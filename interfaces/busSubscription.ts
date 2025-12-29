import { BusSubscriptionStatus } from '../constants/enum';

export interface BusSubscription {
  id: string;
  user_id: string;
  route_id: string;
  bus_id: string;
  subscription_date: string;
  start_time: Date;
  end_time: Date;
  status: BusSubscriptionStatus;
  payment_id: string;
  seat_number: string;
  notes?: string;
  created_at: Date;
  updated_at?: Date;
  confirmed_at?: Date;
  cancelled_at?: Date;
  cancellation_reason?: string;
}
