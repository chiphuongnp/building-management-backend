import { firestore } from 'firebase-admin';
import { EventBookingStatus } from '../constants/enum';

export interface EventBooking {
  id: string;
  event_title: string;
  description?: string;
  location?: string;
  facility_reservation_id?: string;
  current_participants: number;
  max_participants: number;
  start_time: Date | firestore.Timestamp;
  end_time: Date | firestore.Timestamp;
  status: EventBookingStatus;
  approved_by?: string;
  deadline: Date | firestore.Timestamp;
  created_by: string;
  created_at: Date | firestore.Timestamp;
  updated_by?: string;
  updated_at: Date | firestore.Timestamp;
}
