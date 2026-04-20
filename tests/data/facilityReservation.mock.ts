import { Timestamp } from 'firebase-admin/firestore';
import { FacilityReservationStatus, PaymentStatus } from '../../constants/enum';
import { mockFacility } from './facility.mock';
import { mockUser } from './busSubscription.mock';

export const mockFacilityReservation = {
  id: '0BfJJphzrcrqv8idzyayths',
  user_id: mockUser.id,
  facility_id: mockFacility.id,
  status: FacilityReservationStatus.RESERVED,
  payment_status: PaymentStatus.PENDING,
  start_time: Timestamp.fromDate(new Date('2026-03-02T08:00:00')),
  end_time: Timestamp.fromDate(new Date('2026-03-02T10:00:00')),
  total_amount: 200,
};

export const mockFacilityReservations = [
  mockFacilityReservation,
  { ...mockFacilityReservation, id: '0BfJJphzrcrqv8idzyayths' },
];

export const mockCalculatePaymentResult = {
  finalAmount: 180,
  discount: 20,
  pointsEarned: 10,
  finalPointsUsed: 50,
  vatCharge: 10,
};

export const mockCreateReservationInput = {
  user: { uid: mockUser.id },
  body: {
    facility_id: mockFacility.id,
    start_date: '2026-03-02',
    hour_duration: 2,
    points_used: 50,
  },
};
