import { ErrorMessage, Message, StatusCode } from '../../constants/message';
import {
  createBus,
  getAllBuses,
  getBusStats,
  getBusDetail,
  updateBus,
  updateBusStatus,
} from '../../services/bus';
import { firebaseHelper, logger, deleteImages } from '../../utils/index';
import { mockBuses, mockEmptyBuses } from '../data/bus.mock';
import { mockReq, mockRes } from '../helpers/httpMock';
import { BusSeatStatus, BusStatus } from '../../constants/enum';

const mockedDeleteImages = jest.mocked(deleteImages);
const mockedFirebase = jest.mocked(firebaseHelper);
const mockedLogger = jest.mocked(logger);

export const responseSuccessMock = jest
  .fn()
  .mockImplementation((_res: any, _message: string, data?: any) => ({
    success: true,
    data,
  }));

export const responseErrorMock = jest
  .fn()
  .mockImplementation((_res: any, statusCode: number, message: string) => ({
    success: false,
    status: statusCode,
    message,
  }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createBus()', () => {
  describe('valid cases', () => {
    test('should create bus successfully', async () => {
      mockedFirebase.getDocByField.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: 'AjBfMRzDyXC8wbM4KHWb' } as any);

      const req = mockReq({
        body: {
          type_name: 'Sleeper Bus',
          number: 1,
          plate_number: 'ABC-1234',
          capacity: 30,
          model: 'Toyota Coaster',
        },
        files: [],
      });
      const res = mockRes();
      const response = await createBus(req, res);

      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_CREATED, { id: 'AjBfMRzDyXC8wbM4KHWb' }),
      );
    });

    test('should create bus with uploaded images', async () => {
      mockedFirebase.getDocByField.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: 'AjBfMRzDyXC8wbM4KHWb' } as any);

      const req = mockReq({
        body: {
          type_name: 'Sleeper Bus',
          number: 1,
          plate_number: 'ABC-1234',
          capacity: 30,
          model: 'Toyota Coaster',
        },
        files: [{ path: 'uploads\\bus1.jpg' }, { path: 'uploads\\bus2.jpg' }],
      });
      const res = mockRes();
      const response = await createBus(req, res);

      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_CREATED, { id: 'AjBfMRzDyXC8wbM4KHWb' }),
      );
    });

    test('should generate seats based on capacity', async () => {
      mockedFirebase.getDocByField.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: 'AjBfMRzDyXC8wbM4KHWb' } as any);

      const req = mockReq({
        body: {
          type_name: 'Sleeper Bus',
          number: 1,
          plate_number: 'ABC-1234',
          capacity: 3,
          model: 'Toyota Coaster',
        },
        files: [],
      });
      const res = mockRes();
      await createBus(req, res);

      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          seats: [
            { seat_number: '1', status: BusSeatStatus.AVAILABLE },
            { seat_number: '2', status: BusSeatStatus.AVAILABLE },
            { seat_number: '3', status: BusSeatStatus.AVAILABLE },
          ],
          created_by: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
        }),
      );
    });

    test('should set image_urls to empty array when files is undefined', async () => {
      mockedFirebase.getDocByField.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: 'AjBfMRzDyXC8wbM4KHWb' } as any);

      const req = mockReq({
        body: {
          type_name: 'Sleeper Bus',
          number: 1,
          plate_number: 'ABC-1234',
          capacity: 30,
          model: 'Toyota Coaster',
        },
        files: null,
        user: { uid: 'user_001' },
      });
      const res = mockRes();
      await createBus(req, res);

      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          image_urls: [],
        }),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when bus number already exists',
        mockFirebase: () =>
          mockedFirebase.getDocByField.mockResolvedValueOnce([{ id: 'AjBfMRzDyXC8wbM4KHWb' }]),
        error: {
          statusCode: StatusCode.BUS_NUMBER_ALREADY_EXISTS,
          errorMessage: ErrorMessage.BUS_NUMBER_ALREADY_EXISTS,
        },
      },
      {
        name: 'should return error when plate number already exists',
        mockFirebase: () =>
          mockedFirebase.getDocByField
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 'AjBfMRzDyXC8wbM4KHWb' }]),
        error: {
          statusCode: StatusCode.BUS_CODE_ALREADY_EXISTS,
          errorMessage: ErrorMessage.BUS_CODE_ALREADY_EXISTS,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFirebase, error }) => {
      mockFirebase();

      const req = mockReq({
        body: {
          type_name: 'Sleeper Bus',
          number: 1,
          plate_number: 'ABC-1234',
          capacity: 30,
          model: 'Toyota Coaster',
        },
        files: [],
      });
      const res = mockRes();
      const response = await createBus(req, res);

      expect(response).toEqual(responseErrorMock(res, error.statusCode, error.errorMessage));
    });

    test('should return error when firebase create fails', async () => {
      mockedFirebase.getDocByField.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedFirebase.createDoc.mockRejectedValue(new Error('firebase error'));

      const req = mockReq({
        body: {
          type_name: 'Sleeper Bus',
          number: 1,
          plate_number: 'ABC-1234',
          capacity: 30,
          model: 'Toyota Coaster',
        },
        files: [],
      });
      const res = mockRes();
      const response = await createBus(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(response).toEqual(
        responseErrorMock(res, StatusCode.BUS_CREATE, ErrorMessage.CANNOT_CREATE_BUS),
      );
    });
  });
});

describe('getAllBuses()', () => {
  describe('valid cases', () => {
    test('should return all buses with pagination', async () => {
      mockedFirebase.countAllDocs.mockResolvedValue(3);
      mockedFirebase.getAllDocs.mockResolvedValue(mockBuses);

      const req = mockReq({ query: {}, pagination: { page: 1, page_size: 10 } });
      const res = mockRes();
      const response = await getAllBuses(req, res);

      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_GET_ALL, {
          buses: mockBuses,
          pagination: { page: 1, page_size: 10, total: 3, total_page: 1 },
        }),
      );
    });

    test('should return empty list when no buses found', async () => {
      mockedFirebase.countAllDocs.mockResolvedValue(0);
      mockedFirebase.getAllDocs.mockResolvedValue(mockEmptyBuses);

      const req = mockReq({ query: {}, pagination: { page: 1, page_size: 10 } });
      const res = mockRes();
      const response = await getAllBuses(req, res);

      expect(response).toEqual(responseSuccessMock(res, Message.BUS_GET_ALL, mockEmptyBuses));
    });

    test('should filter buses by plate_number', async () => {
      const filtered = [mockBuses[0]];
      mockedFirebase.countDocsByFields.mockResolvedValue(1);
      mockedFirebase.getDocsByFields.mockResolvedValue(filtered);

      const req = mockReq({
        query: { plate_number: 'abc-1234' },
        pagination: { page: 1, page_size: 10 },
      });
      const res = mockRes();
      const response = await getAllBuses(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalled();
      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_GET_ALL, {
          buses: filtered,
          pagination: { page: 1, page_size: 10, total: 1, total_page: 1 },
        }),
      );
    });

    test('should filter buses by status', async () => {
      const filtered = [mockBuses[0]];
      mockedFirebase.countDocsByFields.mockResolvedValue(1);
      mockedFirebase.getDocsByFields.mockResolvedValue(filtered);

      const req = mockReq({
        query: { status: BusStatus.ACTIVE },
        pagination: { page: 1, page_size: 10 },
      });
      const res = mockRes();
      const response = await getAllBuses(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalled();
      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_GET_ALL, {
          buses: filtered,
          pagination: { page: 1, page_size: 10, total: 1, total_page: 1 },
        }),
      );
    });

    test('should apply order and order_by when provided', async () => {
      mockedFirebase.countAllDocs.mockResolvedValue(2);
      mockedFirebase.getAllDocs.mockResolvedValue(mockBuses);

      const req = mockReq({
        query: { order: 'desc', order_by: 'number' },
        pagination: { page: 1, page_size: 10 },
      });
      const res = mockRes();
      const response = await getAllBuses(req, res);

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            buses: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              page_size: 10,
            }),
          }),
        }),
      );
    });
  });

  describe('edge cases', () => {
    test('should return empty list when buses not found', async () => {
      mockedFirebase.countAllDocs.mockResolvedValue(0);
      mockedFirebase.getAllDocs.mockResolvedValue([]);

      const req = mockReq({ query: {}, pagination: { page: 1, page_size: 10 } });
      const res = mockRes();
      const response = await getAllBuses(req, res);

      expect(response).toEqual({
        success: true,
        data: [],
      });
    });

    test('should use undefined page and page_size when pagination is undefined', async () => {
      mockedFirebase.countAllDocs.mockResolvedValue(2);
      mockedFirebase.getAllDocs.mockResolvedValue(mockBuses);
      const req = mockReq({});
      const res = mockRes();
      req.pagination = undefined;

      const response = await getAllBuses(req, res);

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            buses: expect.any(Array),
            pagination: expect.objectContaining({
              page: undefined,
              page_size: undefined,
              total: 2,
              total_page: 1,
            }),
          }),
        }),
      );
    });

    test('should use DEFAULT_PAGE_TOTAL when page_size is undefined', async () => {
      mockedFirebase.countAllDocs.mockResolvedValue(5);
      mockedFirebase.getAllDocs.mockResolvedValue(mockBuses);

      const req = mockReq({ query: {}, pagination: { page: 1, page_size: undefined } });
      const res = mockRes();
      const response = await getAllBuses(req, res);

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            pagination: expect.objectContaining({
              page: 1,
              total: 5,
            }),
          }),
        }),
      );
    });
  });

  describe('error cases', () => {
    test('should return error when firebase fails', async () => {
      mockedFirebase.countAllDocs.mockRejectedValue(new Error('firebase error'));

      const req = mockReq({ query: {}, pagination: { page: 1, page_size: 10 } });
      const res = mockRes();
      const response = await getAllBuses(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(response).toEqual(
        responseErrorMock(res, StatusCode.BUS_GET_ALL, ErrorMessage.CANNOT_GET_BUS_LIST),
      );
    });
  });
});

describe('getBusStats()', () => {
  describe('valid cases', () => {
    test('should return correct bus stats', async () => {
      mockedFirebase.getDocsWithFields.mockResolvedValue([
        { status: BusStatus.ACTIVE, driver_id: 'driver_001' },
        { status: BusStatus.INACTIVE, driver_id: 'driver_002' },
        { status: BusStatus.MAINTENANCE, driver_id: undefined },
      ]);

      const req = mockReq();
      const res = mockRes();
      const response = await getBusStats(req, res);

      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_GET_STATS, {
          total: 3,
          active: 1,
          inactive: 1,
          maintenance: 1,
          drivers: expect.arrayContaining(['driver_001', 'driver_002']),
        }),
      );
    });

    test('should return zero stats when no buses exist', async () => {
      mockedFirebase.getDocsWithFields.mockResolvedValue([]);

      const req = mockReq();
      const res = mockRes();
      const response = await getBusStats(req, res);

      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_GET_STATS, {
          total: 0,
          active: 0,
          inactive: 0,
          maintenance: 0,
          drivers: [],
        }),
      );
    });

    test('should count unique drivers only once', async () => {
      mockedFirebase.getDocsWithFields.mockResolvedValue([
        { status: BusStatus.ACTIVE, driver_id: 'driver_001' },
        { status: BusStatus.INACTIVE, driver_id: 'driver_001' },
      ]);

      const req = mockReq();
      const res = mockRes();
      const response = await getBusStats(req, res);

      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_GET_STATS, {
          total: 2,
          active: 1,
          inactive: 1,
          maintenance: 0,
          drivers: ['driver_001'],
        }),
      );
    });
  });

  describe('error cases', () => {
    test('should return error when firebase fails', async () => {
      mockedFirebase.getDocsWithFields.mockRejectedValue(new Error('firebase error'));

      const req = mockReq();
      const res = mockRes();
      const response = await getBusStats(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(response).toEqual(
        responseErrorMock(res, StatusCode.CANNOT_GET_BUS_STATS, ErrorMessage.CANNOT_GET_BUS_STATS),
      );
    });
  });
});

describe('getBusDetail()', () => {
  describe('valid cases', () => {
    test('should return bus detail when bus exists', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[0]);

      const req = mockReq({ params: { id: 'AjBfMRzDyXC8wbM4KHWb' } });
      const res = mockRes();
      const response = await getBusDetail(req, res);

      expect(response).toEqual(responseSuccessMock(res, Message.BUS_GET_DETAIL, mockBuses[0]));
    });
  });

  describe('edge cases', () => {
    test('should return error when id parameter is missing', async () => {
      mockedFirebase.getDocById.mockResolvedValue(null);

      const req = mockReq({ params: {} });
      const res = mockRes();
      const response = await getBusDetail(req, res);

      expect(response).toEqual(
        responseErrorMock(res, StatusCode.BUS_NOT_FOUND, ErrorMessage.BUS_NOT_FOUND),
      );
    });
  });

  describe('error cases', () => {
    test('should return error when bus not found', async () => {
      mockedFirebase.getDocById.mockResolvedValue(null);

      const req = mockReq({ params: { id: 'nonexistent_id_000' } });
      const res = mockRes();
      const response = await getBusDetail(req, res);

      expect(response).toEqual(
        responseErrorMock(res, StatusCode.BUS_NOT_FOUND, ErrorMessage.BUS_NOT_FOUND),
      );
    });

    test('should return error when firebase throws error', async () => {
      mockedFirebase.getDocById.mockRejectedValue(new Error('firebase error'));

      const req = mockReq({ params: { id: 'AjBfMRzDyXC8wbM4KHWb' } });
      const res = mockRes();
      const response = await getBusDetail(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(response).toEqual(
        responseErrorMock(res, StatusCode.BUS_GET_DETAIL, ErrorMessage.CANNOT_GET_BUS_DETAIL),
      );
    });
  });
});

describe('updateBus()', () => {
  describe('valid cases', () => {
    test('should update bus successfully', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[0]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { capacity: 40 },
        files: [],
      });
      const res = mockRes();
      const response = await updateBus(req, res);

      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_UPDATED, { id: 'AjBfMRzDyXC8wbM4KHWb' }),
      );
    });

    test('should update bus with new images and delete old ones', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[0]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);
      (mockedDeleteImages as jest.Mock).mockResolvedValue(undefined as any);

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: {},
        files: [{ path: 'uploads\\new_bus1.jpg' }],
      });
      const res = mockRes();
      const response = await updateBus(req, res);

      expect(mockedDeleteImages).toHaveBeenCalledWith(mockBuses[0].image_urls);
      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_UPDATED, { id: 'AjBfMRzDyXC8wbM4KHWb' }),
      );
    });

    test('should update bus with new images but skip deleteImages when bus has no existing images', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[2]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);

      const req = mockReq({
        params: { id: 'xatrgjGstsC8wbM4hgGtw' },
        body: {},
        files: [{ path: 'uploads\\new_bus3.jpg' }],
      });
      const res = mockRes();
      const response = await updateBus(req, res);

      expect(mockedDeleteImages).not.toHaveBeenCalled();
      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_UPDATED, { id: 'xatrgjGstsC8wbM4hgGtw' }),
      );
    });

    test('should update bus when number is unchanged', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[0]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { number: mockBuses[0].number },
        files: [],
      });
      const res = mockRes();
      const response = await updateBus(req, res);

      expect(mockedFirebase.getDocByField).not.toHaveBeenCalled();
      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_UPDATED, { id: 'AjBfMRzDyXC8wbM4KHWb' }),
      );
    });

    test('should regenerate seats when capacity is updated', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[0]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { capacity: 5 },
        files: [],
      });
      const res = mockRes();
      await updateBus(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        expect.any(String),
        'AjBfMRzDyXC8wbM4KHWb',
        expect.objectContaining({
          seats: expect.arrayContaining([
            expect.objectContaining({ seat_number: '1' }),
            expect.objectContaining({ seat_number: '5' }),
          ]),
        }),
      );
    });

    test('should set updated_by from authenticated user uid', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[0]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { capacity: 40 },
        files: [],
      });
      const res = mockRes();
      await updateBus(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        expect.any(String),
        'AjBfMRzDyXC8wbM4KHWb',
        expect.objectContaining({ updated_by: '2Wv3zE7vsianIJyrafPFJ98YWSj2' }),
      );
    });

    test('should update bus when number changes and no conflict exists', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[0]);
      mockedFirebase.getDocByField.mockResolvedValueOnce([]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { number: 99 },
        files: [],
      });
      const res = mockRes();
      const response = await updateBus(req, res);

      expect(mockedFirebase.getDocByField).toHaveBeenCalled();
      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_UPDATED, { id: 'AjBfMRzDyXC8wbM4KHWb' }),
      );
    });

    test('should update bus when plate_number changes and no conflict exists', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[0]);
      mockedFirebase.getDocByField.mockResolvedValueOnce([]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { plate_number: 'NEW-0000' },
        files: [],
      });
      const res = mockRes();
      const response = await updateBus(req, res);

      expect(mockedFirebase.getDocByField).toHaveBeenCalled();
      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_UPDATED, { id: 'AjBfMRzDyXC8wbM4KHWb' }),
      );
    });
  });

  describe('error cases', () => {
    test('should return error when bus not found', async () => {
      mockedFirebase.getDocById.mockResolvedValue(null);

      const req = mockReq({
        params: { id: 'nonexistent_id_000' },
        body: { capacity: 40 },
        files: [],
      });
      const res = mockRes();
      const response = await updateBus(req, res);

      expect(response).toEqual(
        responseErrorMock(res, StatusCode.BUS_NOT_FOUND, ErrorMessage.BUS_NOT_FOUND),
      );
    });

    test('should return error when bus number already exists on another bus', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[0]);
      mockedFirebase.getDocByField.mockResolvedValueOnce([mockBuses[1]]);

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { number: 2 },
        files: [],
      });
      const res = mockRes();
      const response = await updateBus(req, res);

      expect(response).toEqual(
        responseErrorMock(
          res,
          StatusCode.BUS_NUMBER_ALREADY_EXISTS,
          ErrorMessage.BUS_NUMBER_ALREADY_EXISTS,
        ),
      );
    });

    test('should return error when plate number already exists on another bus', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[0]);
      mockedFirebase.getDocByField.mockResolvedValueOnce([mockBuses[2]]);

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { plate_number: 'DEF-9012' },
        files: [],
      });
      const res = mockRes();
      const response = await updateBus(req, res);

      expect(response).toEqual(
        responseErrorMock(
          res,
          StatusCode.BUS_CODE_ALREADY_EXISTS,
          ErrorMessage.BUS_CODE_ALREADY_EXISTS,
        ),
      );
    });

    test('should return error when firebase update fails', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockBuses[0]);
      mockedFirebase.updateDoc.mockRejectedValue(new Error('firebase error'));

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { capacity: 40 },
        files: [],
      });
      const res = mockRes();
      const response = await updateBus(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(response).toEqual(
        responseErrorMock(res, StatusCode.BUS_UPDATE, ErrorMessage.CANNOT_UPDATE_BUS),
      );
    });
  });
});

describe('updateBusStatus()', () => {
  describe('valid cases', () => {
    test('should update bus status to INACTIVE', async () => {
      mockedFirebase.updateDoc.mockResolvedValue({} as any);

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { status: BusStatus.INACTIVE },
      });
      const res = mockRes();
      const response = await updateBusStatus(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        expect.any(String),
        'AjBfMRzDyXC8wbM4KHWb',
        { status: BusStatus.INACTIVE },
      );
      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_STATUS_UPDATED, { id: 'AjBfMRzDyXC8wbM4KHWb' }),
      );
    });

    test('should update bus status to MAINTENANCE', async () => {
      mockedFirebase.updateDoc.mockResolvedValue({} as any);

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { status: BusStatus.MAINTENANCE },
      });
      const res = mockRes();
      const response = await updateBusStatus(req, res);

      expect(response).toEqual(
        responseSuccessMock(res, Message.BUS_STATUS_UPDATED, { id: 'AjBfMRzDyXC8wbM4KHWb' }),
      );
    });
  });

  describe('error cases', () => {
    test('should return error when firebase update fails', async () => {
      mockedFirebase.updateDoc.mockRejectedValue(new Error('firebase error'));

      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { status: BusStatus.INACTIVE },
      });
      const res = mockRes();
      const response = await updateBusStatus(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(response).toEqual(
        responseErrorMock(
          res,
          StatusCode.CANNOT_UPDATE_BUS_STATUS,
          ErrorMessage.CANNOT_UPDATE_BUS_STATUS,
        ),
      );
    });
  });
});
