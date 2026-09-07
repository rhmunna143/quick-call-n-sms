'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { Upload, Trash } from 'lucide-react';

export default function ContactsPage() {
  const [isImporting, setIsImporting] = useState(false);
  const contacts = useLiveQuery(() => db.contacts.toArray());

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
          // Attempt to map common headers
          const name = row['Name'] || row['First Name'] || row['Customer Name'] || 'Unknown';
          const rawPhone = row['Phone'] || row['Phone 1 - Value'] || row['Mobile'] || row['Phone Number'] || '';
          
          return {
            name,
            phone: rawPhone,
            normalizedPhone: normalizePhone(rawPhone),
            tags: ['imported'],
            createdAt: new Date().toISOString()
          };
        }).filter(c => c.phone.length > 5);

        // Basic Deduplication: Skip if normalized phone already exists in DB
        const existingPhones = new Set(contacts?.map(c => c.normalizedPhone) || []);
        const toInsert = [];
        
        // Dedup within the imported file itself
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
        e.target.value = ''; // reset file input
        alert(`Imported ${toInsert.length} new contacts. Skipped ${newContacts.length - toInsert.length} duplicates.`);
      }
    });
  };

  const clearContacts = async () => {
    if (confirm('Are you sure you want to delete all contacts?')) {
      await db.contacts.clear();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-gray-500">Manage your customers and agent lists.</p>
        </div>
        
        <div className="flex space-x-4">
          <Button variant="outline" onClick={clearContacts} className="text-red-500 hover:text-red-600">
            <Trash className="w-4 h-4 mr-2" />
            Clear All
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-medium">
          Total Contacts: {contacts?.length || 0}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm text-gray-500 font-medium">Name</th>
                <th className="px-6 py-3 text-sm text-gray-500 font-medium">Phone</th>
                <th className="px-6 py-3 text-sm text-gray-500 font-medium">Normalized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts?.slice(0, 100).map(contact => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{contact.name}</td>
                  <td className="px-6 py-4">{contact.phone}</td>
                  <td className="px-6 py-4">{contact.normalizedPhone}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {contacts && contacts.length > 100 && (
            <div className="p-4 text-center text-sm text-gray-500">
              Showing first 100 contacts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
