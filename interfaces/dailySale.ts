import { Timestamp } from 'firebase-admin/firestore';

export interface DailySale {
  id: string;
  total_orders: number;
  total_revenue: number;
  total_vat_charge: number;
  created_at: Date | Timestamp;
}
