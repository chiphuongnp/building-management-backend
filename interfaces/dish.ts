import { firestore } from 'firebase-admin';
import { ActiveStatus, DishCategory } from '../constants/enum';

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: DishCategory;
  image_urls?: string[];
  status: ActiveStatus;
  created_at: Date | firestore.Timestamp;
  updated_at?: Date | firestore.Timestamp | null;
  created_by?: string;
  updated_by?: string;
}
