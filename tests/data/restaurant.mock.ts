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
