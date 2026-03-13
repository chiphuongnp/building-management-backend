import { ActiveStatus } from '../../constants/enum';

export const mockSites = [
  {
    id: 'AjBfMRzDyXC8wbM4KHWb',
    code: 'TOKYO',
    address: 'Tokyo, Japan',
    status: ActiveStatus.ACTIVE,
    created_at: new Date('2024-01-01'),
    created_by: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
  },
  {
    id: 'Cwa6Fa1LjcmubpbCHh2X',
    code: 'OSAKA',
    address: 'Osaka, Japan',
    status: ActiveStatus.INACTIVE,
    created_at: new Date('2024-01-02'),
    created_by: 'F8TBShxahAVWgk1BibSNQj787Xw1',
  },
];

export const mockEmptySites: any[] = [];
