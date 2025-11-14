import { firestore } from 'firebase-admin';
import { FacilityType, FacilityStatus } from '../constants/enum';

export interface FacilityLocation {
  floor: string;
  outdoor: boolean;
  area: string;
}

export interface Facility {
  id: string;
  building_id: string;
  name: string;
  facility_type: FacilityType;
  description: string;
  capacity: number;
  location: FacilityLocation;
  base_price: number;
  service_charge: number;
  status: FacilityStatus;
  created_at: Date | firestore.Timestamp;
  updated_at?: Date | firestore.Timestamp | null;
  created_by?: string;
  updated_by?: string;
}
