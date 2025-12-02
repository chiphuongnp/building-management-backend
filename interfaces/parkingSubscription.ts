import { ParkingSubscriptionStatus } from '../constants/enum';

export interface ParkingSubscription {
  id?: string;
  user_id: string;
  start_time: Date;
  end_time: Date;
  base_amount: number;
  vat_charge: number;
  discount: number;
  points_used: number;
  total_amount: number;
  point_earned: number;
  status: ParkingSubscriptionStatus;
  created_at?: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}
