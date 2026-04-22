import {
  getSubscriptions,
  getCurrentSubscription,
  getSubscriptionById,
  createParkingSubscription,
  updateParkingSubscriptionStatus,
  cancelParkingSubscription,
} from '../../services/parkingSubscription';
import { ErrorMessage, StatusCode } from '../../constants/message';
import { Collection, ParkingSpaceStatus, ParkingSubscriptionStatus } from '../../constants/enum';
import { firebaseHelper, getTomorrow } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import { Transaction } from 'firebase-admin/firestore';
import {
  mockUser,
  mockParkingSpace,
  mockParkingSubscription,
  mockParkingSubscriptions,
  mockCreateSubscriptionInput,
  mockUpdateStatusInput,
  mockCancelInput,
} from '../data/parkingSubscription.mock';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedGetTomorrow = jest.mocked(getTomorrow);

beforeEach(() => {
  jest.clearAllMocks();

  mockedFirebase.runTransaction.mockImplementation(async (cb) => cb({} as Transaction));
  mockedGetTomorrow.mockReturnValue(new Date('2026-03-02'));
});

describe('getSubscriptions()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return all subscriptions for a parking space',
        expected: mockParkingSubscriptions,
      },
      {
        name: 'should return empty list when no subscriptions exist',
        expected: [],
      },
    ];

    test.each(validCases)('$name', async ({ expected }) => {
      const req = mockReq({ params: { parkingSpaceId: mockParkingSpace.id } });
      const res = mockRes();

      mockedFirebase.getAllDocs.mockResolvedValue(expected as never);

      const response = await getSubscriptions(req, res);
      expect(response).toEqual({
        success: true,
        data: expected,
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({ params: { parkingSpaceId: mockParkingSpace.id } });
      const res = mockRes();

      mockedFirebase.getAllDocs.mockRejectedValue(new Error('firestore error') as never);

      const response = await getSubscriptions(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_PARKING_SUBSCRIPTION_LIST,
        message: ErrorMessage.CANNOT_GET_PARKING_SUBSCRIPTION_LIST,
      });
    });
  });
});

describe('getCurrentSubscription()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return current reserved subscription',
        mockFire: () =>
          mockedFirebase.getDocByField.mockResolvedValue([mockParkingSubscription] as never),
        expected: {
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ id: mockParkingSubscription.id }),
          ]),
        },
      },
      {
        name: 'should return empty when no active subscription exists',
        mockFire: () => mockedFirebase.getDocByField.mockResolvedValue([] as never),
        expected: {
          success: true,
          data: [],
        },
      },
    ];

    test.each(validCases)('$name', async ({ mockFire, expected }) => {
      const req = mockReq({
        params: { parkingSpaceId: mockParkingSpace.id },
      });
      const res = mockRes();

      mockFire();

      const response = await getCurrentSubscription(req, res);
      expect(response).toEqual(expected);
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({ params: { parkingSpaceId: mockParkingSpace.id } });
      const res = mockRes();

      mockedFirebase.getDocByField.mockRejectedValue(new Error('firestore error') as never);

      const response = await getCurrentSubscription(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_CURRENT_PARKING_SUBSCRIPTION,
        message: ErrorMessage.CANNOT_GET_CURRENT_PARKING_SUBSCRIPTION,
      });
    });
  });
});

describe('getSubscriptionById()', () => {
  describe('valid cases', () => {
    test('should return subscription detail', async () => {
      const req = mockReq({
        params: { parkingSpaceId: mockParkingSpace.id, id: mockParkingSubscription.id },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockParkingSubscription as never);

      const response = await getSubscriptionById(req, res);
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining(mockParkingSubscription),
      });
    });
  });

  describe('error cases', () => {
    test('should return PARKING_SUBSCRIPTION_NOT_FOUND when subscription does not exist', async () => {
      const req = mockReq({
        params: { parkingSpaceId: mockParkingSpace.id, id: 'nonexistent_id' },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null as never);

      const response = await getSubscriptionById(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.PARKING_SUBSCRIPTION_NOT_FOUND,
        message: ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
      });
    });

    test('should handle firestore error', async () => {
      const req = mockReq({
        params: { parkingSpaceId: mockParkingSpace.id, id: mockParkingSubscription.id },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as never);

      const response = await getSubscriptionById(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.PARKING_SUBSCRIPTION_NOT_FOUND,
        message: ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
      });
    });
  });
});

describe('createParkingSubscription()', () => {
  const baseInput = mockCreateSubscriptionInput;

  const defaultMockFire = () => {
    mockedFirebase.getDocsByFields.mockResolvedValue([]);
    mockedFirebase.getDocById
      .mockResolvedValueOnce(mockUser as any)
      .mockResolvedValueOnce(mockParkingSpace as any);

    mockedFirebase.setTransaction.mockResolvedValue({ id: 'subAjBfMRzDyXC8wbM4asyahs_03' } as any);
    mockedFirebase.updateTransaction.mockResolvedValue(undefined as any);
  };

  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should create subscription successfully',
        input: baseInput,
        mockFire: defaultMockFire,
      },
      {
        name: 'should use default start_date when not provided',
        input: {
          ...baseInput,
          body: { ...baseInput.body, start_date: undefined },
        },
        mockFire: defaultMockFire,
      },
      {
        name: 'should handle user with undefined points',
        input: {
          ...baseInput,
          body: { ...baseInput.body, points_used: 0 },
        },
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById
            .mockResolvedValueOnce({ ...mockUser, points: undefined } as any)
            .mockResolvedValueOnce(mockParkingSpace as any);
          mockedFirebase.setTransaction.mockResolvedValue({
            id: 'subAjBfMRzDyXC8wbM4asyahs_03',
          } as any);
          mockedFirebase.updateTransaction.mockResolvedValue(undefined as any);
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await createParkingSubscription(req, res);
      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 'subAjBfMRzDyXC8wbM4asyahs_03',
            finalAmount: expect.any(Number),
          }),
        }),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return PARKING_SPACE_ALREADY_RESERVED when time slot conflicts',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([mockParkingSubscription] as any);
        },
        error: {
          statusCode: StatusCode.PARKING_SPACE_ALREADY_RESERVED,
          errorMessage: ErrorMessage.PARKING_SPACE_ALREADY_RESERVED,
        },
      },
      {
        name: 'should return ACCOUNT_NOT_FOUND when uid is missing',
        input: { ...baseInput, user: {} },
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
        },
        error: {
          statusCode: StatusCode.ACCOUNT_NOT_FOUND,
          errorMessage: ErrorMessage.ACCOUNT_NOT_FOUND,
        },
      },
      {
        name: 'should return INVALID_POINTS when user uses more points than available',
        input: {
          ...baseInput,
          body: { ...baseInput.body, points_used: 9999 },
        },
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById.mockResolvedValueOnce({ ...mockUser, points: 100 } as any);
        },
        error: {
          statusCode: StatusCode.INVALID_POINTS,
          errorMessage: ErrorMessage.INVALID_POINTS,
        },
      },
      {
        name: 'should return PARKING_SPACE_NOT_FOUND when parking space does not exist',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockUser as any)
            .mockResolvedValueOnce(null as any);
        },
        error: {
          statusCode: StatusCode.PARKING_SPACE_NOT_FOUND,
          errorMessage: ErrorMessage.PARKING_SPACE_NOT_FOUND,
        },
      },
      {
        name: 'should return default error when transaction fails',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockUser as any)
            .mockResolvedValueOnce(mockParkingSpace as any);

          mockedFirebase.runTransaction.mockImplementation(async () => {
            throw new Error('UNKNOWN_ERROR');
          });
        },
        error: {
          statusCode: StatusCode.CANNOT_CREATE_PARKING_SUBSCRIPTION,
          errorMessage: ErrorMessage.CANNOT_CREATE_PARKING_SUBSCRIPTION,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await createParkingSubscription(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('updateParkingSubscriptionStatus()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should update status to RESERVED and set parking space to RESERVED',
        input: {
          ...mockUpdateStatusInput,
          body: { status: ParkingSubscriptionStatus.RESERVED },
        },
        expected: ParkingSpaceStatus.RESERVED,
      },
      {
        name: 'should update status to EXPIRED and set parking space to AVAILABLE',
        input: {
          ...mockUpdateStatusInput,
          body: { status: ParkingSubscriptionStatus.EXPIRED },
        },
        expected: ParkingSpaceStatus.AVAILABLE,
      },
      {
        name: 'should update status to CANCELLED and set parking space to AVAILABLE',
        input: {
          ...mockUpdateStatusInput,
          body: { status: ParkingSubscriptionStatus.CANCELLED },
        },
        expected: ParkingSpaceStatus.AVAILABLE,
      },
    ];

    test.each(validCases)('$name', async ({ input, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockParkingSubscription as never);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as never);

      const response = await updateParkingSubscriptionStatus(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockParkingSubscription.id },
      });
      expect(mockedFirebase.updateDoc).toHaveBeenNthCalledWith(
        2,
        expect.not.stringContaining(Collection.PARKING_SUBSCRIPTIONS),
        mockParkingSpace.id,
        { status: expected },
      );
    });
  });

  describe('edge cases', () => {
    test('should not update parking space when status does not match any switch case', async () => {
      const req = mockReq({
        ...mockUpdateStatusInput,
        body: { status: 'UNKNOWN_STATUS' },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockParkingSubscription as never);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as never);

      const response = await updateParkingSubscriptionStatus(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockParkingSubscription.id },
      });

      expect(mockedFirebase.updateDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return PARKING_SUBSCRIPTION_NOT_FOUND when subscription does not exist',
        mockFire: () => mockedFirebase.getDocById.mockResolvedValue(null as never),
        error: {
          statusCode: StatusCode.PARKING_SUBSCRIPTION_NOT_FOUND,
          errorMessage: ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
        },
      },
      {
        name: 'should handle firestore error',
        mockFire: () =>
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as never),
        error: {
          statusCode: StatusCode.CANNOT_UPDATE_PARKING_SUBSCRIPTION_STATUS,
          errorMessage: ErrorMessage.CANNOT_UPDATE_PARKING_SUBSCRIPTION_STATUS,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq(mockUpdateStatusInput);
      const res = mockRes();

      mockFire();

      const response = await updateParkingSubscriptionStatus(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('cancelParkingSubscription()', () => {
  describe('valid cases', () => {
    test('should cancel subscription successfully', async () => {
      const req = mockReq(mockCancelInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockParkingSubscription as never);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as never);

      const response = await cancelParkingSubscription(req, res);

      expect(response).toEqual({
        success: true,
        data: { id: mockParkingSubscription.id },
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return PARKING_SUBSCRIPTION_NOT_FOUND when subscription does not exist',
        input: {
          ...mockCancelInput,
          params: { ...mockCancelInput.params, id: 'nonexistent_id' },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.PARKING_SUBSCRIPTION_NOT_FOUND,
          errorMessage: ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
        },
      },
      {
        name: 'should return CANCEL_PARKING_SUBSCRIPTION_FORBIDDEN when user is not the owner',
        input: {
          ...mockCancelInput,
          user: { uid: 'other_user' },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockParkingSubscription as any);
        },
        error: {
          statusCode: StatusCode.CANCEL_PARKING_SUBSCRIPTION_FORBIDDEN,
          errorMessage: ErrorMessage.CANCEL_PARKING_SUBSCRIPTION_FORBIDDEN,
        },
      },
      {
        name: 'should handle firestore error',
        input: mockCancelInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as any);
        },
        error: {
          statusCode: StatusCode.CANNOT_CANCEL_PARKING_SUBSCRIPTION,
          errorMessage: ErrorMessage.CANNOT_CANCEL_PARKING_SUBSCRIPTION,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await cancelParkingSubscription(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});
