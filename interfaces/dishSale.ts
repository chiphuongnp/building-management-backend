import { Timestamp } from 'firebase-admin/firestore';

export interface DishSale {
  id: string;
  daily_sale_id: string;
  dish_name: string;
  total_quantity: number;
  total_revenue: number;
  created_at: Date | Timestamp;
}
