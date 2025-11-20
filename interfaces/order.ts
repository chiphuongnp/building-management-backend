import { OrderStatus, PickupMethod } from './../constants/enum';
export interface OrderDetail {
  id: string;
  order_id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Order {
  id: string;
  user_id: string;
  base_amount: number;
  vat_charge: number;
  total_amount: number;
  pickup_method: PickupMethod;
  delivery_address?: {
    building?: string;
    floor?: number;
    room?: string;
  };
  delivery_info?: {
    contact_name?: string;
    contact_phone?: string;
    notes?: string;
  };
  status: OrderStatus;
  payment_id?: string;
  created_at: Date;
  updated_at?: Date;
}
