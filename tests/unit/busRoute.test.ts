import { ActiveStatus } from '../../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../../constants/message';
import {
  createBusRoute,
  getBusRouteDetail,
  getAllBusRoutes,
  updateBusRoute,
  activeBusRoute,
  inactiveBusRoute,
} from '../../services/busRoute';
import { firebaseHelper, logger } from '../../utils/index';
import { BUS_ID, mockRoute, mockRouteAlternate, ROUTE_ID, USER_ID } from '../data/busRoute.mock';
import { mockReq, mockRes } from '../helpers/httpMock';

const mockedFirebase = firebaseHelper as jest.Mocked<typeof firebaseHelper>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

describe('createBusRoute()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should create bus route successfully',
        input: { body: mockRoute, user: { uid: USER_ID } },
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([]);
          mockedFirebase.getDocById.mockResolvedValue({ id: BUS_ID } as any);
          mockedFirebase.createDoc.mockResolvedValue({ id: ROUTE_ID } as any);
        },
        expected: { success: true, data: { id: ROUTE_ID } },
      },
      {
        name: 'should create bus route successfully when bus_id is empty',
        input: { body: { ...mockRoute, bus_id: [] }, user: { uid: USER_ID } },
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([]);
          mockedFirebase.createDoc.mockResolvedValue({ id: ROUTE_ID } as any);
        },
        expected: { success: true, data: { id: ROUTE_ID } },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();
      const response = await createBusRoute(req, res);
      expect(response).toEqual(expected);
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when route code already exists',
        input: { body: mockRoute },
        mockFire: () => mockedFirebase.getDocByField.mockResolvedValue([mockRoute]),
        error: {
          statusCode: StatusCode.BUS_ROUTE_ALREADY_EXISTS,
          errorMessage: ErrorMessage.BUS_ROUTE_ALREADY_EXISTS,
        },
      },
      {
        name: 'should return error when bus not found',
        input: { body: mockRoute },
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([]);
          mockedFirebase.getDocById.mockResolvedValue(null);
        },
        error: {
          statusCode: StatusCode.BUS_NOT_FOUND,
          errorMessage: ErrorMessage.BUS_NOT_FOUND,
        },
      },
      {
        name: 'should return error when firebase throws error',
        input: { body: mockRoute },
        mockFire: () => {
          mockedFirebase.getDocByField.mockRejectedValue(new Error('firebase error'));
        },
        error: {
          statusCode: StatusCode.BUS_ROUTE_CREATE,
          errorMessage: ErrorMessage.CANNOT_CREATE_BUS_ROUTE,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();
      const response = await createBusRoute(req, res);

      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('getBusRouteDetail()', () => {
  describe('valid cases', () => {
    test('should return bus route detail successfully', async () => {
      const req = mockReq({ params: { id: ROUTE_ID } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockRoute);
      const response = await getBusRouteDetail(req, res);

      expect(response).toEqual({
        success: true,
        data: mockRoute,
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when id parameter is missing',
        input: { params: {} },
        mockFire: () => mockedFirebase.getDocById.mockResolvedValue(null),
        error: {
          statusCode: StatusCode.BUS_ROUTE_NOT_FOUND,
          errorMessage: ErrorMessage.BUS_ROUTE_NOT_FOUND,
        },
      },
      {
        name: 'should return error when route not found',
        input: { params: { id: ROUTE_ID } },
        mockFire: () => mockedFirebase.getDocById.mockResolvedValue(null),
        error: {
          statusCode: StatusCode.BUS_ROUTE_NOT_FOUND,
          errorMessage: ErrorMessage.BUS_ROUTE_NOT_FOUND,
        },
      },
      {
        name: 'should return error when firebase throws error',
        input: { params: { id: ROUTE_ID } },
        mockFire: () => mockedFirebase.getDocById.mockRejectedValue(new Error('firebase error')),
        error: {
          statusCode: StatusCode.BUS_ROUTE_GET_DETAIL,
          errorMessage: ErrorMessage.CANNOT_GET_BUS_ROUTE_DETAIL,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();
      const response = await getBusRouteDetail(req, res);

      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('getAllBusRoutes()', () => {
  describe('valid cases', () => {
    test('should return all bus routes', async () => {
      const req = mockReq();
      const res = mockRes();

      mockedFirebase.getAllDocs.mockResolvedValue([mockRoute]);
      const response = await getAllBusRoutes(req, res);

      expect(response).toEqual({
        success: true,
        data: [mockRoute],
      });
    });
  });

  describe('edge cases', () => {
    const edgeCases = [
      {
        name: 'should return error when routes list is empty',
        mockFire: () => mockedFirebase.getAllDocs.mockResolvedValue([]),
        error: {
          statusCode: StatusCode.BUS_ROUTE_NOT_FOUND,
          errorMessage: ErrorMessage.BUS_ROUTE_NOT_FOUND,
        },
      },
      {
        name: 'should return error when routes list is null',
        mockFire: () => mockedFirebase.getAllDocs.mockResolvedValue(null as any),
        error: {
          statusCode: StatusCode.BUS_ROUTE_GET_ALL,
          errorMessage: ErrorMessage.CANNOT_GET_BUS_ROUTE_LIST,
        },
      },
      {
        name: 'should return error when routes list is undefined',
        mockFire: () => mockedFirebase.getAllDocs.mockResolvedValue(undefined as any),
        error: {
          statusCode: StatusCode.BUS_ROUTE_GET_ALL,
          errorMessage: ErrorMessage.CANNOT_GET_BUS_ROUTE_LIST,
        },
      },
    ];

    test.each(edgeCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq();
      const res = mockRes();

      mockFire();
      const response = await getAllBusRoutes(req, res);

      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });

  describe('error cases', () => {
    test('should return error when firebase throws error', async () => {
      const req = mockReq();
      const res = mockRes();

      mockedFirebase.getAllDocs.mockRejectedValue(new Error('firebase error'));
      const response = await getAllBusRoutes(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(response).toEqual({
        success: false,
        status: StatusCode.BUS_ROUTE_GET_ALL,
        message: ErrorMessage.CANNOT_GET_BUS_ROUTE_LIST,
      });
    });
  });
});

describe('updateBusRoute()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should update bus route successfully',
        input: {
          params: { id: ROUTE_ID },
          body: { route_name: 'New Name' },
          user: { uid: USER_ID },
        },
      },
      {
        name: 'should skip bus validation when bus_id is empty',
        input: { params: { id: ROUTE_ID }, body: { bus_id: [] }, user: { uid: USER_ID } },
      },
      {
        name: 'should update when route_code is changed and not duplicated',
        input: {
          params: { id: ROUTE_ID },
          body: { route_code: 'R005' },
          user: { uid: USER_ID },
        },
      },
      {
        name: 'should update when all buses exist',
        input: {
          params: { id: ROUTE_ID },
          body: { bus_id: [BUS_ID] },
          user: { uid: USER_ID },
        },
      },
    ];

    test.each(validCases)('$name', async ({ input }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockRoute);
      mockedFirebase.getDocByField.mockResolvedValue([]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);

      const response = await updateBusRoute(req, res);
      expect(response).toEqual({ success: true, data: { id: ROUTE_ID } });
    });
  });

  describe('edge cases', () => {
    test('should update route when code exists but belongs to same route', async () => {
      const req = mockReq({
        params: { id: ROUTE_ID },
        body: { route_code: 'R001' },
        user: { uid: USER_ID },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockRoute);
      mockedFirebase.getDocByField.mockResolvedValue([mockRoute]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);

      const response = await updateBusRoute(req, res);

      expect(response).toEqual({
        success: true,
        data: { id: ROUTE_ID },
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when route not found',
        input: { params: { id: ROUTE_ID }, body: { route_name: 'New Name' } },
        mockFire: () => mockedFirebase.getDocById.mockResolvedValue(null),
        error: {
          statusCode: StatusCode.BUS_ROUTE_NOT_FOUND,
          errorMessage: ErrorMessage.BUS_ROUTE_NOT_FOUND,
        },
      },
      {
        name: 'should return error when route code already exists in another route',
        input: { params: { id: ROUTE_ID }, body: { route_code: 'R002' } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockRoute);
          mockedFirebase.getDocByField.mockResolvedValue([mockRouteAlternate]);
        },
        error: {
          statusCode: StatusCode.BUS_ROUTE_ALREADY_EXISTS,
          errorMessage: ErrorMessage.BUS_ROUTE_ALREADY_EXISTS,
        },
      },
      {
        name: 'should return error when bus not found',
        input: {
          params: { id: ROUTE_ID },
          body: { bus_id: [BUS_ID] },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockRoute).mockResolvedValueOnce(null);
        },
        error: {
          statusCode: StatusCode.BUS_NOT_FOUND,
          errorMessage: ErrorMessage.BUS_NOT_FOUND,
          data: { id: BUS_ID },
        },
      },
      {
        name: 'should return error when firebase update fails',
        input: { params: { id: ROUTE_ID }, body: { route_name: 'New Name' } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockRoute);
          mockedFirebase.updateDoc.mockRejectedValue(new Error('firebase error'));
        },
        error: {
          statusCode: StatusCode.BUS_ROUTE_UPDATE,
          errorMessage: ErrorMessage.CANNOT_UPDATE_BUS_ROUTE,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();
      const response = await updateBusRoute(req, res);

      expect(response).toMatchObject({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('activeBusRoute()', () => {
  describe('valid cases', () => {
    test('should activate bus route successfully', async () => {
      const req = mockReq({
        params: { id: ROUTE_ID },
        user: { uid: USER_ID },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockRoute);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);
      const response = await activeBusRoute(req, res);

      expect(response).toEqual({
        success: true,
        data: {
          id: ROUTE_ID,
          status: ActiveStatus.ACTIVE,
        },
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when route not found',
        input: { params: { id: ROUTE_ID } },
        mockFire: () => mockedFirebase.getDocById.mockResolvedValue(null),
        error: {
          statusCode: StatusCode.BUS_ROUTE_NOT_FOUND,
          errorMessage: ErrorMessage.BUS_ROUTE_NOT_FOUND,
        },
      },
      {
        name: 'should return error when firebase fails',
        input: { params: { id: ROUTE_ID }, user: { uid: USER_ID } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockRoute);
          mockedFirebase.updateDoc.mockRejectedValue(new Error('firebase error'));
        },
        error: {
          statusCode: StatusCode.BUS_ROUTE_UPDATE,
          errorMessage: ErrorMessage.CANNOT_UPDATE_BUS_ROUTE,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();
      const response = await activeBusRoute(req, res);

      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('inactiveBusRoute()', () => {
  describe('valid cases', () => {
    test('should deactivate bus route successfully', async () => {
      const req = mockReq({
        params: { id: ROUTE_ID },
        user: { uid: USER_ID },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockRoute);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);
      const response = await inactiveBusRoute(req, res);

      expect(response).toEqual({
        success: true,
        data: {
          id: ROUTE_ID,
          status: ActiveStatus.INACTIVE,
        },
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when route not found',
        input: { params: { id: ROUTE_ID } },
        mockFire: () => mockedFirebase.getDocById.mockResolvedValue(null),
        error: {
          statusCode: StatusCode.BUS_ROUTE_NOT_FOUND,
          errorMessage: ErrorMessage.BUS_ROUTE_NOT_FOUND,
        },
      },
      {
        name: 'should return error when firebase fails',
        input: { params: { id: ROUTE_ID }, user: { uid: USER_ID } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockRoute);
          mockedFirebase.updateDoc.mockRejectedValue(new Error('firebase error'));
        },
        error: {
          statusCode: StatusCode.BUS_ROUTE_UPDATE,
          errorMessage: ErrorMessage.CANNOT_UPDATE_BUS_ROUTE,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();
      const response = await inactiveBusRoute(req, res);

      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});
