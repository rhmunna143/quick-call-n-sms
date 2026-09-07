import Dexie, { Table } from 'dexie';

export interface Contact {
  id?: number;
  name: string;
  phone: string;
  normalizedPhone: string;
  tags: string[];
  createdAt: string;
}

export interface Campaign {
  id?: number;
  name: string;
  content: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  createdAt: string;
}

export interface CampaignLog {
  id?: number;
  campaignId: number;
  contactId: number;
  phone: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  errorReason?: string;
  sentAt?: string;
}

export class QuickCallDatabase extends Dexie {
  contacts!: Table<Contact, number>;
  campaigns!: Table<Campaign, number>;
  logs!: Table<CampaignLog, number>;

  constructor() {
    super('QuickCallDatabase');
    this.version(1).stores({
      contacts: '++id, phone, normalizedPhone, name', // Primary key and indexed props
      campaigns: '++id, status',
      logs: '++id, campaignId, contactId, phone, status'
    });
  }
}

export const db = new QuickCallDatabase();
