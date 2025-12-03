import { firestore } from 'firebase-admin';
import { FacilityReservationStatus } from '../constants/enum';

export interface FacilityReservation {
  id: string;
  user_id: string;
  facility_id: string;
  start_time: Date;
  end_time: Date;
  base_amount: number;
  vat_charge: number;
  discount: number;
  points_used: number;
  total_amount: number;
  point_earned: number;
  status: FacilityReservationStatus;
  created_at: Date | firestore.Timestamp;
  updated_at?: Date | firestore.Timestamp | null;
  created_by?: string;
  updated_by?: string;
}
