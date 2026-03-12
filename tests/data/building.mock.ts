import { ActiveStatus } from '../../constants/enum';

export const mockBuildings = [
  {
    id: 'AjBfMRzDyXC8wbM4KHWb',
    name: 'Tokyo Tower',
    code: 'TOKYO',
    address: 'Tokyo',
    status: ActiveStatus.ACTIVE,
    manager_id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
  },
  {
    id: 'Cwa6Fa1LjcmubpbCHh2X',
    name: 'Shibuya Center',
    code: 'SHIBUYA',
    address: 'Shibuya',
    status: ActiveStatus.INACTIVE,
    manager_id: 'F8TBShxahAVWgk1BibSNQj787Xw1',
  },
];

export const mockFilteredBuildings = [
  {
    id: 'AjBfMRzDyXC8wbM4KHWb',
    name: 'Tokyo Tower',
    code: 'TOKYO',
    status: ActiveStatus.ACTIVE,
  },
];

export const mockEmptyBuildings: any[] = [];

export const mockBuildingsStats = [
  { status: ActiveStatus.ACTIVE, manager_id: '2Wv3zE7vsianIJyrafPFJ98YWSj2' },
  { status: ActiveStatus.ACTIVE, manager_id: 'F8TBShxahAVWgk1BibSNQj787Xw1' },
  { status: ActiveStatus.INACTIVE, manager_id: '2Wv3zE7vsianIJyrafPFJ98YWSj2' },
  { status: ActiveStatus.INACTIVE, manager_id: 'F8TBShxahAVWgk1BibSNQj787Xw1' },
];

export const mockBuildingsNoManager = [
  { status: ActiveStatus.ACTIVE, manager_id: null },
  { status: ActiveStatus.INACTIVE, manager_id: null },
];
