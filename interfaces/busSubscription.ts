import { BusSubscriptionStatus, BusSubscriptionType } from '../constants/enum';

export interface BusSubscription {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_phone: string;
  route_id: string;
  route_name: string;
  bus_id: string;
  subscription_date: string;
  subscription_type: BusSubscriptionType;
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
