import { OrderStatus, PickupMethod } from '../../constants/enum';

export const mockUser = {
  id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
  full_name: 'John Doe',
  phone: '0901234567',
  rank: 'BRONZE',
  points: 100,
};

export const mockMenuItem = { id: 'F8kLmN3pQrS9tUvWxYz1', name: 'Fried Rice', quantity: 10 };

export const mockOrderDetail = [{ name: 'Fried Rice', price: 100, quantity: 2 }];

export const mockOrderBody = {
  pickup_method: PickupMethod.TAKEAWAY,
  points_used: 10,
  order_details: mockOrderDetail,
};


export const mockTransaction = { id: 'TxN4bC8dEfGhIjKlMnOp' };

export const mockRestaurantId = 'AbCdEfGhIjKlMnOpQrSt';

export const mockOrderId = 'XyZaBcDeFgHiJkLmNoPq';

export const mockOrder = {
  id: mockOrderId,
  user_id: mockUser.id,
  status: OrderStatus.PENDING,
};

export const mockOrderDetails = [
  {
    order_id: mockOrderId,
    name: 'Fried Rice',
    quantity: 2,
    price: 100,
  },
];
