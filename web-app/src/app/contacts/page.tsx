'use client';

import { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { Upload, Trash, Search, ChevronLeft, ChevronRight, Phone, Send, X } from 'lucide-react';

export default function ContactsPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  
  // Action Modal State
  const [actionName, setActionName] = useState('Quick Campaign');
  const [actionType, setActionType] = useState<'SMS' | 'CALL'>('SMS');
  const [actionContent, setActionContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const pageSize = 50;
  const contacts = useLiveQuery(() => db.contacts.toArray()) || [];

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedContacts.map(c => c.id!)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const openActionForSingle = (id: number) => {
    setSelectedIds(new Set([id]));
    setIsActionModalOpen(true);
  };

  const executeAction = async () => {
    if (!actionName || !actionContent) {
      alert('Please fill out all fields.');
      return;
    }
    
    setIsSending(true);
    const targetContacts = contacts.filter(c => selectedIds.has(c.id!));

    const campaignId = await db.campaigns.add({
      name: actionName,
      content: actionContent,
      status: 'RUNNING',
      type: actionType,
      createdAt: new Date().toISOString()
    });

    const logs = targetContacts.map(c => ({
      campaignId,
      contactId: c.id!,
      phone: c.normalizedPhone,
      status: 'QUEUED' as const
    }));

    await db.logs.bulkAdd(logs);
    
    setIsActionModalOpen(false);
    setSelectedIds(new Set());
    setIsSending(false);
    
    // Redirect to campaigns page so the background queue handles it
    alert('Campaign Queued! Switch to the Campaigns tab to monitor execution.');
  };

  const normalizePhone = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('880')) return '+' + clean;
    if (clean.startsWith('01')) return '+88' + clean;
    return '+' + clean;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        
        const newContacts = rows.map(row => {
          let name = row['Name'] || row['First Name'] || row['Customer Name'];
          let rawPhone = row['Phone'] || row['Phone 1 - Value'] || row['Mobile'] || row['Phone Number'] || row['Mobile No.'];
          
          if (!name) {
            const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name'));
            name = nameKey ? row[nameKey] : 'Unknown';
          }
          if (!rawPhone) {
            const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobile'));
            rawPhone = phoneKey ? row[phoneKey] : '';
          }
          
          name = name || 'Unknown';
          rawPhone = rawPhone || '';
          
          return {
            name,
            phone: rawPhone,
            normalizedPhone: normalizePhone(rawPhone),
            tags: ['imported'],
            createdAt: new Date().toISOString()
          };
        }).filter(c => c.phone.length > 5);

        const existingPhones = new Set(contacts.map(c => c.normalizedPhone));
        const toInsert = [];
        const importedPhones = new Set();

        for (const contact of newContacts) {
          if (!existingPhones.has(contact.normalizedPhone) && !importedPhones.has(contact.normalizedPhone)) {
            toInsert.push(contact);
            importedPhones.add(contact.normalizedPhone);
          }
        }

        if (toInsert.length > 0) {
          await db.contacts.bulkAdd(toInsert);
        }
        
        setIsImporting(false);
        e.target.value = '';
        alert(`Imported ${toInsert.length} new contacts. Skipped ${newContacts.length - toInsert.length} duplicates.`);
      }
    });
  };

  const clearContacts = async () => {
    if (confirm('Are you sure you want to delete all contacts?')) {
      await db.contacts.clear();
      setCurrentPage(1);
      setSelectedIds(new Set());
    }
  };

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const lowerQuery = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      c.normalizedPhone.includes(lowerQuery) ||
      c.phone.includes(lowerQuery)
    );
  }, [contacts, searchQuery]);

  const totalPages = Math.ceil(filteredContacts.length / pageSize) || 1;
  const paginatedContacts = filteredContacts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-gray-500">Manage your customers and agent lists.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {selectedIds.size > 0 && (
            <Button onClick={() => setIsActionModalOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4 mr-2" /> Action for ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" onClick={clearContacts} className="text-red-500 hover:text-red-600">
            <Trash className="w-4 h-4 mr-2" /> Clear All
          </Button>
          <div className="relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <Button disabled={isImporting}>
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import CSV'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-medium text-gray-700">
            Total: {filteredContacts.length} Contacts
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left relative">
            <thead className="bg-white sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <input 
                    type="checkbox" 
                    onChange={toggleSelectAll}
                    checked={paginatedContacts.length > 0 && paginatedContacts.every(c => selectedIds.has(c.id!))}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-sm text-gray-500 font-medium">Name</th>
                <th className="px-6 py-3 text-sm text-gray-500 font-medium">Phone</th>
                <th className="px-6 py-3 text-sm text-gray-500 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedContacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No contacts found.
                  </td>
                </tr>
              ) : (
                paginatedContacts.map(contact => (
                  <tr key={contact.id} className={`hover:bg-gray-50 ${selectedIds.has(contact.id!) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedIds.has(contact.id!)}
                        onChange={() => toggleSelect(contact.id!)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-3">{contact.name}</td>
                    <td className="px-6 py-3 font-mono text-sm">{contact.normalizedPhone}</td>
                    <td className="px-6 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openActionForSingle(contact.id!)}>
                        <Phone className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredContacts.length)} of {filteredContacts.length}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <span className="text-sm font-medium px-4">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      {isActionModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold">Targeted Action ({selectedIds.size} contacts)</h3>
              <button onClick={() => setIsActionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input 
                  type="text" 
                  value={actionName}
                  onChange={e => setActionName(e.target.value)}
                  className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                <select 
                  value={actionType}
                  onChange={e => setActionType(e.target.value as any)}
                  className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="SMS">SMS Message</option>
                  <option value="CALL">Broadcast Call (Audio)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {actionType === 'SMS' ? 'Message Content' : 'Upload Audio'}
                </label>
                {actionType === 'SMS' ? (
                  <textarea 
                    value={actionContent}
                    onChange={e => setActionContent(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 h-24" 
                  />
                ) : (
                  <input 
                    type="file" 
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setActionContent(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" 
                  />
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>Cancel</Button>
              <Button onClick={executeAction} disabled={isSending}>
                <Send className="w-4 h-4 mr-2" /> Execute
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
