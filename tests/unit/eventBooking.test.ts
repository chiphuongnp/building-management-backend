jest.mock('../../utils', () => {
  const { utilMock } = require('../helpers/utilMock');
  return utilMock({
    formatToTimestamp: jest.fn(),
    capitalizeName: jest.fn(),
  })();
});
import {
  getEventBookings,
  getEventBookingById,
  getAvailableEventBooking,
  createEventBooking,
  updateEventBookingInfo,
  updateEventBookingStatus,
} from '../../services/eventBooking';
import { ErrorMessage, StatusCode } from '../../constants/message';
import { EventBookingStatus } from '../../constants/enum';
import { firebaseHelper, formatToTimestamp, capitalizeName } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import {
  mockEventBookingId,
  mockFacilityReservationId,
  mockUserId,
  mockEventBooking,
  mockEventBookings,
  mockFacilityReservation,
  mockGetEventBookingsInput,
  mockGetEventBookingByIdInput,
  mockCreateEventBookingInput,
  mockUpdateEventBookingInfoInput,
  mockUpdateEventBookingStatusInput,
} from '../data/eventBooking.mock';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedFormatToTimestamp = jest.mocked(formatToTimestamp);
const mockedCapitalizeName = jest.mocked(capitalizeName);

beforeEach(() => {
  jest.clearAllMocks();

  mockedCapitalizeName.mockImplementation((name: string) => name);
  mockedFormatToTimestamp.mockImplementation((val: string) => val as any);
});

describe('getEventBookings()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return all event bookings without filters',
        input: mockGetEventBookingsInput,
        mockFire: () => {
          mockedFirebase.countAllDocs.mockResolvedValue(2);
          mockedFirebase.getAllDocs.mockResolvedValue(mockEventBookings as any);
        },
        expected: {
          eventBookings: mockEventBookings,
          pagination: { page: 1, page_size: 10, total: 2, total_page: 1 },
        },
      },
      {
        name: 'should return filtered event bookings by status',
        input: { ...mockGetEventBookingsInput, query: { status: EventBookingStatus.APPROVED } },
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockResolvedValue(1);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockEventBooking] as any);
        },
        expected: {
          eventBookings: [mockEventBooking],
          pagination: { page: 1, page_size: 10, total: 1, total_page: 1 },
        },
      },
      {
        name: 'should return filtered event bookings by created_by',
        input: { ...mockGetEventBookingsInput, query: { created_by: mockUserId } },
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockResolvedValue(1);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockEventBooking] as any);
        },
        expected: {
          eventBookings: [mockEventBooking],
          pagination: { page: 1, page_size: 10, total: 1, total_page: 1 },
        },
      },
      {
        name: 'should return filtered event bookings by event_title using capitalizeName',
        input: { ...mockGetEventBookingsInput, query: { event_title: 'team building' } },
        mockFire: () => {
          mockedCapitalizeName.mockReturnValue('Team Building');
          mockedFirebase.countDocsByFields.mockResolvedValue(1);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockEventBooking] as any);
        },
        expected: {
          eventBookings: [mockEventBooking],
          pagination: { page: 1, page_size: 10, total: 1, total_page: 1 },
        },
      },
      {
        name: 'should handle order and order_by query params',
        input: { ...mockGetEventBookingsInput, query: { order: 'asc', order_by: 'created_at' } },
        mockFire: () => {
          mockedFirebase.countAllDocs.mockResolvedValue(2);
          mockedFirebase.getAllDocs.mockResolvedValue(mockEventBookings as any);
        },
        expected: {
          eventBookings: mockEventBookings,
          pagination: { page: 1, page_size: 10, total: 2, total_page: 1 },
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await getEventBookings(req, res);
      expect(response).toEqual({
        success: true,
        data: {
          eventBookings: expected.eventBookings,
          pagination: expected.pagination,
        },
      });
    });
  });

  describe('edge cases', () => {
    describe('pagination', () => {
      const edgeCases = [
        {
          name: 'should handle missing pagination',
          input: { ...mockGetEventBookingsInput, pagination: undefined },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(2);
            mockedFirebase.getAllDocs.mockResolvedValue(mockEventBookings as any);
          },
          expected: {
            eventBookings: mockEventBookings,
            pagination: { page: 1, page_size: 10, total: 2, total_page: 1 },
          },
        },
        {
          name: 'should handle null pagination',
          input: { ...mockGetEventBookingsInput, pagination: null },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(3);
            mockedFirebase.getAllDocs.mockResolvedValue(mockEventBookings as any);
          },
          expected: {
            eventBookings: mockEventBookings,
            pagination: { page: undefined, page_size: undefined, total: 3, total_page: 1 },
          },
        },
        {
          name: 'should calculate totalPage correctly',
          input: { ...mockGetEventBookingsInput, pagination: { page: 2, page_size: 1 } },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(5);
            mockedFirebase.getAllDocs.mockResolvedValue([mockEventBooking] as any);
          },
          expected: {
            eventBookings: [mockEventBooking],
            pagination: { page: 2, page_size: 1, total: 5, total_page: 5 },
          },
        },
      ];

      test.each(edgeCases)('$name', async ({ input, mockFire, expected }) => {
        const req = mockReq(input);
        const res = mockRes();

        mockFire();

        const response = await getEventBookings(req, res);
        expect(response).toEqual({
          success: true,
          data: {
            eventBookings: expected.eventBookings,
            pagination: expected.pagination,
          },
        });
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should handle firestore error',
        mockFire: () => {
          mockedFirebase.countAllDocs.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_GET_EVENT_BOOKING_LIST,
          errorMessage: ErrorMessage.CANNOT_GET_EVENT_BOOKING_LIST,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq(mockGetEventBookingsInput);
      const res = mockRes();

      mockFire();

      const response = await getEventBookings(req, res);

      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('getEventBookingById()', () => {
  describe('valid cases', () => {
    test('should return event booking detail', async () => {
      const req = mockReq(mockGetEventBookingByIdInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockEventBooking as any);

      const response = await getEventBookingById(req, res);
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining(mockEventBooking),
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return EVENT_BOOKING_NOT_FOUND when event booking does not exist',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.EVENT_BOOKING_NOT_FOUND,
          errorMessage: ErrorMessage.EVENT_BOOKING_NOT_FOUND,
        },
      },
      {
        name: 'should handle firestore error',
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.EVENT_BOOKING_NOT_FOUND,
          errorMessage: ErrorMessage.EVENT_BOOKING_NOT_FOUND,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq(mockGetEventBookingByIdInput);
      const res = mockRes();

      mockFire();

      const response = await getEventBookingById(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('getAvailableEventBooking()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return only events where current_participants < max_participants',
        input: mockEventBookings,
        expected: [mockEventBookings[0]],
      },
      {
        name: 'should return empty list when all events are full',
        input: mockEventBookings.map((e) => ({
          ...e,
          current_participants: e.max_participants,
        })),
        expected: [],
      },
      {
        name: 'should return empty list when no events found',
        input: [],
        expected: [],
      },
    ];

    test.each(validCases)('$name', async ({ input, expected }) => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocsByFields.mockResolvedValue(input as any);

      const response = await getAvailableEventBooking(req, res);
      expect(response).toEqual({
        success: true,
        data: expected,
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocsByFields.mockRejectedValue(new Error('firestore error'));

      const response = await getAvailableEventBooking(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_AVAILABLE_EVENT_BOOKINGS,
        message: ErrorMessage.CANNOT_GET_AVAILABLE_EVENT_BOOKINGS,
      });
    });
  });
});

describe('createEventBooking()', () => {
  const defaultMockFire = () => {
    mockedFirebase.getDocById.mockResolvedValue(mockFacilityReservation as any);
    mockedFirebase.createDoc.mockResolvedValue({ id: mockEventBookingId } as any);
  };

  describe('valid cases', () => {
    test('should create event booking successfully with facility_reservation_id', async () => {
      const req = mockReq(mockCreateEventBookingInput);
      const res = mockRes();

      defaultMockFire();

      const response = await createEventBooking(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockEventBookingId },
      });
    });

    test('should create event booking without facility_reservation_id', async () => {
      const req = mockReq({
        ...mockCreateEventBookingInput,
        body: { ...mockCreateEventBookingInput.body, facility_reservation_id: undefined },
      });
      const res = mockRes();

      mockedFirebase.createDoc.mockResolvedValue({ id: mockEventBookingId } as any);

      const response = await createEventBooking(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockEventBookingId },
      });
      expect(mockedFirebase.getDocById).not.toHaveBeenCalled();
    });

    test('should normalize backslash path and pass correct image_url to createDoc', async () => {
      const req = mockReq({
        ...mockCreateEventBookingInput,
      });
      req.file = { path: 'uploads/event.jpg' } as any;
      const res = mockRes();

      defaultMockFire();

      await createEventBooking(req, res);

      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          image_url: 'uploads/event.jpg',
        }),
      );
    });

    test('should set image_url to null when file is not provided', async () => {
      const req = mockReq({ ...mockCreateEventBookingInput, files: undefined });
      const res = mockRes();

      defaultMockFire();

      await createEventBooking(req, res);

      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          image_url: null,
        }),
      );
    });

    test('should pass correct fields to createDoc', async () => {
      const req = mockReq(mockCreateEventBookingInput);
      const res = mockRes();

      defaultMockFire();

      await createEventBooking(req, res);

      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          current_participants: 0,
          status: EventBookingStatus.PENDING,
          facility_reservation_id: mockFacilityReservationId,
          created_by: mockUserId,
        }),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return FACILITY_RESERVATION_NOT_FOUND when facility reservation does not exist',
        input: mockCreateEventBookingInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.FACILITY_RESERVATION_NOT_FOUND,
          errorMessage: ErrorMessage.FACILITY_RESERVATION_NOT_FOUND,
        },
      },
      {
        name: 'should handle firestore error',
        input: mockCreateEventBookingInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_CREATE_EVENT_BOOKING,
          errorMessage: ErrorMessage.CANNOT_CREATE_EVENT_BOOKING,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await createEventBooking(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('updateEventBookingInfo()', () => {
  const defaultMockFire = () => {
    mockedFirebase.getDocById.mockResolvedValue(mockEventBooking as any);
    mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
  };

  describe('valid cases', () => {
    test('should update event booking info successfully', async () => {
      const req = mockReq(mockUpdateEventBookingInfoInput);
      const res = mockRes();

      defaultMockFire();

      const response = await updateEventBookingInfo(req, res);

      expect(response).toEqual({
        success: true,
        data: { id: mockEventBookingId },
      });
    });

    test('should update with facility_reservation_id and set location to null', async () => {
      const req = mockReq({
        ...mockUpdateEventBookingInfoInput,
        body: {
          ...mockUpdateEventBookingInfoInput.body,
          facility_reservation_id: mockFacilityReservationId,
          location: 'Some Location',
        },
      });
      const res = mockRes();

      mockedFirebase.getDocById
        .mockResolvedValueOnce(mockEventBooking as any)
        .mockResolvedValueOnce(mockFacilityReservation as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      await updateEventBookingInfo(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        expect.any(String),
        mockEventBookingId,
        expect.objectContaining({
          location: null,
          facility_reservation_id: mockFacilityReservationId,
        }),
      );
    });

    test('should keep location when no facility_reservation_id provided', async () => {
      const req = mockReq({
        ...mockUpdateEventBookingInfoInput,
        body: {
          ...mockUpdateEventBookingInfoInput.body,
          facility_reservation_id: null,
          location: 'Conference Room A',
        },
      });
      const res = mockRes();

      defaultMockFire();

      await updateEventBookingInfo(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        expect.any(String),
        mockEventBookingId,
        expect.objectContaining({
          location: 'Conference Room A',
        }),
      );
    });

    test('should include start_time and deadline when start_time is provided', async () => {
      const req = mockReq({
        ...mockUpdateEventBookingInfoInput,
        body: {
          ...mockUpdateEventBookingInfoInput.body,
          facility_reservation_id: mockFacilityReservationId,
        },
      });
      const res = mockRes();

      defaultMockFire();

      await updateEventBookingInfo(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        expect.any(String),
        mockEventBookingId,
        expect.objectContaining({
          start_time: expect.anything(),
          deadline: expect.anything(),
        }),
      );
    });

    test('should always reset status to PENDING on update', async () => {
      const req = mockReq(mockUpdateEventBookingInfoInput);
      const res = mockRes();

      defaultMockFire();

      await updateEventBookingInfo(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        expect.any(String),
        mockEventBookingId,
        expect.objectContaining({
          status: EventBookingStatus.PENDING,
          updated_by: mockUserId,
        }),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return EVENT_BOOKING_NOT_FOUND when event booking does not exist',
        input: mockUpdateEventBookingInfoInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.EVENT_BOOKING_NOT_FOUND,
          errorMessage: ErrorMessage.EVENT_BOOKING_NOT_FOUND,
        },
      },
      {
        name: 'should return UPDATE_EVENT_BOOKING_FORBIDDEN when user is not the creator',
        input: {
          ...mockUpdateEventBookingInfoInput,
          user: { uid: 'other_user_id' },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockEventBooking as any);
        },
        error: {
          statusCode: StatusCode.UPDATE_EVENT_BOOKING_FORBIDDEN,
          errorMessage: ErrorMessage.UPDATE_EVENT_BOOKING_FORBIDDEN,
        },
      },
      {
        name: 'should return FACILITY_RESERVATION_NOT_FOUND when facility reservation does not exist',
        input: {
          ...mockUpdateEventBookingInfoInput,
          body: {
            ...mockUpdateEventBookingInfoInput.body,
            facility_reservation_id: mockFacilityReservationId,
          },
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockEventBooking as any)
            .mockResolvedValueOnce(null as any);
        },
        error: {
          statusCode: StatusCode.FACILITY_RESERVATION_NOT_FOUND,
          errorMessage: ErrorMessage.FACILITY_RESERVATION_NOT_FOUND,
        },
      },
      {
        name: 'should handle firestore error',
        input: mockUpdateEventBookingInfoInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_UPDATE_EVENT_BOOKING,
          errorMessage: ErrorMessage.CANNOT_UPDATE_EVENT_BOOKING,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await updateEventBookingInfo(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('updateEventBookingStatus()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should update status to APPROVED',
        input: {
          ...mockUpdateEventBookingStatusInput,
          body: { status: EventBookingStatus.APPROVED },
        },
      },
      {
        name: 'should update status to PENDING',
        input: {
          ...mockUpdateEventBookingStatusInput,
          body: { status: EventBookingStatus.PENDING },
        },
      },
      {
        name: 'should update status to REJECTED',
        input: {
          ...mockUpdateEventBookingStatusInput,
          body: { status: EventBookingStatus.REJECTED },
        },
      },
    ];

    test.each(validCases)('$name', async ({ input }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.updateDoc.mockResolvedValue(undefined as never);

      const response = await updateEventBookingStatus(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockEventBookingId },
      });
      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        expect.any(String),
        mockEventBookingId,
        expect.objectContaining({
          status: input.body.status,
          approved_by: mockUserId,
        }),
      );
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq(mockUpdateEventBookingStatusInput);
      const res = mockRes();

      mockedFirebase.updateDoc.mockRejectedValue(new Error('firestore error'));

      const response = await updateEventBookingStatus(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_UPDATE_EVENT_BOOKING_STATUS,
        message: ErrorMessage.CANNOT_UPDATE_EVENT_BOOKING_STATUS,
      });
    });
  });
});
