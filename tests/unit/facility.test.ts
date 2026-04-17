import { FacilityStatus } from '../../constants/enum';
import { ErrorMessage, StatusCode } from '../../constants/message';
import {
  getFacilities,
  getFacilityById,
  getAvailableFacility,
  getFacilityStats,
  createFacility,
  updateFacility,
  updateFacilityStatus,
} from '../../services/facility';
import { firebaseHelper } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import {
  mockBuilding,
  mockFacility,
  mockFacility2,
  mockFacilities,
  mockCreateFacilityInput,
} from '../data/facility.mock';
import { mockUser } from '../data/busSubscription.mock';

const mockedFirebase = jest.mocked(firebaseHelper);

describe('getFacilities()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return all facilities without filters',
        input: {
          query: {},
          pagination: { page: 1, page_size: 10 },
        },
        expected: { facilities: mockFacilities, total: 2 },
      },
      {
        name: 'should return facilities filtered by building_id',
        input: {
          query: { building_id: mockBuilding.id },
          pagination: { page: 1, page_size: 10 },
        },
        expected: { facilities: mockFacilities, total: 2 },
      },
      {
        name: 'should return facilities filtered by status',
        input: {
          query: { status: FacilityStatus.AVAILABLE },
          pagination: { page: 1, page_size: 10 },
        },
        expected: { facilities: [mockFacility], total: 1 },
      },
      {
        name: 'should return facilities filtered by name',
        input: {
          query: { name: 'Conference' },
          pagination: { page: 1, page_size: 10 },
        },
        expected: { facilities: [mockFacility], total: 1 },
      },
      {
        name: 'should return facilities filtered by multiple fields (status + building_id)',
        input: {
          query: { status: FacilityStatus.AVAILABLE, building_id: mockBuilding.id },
          pagination: { page: 1, page_size: 10 },
        },
        expected: { facilities: [mockFacility], total: 1 },
      },
      {
        name: 'should return empty facilities list',
        input: {
          query: {},
          pagination: { page: 1, page_size: 10 },
        },
        expected: { facilities: [], total: 0 },
      },
      {
        name: 'should handle order and order_by query params',
        input: {
          query: { order: 'asc', order_by: 'created_at' },
          pagination: { page: 1, page_size: 10 },
        },
        expected: { facilities: mockFacilities, total: 2 },
      },
    ];

    test.each(validCases)('$name', async ({ input, expected }) => {
      const { facilities, total } = expected;
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(total as never);
      mockedFirebase.countDocsByFields.mockResolvedValue(total as never);
      mockedFirebase.getAllDocs.mockResolvedValue(facilities as never);
      mockedFirebase.getDocsByFields.mockResolvedValue(facilities as never);

      const response = await getFacilities(req, res);

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            facilities,
          }),
        }),
      );
    });
  });

  describe('edge cases', () => {
    describe('pagination', () => {
      const cases = [
        {
          name: 'should handle missing pagination',
          input: { query: {}, pagination: undefined },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(2 as never);
            mockedFirebase.getAllDocs.mockResolvedValue(mockFacilities as never);
          },
        },
        {
          name: 'should handle empty pagination object',
          input: { query: {}, pagination: {} },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(3 as never);
            mockedFirebase.getAllDocs.mockResolvedValue(mockFacilities as never);
          },
        },
        {
          name: 'should handle null pagination',
          input: { query: {}, pagination: null },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(4 as never);
            mockedFirebase.getAllDocs.mockResolvedValue(mockFacilities as never);
          },
        },
        {
          name: 'should use default when page_size is missing',
          input: { query: {}, pagination: { page: 1 } },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(5 as never);
            mockedFirebase.getAllDocs.mockResolvedValue(mockFacilities as never);
          },
        },
        {
          name: 'should calculate totalPage correctly',
          input: { query: {}, pagination: { page: 1, page_size: 2 } },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(5 as never);
            mockedFirebase.getAllDocs.mockResolvedValue(mockFacilities as never);
          },
        },
      ];

      test.each(cases)('$name', async ({ input, mockFire }) => {
        const req = mockReq(input);
        const res = mockRes();

        mockFire();

        const response = await getFacilities(req, res);

        expect(response).toEqual(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              facilities: expect.any(Array),
              pagination: expect.any(Object),
            }),
          }),
        );
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({ query: {}, pagination: { page: 1, page_size: 10 } });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockRejectedValue(new Error('firestore error') as never);

      const response = await getFacilities(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_FACILITY_LIST,
        message: ErrorMessage.CANNOT_GET_FACILITY_LIST,
      });
    });
  });
});

describe('getFacilityById()', () => {
  describe('valid cases', () => {
    test('should return facility detail', async () => {
      const req = mockReq({ params: { id: mockFacility.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockFacility as never);

      const response = await getFacilityById(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining(mockFacility),
      });
    });
  });

  describe('error cases', () => {
    test('should return FACILITY_NOT_FOUND when facility does not exist', async () => {
      const req = mockReq({ params: { id: 'nonexistent_id' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null as never);

      const response = await getFacilityById(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.FACILITY_NOT_FOUND,
        message: ErrorMessage.FACILITY_NOT_FOUND,
      });
    });

    test('should handle firestore error', async () => {
      const req = mockReq({ params: { id: mockFacility.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as never);

      const response = await getFacilityById(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.FACILITY_NOT_FOUND,
        message: ErrorMessage.FACILITY_NOT_FOUND,
      });
    });
  });
});

describe('getAvailableFacility()', () => {
  describe('valid cases', () => {
    test('should return list of available facilities', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([mockFacility] as never);

      const response = await getAvailableFacility(req, res);

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: [mockFacility],
        }),
      );
    });

    test('should return empty array when no facilities are available', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([] as never);

      const response = await getAvailableFacility(req, res);

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: [],
        }),
      );
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocByField.mockRejectedValue(new Error('firestore error') as never);

      const response = await getAvailableFacility(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_AVAILABLE_FACILITY,
        message: ErrorMessage.CANNOT_GET_AVAILABLE_FACILITY,
      });
    });
  });
});

describe('getFacilityStats()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return correct stats with mixed statuses',
        docs: [
          { status: FacilityStatus.AVAILABLE, building_id: 'building_01' },
          { status: FacilityStatus.MAINTENANCE, building_id: 'building_01' },
          { status: FacilityStatus.RESERVED, building_id: 'building_02' },
        ],
        expected: { total: 3, available: 1, maintenance: 1, reserved: 1 },
      },
      {
        name: 'should return stats when all facilities are available',
        docs: [
          { status: FacilityStatus.AVAILABLE, building_id: 'building_01' },
          { status: FacilityStatus.AVAILABLE, building_id: 'building_01' },
        ],
        expected: { total: 2, available: 2, maintenance: 0, reserved: 0 },
      },
      {
        name: 'should return zeroed stats when no facilities exist',
        docs: [],
        expected: { total: 0, available: 0, maintenance: 0, reserved: 0 },
      },
      {
        name: 'should deduplicate buildings',
        docs: [
          { status: FacilityStatus.AVAILABLE, building_id: 'building_01' },
          { status: FacilityStatus.AVAILABLE, building_id: 'building_01' },
          { status: FacilityStatus.MAINTENANCE, building_id: 'building_02' },
        ],
        expected: { total: 3, available: 2, maintenance: 1, reserved: 0 },
      },
      {
        name: 'should handle facilities without building_id',
        docs: [
          { status: FacilityStatus.AVAILABLE, building_id: null },
          { status: FacilityStatus.AVAILABLE, building_id: undefined },
        ],
        expected: { total: 2, available: 2, maintenance: 0, reserved: 0 },
      },
    ];

    test.each(validCases)('$name', async ({ docs, expected }) => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocsWithFields.mockResolvedValue(docs as never);

      const response = await getFacilityStats(req, res);

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining(expected),
        }),
      );
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocsWithFields.mockRejectedValue(new Error('firestore error') as never);

      const response = await getFacilityStats(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_FACILITY_STATS,
        message: ErrorMessage.CANNOT_GET_FACILITY_STATS,
      });
    });
  });
});

describe('createFacility()', () => {
  const baseInput = mockCreateFacilityInput;

  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should create facility successfully',
        input: baseInput,
      },
      {
        name: 'should create facility with different building',
        input: {
          ...baseInput,
          body: { ...baseInput.body, building_id: 'building_02' },
        },
      },
    ];

    test.each(validCases)('$name', async ({ input }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockBuilding as any);
      mockedFirebase.getDocsByFields.mockResolvedValue([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: 'fA9sD3kL0pQwErTyUiOpZxCvsadw1' } as any);

      const response = await createFacility(req, res);

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: 'fA9sD3kL0pQwErTyUiOpZxCvsadw1' }),
        }),
      );
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
        name: 'should return FACILITY_NAME_ALREADY_EXISTS when name is duplicate in same building',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockBuilding as any);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockFacility] as any);
        },
        error: {
          statusCode: StatusCode.FACILITY_NAME_ALREADY_EXISTS,
          errorMessage: ErrorMessage.FACILITY_NAME_ALREADY_EXISTS,
        },
      },
      {
        name: 'should handle firestore error',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as any);
        },
        error: {
          statusCode: StatusCode.CANNOT_CREATE_FACILITY,
          errorMessage: ErrorMessage.CANNOT_CREATE_FACILITY,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await createFacility(req, res);

      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('updateFacility()', () => {
  const baseInput = {
    params: { id: mockFacility.id },
    body: {
      name: 'Updated Name',
      location: { area: 'North', floor: 4, outdoor: true },
    },
    user: { uid: mockUser.id },
  };

  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should update facility name and location successfully',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([mockFacility] as any);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockFacility] as any);
        },
      },
      {
        name: 'should update facility without name field',
        input: {
          ...baseInput,
          body: { location: { area: 'East', floor: 1, outdoor: false } },
        },
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([mockFacility] as any);
        },
      },
      {
        name: 'should update facility without location field',
        input: {
          ...baseInput,
          body: { name: 'Only Name Updated' },
        },
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([mockFacility] as any);
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockFacility as any);
      mockFire();
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      const response = await updateFacility(req, res);

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: mockFacility.id }),
        }),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return FACILITY_NOT_FOUND when facility does not exist',
        input: { ...baseInput, params: { id: 'nonexistent_id' } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.FACILITY_NOT_FOUND,
          errorMessage: ErrorMessage.FACILITY_NOT_FOUND,
        },
      },
      {
        name: 'should return FACILITY_NAME_ALREADY_EXISTS when name belongs to another facility',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockFacility as any);
          mockedFirebase.getDocByField.mockResolvedValue([
            { ...mockFacility2, name: baseInput.body.name },
          ] as any);
        },
        error: {
          statusCode: StatusCode.FACILITY_NAME_ALREADY_EXISTS,
          errorMessage: ErrorMessage.FACILITY_NAME_ALREADY_EXISTS,
        },
      },
      {
        name: 'should return FACILITY_LOCATION_ALREADY_EXISTS when location belongs to another facility',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockFacility as any);
          mockedFirebase.getDocByField.mockResolvedValue([mockFacility] as any);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockFacility2] as any);
        },
        error: {
          statusCode: StatusCode.FACILITY_LOCATION_ALREADY_EXISTS,
          errorMessage: ErrorMessage.FACILITY_LOCATION_ALREADY_EXISTS,
        },
      },
      {
        name: 'should handle firestore error',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as any);
        },
        error: {
          statusCode: StatusCode.CANNOT_UPDATE_FACILITY,
          errorMessage: ErrorMessage.CANNOT_UPDATE_FACILITY,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await updateFacility(req, res);

      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('updateFacilityStatus()', () => {
  const baseInput = {
    params: { id: mockFacility.id },
    body: { status: FacilityStatus.MAINTENANCE },
    user: { uid: mockUser.id },
  };

  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should update status to MAINTENANCE',
        input: baseInput,
      },
      {
        name: 'should update status to RESERVED',
        input: { ...baseInput, body: { status: FacilityStatus.RESERVED } },
      },
      {
        name: 'should update status back to AVAILABLE',
        input: { ...baseInput, body: { status: FacilityStatus.AVAILABLE } },
      },
    ];

    test.each(validCases)('$name', async ({ input }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockFacility as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      const response = await updateFacilityStatus(req, res);

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: mockFacility.id }),
        }),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return FACILITY_NOT_FOUND when facility does not exist',
        input: { ...baseInput, params: { id: 'nonexistent_id' } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.FACILITY_NOT_FOUND,
          errorMessage: ErrorMessage.FACILITY_NOT_FOUND,
        },
      },
      {
        name: 'should handle firestore error',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as any);
        },
        error: {
          statusCode: StatusCode.CANNOT_UPDATE_FACILITY_STATUS,
          errorMessage: ErrorMessage.CANNOT_UPDATE_FACILITY_STATUS,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await updateFacilityStatus(req, res);

      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});
