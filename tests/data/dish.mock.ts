import { ActiveStatus } from '../../constants/enum';

export const mockRestaurantId = 'xatrgjGstsC8wbM4hgGtw';

export const mockDish = {
  id: 'CHbfMRzDyXC8wbM4KHWb',
  name: 'Sushi',
  category: 'Japanese',
  status: ActiveStatus.ACTIVE,
  image_urls: ['https://cdn.example.com/sushi.jpg'],
  created_by: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
};

export const mockDishes = [mockDish, { ...mockDish, id: 'CHbfMRzDyXC8wbM4Khts', name: 'Ramen' }];

export const mockGetDishesInput = {
  params: { restaurantId: mockRestaurantId },
  query: {},
  pagination: { page: 1, page_size: 10 },
};

export const mockGetDishByIdInput = {
  params: { restaurantId: mockRestaurantId, id: mockDish.id },
};

export const mockCreateDishInput = {
  user: { uid: '2Wv3zE7vsianIJyrafPFJ98YWSj2' },
  params: { restaurantId: mockRestaurantId },
  body: {
    name: mockDish.name,
    category: mockDish.category,
  },
  files: [{ path: 'uploads/sushi.jpg' }],
};

export const mockUpdateDishInput = {
  user: { uid: '2Wv3zE7vsianIJyrafPFJ98YWSj2' },
  params: { restaurantId: mockRestaurantId, id: mockDish.id },
  body: {
    name: 'Sushi Updated',
    category: 'Japanese',
  },
  files: [],
};
