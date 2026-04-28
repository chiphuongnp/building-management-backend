import { ActiveStatus } from '../../constants/enum';

export const mockRestaurant = {
  id: 'xatrgjGstsC8wbM4hgGtw',
  name: 'Pizza Hut',
  building_id: 'AjBfMRzDyXC8wbM4KHWb',
  status: ActiveStatus.ACTIVE,
  created_at: '2026-01-01',
};

export const mockRestaurants = [
  mockRestaurant,
  {
    id: 'xatrgjGstsC8wbM4hgGty',
    name: 'Burger King',
    building_id: 'Cwa6Fa1LjcmubpbCHh2X',
    status: ActiveStatus.INACTIVE,
    created_at: '2026-01-02',
  },
];

export const mockRestaurantStats = [
  { status: ActiveStatus.ACTIVE, building_id: 'AjBfMRzDyXC8wbM4KHWb' },
  { status: ActiveStatus.INACTIVE, building_id: 'Cwa6Fa1LjcmubpbCHh2X' },
  { status: ActiveStatus.ACTIVE, building_id: 'AjBfMRzDyXC8wbM4KHWb' },
  { status: ActiveStatus.INACTIVE },
];

export const mockCreateRestaurantBody = {
  name: 'Pizza Hut',
  building_id: 'AjBfMRzDyXC8wbM4KHWb',
};

export const mockBuilding = {
  id: 'AjBfMRzDyXC8wbM4KHWb',
  name: 'Building A',
};

export const mockUid = '2Wv3zE7vsianIJyrafPFJ98YWSj2';

export const mockMenuItem = {
  id: 'k53aqCh6T13okDndR9Vf',
  name: 'New York Tenderloin Steak',
  price: 15000,
  image_urls: ['steak.jpg', 'steak2.jpg'],
};

export const mockMenuItems = [
  mockMenuItem,
  {
    id: 'pfMLNzcevRKZx2Ia2H3F',
    name: 'Burger',
    price: 8000,
    image_urls: ['burger.jpg'],
  },
];

export const mockDailySale = {
  id: '2026-01-01',
  total_orders: 5,
  total_revenue: 100000,
  total_vat_charge: 10000,
  created_at: new Date('2026-01-01'),
};

export const mockDefaultDailySale = {
  id: '2026-01-02',
  total_orders: 0,
  total_revenue: 0,
  total_vat_charge: 0,
  created_at: expect.any(Date),
};

export const mockDishSales = [
  {
    id: '1jq9Xrmdw3oGkhwhXAq0',
    daily_sale_id: '2026-01-01',
    total_quantity: 10,
    total_revenue: 200000,
    dish_name: 'Chicken Alfredo Pasta',
    created_at: new Date('2026-01-01'),
  },
];

export const mockDefaultDishSales = [
  {
    id: 'default',
    daily_sale_id: '2026-01-02',
    total_quantity: 0,
    total_revenue: 0,
    dish_name: 'No data',
    created_at: expect.any(Date),
  },
];
