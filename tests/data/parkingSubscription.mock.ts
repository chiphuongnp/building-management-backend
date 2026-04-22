import { Timestamp } from 'firebase-admin/firestore';
import {
  ParkingSpaceStatus,
  ParkingSubscriptionStatus,
  PaymentStatus,
  UserRank,
} from '../../constants/enum';

export const mockUser = {
  id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
  uid: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
  points: 500,
  rank: UserRank.GOLD,
};

export const mockParkingSpace = {
  id: '1Wv3zE7vsianIJyrafPFJ9aswefW',
  code: 'A-01',
  building_id: 'AjBfMRzDyXC8wbM4KHWb',
  base_price: 100,
  status: ParkingSpaceStatus.AVAILABLE,
};

export const mockParkingSubscription = {
  id: 'subAjBfMRzDyXC8wbM4asyahs_01',
  user_id: mockUser.id,
  parking_space_id: mockParkingSpace.id,
  status: ParkingSubscriptionStatus.RESERVED,
  payment_status: PaymentStatus.PENDING,
  start_date: Timestamp.fromDate(new Date('2026-03-02T00:00:00')),
  end_date: Timestamp.fromDate(new Date('2026-04-02T00:00:00')),
  base_amount: 100,
  vat_charge: 7,
  discount: 10,
  points_used: 50,
  points_earned: 5,
  total_amount: 97,
};

export const mockParkingSubscriptions = [
  mockParkingSubscription,
  { ...mockParkingSubscription, id: 'subAjBfMRzDyXC8wbM4asyahs_02' },
];

export const mockCreateSubscriptionInput = {
  user: { uid: mockUser.uid },
  params: { parkingSpaceId: mockParkingSpace.id },
  body: {
    start_date: '2026-03-02',
    month_duration: 1,
    points_used: 50,
  },
};

export const mockUpdateStatusInput = {
  params: {
    parkingSpaceId: mockParkingSpace.id,
    id: mockParkingSubscription.id,
  },
  body: { status: ParkingSubscriptionStatus.RESERVED },
};

export const mockCancelInput = {
  user: { uid: mockUser.uid },
  params: {
    parkingSpaceId: mockParkingSpace.id,
    id: mockParkingSubscription.id,
  },
};
