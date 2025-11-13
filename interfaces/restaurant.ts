import { firestore } from 'firebase-admin';
import { ActiveStatus } from '../constants/enum';

export interface OperatingHours {
  open: string;
  close: string;
  days?: string[];
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  facebook?: string;
  zalo?: string;
}

export interface Restaurant {
  id: string;
  building_id: string;
  floor: number;
  name: string;
  description?: string;
  operating_hours?: OperatingHours;
  contact?: ContactInfo;
  status: ActiveStatus;
  created_at: Date | firestore.Timestamp;
  updated_at?: Date | firestore.Timestamp | null;
  created_by?: string;
  updated_by?: string;
}
