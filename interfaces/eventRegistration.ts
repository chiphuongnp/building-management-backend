import { firestore } from 'firebase-admin';
import { EventRegistrationsStatus } from '../constants/enum';

export interface EventRegistration {
  id: string;
  event_booking_id: string;
  user_id: string;
  status: EventRegistrationsStatus;
  created_at: Date | firestore.Timestamp;
  updated_at: Date | firestore.Timestamp;
}
