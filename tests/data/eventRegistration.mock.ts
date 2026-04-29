import { EventBookingStatus, EventRegistrationsStatus } from '../../constants/enum';

export const mockUserId = '0BfJJphzrcrqv8idzNEJ';
export const mockEventBookingId = '0BfJJphzrcrqv8idzNEJ';
export const mockEventRegistrationId = '0BfJJphzrcrqv8idzNEJ';

export const mockEventBooking = {
  id: mockEventBookingId,
  event_title: 'Team Building 2026',
  status: EventBookingStatus.APPROVED,
  current_participants: 5,
  max_participants: 20,
};

export const mockEventRegistration = {
  id: mockEventRegistrationId,
  user_id: mockUserId,
  event_booking_id: mockEventBookingId,
  status: EventRegistrationsStatus.REGISTERED,
};

export const mockEventRegistrations = [
  mockEventRegistration,
  { ...mockEventRegistration, id: '1CgKKqiAsdsr9jezOPFK' },
];

export const mockCancelledRegistration = {
  ...mockEventRegistration,
  status: EventRegistrationsStatus.CANCELLED,
};

export const mockClosedRegistration = {
  ...mockEventRegistration,
  status: EventRegistrationsStatus.CLOSED,
};

export const mockGetByUserInput = {
  user: { uid: mockUserId },
};

export const mockGetHistoryInput = {
  user: { uid: mockUserId },
};

export const mockGetByEventBookingInput = {
  body: { event_booking_id: mockEventBookingId },
};

export const mockCreateEventRegistrationInput = {
  user: { uid: mockUserId },
  body: {
    event_booking_id: mockEventBookingId,
    note: 'Looking forward to it',
  },
};

export const mockCancelEventRegistrationInput = {
  user: { uid: mockUserId },
  params: { id: mockEventRegistrationId },
  body: { event_booking_id: mockEventBookingId },
};
