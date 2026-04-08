import { Timestamp } from 'firebase-admin/firestore';
import { PaymentStatus, PaymentReferenceType } from '../../constants/enum';

export const mockUserPayments = [
  {
    id: '0BfJJphzrcrqv8idzNEJ',
    amount: 1000,
    status: PaymentStatus.SUCCESS,
    user_id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
    transaction_time: Timestamp.now(),
  },
  {
    id: '0c0PTKlgW3eEVC0yLRiq',
    amount: 2000,
    status: PaymentStatus.SUCCESS,
    user_id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
    transaction_time: Timestamp.now(),
  },
];

export const mockUser = { id: '2Wv3zE7vsianIJyrafPFJ98YWSj2' };

export const mockPayment = {
  id: '0BfJJphzrcrqv8idzNEJ',
  status: PaymentStatus.PENDING,
  reference_type: PaymentReferenceType.ORDER,
  reference_id: 'order1',
  user_id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
  created_at: new Date(),
};

export const mockOrder = {
  id: '1d3cREDuz59SPrOGUoYc',
  payment_status: PaymentStatus.PENDING,
};

export const mockBusSubscription = {
  id: '1vPZVTJR1DIlxv3Kpv4H',
  payment_status: PaymentStatus.PENDING,
};

export const mockFacilityReservation = {
  id: '9YFNOgOUIFB12S4LZTRJ',
  payment_status: PaymentStatus.PENDING,
};

export const mockParkingSubscription = {
  id: 'C6TIGqBnUJvaGLlaWeBW',
  payment_status: PaymentStatus.PENDING,
};

export const MOCK_NOW = 1704067200000; // 2024-01-01T00:00:00Z
export const MOCK_MOMENT = '20240101000000'; // moment().format('YYYYMMDDHHmmss')
export const MOCK_SIGNATURE = 'mock_signature';
