import { getRestaurants, getRestaurant, getRestaurantsStats } from './../../services/restaurant';
import { StatusCode, ErrorMessage, Message } from '../../constants/message';
import {
  capitalizeName,
  firebaseHelper,
  logger,
  responseError,
  responseSuccess,
} from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import { ActiveStatus, Collection, Sites } from '../../constants/enum';
import { mockRestaurant, mockRestaurants, mockRestaurantStats } from '../data/restaurant.mock';
import { DEFAULT_PAGE_TOTAL } from '../../constants/constant';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedLogger = jest.mocked(logger);
const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;

describe('getRestaurants()', () => {
  describe('filtered cases', () => {
    const filteredCases = [
      {
        name: 'should filter by name',
        input: { query: { name: 'pizza' } },
        expected: {
          filters: [
            { field: 'name', operator: '>=', value: capitalizeName('pizza') },
            { field: 'name', operator: '<=', value: capitalizeName('pizza') + '\uf8ff' },
          ],
          orderBy: 'name',
          order: undefined,
          page: 1,
          page_size: 10,
        },
      },
      {
        name: 'should filter by building_id',
        input: { query: { building_id: 'AjBfMRzDyXC8wbM4KHWb' } },
        expected: {
          filters: [{ field: 'building_id', operator: '==', value: 'AjBfMRzDyXC8wbM4KHWb' }],
          orderBy: undefined,
          order: undefined,
          page: 1,
          page_size: 10,
        },
      },
      {
        name: 'should filter by status',
        input: { query: { status: ActiveStatus.ACTIVE } },
        expected: {
          filters: [{ field: 'status', operator: '==', value: ActiveStatus.ACTIVE }],
          orderBy: undefined,
          order: undefined,
          page: 1,
          page_size: 10,
        },
      },
      {
        name: 'should filter by name + status',
        input: { query: { name: 'pizza', status: ActiveStatus.ACTIVE } },
        expected: {
          filters: [
            { field: 'name', operator: '>=', value: capitalizeName('pizza') },
            { field: 'name', operator: '<=', value: capitalizeName('pizza') + '\uf8ff' },
            { field: 'status', operator: '==', value: ActiveStatus.ACTIVE },
          ],
          orderBy: 'name',
          order: undefined,
          page: 1,
          page_size: 10,
        },
      },
      {
        name: 'should apply order when filtering',
        input: { query: { name: 'pizza', order: 'desc' } },
        expected: {
          filters: [
            { field: 'name', operator: '>=', value: capitalizeName('pizza') },
            { field: 'name', operator: '<=', value: capitalizeName('pizza') + '\uf8ff' },
          ],
          orderBy: 'name',
          order: 'desc',
          page: 1,
          page_size: 10,
        },
      },
      {
        name: 'should apply pagination when filtering',
        input: { query: { name: 'pizza' }, pagination: { page: 2, page_size: 5 } },
        expected: {
          filters: [
            { field: 'name', operator: '>=', value: capitalizeName('pizza') },
            { field: 'name', operator: '<=', value: capitalizeName('pizza') + '\uf8ff' },
          ],
          orderBy: 'name',
          order: undefined,
          page: 2,
          page_size: 5,
        },
      },
      {
        name: 'should override order_by when name filter exists',
        input: { query: { name: 'pizza', order_by: 'created_at', order: 'desc' } },
        expected: {
          filters: [
            { field: 'name', operator: '>=', value: capitalizeName('pizza') },
            { field: 'name', operator: '<=', value: capitalizeName('pizza') + '\uf8ff' },
          ],
          orderBy: 'name',
          order: 'desc',
          page: 1,
          page_size: 10,
        },
      },
      {
        name: 'should filter by name + building_id + status',
        input: {
          query: {
            name: 'pizza',
            building_id: 'AjBfMRzDyXC8wbM4KHWb',
            status: ActiveStatus.ACTIVE,
          },
        },
        expected: {
          filters: [
            { field: 'name', operator: '>=', value: capitalizeName('pizza') },
            { field: 'name', operator: '<=', value: capitalizeName('pizza') + '\uf8ff' },
            { field: 'building_id', operator: '==', value: 'AjBfMRzDyXC8wbM4KHWb' },
            { field: 'status', operator: '==', value: ActiveStatus.ACTIVE },
          ],
          orderBy: 'name',
          order: undefined,
          page: 1,
          page_size: 10,
        },
      },
      {
        name: 'should use order_by when filtering without name',
        input: {
          query: { building_id: 'AjBfMRzDyXC8wbM4KHWb', order_by: 'created_at', order: 'desc' },
        },
        expected: {
          filters: [{ field: 'building_id', operator: '==', value: 'AjBfMRzDyXC8wbM4KHWb' }],
          orderBy: 'created_at',
          order: 'desc',
          page: 1,
          page_size: 10,
        },
      },
    ];

    test.each(filteredCases)('$name', async ({ input, expected }) => {
      const { query, pagination } = input;
      const req = mockReq({ query, pagination });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(1);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockRestaurants);
      const response = await getRestaurants(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        restaurantUrl,
        expected.filters,
        expected.orderBy,
        expected.order,
        expected.page,
        expected.page_size,
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.RESTAURANT_GET_ALL,
        expect.objectContaining({
          restaurants: mockRestaurants,
          pagination: expect.objectContaining({
            total: 1,
            total_page: expect.any(Number),
          }),
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          restaurants: mockRestaurants,
          pagination: expect.objectContaining({
            total: 1,
            total_page: expect.any(Number),
          }),
        }),
      });
    });

    test('should return empty result when no restaurants match filter', async () => {
      const query = { name: 'notfound' };
      const req = mockReq({ query });
      const res = mockRes();
      const filters = [
        { field: 'name', operator: '>=', value: capitalizeName('notfound') },
        { field: 'name', operator: '<=', value: capitalizeName('notfound') + '\uf8ff' },
      ];

      mockedFirebase.countDocsByFields.mockResolvedValue(0);
      mockedFirebase.getDocsByFields.mockResolvedValue([]);
      const response = await getRestaurants(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        restaurantUrl,
        filters,
        'name',
        undefined,
        1,
        10,
      );
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.RESTAURANT_GET_ALL, {
        restaurants: [],
        pagination: { page: 1, page_size: 10, total: 0, total_page: DEFAULT_PAGE_TOTAL },
      });
      expect(response).toEqual({
        success: true,
        data: {
          restaurants: [],
          pagination: { page: 1, page_size: 10, total: 0, total_page: DEFAULT_PAGE_TOTAL },
        },
      });
    });
  });

  describe('pagination cases', () => {
    const paginationCases = [
      {
        name: 'should use DEFAULT_PAGE_TOTAL when total/page_size < default',
        input: { query: {}, pagination: { page: 1, page_size: 100 }, total: 2 },
        expected: {
          total: 2,
          total_page: DEFAULT_PAGE_TOTAL,
          orderBy: undefined,
          order: undefined,
          page: 1,
          page_size: 100,
        },
      },
      {
        name: 'should calculate total_page using ceil when total is large',
        input: { query: {}, pagination: { page: 1, page_size: 10 }, total: 25 },
        expected: {
          total: 25,
          total_page: 3,
          orderBy: undefined,
          order: undefined,
          page: 1,
          page_size: 10,
        },
      },
    ];

    test.each(paginationCases)('$name', async ({ input, expected }) => {
      const { query, pagination } = input;
      const req = mockReq({ query, pagination });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(input.total);
      mockedFirebase.getAllDocs.mockResolvedValue(mockRestaurants);
      const response = await getRestaurants(req, res);

      expect(mockedFirebase.getAllDocs).toHaveBeenCalledWith(
        restaurantUrl,
        expected.orderBy,
        expected.order,
        expected.page,
        expected.page_size,
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.RESTAURANT_GET_ALL,
        expect.objectContaining({
          restaurants: mockRestaurants,
          pagination: {
            page: expected.page,
            page_size: expected.page_size,
            total: expected.total,
            total_page: expected.total_page,
          },
        }),
      );
      expect(response).toEqual({
        success: true,
        data: {
          restaurants: mockRestaurants,
          pagination: {
            page: expected.page,
            page_size: expected.page_size,
            total: expected.total,
            total_page: expected.total_page,
          },
        },
      });
    });

    test('should fallback to DEFAULT_PAGE_TOTAL when page_size is 0', async () => {
      const req = mockReq({ query: {}, pagination: { page: 1, page_size: 0 } });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(10);
      mockedFirebase.getAllDocs.mockResolvedValue(mockRestaurants);
      const response = await getRestaurants(req, res);

      expect(mockedFirebase.getAllDocs).toHaveBeenCalledWith(
        restaurantUrl,
        undefined,
        undefined,
        1,
        0,
      );
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.RESTAURANT_GET_ALL, {
        restaurants: mockRestaurants,
        pagination: {
          page: 1,
          page_size: 0,
          total: 10,
          total_page: DEFAULT_PAGE_TOTAL,
        },
      });
      expect(response).toEqual({
        success: true,
        data: {
          restaurants: mockRestaurants,
          pagination: {
            page: 1,
            page_size: 0,
            total: 10,
            total_page: DEFAULT_PAGE_TOTAL,
          },
        },
      });
    });

    test('should calculate correct total_page when filtering', async () => {
      const query = { name: 'pizza' };
      const req = mockReq({ query, pagination: { page: 1, page_size: 10 } });
      const res = mockRes();
      const filters = [
        { field: 'name', operator: '>=', value: capitalizeName('pizza') },
        { field: 'name', operator: '<=', value: capitalizeName('pizza') + '\uf8ff' },
      ];

      mockedFirebase.countDocsByFields.mockResolvedValue(5);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockRestaurants);
      const response = await getRestaurants(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        restaurantUrl,
        filters,
        'name',
        undefined,
        1,
        10,
      );
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.RESTAURANT_GET_ALL, {
        restaurants: mockRestaurants,
        pagination: {
          page: 1,
          page_size: 10,
          total: 5,
          total_page: DEFAULT_PAGE_TOTAL,
        },
      });

      expect(response).toEqual({
        success: true,
        data: {
          restaurants: mockRestaurants,
          pagination: {
            page: 1,
            page_size: 10,
            total: 5,
            total_page: DEFAULT_PAGE_TOTAL,
          },
        },
      });
    });

    test('should handle undefined pagination', async () => {
      const req = mockReq({ query: {} });
      const res = mockRes();

      req.pagination = undefined;
      mockedFirebase.countAllDocs.mockResolvedValue(2);
      mockedFirebase.getAllDocs.mockResolvedValue(mockRestaurants);
      const response = await getRestaurants(req, res);

      expect(mockedFirebase.getAllDocs).toHaveBeenCalledWith(
        restaurantUrl,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          pagination: expect.objectContaining({
            page: undefined,
            page_size: undefined,
            total: 2,
          }),
        }),
      });
    });
  });

  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return all restaurants when no filter',
        input: { query: {} },
        expected: { orderBy: undefined, order: undefined, page: 1, page_size: 10 },
      },
      {
        name: 'should apply order and order_by without filters',
        input: { query: { order_by: 'created_at', order: 'desc' } },
        expected: { orderBy: 'created_at', order: 'desc', page: 1, page_size: 10 },
      },
      {
        name: 'should apply only order without order_by',
        input: { query: { order: 'desc' } },
        expected: { orderBy: undefined, order: 'desc', page: 1, page_size: 10 },
      },
      {
        name: 'should apply pagination without filters',
        input: { query: {}, pagination: { page: 3, page_size: 20 } },
        expected: { orderBy: undefined, order: undefined, page: 3, page_size: 20 },
      },
    ];

    test.each(validCases)('$name', async ({ input, expected }) => {
      const { query, pagination } = input;
      const req = mockReq({ query, pagination });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(2);
      mockedFirebase.getAllDocs.mockResolvedValue(mockRestaurants);
      const response = await getRestaurants(req, res);

      expect(mockedFirebase.getAllDocs).toHaveBeenCalledWith(
        restaurantUrl,
        expected.orderBy,
        expected.order,
        expected.page,
        expected.page_size,
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.RESTAURANT_GET_ALL,
        expect.objectContaining({
          restaurants: mockRestaurants,
          pagination: expect.objectContaining({ total: 2 }),
        }),
      );

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          restaurants: mockRestaurants,
          pagination: expect.objectContaining({ total: 2 }),
        }),
      });
    });
  });

  describe('error cases', () => {
    test('should handle error when filtering (getDocsByFields throws)', async () => {
      const req = mockReq({ query: { name: 'pizza' } });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(1);
      mockedFirebase.getDocsByFields.mockRejectedValue(new Error('DB error'));
      const response = await getRestaurants(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_GET_RESTAURANT_LIST,
        ErrorMessage.CANNOT_GET_RESTAURANT_LIST,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_RESTAURANT_LIST,
        message: ErrorMessage.CANNOT_GET_RESTAURANT_LIST,
      });
    });

    test('should handle error when no filter (getAllDocs throws)', async () => {
      const req = mockReq({ query: {} });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(1);
      mockedFirebase.getAllDocs.mockRejectedValue(new Error('DB error'));
      const response = await getRestaurants(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_GET_RESTAURANT_LIST,
        ErrorMessage.CANNOT_GET_RESTAURANT_LIST,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_RESTAURANT_LIST,
        message: ErrorMessage.CANNOT_GET_RESTAURANT_LIST,
      });
    });

    test('should handle error when countDocsByFields throws', async () => {
      const req = mockReq({ query: { name: 'pizza' } });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockRejectedValue(new Error('Count error'));
      const response = await getRestaurants(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_GET_RESTAURANT_LIST,
        ErrorMessage.CANNOT_GET_RESTAURANT_LIST,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_RESTAURANT_LIST,
        message: ErrorMessage.CANNOT_GET_RESTAURANT_LIST,
      });
    });
  });
});

describe('getRestaurantsStats()', () => {
  describe('valid cases', () => {
    test('should return correct stats', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocsWithFields.mockResolvedValue(mockRestaurantStats);
      const response = await getRestaurantsStats(req, res);

      expect(mockedFirebase.getDocsWithFields).toHaveBeenCalledWith(restaurantUrl, [
        'status',
        'building_id',
      ]);
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.RESTAURANT_GET_STATS, {
        total: 4,
        active: 2,
        inactive: 2,
        building_ids: ['AjBfMRzDyXC8wbM4KHWb', 'Cwa6Fa1LjcmubpbCHh2X'],
      });
      expect(response).toEqual({
        success: true,
        data: {
          total: 4,
          active: 2,
          inactive: 2,
          building_ids: ['AjBfMRzDyXC8wbM4KHWb', 'Cwa6Fa1LjcmubpbCHh2X'],
        },
      });
    });

    test('should return zero stats when no restaurants', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocsWithFields.mockResolvedValue([]);
      const response = await getRestaurantsStats(req, res);

      expect(responseSuccess).toHaveBeenCalledWith(res, Message.RESTAURANT_GET_STATS, {
        total: 0,
        active: 0,
        inactive: 0,
        building_ids: [],
      });
      expect(response).toEqual({
        success: true,
        data: {
          total: 0,
          active: 0,
          inactive: 0,
          building_ids: [],
        },
      });
    });
  });

  describe('error cases', () => {
    test('should handle error when getDocsWithFields throws', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocsWithFields.mockRejectedValue(new Error('DB error'));
      const response = await getRestaurantsStats(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_GET_RESTAURANT_STATS,
        ErrorMessage.CANNOT_GET_RESTAURANT_STATS,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_RESTAURANT_STATS,
        message: ErrorMessage.CANNOT_GET_RESTAURANT_STATS,
      });
    });
  });
});

describe('getRestaurant()', () => {
  test('should return restaurant detail', async () => {
    const req = mockReq({ params: { id: mockRestaurant.id } });
    const res = mockRes();

    mockedFirebase.getDocById.mockResolvedValue(mockRestaurant);
    const response = await getRestaurant(req, res);

    expect(mockedFirebase.getDocById).toHaveBeenCalledWith(restaurantUrl, mockRestaurant.id);
    expect(responseSuccess).toHaveBeenCalledWith(
      res,
      Message.RESTAURANT_GET_DETAIL,
      mockRestaurant,
    );
    expect(response).toEqual({
      success: true,
      data: mockRestaurant,
    });
  });

  describe('error cases', () => {
    test('should return error when restaurant not found', async () => {
      const req = mockReq({ params: { id: 'r1' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null);
      const response = await getRestaurant(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.RESTAURANT_NOT_FOUND,
        ErrorMessage.RESTAURANT_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.RESTAURANT_NOT_FOUND,
        message: ErrorMessage.RESTAURANT_NOT_FOUND,
      });
    });

    test('should handle error when getDocById throws', async () => {
      const req = mockReq({ params: { id: 'r1' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockRejectedValue(new Error('DB error'));
      const response = await getRestaurant(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_GET_RESTAURANT_DETAIL,
        ErrorMessage.CANNOT_GET_RESTAURANT_DETAIL,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_RESTAURANT_DETAIL,
        message: ErrorMessage.CANNOT_GET_RESTAURANT_DETAIL,
      });
    });
  });
});
