import { ActiveStatus } from '../../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../../constants/message';
import {
  createBuilding,
  getBuildingById,
  getBuildings,
  getBuildingsStats,
  updateBuilding,
  updateBuildingStatus,
} from '../../services/building';
import { firebaseHelper, logger } from '../../utils/index';
import {
  mockBuildings,
  mockFilteredBuildings,
  mockEmptyBuildings,
  mockBuildingsStats,
  mockBuildingsNoManager,
} from '../data/building.mock';
import { mockReq, mockRes } from '../helpers/httpMock';

const mockedFirebase = firebaseHelper as jest.Mocked<typeof firebaseHelper>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getBuildings()', () => {
  describe('valid cases', () => {
    test('should return all buildings when no filter', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(2);
      mockedFirebase.getAllDocs.mockResolvedValue(mockBuildings);
      const response = await getBuildings(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          buildings: mockBuildings,
          pagination: expect.objectContaining({
            page: 1,
            page_size: 10,
            total: 2,
            total_page: 1,
          }),
        }),
      });
    });

    const filteredCases = [
      {
        name: 'should return buildings filtered by name',
        query: { name: 'Tokyo' },
      },
      {
        name: 'should return buildings filtered by status',
        query: { status: ActiveStatus.ACTIVE },
      },
      {
        name: 'should return buildings filtered by name and status',
        query: { status: ActiveStatus.ACTIVE, name: 'Tokyo' },
      },
    ];

    test.each(filteredCases)('$name', async ({ query }) => {
      const req = mockReq({ query });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(1);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockFilteredBuildings);
      const response = await getBuildings(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          buildings: mockFilteredBuildings,
          pagination: expect.objectContaining({ total: 1 }),
        }),
      });
    });

    test('should return paginated buildings', async () => {
      const req = mockReq({ query: {}, pagination: { page: 2, page_size: 5 } });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(20);
      mockedFirebase.getAllDocs.mockResolvedValue(mockBuildings);
      const response = await getBuildings(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          buildings: mockBuildings,
          pagination: expect.objectContaining({
            page: 2,
            page_size: 5,
            total: 20,
            total_page: 4,
          }),
        }),
      });
    });

    test('should return buildings sorted by name ascending', async () => {
      const req = mockReq({ query: { order_by: 'name', order: 'asc' } });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(2);
      mockedFirebase.getAllDocs.mockResolvedValue(mockBuildings);
      const response = await getBuildings(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          buildings: mockBuildings,
          pagination: expect.objectContaining({ total: 2 }),
        }),
      });
    });
  });

  describe('edge cases', () => {
    test('should return empty result when no buildings found', async () => {
      const req = mockReq({ query: { name: 'NotExist' } });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(0);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockEmptyBuildings);
      const response = await getBuildings(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          buildings: mockEmptyBuildings,
          pagination: expect.objectContaining({ total: 0 }),
        }),
      });
    });

    test('should use undefined page and page_size when pagination is undefined', async () => {
      const req = mockReq({});
      const res = mockRes();
      req.pagination = undefined;

      mockedFirebase.countAllDocs.mockResolvedValue(2);
      mockedFirebase.getAllDocs.mockResolvedValue(mockBuildings);
      const response = await getBuildings(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          buildings: mockBuildings,
          pagination: expect.objectContaining({
            page: undefined,
            page_size: undefined,
            total: 2,
          }),
        }),
      });
    });

    test('should use DEFAULT_PAGE_TOTAL when page_size is undefined', async () => {
      const req = mockReq({ query: {}, pagination: { page: 1, page_size: undefined } });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(10);
      mockedFirebase.getAllDocs.mockResolvedValue(mockBuildings);
      const response = await getBuildings(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          pagination: expect.objectContaining({
            page: 1,
            page_size: undefined,
            total_page: 1,
          }),
        }),
      });
    });
  });

  describe('error cases', () => {
    test('should return error when firebase fails', async () => {
      const req = mockReq({ query: { status: ActiveStatus.ACTIVE } });
      const res = mockRes();

      mockedFirebase.getDocsByFields.mockRejectedValue(new Error('firebase error'));
      const response = await getBuildings(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_BUILDING_LIST,
        message: ErrorMessage.CANNOT_GET_BUILDING_LIST,
      });
    });
  });
});

describe('getBuildingsStats()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return correct stats with active, inactive buildings and unique managers',
        mockData: mockBuildingsStats,
        expected: {
          total: 4,
          active: 2,
          inactive: 2,
          managers: ['2Wv3zE7vsianIJyrafPFJ98YWSj2', 'F8TBShxahAVWgk1BibSNQj787Xw1'],
        },
      },
      {
        name: 'should return empty managers when no manager_id exists',
        mockData: mockBuildingsNoManager,
        expected: { total: 2, active: 1, inactive: 1, managers: [] },
      },
    ];

    test.each(validCases)('$name', async ({ mockData, expected }) => {
      const req = mockReq();
      const res = mockRes();

      mockedFirebase.getDocsWithFields.mockResolvedValue(mockData);
      const response = await getBuildingsStats(req, res);

      expect(response).toEqual({ success: true, data: expected });
    });
  });

  describe('error cases', () => {
    test('should return error when firebase fails', async () => {
      const req = mockReq();
      const res = mockRes();

      mockedFirebase.getDocsWithFields.mockRejectedValue(new Error('firebase error'));
      const response = await getBuildingsStats(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_BUILDING_STATS,
        message: ErrorMessage.CANNOT_GET_BUILDING_STATS,
      });
    });
  });
});

describe('getBuildingById()', () => {
  describe('valid cases', () => {
    test('should return building when building exists', async () => {
      const req = mockReq({ params: { id: 'AjBfMRzDyXC8wbM4KHWb' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockBuildings[0]);
      const response = await getBuildingById(req, res);

      expect(response).toEqual({ success: true, data: mockBuildings[0] });
    });
  });

  describe('edge cases', () => {
    test('should handle missing id parameter', async () => {
      const req = mockReq({ params: {} });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null);
      const response = await getBuildingById(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.BUILDING_NOT_FOUND,
        message: ErrorMessage.BUILDING_NOT_FOUND,
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when building not found',
        mockFire: () => mockedFirebase.getDocById.mockResolvedValue(null),
      },
      {
        name: 'should return error when firebase throws error',
        mockFire: () => mockedFirebase.getDocById.mockRejectedValue(new Error('firebase error')),
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire }) => {
      const req = mockReq({ params: { id: 'building1' } });
      const res = mockRes();

      mockFire();
      const response = await getBuildingById(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.BUILDING_NOT_FOUND,
        message: ErrorMessage.BUILDING_NOT_FOUND,
      });
    });
  });
});

describe('createBuilding()', () => {
  describe('valid cases', () => {
    test('should create building successfully', async () => {
      const req = mockReq({
        body: { name: 'Tokyo Tower', code: 'TOKYO', address: 'Tokyo, Japan' },
      });
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: 'AjBfMRzDyXC8wbM4KHWb' } as any);
      const response = await createBuilding(req, res);

      expect(response).toEqual({ success: true, data: { id: 'AjBfMRzDyXC8wbM4KHWb' } });
    });
  });

  describe('error cases', () => {
    const duplicateCases = [
      {
        name: 'should return error when building name already exists',
        mockFire: () =>
          mockedFirebase.getDocByField.mockResolvedValueOnce([{ id: 'AjBfMRzDyXC8wbM4KHWb' }]),
        statusCode: StatusCode.BUILDING_NAME_ALREADY_EXISTS,
        errorMessage: ErrorMessage.BUILDING_NAME_ALREADY_EXISTS,
      },
      {
        name: 'should return error when building code already exists',
        mockFire: () =>
          mockedFirebase.getDocByField
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 'AjBfMRzDyXC8wbM4KHWb' }]),
        statusCode: StatusCode.BUILDING_CODE_ALREADY_EXISTS,
        errorMessage: ErrorMessage.BUILDING_CODE_ALREADY_EXISTS,
      },
    ];

    test.each(duplicateCases)('$name', async ({ mockFire, statusCode, errorMessage }) => {
      const req = mockReq({ body: { name: 'Tokyo Tower', code: 'TOKYO' } });
      const res = mockRes();

      mockFire();
      const response = await createBuilding(req, res);

      expect(response).toEqual({ success: false, status: statusCode, message: errorMessage });
    });

    test('should return error when create building fails', async () => {
      const req = mockReq({ body: { name: 'Tokyo Tower', code: 'TOKYO' } });
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedFirebase.createDoc.mockRejectedValue(new Error('firebase error'));
      const response = await createBuilding(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_CREATE_BUILDING,
        message: ErrorMessage.CANNOT_CREATE_BUILDING,
      });
    });
  });
});

describe('updateBuilding()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should update building successfully',
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { address: 'Osaka, Japan' },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockBuildings[0]);
          mockedFirebase.updateDoc.mockResolvedValue({} as any);
        },
      },
      {
        name: 'should update building when name exists but belongs to same building',
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { name: 'Tokyo Tower' },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockBuildings[0]);
          mockedFirebase.getDocByField.mockResolvedValue([mockBuildings[0]]);
          mockedFirebase.updateDoc.mockResolvedValue({} as any);
        },
      },
      {
        name: 'should update building when code exists but belongs to same building',
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { code: 'TOKYO' },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockBuildings[0]);
          mockedFirebase.getDocByField.mockResolvedValue([mockBuildings[0]]);
          mockedFirebase.updateDoc.mockResolvedValue({} as any);
        },
      },
    ];

    test.each(validCases)('$name', async ({ params, body, mockFire }) => {
      const req = mockReq({ params, body });
      const res = mockRes();

      mockFire();
      const response = await updateBuilding(req, res);

      expect(response).toEqual({ success: true, data: { id: 'AjBfMRzDyXC8wbM4KHWb' } });
    });
  });

  describe('error cases', () => {
    test('should return error when building not found', async () => {
      const req = mockReq({ params: { id: 'building_999' }, body: {} });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null);
      const response = await updateBuilding(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.BUILDING_NOT_FOUND,
        message: ErrorMessage.BUILDING_NOT_FOUND,
      });
    });

    const duplicateCases = [
      {
        name: 'should return error when building name already exists',
        body: { name: 'Shibuya Center' },
        statusCode: StatusCode.BUILDING_NAME_ALREADY_EXISTS,
        errorMessage: ErrorMessage.BUILDING_NAME_ALREADY_EXISTS,
      },
      {
        name: 'should return error when building code already exists',
        body: { code: 'SHIBUYA' },
        statusCode: StatusCode.BUILDING_CODE_ALREADY_EXISTS,
        errorMessage: ErrorMessage.BUILDING_CODE_ALREADY_EXISTS,
      },
    ];

    test.each(duplicateCases)('$name', async ({ body, statusCode, errorMessage }) => {
      const req = mockReq({ params: { id: 'AjBfMRzDyXC8wbM4KHWb' }, body });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockBuildings[0]);
      mockedFirebase.getDocByField.mockResolvedValue([mockBuildings[1]]);
      const response = await updateBuilding(req, res);

      expect(response).toEqual({ success: false, status: statusCode, message: errorMessage });
    });

    test('should return error when firebase update fails', async () => {
      const req = mockReq({ params: { id: 'building_1' }, body: { address: 'Osaka, Japan' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockBuildings[0]);
      mockedFirebase.updateDoc.mockRejectedValue(new Error('firebase error'));
      const response = await updateBuilding(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_UPDATE_BUILDING,
        message: ErrorMessage.CANNOT_UPDATE_BUILDING,
      });
    });
  });
});

describe('updateBuildingStatus()', () => {
  describe('valid cases', () => {
    test('should update building status successfully', async () => {
      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { status: ActiveStatus.INACTIVE },
      });
      const res = mockRes();

      mockedFirebase.updateDoc.mockResolvedValue({} as any);
      const response = await updateBuildingStatus(req, res);

      expect(response).toEqual({ success: true, data: { id: 'AjBfMRzDyXC8wbM4KHWb' } });
    });
  });

  describe('error cases', () => {
    test('should return error when firebase fails', async () => {
      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4Khhh' },
        body: { status: ActiveStatus.ACTIVE },
      });
      const res = mockRes();

      mockedFirebase.updateDoc.mockRejectedValue(new Error('Firebase error'));
      const response = await updateBuildingStatus(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_UPDATE_BUILDING_STATUS,
        message: ErrorMessage.CANNOT_UPDATE_BUILDING_STATUS,
      });
    });
  });
});
