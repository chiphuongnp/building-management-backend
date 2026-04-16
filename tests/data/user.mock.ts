import { ActiveStatus, UserRole, UserRank } from '../../constants/enum';

export const mockUsers = [
  {
    id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
    email: 'john@gmail.com',
    full_name: 'John Doe',
    role: UserRole.USER,
    rank: UserRank.BRONZE,
    status: ActiveStatus.ACTIVE,
  },
  {
    id: 'F8TBShxahAVWgk1BibSNQj787Xw1',
    email: 'admin@gmail.com',
    full_name: 'Admin User',
    role: UserRole.MANAGER,
    rank: UserRank.GOLD,
    status: ActiveStatus.INACTIVE,
  },
];

export const mockFilteredUsers = [
  {
    id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
    email: 'john@gmail.com',
    full_name: 'John Doe',
    role: UserRole.USER,
    rank: UserRank.BRONZE,
    status: ActiveStatus.ACTIVE,
  },
];

export const mockUsersData = [
  { role: UserRole.MANAGER, rank: UserRank.GOLD },
  { role: UserRole.MANAGER, rank: UserRank.SILVER },
  { role: UserRole.USER, rank: UserRank.GOLD },
  { role: UserRole.USER, rank: UserRank.GOLD },
];

export const mockUser = { id: '2Wv3zE7vsianIJyrafPFJ98YWSj2', full_name: 'John Doe' };

export const mockCreateUserBody = {
  email: 'test@gmail.com',
  password: '123456',
  username: 'johnson',
  full_name: 'John Doe',
  phone: '123456789',
};

export const mockUid = '2Wv3zE7vsianIJyrafPFJ98YWSj2';

export const mockTokens = {
  empty: [],

  single: [
    {
      id: 'AjBfMRzDyXC8wbM4KHWb',
      revoked: false,
    },
  ],

  multiple: [
    {
      id: 'AjBfMRzDyXC8wbM4KHWb',
      revoked: false,
    },
    {
      id: 'Cwa6Fa1LjcmubpbCHh2X',
      revoked: false,
    },
  ],

  alreadyRevoked: [
    {
      id: 'AjBfMRzDyXC8wbM4KHWb',
      revoked: true,
    },
    {
      id: 'Cwa6Fa1LjcmubpbCHh2X',
      revoked: true,
    },
  ],
};
