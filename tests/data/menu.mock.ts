import { DayOfWeek } from '../../constants/enum';

export const mockRestaurantId = '0BfJJphzrcrqv8idzNEJ';
export const mockUserId = '0BfJJphzrcrqv8idzNEJ';
export const mockItemId = '0BfJJphzrcrqv8idzNEJ';
export const mockDayId = DayOfWeek.MONDAY;

export const mockMenuItem = {
  id: mockItemId,
  name: 'Sushi',
  price: 15,
  image_urls: ['https://cdn.example.com/sushi.jpg'],
  created_by: mockUserId,
};

export const mockMenuItems = [
  mockMenuItem,
  { ...mockMenuItem, id: '1CgKKqiAsdsr9jezOPFK', name: 'Ramen' },
];

export const mockMenuSchedule = {
  id: mockDayId,
  created_by: mockUserId,
};

export const mockMenuScheduleWithItems = {
  ...mockMenuSchedule,
  items: mockMenuItems,
};

export const mockGetMenuSchedulesInput = {
  params: { restaurantId: mockRestaurantId },
};

export const mockGetMenuScheduleByIdInput = {
  params: { restaurantId: mockRestaurantId, id: mockDayId },
};

export const mockCreateMenuScheduleInput = {
  user: { uid: mockUserId },
  params: { restaurantId: mockRestaurantId },
  body: {
    schedules: [
      {
        id: mockDayId,
        items: [
          { name: 'Sushi', price: 15 },
          { name: 'Ramen', price: 12 },
        ],
      },
    ],
  },
};

export const mockAddMenuItemInput = {
  user: { uid: mockUserId },
  params: { restaurantId: mockRestaurantId, id: mockDayId },
  body: {
    name: 'Tempura',
    price: 18,
    image_urls: [],
  },
  files: [],
};

export const mockUpdateMenuItemInput = {
  user: { uid: mockUserId },
  params: { restaurantId: mockRestaurantId, id: mockDayId, itemId: mockItemId },
  body: {
    name: 'Sushi Updated',
    price: 20,
  },
  files: [],
};
