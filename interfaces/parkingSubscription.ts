import { ParkingSubscriptionStatus } from '../constants/enum';

export interface ParkingSubscription {
  id?: string;
  user_id: string;
  start_time: Date;
  end_time: Date;
  amount: number;
  payment_id?: string;
  status: ParkingSubscriptionStatus;
  created_at?: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}
