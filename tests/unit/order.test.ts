jest.mock('../../utils', () => {
  const { utilMock } = require('../helpers/utilMock');

  return utilMock({ calculatePayment: jest.fn() })();
});
import { Collection, OrderStatus, PickupMethod, Sites } from '../../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../../constants/message';
import { DEFAULT_ORDER_BY, DEFAULT_PAGE_TOTAL } from '../../constants/constant';
import { calculatePayment, firebaseHelper, responseError, responseSuccess } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import { Transaction } from 'firebase-admin/firestore';
import {
  mockMenuItem,
  mockOrder,
  mockOrderBody,
  mockOrderDetail,
  mockOrderId,
  mockRestaurantId,
  mockUser,
} from '../data/order.mock';
import {
  createOrder,
  getOrderDetailsByOrderId,
  getOrderHistory,
  getOrders,
  getOrdersByUserId,
  updateOrderInfo,
  updateOrderStatus,
} from '../../services/order';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const userUrl = `${Sites.TOKYO}/${Collection.USERS}`;
const getPaths = (restaurantId: string) => {
  const orderPath = `${restaurantUrl}/${restaurantId}/${Collection.ORDERS}`;
  const detailPath = `${restaurantUrl}/${restaurantId}/${Collection.ORDER_DETAILS}`;
  const menuPath = `${restaurantUrl}/${restaurantId}/${Collection.MENU_ITEMS}`;

  return { orderPath, detailPath, menuPath };
};

const mockedCalculatePayment = jest.mocked(calculatePayment);
const mockedFirebase = jest.mocked(firebaseHelper);
beforeEach(() => {
  jest.clearAllMocks();

  mockedFirebase.runTransaction.mockImplementation(async (cb) => cb({} as Transaction));
});

describe('createOrder()', () => {
  describe('valid cases', () => {
    test('should create order successfully', async () => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId },
        body: mockOrderBody,
        user: { uid: mockUser.id },
      });
      const res = mockRes();
      const { orderPath, menuPath } = getPaths(mockRestaurantId);

      mockedFirebase.getDocById.mockResolvedValueOnce(mockUser);
      mockedFirebase.getAllDocs.mockResolvedValueOnce([mockMenuItem]);
      mockedCalculatePayment.mockReturnValue({
        finalAmount: 210,
        discount: 0,
        pointsEarned: 20,
        finalPointsUsed: 10,
        vatCharge: 10,
      });

      mockedFirebase.getTransaction.mockResolvedValue(mockMenuItem);
      mockedFirebase.setTransaction
        .mockResolvedValueOnce({ id: mockOrderId } as any)
        .mockResolvedValueOnce(undefined as any);
      const response = await createOrder(req, res, jest.fn());

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(userUrl, mockUser.id);
      expect(mockedFirebase.updateTransaction).toHaveBeenCalledWith(
        menuPath,
        mockMenuItem.id,
        { quantity: mockMenuItem.quantity - mockOrderBody.order_details[0].quantity },
        expect.anything(),
      );
      expect(mockedFirebase.setTransaction).toHaveBeenCalledWith(
        orderPath,
        expect.objectContaining({ user_id: mockUser.id, status: OrderStatus.PENDING }),
        expect.anything(),
      );
      expect(mockedFirebase.updateTransaction).toHaveBeenCalledWith(
        userUrl,
        mockUser.id,
        { points: 110 },
        expect.anything(),
      );
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.ORDER_CREATED, {
        id: mockOrderId,
        amount: 210,
      });
      expect(response).toEqual({ success: true, data: { id: mockOrderId, amount: 210 } });
    });
  });

  describe('edge cases', () => {
    test('should create order successfully when user points is undefined', async () => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId },
        body: { ...mockOrderBody, points_used: 0 },
        user: { uid: mockUser.id },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValueOnce({ ...mockUser, points: undefined });
      mockedFirebase.getAllDocs.mockResolvedValueOnce([mockMenuItem]);
      mockedCalculatePayment.mockReturnValue({
        finalAmount: 210,
        discount: 0,
        pointsEarned: 20,
        finalPointsUsed: 0,
        vatCharge: 10,
      });

      mockedFirebase.getTransaction.mockResolvedValue(mockMenuItem);
      mockedFirebase.setTransaction
        .mockResolvedValueOnce({ id: mockOrderId } as any)
        .mockResolvedValueOnce(undefined as any);
      await createOrder(req, res, jest.fn());

      expect(mockedFirebase.updateTransaction).toHaveBeenCalledWith(
        userUrl,
        mockUser.id,
        { points: 20 },
        expect.anything(),
      );
    });

    test('should use user contact info for delivery when delivery info is missing', async () => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId },
        body: {
          ...mockOrderBody,
          pickup_method: PickupMethod.DELIVERY,
          delivery_info: { notes: 'call me' },
        },
        user: { uid: mockUser.id },
      });
      const res = mockRes();
      const { orderPath } = getPaths(mockRestaurantId);

      mockedFirebase.getDocById.mockResolvedValueOnce(mockUser);
      mockedFirebase.getAllDocs.mockResolvedValueOnce([mockMenuItem]);
      mockedCalculatePayment.mockReturnValue({
        finalAmount: 210,
        discount: 0,
        pointsEarned: 20,
        finalPointsUsed: 10,
        vatCharge: 10,
      });
      mockedFirebase.getTransaction.mockResolvedValue(mockMenuItem);
      mockedFirebase.setTransaction
        .mockResolvedValueOnce({ id: mockOrderId } as any)
        .mockResolvedValueOnce(undefined as any);
      await createOrder(req, res, jest.fn());

      expect(mockedFirebase.setTransaction).toHaveBeenCalledWith(
        orderPath,
        expect.objectContaining({
          delivery_info: {
            contact_name: mockUser.full_name,
            contact_phone: mockUser.phone,
            notes: 'call me',
          },
        }),
        expect.anything(),
      );
    });

    test('should omit notes when delivery notes is empty', async () => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId },
        body: { ...mockOrderBody, pickup_method: PickupMethod.DELIVERY, delivery_info: {} },
        user: { uid: mockUser.id },
      });
      const res = mockRes();
      const { orderPath } = getPaths(mockRestaurantId);

      mockedFirebase.getDocById.mockResolvedValueOnce(mockUser);
      mockedFirebase.getAllDocs.mockResolvedValueOnce([mockMenuItem]);
      mockedCalculatePayment.mockReturnValue({
        finalAmount: 210,
        discount: 0,
        pointsEarned: 20,
        finalPointsUsed: 10,
        vatCharge: 10,
      });

      mockedFirebase.getTransaction.mockResolvedValue(mockMenuItem);
      mockedFirebase.setTransaction
        .mockResolvedValueOnce({ id: mockOrderId } as any)
        .mockResolvedValueOnce(undefined as any);
      await createOrder(req, res, jest.fn());
      const createdOrder = mockedFirebase.setTransaction.mock.calls[0][1];

      expect(mockedFirebase.setTransaction).toHaveBeenCalledWith(
        orderPath,
        expect.objectContaining({
          delivery_info: {
            contact_name: mockUser.full_name,
            contact_phone: mockUser.phone,
          },
        }),
        expect.anything(),
      );
      expect(createdOrder.delivery_info.notes).toBeUndefined();
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when points exceed user points',
        input: {
          params: { restaurantId: mockRestaurantId },
          body: { ...mockOrderBody, points_used: 999 },
          user: { uid: mockUser.id },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockUser);
        },
        error: { status: StatusCode.INVALID_POINTS, message: ErrorMessage.INVALID_POINTS },
      },
      {
        name: 'should return error when dish not found in menu',
        input: {
          params: { restaurantId: mockRestaurantId },
          body: mockOrderBody,
          user: { uid: mockUser.id },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockUser);
          mockedFirebase.getAllDocs.mockResolvedValueOnce([]);
          mockedCalculatePayment.mockReturnValue({
            finalAmount: 210,
            discount: 0,
            pointsEarned: 20,
            finalPointsUsed: 10,
            vatCharge: 10,
          });
        },
        error: {
          status: StatusCode.DISH_NOT_FOUND_IN_MENU,
          message: ErrorMessage.DISH_NOT_FOUND_IN_MENU,
        },
      },
      {
        name: 'should return error when menu item not found',
        input: {
          params: { restaurantId: mockRestaurantId },
          body: mockOrderBody,
          user: { uid: mockUser.id },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockUser);
          mockedFirebase.getAllDocs.mockResolvedValueOnce([mockMenuItem]);
          mockedCalculatePayment.mockReturnValue({
            finalAmount: 210,
            discount: 0,
            pointsEarned: 20,
            finalPointsUsed: 10,
            vatCharge: 10,
          });
          mockedFirebase.getTransaction.mockResolvedValueOnce(null);
        },
        error: {
          status: StatusCode.MENU_ITEM_NOT_FOUND,
          message: ErrorMessage.MENU_ITEM_NOT_FOUND,
        },
      },
      {
        name: 'should return error when stock is insufficient',
        input: {
          params: { restaurantId: mockRestaurantId },
          body: {
            ...mockOrderBody,
            order_details: [{ ...mockOrderBody.order_details[0], quantity: 999 }],
          },
          user: { uid: mockUser.id },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockUser);
          mockedFirebase.getAllDocs.mockResolvedValueOnce([mockMenuItem]);
          mockedCalculatePayment.mockReturnValue({
            finalAmount: 210,
            discount: 0,
            pointsEarned: 20,
            finalPointsUsed: 10,
            vatCharge: 10,
          });
          mockedFirebase.getTransaction.mockResolvedValueOnce(mockMenuItem);
        },
        error: {
          status: StatusCode.DISH_QUANTITY_EXCEEDS_STOCK,
          message: ErrorMessage.DISH_QUANTITY_EXCEEDS_STOCK,
        },
      },
      {
        name: 'should handle unknown error',
        input: {
          params: { restaurantId: mockRestaurantId },
          body: mockOrderBody,
          user: { uid: mockUser.id },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_CREATE_ORDER,
          message: ErrorMessage.CANNOT_CREATE_ORDER,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();
      const response = await createOrder(req, res, jest.fn());

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({ success: false, status: error.status, message: error.message });
    });

    test('should return error when uid not found', async () => {
      const req = mockReq({ params: { restaurantId: mockRestaurantId }, body: mockOrderBody });
      req.user = undefined;
      const res = mockRes();
      const response = await createOrder(req, res, jest.fn());

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.ACCOUNT_NOT_FOUND,
        ErrorMessage.ACCOUNT_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.ACCOUNT_NOT_FOUND,
        message: ErrorMessage.ACCOUNT_NOT_FOUND,
      });
    });
  });
});

describe('getOrderDetailsByOrderId()', () => {
  const { orderPath, detailPath } = getPaths(mockRestaurantId);

  describe('valid cases', () => {
    test('should return order details successfully', async () => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId, id: mockOrderId },
        user: { uid: mockUser.id },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValueOnce(mockOrder);
      mockedFirebase.getDocsByFields.mockResolvedValueOnce(mockOrderDetail);
      const response = await getOrderDetailsByOrderId(req, res, jest.fn());

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(orderPath, mockOrderId);
      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(detailPath, [
        { field: 'order_id', operator: '==', value: mockOrderId },
      ]);
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.GET_ORDER_DETAILS,
        expect.objectContaining({ order_details: mockOrderDetail }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({ order_details: mockOrderDetail }),
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when order not found',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(null);
        },
        error: { status: StatusCode.ORDER_NOT_FOUND, message: ErrorMessage.ORDER_NOT_FOUND },
      },
      {
        name: 'should return error when user is forbidden',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce({
            ...mockOrder,
            user_id: '2Wv3zE7vsianIJyrafPFJ98YWSj0',
          });
        },
        error: {
          status: StatusCode.GET_ORDER_FORBIDDEN,
          message: ErrorMessage.GET_ORDER_FORBIDDEN,
        },
      },
      {
        name: 'should return error when order details not found',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockOrder);
          mockedFirebase.getDocsByFields.mockResolvedValueOnce([]);
        },
        error: {
          status: StatusCode.ORDER_DETAIL_NOT_FOUND,
          message: ErrorMessage.ORDER_DETAIL_NOT_FOUND,
        },
      },
      {
        name: 'should handle unknown error',
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_GET_ORDER_DETAILS,
          message: ErrorMessage.CANNOT_GET_ORDER_DETAILS,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId, id: mockOrderId },
        user: { uid: mockUser.id },
      });
      const res = mockRes();

      mockFire();
      const response = await getOrderDetailsByOrderId(req, res, jest.fn());

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({
        success: false,
        status: error.status,
        message: error.message,
      });
    });
  });
});

describe('getOrders()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should get orders successfully with default filters',
        input: {
          params: { restaurantId: mockRestaurantId },
          query: { date: '2026-05-04', order: 'desc' },
          pagination: { page: 1, page_size: 10 },
        },
        expectedPagination: {
          page: 1,
          page_size: 10,
          total: 20,
          total_page: 2,
        },
      },
      {
        name: 'should get orders successfully with status and pickup method',
        input: {
          params: { restaurantId: mockRestaurantId },
          query: {
            date: '2026-05-04',
            status: OrderStatus.PENDING,
            pickup_method: PickupMethod.TAKEAWAY,
            order: 'desc',
          },
          pagination: { page: 1, page_size: 10 },
        },
        expectedPagination: {
          page: 1,
          page_size: 10,
          total: 20,
          total_page: 2,
        },
      },
      {
        name: 'should use default total page when page size is missing',
        input: {
          params: { restaurantId: mockRestaurantId },
          query: { date: '2026-05-04', order: 'desc' },
          pagination: { page: 1 },
        },
        expectedPagination: {
          page: 1,
          page_size: undefined,
          total: 20,
          total_page: DEFAULT_PAGE_TOTAL,
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, expectedPagination }) => {
      const req = mockReq(input);
      const res = mockRes();
      const { orderPath } = getPaths(mockRestaurantId);

      mockedFirebase.countDocsByFields.mockResolvedValueOnce(20);
      mockedFirebase.getDocsByFields.mockResolvedValueOnce([mockOrder]);
      const response = await getOrders(req, res, jest.fn());

      expect(mockedFirebase.countDocsByFields).toHaveBeenCalledWith(orderPath, expect.any(Array));
      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        orderPath,
        expect.any(Array),
        DEFAULT_ORDER_BY,
        req.query.order,
        req.pagination?.page,
        req.pagination?.page_size,
      );

      expect(responseSuccess).toHaveBeenCalledWith(res, Message.GET_ORDER_LIST, {
        orders: [mockOrder],
        pagination: expectedPagination,
      });
      expect(response).toEqual({
        success: true,
        data: {
          orders: [mockOrder],
          pagination: expectedPagination,
        },
      });
    });

    test('should return orders when pagination is undefined', async () => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId },
        query: { date: '2026-05-01' },
      });
      req.pagination = undefined;
      const res = mockRes();
      const { orderPath } = getPaths(mockRestaurantId);

      mockedFirebase.countDocsByFields.mockResolvedValueOnce(1);
      mockedFirebase.getDocsByFields.mockResolvedValueOnce([mockOrder]);
      const response = await getOrders(req, res, jest.fn());

      expect(mockedFirebase.countDocsByFields).toHaveBeenCalled();
      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        orderPath,
        expect.any(Array),
        DEFAULT_ORDER_BY,
        undefined,
        undefined,
        undefined,
      );
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.GET_ORDER_LIST, {
        orders: [mockOrder],
        pagination: {
          page: undefined,
          page_size: undefined,
          total: 1,
          total_page: DEFAULT_PAGE_TOTAL,
        },
      });
      expect(response).toEqual({
        success: true,
        data: {
          orders: [mockOrder],
          pagination: {
            page: undefined,
            page_size: undefined,
            total: 1,
            total_page: DEFAULT_PAGE_TOTAL,
          },
        },
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when orders not found',
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockResolvedValueOnce(0);
          mockedFirebase.getDocsByFields.mockResolvedValueOnce([]);
        },
        error: { status: StatusCode.ORDER_NOT_FOUND, message: ErrorMessage.ORDER_NOT_FOUND },
      },
      {
        name: 'should handle unknown error',
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockRejectedValueOnce(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_GET_ORDER_LIST,
          message: ErrorMessage.CANNOT_GET_ORDER_LIST,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId },
        query: { date: '2026-05-01' },
        pagination: { page: 1, page_size: 10 },
      });
      const res = mockRes();

      mockFire();
      const response = await getOrders(req, res, jest.fn());

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({
        success: false,
        status: error.status,
        message: error.message,
      });
    });
  });
});

describe('getOrdersByUserId()', () => {
  describe('valid cases', () => {
    test('should return user orders successfully', async () => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId },
        user: { uid: mockUser.id },
      });
      const res = mockRes();
      const { orderPath } = getPaths(mockRestaurantId);

      mockedFirebase.getDocsByFields.mockResolvedValueOnce([mockOrder]);
      const response = await getOrdersByUserId(req, res, jest.fn());

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(orderPath, [
        { field: 'user_id', operator: '==', value: mockUser.id },
        {
          field: 'status',
          operator: 'in',
          value: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.DELIVERING],
        },
      ]);
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.GET_USER_ORDERS, [mockOrder]);
      expect(response).toEqual({ success: true, data: [mockOrder] });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when orders not found',
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValueOnce([]);
        },
        error: { status: StatusCode.ORDER_NOT_FOUND, message: ErrorMessage.ORDER_NOT_FOUND },
      },
      {
        name: 'should handle unknown error',
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockRejectedValueOnce(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_GET_USER_ORDERS,
          message: ErrorMessage.CANNOT_GET_USER_ORDERS,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId },
        user: { uid: mockUser.id },
      });
      const res = mockRes();

      mockFire();
      const response = await getOrdersByUserId(req, res, jest.fn());

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({ success: false, status: error.status, message: error.message });
    });
  });
});

describe('getOrderHistory()', () => {
  describe('valid cases', () => {
    test('should return order history successfully', async () => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId },
        user: { uid: mockUser.id },
      });
      const res = mockRes();
      const { orderPath } = getPaths(mockRestaurantId);

      mockedFirebase.getDocsByFields.mockResolvedValueOnce([mockOrder]);
      const response = await getOrderHistory(req, res, jest.fn());

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(orderPath, [
        { field: 'user_id', operator: '==', value: mockUser.id },
        { field: 'status', operator: '==', value: OrderStatus.COMPLETED },
      ]);
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.GET_USER_ORDER_HISTORY, [
        mockOrder,
      ]);
      expect(response).toEqual({ success: true, data: [mockOrder] });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when orders not found',
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValueOnce([]);
        },
        error: { status: StatusCode.ORDER_NOT_FOUND, message: ErrorMessage.ORDER_NOT_FOUND },
      },
      {
        name: 'should handle unknown error',
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockRejectedValueOnce(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_GET_USER_ORDER_HISTORY,
          message: ErrorMessage.CANNOT_GET_USER_ORDER_HISTORY,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId },
        user: { uid: mockUser.id },
      });
      const res = mockRes();

      mockFire();
      const response = await getOrderHistory(req, res, jest.fn());

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({ success: false, status: error.status, message: error.message });
    });
  });
});

describe('updateOrderInfo()', () => {
  describe('valid cases', () => {
    test('should update order successfully', async () => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId, id: mockOrderId },
        body: { note: 'updated' },
        user: { uid: mockUser.id },
      });
      const res = mockRes();
      const { orderPath } = getPaths(mockRestaurantId);

      mockedFirebase.getDocById.mockResolvedValueOnce({ ...mockOrder, user_id: mockUser.id });
      const response = await updateOrderInfo(req, res, jest.fn());

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(orderPath, mockOrderId);
      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(orderPath, mockOrderId, {
        note: 'updated',
        updated_by: mockUser.id,
      });
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.ORDER_UPDATED, { id: mockOrderId });
      expect(response).toEqual({ success: true, data: { id: mockOrderId } });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when order not found',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(null);
        },
        error: { status: StatusCode.ORDER_NOT_FOUND, message: ErrorMessage.ORDER_NOT_FOUND },
      },
      {
        name: 'should return error when user is forbidden',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce({
            ...mockOrder,
            user_id: 'another-user',
          });
        },
        error: {
          status: StatusCode.UPDATE_ORDER_FORBIDDEN,
          message: ErrorMessage.UPDATE_ORDER_FORBIDDEN,
        },
      },
      {
        name: 'should handle unknown error',
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValueOnce(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_UPDATE_ORDER_INFO,
          message: ErrorMessage.CANNOT_UPDATE_ORDER_INFO,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId, id: mockOrderId },
        user: { uid: mockUser.id },
      });
      const res = mockRes();

      mockFire();
      const response = await updateOrderInfo(req, res, jest.fn());

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({ success: false, status: error.status, message: error.message });
    });
  });
});

describe('updateOrderStatus()', () => {
  describe('valid cases', () => {
    test('should update order status successfully', async () => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId, id: mockOrderId },
        body: { status: OrderStatus.PREPARING },
        user: { uid: mockUser.id },
      });
      const res = mockRes();
      const { orderPath } = getPaths(mockRestaurantId);

      mockedFirebase.getDocById.mockResolvedValueOnce(mockOrder);
      const response = await updateOrderStatus(req, res, jest.fn());

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(orderPath, mockOrderId);
      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(orderPath, mockOrderId, {
        status: OrderStatus.PREPARING,
        updated_by: mockUser.id,
      });
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.ORDER_STATUS_UPDATED, {
        id: mockOrderId,
      });
      expect(response).toEqual({ success: true, data: { id: mockOrderId } });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when order not found',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(null);
        },
        error: { status: StatusCode.ORDER_NOT_FOUND, message: ErrorMessage.ORDER_NOT_FOUND },
      },
      {
        name: 'should handle unknown error',
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValueOnce(new Error('DB error'));
        },
        error: {
          status: StatusCode.CANNOT_UPDATE_ORDER_STATUS,
          message: ErrorMessage.CANNOT_UPDATE_ORDER_STATUS,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq({
        params: { restaurantId: mockRestaurantId, id: mockOrderId },
        user: { uid: mockUser.id },
      });
      const res = mockRes();

      mockFire();
      const response = await updateOrderStatus(req, res, jest.fn());

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({ success: false, status: error.status, message: error.message });
    });
  });
});
