import { ActiveStatus } from '../../constants/enum';

export const mockRoute = {
  id: 'CHbfMRzDyXC8wbM4KHWb',
  route_code: 'R001',
  route_name: 'Tokyo Route',
  bus_id: ['AjBfMRzDyXC8wbM4KHWb'],
  status: ActiveStatus.ACTIVE,
};

export const mockRouteAlternate = {
  id: 'PIHfMRzDyXC8wbM4KHWb',
  routeCode: 'R002',
  route_name: 'Osaka Route',
  bus_id: ['AjBfMRzDyXC8wbM4hgGtw'],
  status: ActiveStatus.ACTIVE,
};

export const ROUTE_ID = 'CHbfMRzDyXC8wbM4KHWb';
export const BUS_ID = 'AjBfMRzDyXC8wbM4KHWb';
export const USER_ID = 'PIHfMRzDyXC8wbM4KHWb';
