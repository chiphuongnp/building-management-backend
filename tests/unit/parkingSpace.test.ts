import {
  getParkingSpaces,
  getParkingSpaceById,
  getParkingSpaceAvailable,
  getParkingSpaceStats,
  createParkingSpace,
  updateParkingSpace,
  updateParkingSpaceStatus,
} from '../../services/parkingSpace';
import { ErrorMessage, StatusCode } from '../../constants/message';
import { ParkingSpaceStatus } from '../../constants/enum';
import { firebaseHelper } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import {
  mockParkingSpaces,
  mockBuilding,
  mockParkingSpace,
  mockCreateParkingSpaceInput,
  mockUpdateParkingSpaceInput,
} from '../data/parkingSpace.mock';

const mockedFirebase = jest.mocked(firebaseHelper);

describe('getParkingSpaces()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return all parking spaces without filters',
        input: { query: {} },
        mockFire: () => {
          mockedFirebase.getAllDocs.mockResolvedValue(mockParkingSpaces as never);
        },
        expected: mockParkingSpaces,
      },
      {
        name: 'should return filtered parking spaces by building_id',
        input: { query: { building_id: mockBuilding.id } },
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue(mockParkingSpaces as never);
        },
        expected: mockParkingSpaces,
      },
      {
        name: 'should return empty list when no parking spaces exist',
        input: { query: {} },
        mockFire: () => {
          mockedFirebase.getAllDocs.mockResolvedValue([] as never);
        },
        expected: [],
      },
      {
        name: 'should handle order and order_by query params',
        input: { query: { building_id: mockBuilding.id, order: 'asc', order_by: 'code' } },
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue(mockParkingSpaces as never);
        },
        expected: mockParkingSpaces,
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await getParkingSpaces(req, res);
      expect(response).toEqual({
        success: true,
        data: expected,
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({ query: {} });
      const res = mockRes();

      mockedFirebase.getAllDocs.mockRejectedValue(new Error('firestore error') as never);

      const response = await getParkingSpaces(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_PARKING_SPACE_LIST,
        message: ErrorMessage.CANNOT_GET_PARKING_SPACE_LIST,
      });
    });
  });
});

describe('getParkingSpaceStats()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return correct stats for mixed statuses',
        input: { query: { building_id: mockBuilding.id } },
        mockFire: () => mockedFirebase.getDocByField.mockResolvedValue(mockParkingSpaces as never),
        expected: { total: 3, available: 1, reserved: 1, maintenance: 1 },
      },
      {
        name: 'should return zero stats when no parking spaces exist',
        input: { query: { building_id: mockBuilding.id } },
        mockFire: () => mockedFirebase.getDocByField.mockResolvedValue([] as never),
        expected: { total: 0, available: 0, reserved: 0, maintenance: 0 },
      },
      {
        name: 'should return correct stats when all spaces are available',
        input: { query: { building_id: mockBuilding.id } },
        mockFire: () =>
          mockedFirebase.getDocByField.mockResolvedValue([
            mockParkingSpace,
            { ...mockParkingSpace, id: 'parking_002' },
          ] as never),
        expected: { total: 2, available: 2, reserved: 0, maintenance: 0 },
      },
      {
        name: 'should return correct stats when all spaces are reserved',
        input: { query: { building_id: mockBuilding.id } },
        mockFire: () =>
          mockedFirebase.getDocByField.mockResolvedValue([
            { ...mockParkingSpace, status: ParkingSpaceStatus.RESERVED },
            { ...mockParkingSpace, id: 'parking_002', status: ParkingSpaceStatus.RESERVED },
          ] as never),
        expected: { total: 2, available: 0, reserved: 2, maintenance: 0 },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await getParkingSpaceStats(req, res);
      expect(response).toEqual({
        success: true,
        data: expected,
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({ query: { building_id: mockBuilding.id } });
      const res = mockRes();

      mockedFirebase.getDocByField.mockRejectedValue(new Error('firestore error') as never);

      const response = await getParkingSpaceStats(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_PARKING_SPACE_STATS,
        message: ErrorMessage.CANNOT_GET_PARKING_SPACE_STATS,
      });
    });
  });
});

describe('getParkingSpaceById()', () => {
  describe('valid cases', () => {
    test('should return parking space detail', async () => {
      const req = mockReq({ params: { id: mockParkingSpace.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockParkingSpace as never);

      const response = await getParkingSpaceById(req, res);
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining(mockParkingSpace),
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return PARKING_SPACE_NOT_FOUND when space does not exist',
        reqParams: { id: 'nonexistent_id' },
        mockFire: () => mockedFirebase.getDocById.mockResolvedValue(null as never),
        error: {
          statusCode: StatusCode.PARKING_SPACE_NOT_FOUND,
          errorMessage: ErrorMessage.PARKING_SPACE_NOT_FOUND,
        },
      },
      {
        name: 'should handle firestore error',
        reqParams: { id: mockParkingSpace.id },
        mockFire: () =>
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as never),
        error: {
          statusCode: StatusCode.PARKING_SPACE_NOT_FOUND,
          errorMessage: ErrorMessage.PARKING_SPACE_NOT_FOUND,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ reqParams, error, mockFire }) => {
      const req = mockReq({ params: reqParams });
      const res = mockRes();

      mockFire();

      const response = await getParkingSpaceById(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('getParkingSpaceAvailable()', () => {
  describe('valid cases', () => {
    test('should return available parking spaces', async () => {
      const req = mockReq({});
      const res = mockRes();

      const availableSpaces = [mockParkingSpace];
      mockedFirebase.getDocByField.mockResolvedValue(availableSpaces as never);

      const response = await getParkingSpaceAvailable(req, res);
      expect(response).toEqual({
        success: true,
        data: availableSpaces,
      });
    });

    test('should return empty list when no spaces are available', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([] as never);

      const response = await getParkingSpaceAvailable(req, res);
      expect(response).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocByField.mockRejectedValue(new Error('firestore error') as never);

      const response = await getParkingSpaceAvailable(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_AVAILABLE_PARKING_SPACE,
        message: ErrorMessage.CANNOT_GET_AVAILABLE_PARKING_SPACE,
      });
    });
  });
});

describe('createParkingSpace()', () => {
  const baseInput = mockCreateParkingSpaceInput;

  describe('valid cases', () => {
    test('should create parking space successfully', async () => {
      const req = mockReq(baseInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockBuilding as any);
      mockedFirebase.getDocsByFields.mockResolvedValue([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: '1Wv3zE7vsianIJyrafPFJ9asadw' } as any);

      const response = await createParkingSpace(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: '1Wv3zE7vsianIJyrafPFJ9asadw' },
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return BUILDING_NOT_FOUND when building does not exist',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.BUILDING_NOT_FOUND,
          errorMessage: ErrorMessage.BUILDING_NOT_FOUND,
        },
      },
      {
        name: 'should return PARKING_SPACE_CODE_ALREADY_EXISTS when code is duplicate',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockBuilding as any);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockParkingSpace] as any);
        },
        error: {
          statusCode: StatusCode.PARKING_SPACE_CODE_ALREADY_EXISTS,
          errorMessage: ErrorMessage.PARKING_SPACE_CODE_ALREADY_EXISTS,
        },
      },
      {
        name: 'should handle firestore error',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as any);
        },
        error: {
          statusCode: StatusCode.CANNOT_CREATE_PARKING_SPACE,
          errorMessage: ErrorMessage.CANNOT_CREATE_PARKING_SPACE,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await createParkingSpace(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('updateParkingSpace()', () => {
  const baseInput = mockUpdateParkingSpaceInput;

  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should update parking space successfully',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockParkingSpace as any);
          mockedFirebase.getDocByField.mockResolvedValue([mockParkingSpace] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
      },
      {
        name: 'should update without code change',
        input: {
          ...baseInput,
          body: { status: ParkingSpaceStatus.MAINTENANCE },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockParkingSpace as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await updateParkingSpace(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockParkingSpace.id },
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return PARKING_SPACE_NOT_FOUND when space does not exist',
        input: { ...baseInput, params: { id: 'nonexistent_id' } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.PARKING_SPACE_NOT_FOUND,
          errorMessage: ErrorMessage.PARKING_SPACE_NOT_FOUND,
        },
      },
      {
        name: 'should return PARKING_SPACE_CODE_ALREADY_EXISTS when code belongs to another space',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockParkingSpace as any);
          mockedFirebase.getDocByField.mockResolvedValue([
            { ...mockParkingSpace, id: 'parking_other' },
          ] as any);
        },
        error: {
          statusCode: StatusCode.PARKING_SPACE_CODE_ALREADY_EXISTS,
          errorMessage: ErrorMessage.PARKING_SPACE_CODE_ALREADY_EXISTS,
        },
      },
      {
        name: 'should handle firestore error',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as any);
        },
        error: {
          statusCode: StatusCode.CANNOT_UPDATE_PARKING_SPACE,
          errorMessage: ErrorMessage.CANNOT_UPDATE_PARKING_SPACE,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await updateParkingSpace(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('updateParkingSpaceStatus()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should update status to AVAILABLE',
        input: {
          params: { id: mockParkingSpace.id },
          body: { status: ParkingSpaceStatus.AVAILABLE },
        },
      },
      {
        name: 'should update status to RESERVED',
        input: {
          params: { id: mockParkingSpace.id },
          body: { status: ParkingSpaceStatus.RESERVED },
        },
      },
      {
        name: 'should update status to MAINTENANCE',
        input: {
          params: { id: mockParkingSpace.id },
          body: { status: ParkingSpaceStatus.MAINTENANCE },
        },
      },
    ];

    test.each(validCases)('$name', async ({ input }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.updateDoc.mockResolvedValue(undefined as never);

      const response = await updateParkingSpaceStatus(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockParkingSpace.id },
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({
        params: { id: mockParkingSpace.id },
        body: { status: ParkingSpaceStatus.AVAILABLE },
      });
      const res = mockRes();

      mockedFirebase.updateDoc.mockRejectedValue(new Error('firestore error') as never);

      const response = await updateParkingSpaceStatus(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_UPDATE_PARKING_SPACE_STATUS,
        message: ErrorMessage.CANNOT_UPDATE_PARKING_SPACE_STATUS,
      });
    });
  });
});
