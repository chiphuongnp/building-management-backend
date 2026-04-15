import { BusSubscriptionStatus, PaymentStatus } from '../../constants/enum';
import { mockBusSeats, mockBuses } from './bus.mock';
import { mockRoute } from './busRoute.mock';

export const mockUser = {
  id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
  points: 500,
  rank: 'GOLD',
};

export const mockCalculatePaymentResult = {
  finalAmount: 95000,
  discount: 5000,
  pointsEarned: 10,
  finalPointsUsed: 50,
  vatCharge: 8500,
};

export const mockBus = mockBuses[0];
export const mockSeats = mockBusSeats[0];

export const mockCreateBusSubscriptionInput = {
  body: {
    route_id: mockRoute.id,
    bus_id: mockBus.id,
    seat_number: mockSeats.seat_number,
    month_duration: 2,
    points_used: 50,
    start_time: '2026-04-01',
  },
  user: { uid: mockUser.id },
};

export const mockBusSubscription = {
  id: '0BfJJphzrcrqv8idzNEJ',
  user_id: mockUser.id,
  route_id: mockRoute.id,
  bus_id: mockBus.id,
  seat_number: mockSeats.seat_number,
  status: BusSubscriptionStatus.RESERVED,
  payment_status: PaymentStatus.PENDING,
  base_amount: 100000,
  total_amount: 95000,
  points_used: 50,
  points_earned: 10,
  discount: 5000,
  vat_charge: 8500,
};

export const mockBusSubscriptions = [
  mockBusSubscription,
  { ...mockBusSubscription, id: '0BfJJphzrcrqv8adasdis' },
];
