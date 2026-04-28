import { EventBookingStatus } from '../../constants/enum';

export const mockEventBookingId = '0BfJJphzrcrqv8idzNEJ';
export const mockFacilityReservationId = '0BfJJphzrcrqv8idzNEJ';
export const mockUserId = '0BfJJphzrcrqv8idzNEJ';

export const mockEventBooking = {
  id: mockEventBookingId,
  event_title: 'Team Building 2026',
  status: EventBookingStatus.APPROVED,
  facility_reservation_id: mockFacilityReservationId,
  current_participants: 5,
  max_participants: 20,
  deadline: '2026-05-01T00:00:00.000Z',
  start_time: { seconds: 1746057600, nanoseconds: 0 },
  end_time: { seconds: 1746086400, nanoseconds: 0 },
  image_url: 'uploads/event.jpg',
  created_by: mockUserId,
};

export const mockEventBookings = [
  mockEventBooking,
  {
    ...mockEventBooking,
    id: '1CgKKqiAsdsr9jezOPFK',
    event_title: 'Workshop 2026',
    current_participants: 20,
    max_participants: 20,
  },
];

export const mockFacilityReservation = {
  id: mockFacilityReservationId,
  facility_id: '0BfJJphzrcrqv8idzNEJ',
  status: 'reserved',
};

export const mockGetEventBookingsInput = {
  query: {},
  pagination: { page: 1, page_size: 10 },
};

export const mockGetEventBookingByIdInput = {
  params: { id: mockEventBookingId },
};

export const mockCreateEventBookingInput = {
  user: { uid: mockUserId },
  body: {
    event_title: 'Team Building 2026',
    facility_reservation_id: mockFacilityReservationId,
    start_time: '2026-05-01T08:00:00.000Z',
    end_time: '2026-05-01T16:00:00.000Z',
    deadline: '2026-04-30T00:00:00.000Z',
    max_participants: 20,
  },
  file: { path: 'uploads\\event.jpg' },
};

export const mockUpdateEventBookingInfoInput = {
  user: { uid: mockUserId },
  params: { id: mockEventBookingId },
  body: {
    event_title: 'Team Building 2026 Updated',
    start_time: '2026-05-02T08:00:00.000Z',
    end_time: '2026-05-02T16:00:00.000Z',
    deadline: '2026-05-01T00:00:00.000Z',
  },
};

export const mockUpdateEventBookingStatusInput = {
  user: { uid: mockUserId },
  params: { id: mockEventBookingId },
  body: { status: EventBookingStatus.APPROVED },
};
