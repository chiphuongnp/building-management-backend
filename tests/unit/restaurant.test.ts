import {
  getRestaurants,
  getRestaurant,
  getRestaurantsStats,
  createRestaurant,
  updateRestaurant,
  getRestaurantMenu,
  getRestaurantDailySale,
  getRestaurantDishSales,
  updateRestaurantStatus,
} from './../../services/restaurant';
import { StatusCode, ErrorMessage, Message } from '../../constants/message';
import {
  capitalizeName,
  firebaseHelper,
  getNormalizedDate,
  logger,
  responseError,
  responseSuccess,
} from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import { ActiveStatus, Collection, Sites } from '../../constants/enum';
import {
  mockBuilding,
  mockCreateRestaurantBody,
  mockDailySale,
  mockDefaultDailySale,
  mockDefaultDishSales,
  mockDishSales,
  mockMenuItems,
  mockRestaurant,
  mockRestaurants,
  mockRestaurantStats,
  mockUid,
} from '../data/restaurant.mock';
import { DEFAULT_PAGE_TOTAL } from '../../constants/constant';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedLogger = jest.mocked(logger);
const mockedGetNormalizedDate = jest.mocked(getNormalizedDate);
const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const buildingUrl = `${Sites.TOKYO}/${Collection.BUILDINGS}`;
const getPaths = (restaurantId: string) => {
  const menuPath = `${restaurantUrl}/${restaurantId}/${Collection.MENU_ITEMS}`;
  const dailySalePath = `${restaurantUrl}/${restaurantId}/${Collection.DAILY_SALES}`;
  const dishSalePath = `${restaurantUrl}/${restaurantId}/${Collection.DISH_SALES}`;

  return { menuPath, dailySalePath, dishSalePath };
};

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

describe('createRestaurant()', () => {
  test('should create restaurant successfully', async () => {
    const req = mockReq({ body: mockCreateRestaurantBody, user: { uid: mockUid } });
    const res = mockRes();

    mockedFirebase.getDocById.mockResolvedValue(mockBuilding);
    mockedFirebase.getDocByField.mockResolvedValue([]);
    mockedFirebase.createDoc.mockResolvedValue({ id: mockRestaurant.id } as any);
    const response = await createRestaurant(req, res);

    expect(mockedFirebase.getDocById).toHaveBeenCalledWith(
      buildingUrl,
      mockCreateRestaurantBody.building_id,
    );
    expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
      restaurantUrl,
      expect.objectContaining({
        name: mockCreateRestaurantBody.name,
        building_id: mockCreateRestaurantBody.building_id,
        status: ActiveStatus.ACTIVE,
        created_by: mockUid,
      }),
    );
    expect(responseSuccess).toHaveBeenCalledWith(res, Message.RESTAURANT_CREATED, {
      id: mockRestaurant.id,
    });
    expect(response).toEqual({
      success: true,
      data: { id: mockRestaurant.id },
    });
  });

  describe('error cases', () => {
    describe('error cases', () => {
      const errorCases = [
        {
          name: 'should return error when building not found',
          input: { body: mockCreateRestaurantBody },
          mockFire: () => {
            mockedFirebase.getDocById.mockResolvedValue(null);
          },
          error: {
            status: StatusCode.BUILDING_NOT_FOUND,
            message: ErrorMessage.BUILDING_NOT_FOUND,
          },
        },
        {
          name: 'should return error when restaurant name already exists',
          input: { body: mockCreateRestaurantBody },
          mockFire: () => {
            mockedFirebase.getDocById.mockResolvedValue(mockBuilding);
            mockedFirebase.getDocByField.mockResolvedValue([mockRestaurant]);
          },
          error: {
            status: StatusCode.RESTAURANT_NAME_EXISTS,
            message: ErrorMessage.RESTAURANT_NAME_EXISTS,
          },
        },
        {
          name: 'should handle error when createDoc throws',
          input: { body: mockCreateRestaurantBody, user: { uid: mockUid } },
          mockFire: () => {
            mockedFirebase.getDocById.mockResolvedValue(mockBuilding);
            mockedFirebase.getDocByField.mockResolvedValue([]);
            mockedFirebase.createDoc.mockRejectedValue(new Error('DB error'));
          },
          error: {
            status: StatusCode.CANNOT_CREATE_RESTAURANT,
            message: ErrorMessage.CANNOT_CREATE_RESTAURANT,
          },
        },
      ];

      test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
        const req = mockReq(input);
        const res = mockRes();

        mockFire();
        const response = await createRestaurant(req, res);

        expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
        expect(response).toEqual({
          success: false,
          status: error.status,
          message: error.message,
        });
      });
    });
  });
});

describe('updateRestaurant()', () => {
  describe('valid cases', () => {
    test('should update restaurant successfully without changing building_id or name', async () => {
      const req = mockReq({
        params: { id: mockRestaurant.id },
        body: { description: 'new desc' },
        user: { uid: mockUid },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
      const response = await updateRestaurant(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(restaurantUrl, mockRestaurant.id, {
        description: 'new desc',
        updated_by: mockUid,
      });
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.RESTAURANT_UPDATED, {
        id: mockRestaurant.id,
      });
      expect(response).toEqual({
        success: true,
        data: { id: mockRestaurant.id },
      });
    });

    test('should update restaurant with new building_id', async () => {
      const req = mockReq({
        params: { id: mockRestaurant.id },
        body: { building_id: mockBuilding.id },
        user: { uid: mockUid },
      });
      const res = mockRes();

      mockedFirebase.getDocById
        .mockResolvedValueOnce(mockRestaurant)
        .mockResolvedValueOnce(mockBuilding);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
      const response = await updateRestaurant(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(restaurantUrl, mockRestaurant.id);
      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(buildingUrl, mockBuilding.id);
      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(restaurantUrl, mockRestaurant.id, {
        building_id: mockBuilding.id,
        updated_by: mockUid,
      });
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.RESTAURANT_UPDATED, {
        id: mockRestaurant.id,
      });
      expect(response).toEqual({
        success: true,
        data: { id: mockRestaurant.id },
      });
    });

    test('should update restaurant with new name (no duplicate)', async () => {
      const req = mockReq({
        params: { id: mockRestaurant.id },
        body: { name: 'New Name' },
        user: { uid: mockUid },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
      mockedFirebase.getDocByField.mockResolvedValueOnce([{ ...mockRestaurant }]);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
      const response = await updateRestaurant(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(restaurantUrl, mockRestaurant.id);
      expect(mockedFirebase.getDocByField).toHaveBeenCalledWith(restaurantUrl, 'name', 'New Name');
      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(restaurantUrl, mockRestaurant.id, {
        name: 'New Name',
        updated_by: mockUid,
      });
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.RESTAURANT_UPDATED, {
        id: mockRestaurant.id,
      });
      expect(response).toEqual({ success: true, data: { id: mockRestaurant.id } });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when restaurant not found',
        input: { params: { id: mockRestaurant.id }, body: {} },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(null);
        },
        error: {
          status: StatusCode.RESTAURANT_NOT_FOUND,
          message: ErrorMessage.RESTAURANT_NOT_FOUND,
        },
      },
      {
        name: 'should return error when building not found',
        input: { params: { id: mockRestaurant.id }, body: { building_id: mockBuilding.id } },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockRestaurant)
            .mockResolvedValueOnce(null);
        },
        error: {
          status: StatusCode.BUILDING_NOT_FOUND,
          message: ErrorMessage.BUILDING_NOT_FOUND,
        },
      },
      {
        name: 'should return error when name is duplicate',
        input: { params: { id: mockRestaurant.id }, body: { name: 'Pizza Hut' } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
          mockedFirebase.getDocByField.mockResolvedValueOnce([
            { ...mockRestaurant, id: 'another-id' },
          ]);
        },
        error: {
          status: StatusCode.RESTAURANT_NAME_EXISTS,
          message: ErrorMessage.RESTAURANT_NAME_EXISTS,
        },
      },
      {
        name: 'should handle error when getDocById throws',
        input: { params: { id: mockRestaurant.id }, body: {} },
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_UPDATE_RESTAURANT,
          message: ErrorMessage.CANNOT_UPDATE_RESTAURANT,
        },
      },
      {
        name: 'should handle error when getDocByField throws',
        input: { params: { id: mockRestaurant.id }, body: { name: 'New Name' } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
          mockedFirebase.getDocByField.mockRejectedValue(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_UPDATE_RESTAURANT,
          message: ErrorMessage.CANNOT_UPDATE_RESTAURANT,
        },
      },
      {
        name: 'should handle error when updateDoc throws',
        input: {
          params: { id: mockRestaurant.id },
          body: { name: 'New Name' },
          user: { uid: mockUid },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
          mockedFirebase.getDocByField.mockResolvedValueOnce([mockRestaurant]);
          mockedFirebase.updateDoc.mockRejectedValue(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_UPDATE_RESTAURANT,
          message: ErrorMessage.CANNOT_UPDATE_RESTAURANT,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();
      const response = await updateRestaurant(req, res);

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({ success: false, status: error.status, message: error.message });
    });
  });
});

describe('getRestaurantMenu()', () => {
  test('should return menu items successfully', async () => {
    const req = mockReq({ params: { id: mockRestaurant.id } });
    const res = mockRes();
    const { menuPath } = getPaths(mockRestaurant.id);

    mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
    mockedFirebase.getAllDocs.mockResolvedValueOnce(mockMenuItems);
    const response = await getRestaurantMenu(req, res);

    expect(mockedFirebase.getDocById).toHaveBeenCalledWith(restaurantUrl, mockRestaurant.id);
    expect(mockedFirebase.getAllDocs).toHaveBeenCalledWith(menuPath);
    expect(responseSuccess).toHaveBeenCalledWith(res, Message.GET_MENU_ITEMS, mockMenuItems);
    expect(response).toEqual({ success: true, data: mockMenuItems });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when restaurant not found',
        input: { params: { id: mockRestaurant.id } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(null);
        },
        error: {
          status: StatusCode.RESTAURANT_NOT_FOUND,
          message: ErrorMessage.RESTAURANT_NOT_FOUND,
        },
      },
      {
        name: 'should return error when menu items not found',
        input: { params: { id: mockRestaurant.id } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
          mockedFirebase.getAllDocs.mockResolvedValueOnce([]);
        },
        error: {
          status: StatusCode.MENU_ITEM_LIST_NOT_FOUND,
          message: ErrorMessage.MENU_ITEM_LIST_NOT_FOUND,
        },
      },
      {
        name: 'should handle error when getDocById throws',
        input: { params: { id: mockRestaurant.id } },
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_GET_MENU_ITEM_LIST,
          message: ErrorMessage.CANNOT_GET_MENU_ITEM_LIST,
        },
      },
      {
        name: 'should handle error when getAllDocs throws',
        input: { params: { id: mockRestaurant.id } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
          mockedFirebase.getAllDocs.mockRejectedValue(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_GET_MENU_ITEM_LIST,
          message: ErrorMessage.CANNOT_GET_MENU_ITEM_LIST,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();
      const response = await getRestaurantMenu(req, res);

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({ success: false, status: error.status, message: error.message });
    });
  });
});

describe('getRestaurantDailySale()', () => {
  describe('valid cases', () => {
    test('should return default sale when date is today', async () => {
      const now = mockDefaultDailySale.id;
      const req = mockReq({ params: { id: mockRestaurant.id }, query: { date: now } });
      const res = mockRes();

      mockedGetNormalizedDate
        .mockReturnValueOnce(new Date(`${now}T00:00:00.000Z`))
        .mockReturnValueOnce(new Date(`${now}T00:00:00.000Z`));
      mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
      const response = await getRestaurantDailySale(req, res);

      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.NO_SALES_DATA,
        mockDefaultDailySale,
      );
      expect(response).toEqual({ success: true, data: mockDefaultDailySale });
    });

    test('should return daily sale when date is not today', async () => {
      const now = mockDefaultDailySale.id;
      const dailySaleId = mockDailySale.id;
      const req = mockReq({ params: { id: mockRestaurant.id }, query: { date: dailySaleId } });
      const res = mockRes();
      const { dailySalePath } = getPaths(mockRestaurant.id);

      mockedGetNormalizedDate
        .mockReturnValueOnce(new Date(`${now}T00:00:00.000Z`))
        .mockReturnValueOnce(new Date(`${dailySaleId}T00:00:00.000Z`));
      mockedFirebase.getDocById
        .mockResolvedValueOnce(mockRestaurant)
        .mockResolvedValueOnce(mockDailySale);
      const response = await getRestaurantDailySale(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(restaurantUrl, mockRestaurant.id);
      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(dailySalePath, mockDailySale.id);
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.GET_DAILY_SALES, mockDailySale);
      expect(response).toEqual({ success: true, data: mockDailySale });
    });
  });

  describe('error cases', () => {
    test('should return error when restaurant not found', async () => {
      const req = mockReq({ params: { id: mockRestaurant.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValueOnce(null);
      const response = await getRestaurantDailySale(req, res);

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

    test('should return error when daily sale not found', async () => {
      const now = mockDefaultDailySale.id;
      const dailySaleId = mockDailySale.id;
      const req = mockReq({ params: { id: mockRestaurant.id }, query: { date: dailySaleId } });
      const res = mockRes();
      const { dailySalePath } = getPaths(mockRestaurant.id);

      mockedGetNormalizedDate
        .mockReturnValueOnce(new Date(`${now}T00:00:00.000Z`))
        .mockReturnValueOnce(new Date(`${dailySaleId}T00:00:00.000Z`));
      mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant).mockResolvedValueOnce(null);
      const response = await getRestaurantDailySale(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(dailySalePath, mockDailySale.id);
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.DAILY_SALES_NOT_FOUND,
        ErrorMessage.DAILY_SALES_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.DAILY_SALES_NOT_FOUND,
        message: ErrorMessage.DAILY_SALES_NOT_FOUND,
      });
    });

    test('should handle error when getDocById throws', async () => {
      const req = mockReq({ params: { id: mockRestaurant.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockRejectedValue(new Error('DB error'));
      const response = await getRestaurantDailySale(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_GET_DAILY_SALES,
        ErrorMessage.CANNOT_GET_DAILY_SALES,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_DAILY_SALES,
        message: ErrorMessage.CANNOT_GET_DAILY_SALES,
      });
    });
  });
});

describe('getRestaurantDishSales()', () => {
  describe('valid cases', () => {
    test('should return default dish sales when date is today', async () => {
      const now = mockDefaultDishSales[0].daily_sale_id;
      const req = mockReq({ params: { id: mockRestaurant.id }, query: { date: now } });
      const res = mockRes();

      mockedGetNormalizedDate
        .mockReturnValueOnce(new Date(`${now}T00:00:00.000Z`))
        .mockReturnValueOnce(new Date(`${now}T00:00:00.000Z`));
      mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
      const response = await getRestaurantDishSales(req, res);

      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.NO_SALES_DATA,
        mockDefaultDishSales,
      );
      expect(response).toEqual({ success: true, data: mockDefaultDishSales });
    });

    test('should return dish sales when date is not today', async () => {
      const now = mockDefaultDishSales[0].daily_sale_id;
      const dailySaleId = mockDishSales[0].daily_sale_id;
      const req = mockReq({ params: { id: mockRestaurant.id }, query: { date: dailySaleId } });
      const res = mockRes();
      const { dishSalePath } = getPaths(mockRestaurant.id);

      mockedGetNormalizedDate
        .mockReturnValueOnce(new Date(`${now}T00:00:00.000Z`))
        .mockReturnValueOnce(new Date(`${dailySaleId}T00:00:00.000Z`));
      mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
      mockedFirebase.getDocsByFields.mockResolvedValueOnce(mockDishSales);
      const response = await getRestaurantDishSales(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(dishSalePath, [
        { field: 'date_id', operator: '==', value: dailySaleId },
      ]);
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.GET_DISH_SALES, mockDishSales);
      expect(response).toEqual({ success: true, data: mockDishSales });
    });
  });

  describe('error cases', () => {
    test('should return error when restaurant not found', async () => {
      const req = mockReq({ params: { id: mockRestaurant.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValueOnce(null);
      const response = await getRestaurantDishSales(req, res);

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

    test('should return error when dish sales not found', async () => {
      const now = mockDefaultDishSales[0].daily_sale_id;
      const dailySaleId = mockDishSales[0].daily_sale_id;
      const req = mockReq({ params: { id: mockRestaurant.id }, query: { date: dailySaleId } });
      const res = mockRes();
      const { dishSalePath } = getPaths(mockRestaurant.id);

      mockedGetNormalizedDate
        .mockReturnValueOnce(new Date(`${now}T00:00:00.000Z`))
        .mockReturnValueOnce(new Date(`${dailySaleId}T00:00:00.000Z`));
      mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
      mockedFirebase.getDocsByFields.mockResolvedValueOnce([]);
      const response = await getRestaurantDishSales(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(dishSalePath, [
        { field: 'date_id', operator: '==', value: dailySaleId },
      ]);
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.DISH_SALES_NOT_FOUND,
        ErrorMessage.DISH_SALES_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.DISH_SALES_NOT_FOUND,
        message: ErrorMessage.DISH_SALES_NOT_FOUND,
      });
    });

    test('should handle error when getDocsByFields throws', async () => {
      const req = mockReq({ params: { id: mockRestaurant.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
      mockedFirebase.getDocsByFields.mockRejectedValue(new Error('DB error'));
      const response = await getRestaurantDishSales(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_GET_DISH_SALES,
        ErrorMessage.CANNOT_GET_DISH_SALES,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_DISH_SALES,
        message: ErrorMessage.CANNOT_GET_DISH_SALES,
      });
    });
  });
});

describe('updateRestaurantStatus()', () => {
  describe('valid cases', () => {
    test('should update restaurant status successfully', async () => {
      const req = mockReq({
        params: { id: mockRestaurant.id },
        body: { status: ActiveStatus.ACTIVE },
        user: { uid: mockUid },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
      mockedFirebase.updateDoc.mockResolvedValueOnce(undefined as any);
      const response = await updateRestaurantStatus(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(restaurantUrl, mockRestaurant.id);
      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(restaurantUrl, mockRestaurant.id, {
        status: ActiveStatus.ACTIVE,
        updated_by: mockUid,
      });
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.ORDER_UPDATED, {
        id: mockRestaurant.id,
      });
      expect(response).toEqual({
        success: true,
        data: { id: mockRestaurant.id },
      });
    });
  });

  describe('error cases', () => {
    test('should return error when restaurant not found', async () => {
      const req = mockReq({
        params: { id: mockRestaurant.id },
        body: { status: ActiveStatus.ACTIVE },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValueOnce(null);
      const response = await updateRestaurantStatus(req, res);

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

    test('should handle error when updateDoc throws', async () => {
      const req = mockReq({
        params: { id: mockRestaurant.id },
        body: { status: ActiveStatus.ACTIVE },
        user: { uid: mockUid },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValueOnce(mockRestaurant);
      mockedFirebase.updateDoc.mockRejectedValue(new Error('DB error'));
      const response = await updateRestaurantStatus(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_UPDATE_ORDER_STATUS,
        ErrorMessage.CANNOT_UPDATE_ORDER_STATUS,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_UPDATE_ORDER_STATUS,
        message: ErrorMessage.CANNOT_UPDATE_ORDER_STATUS,
      });
    });
  });
});
