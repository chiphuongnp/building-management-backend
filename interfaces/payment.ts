import {
  PaymentMethod,
  PaymentReferenceType,
  PaymentServiceProvider,
  PaymentStatus,
} from '../constants/enum';

export interface Payment {
  id: string;
  user_id: string;
  service_id: string;
  amount: number;
  service_type: PaymentServiceProvider;
  reference_id: string;
  reference_type: PaymentReferenceType;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_time: Date;
  created_at: Date;
}
