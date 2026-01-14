import { BusSubscriptionStatus } from '../constants/enum';

export interface BusSubscription {
  id: string;
  user_id: string;
  route_id: string;
  bus_id: string;
  start_time: Date;
  end_time: Date;
  base_amount: number;
  vat_charge: number;
  discount: number;
  points_used: number;
  total_amount: number;
  point_earned: number;
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
