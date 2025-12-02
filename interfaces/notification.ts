import { firestore } from 'firebase-admin';
import {
  InformationCategory,
  InformationPriority,
  InformationStatus,
  InformationTarget,
} from '../constants/enum';

export interface Information {
  id: string;
  title: string;
  content: string;
  category: InformationCategory;
  priority: InformationPriority;
  target: InformationTarget;
  schedule_at?: Date | firestore.Timestamp;
  status: InformationStatus;
  created_at: Date | firestore.Timestamp;
  created_by: string;
  updated_at?: Date | firestore.Timestamp;
  updated_by?: string;
}
