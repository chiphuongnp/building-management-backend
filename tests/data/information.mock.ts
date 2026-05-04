import {
  ActiveStatus,
  InformationCategory,
  InformationPriority,
  InformationStatus,
  InformationTarget,
  UserRank,
  UserRole,
} from '../../constants/enum';

export const mockUserId = '0BfJJphzrcrqv8idzNEJ';
export const mockInformationId = '0BfJJphzrcrqv8idzNEJ';

export const mockUser = {
  id: '0BfJJphzrcrqv8idzNEJ',
  email: 'user@example.com',
  username: 'johnson',
  phone: '123456789',
  role: UserRole.USER,
  full_name: 'User',
  rank: UserRank.BRONZE,
  status: ActiveStatus.ACTIVE,
};

export const mockUserNoEmail = {
  id: '1CgKKqiAsdsr9jezOPFK',
  email: '',
  role: UserRole.USER,
  username: 'user',
  phone: '123456789',
  full_name: 'User 2',
  rank: UserRank.BRONZE,
  status: ActiveStatus.ACTIVE,
};

export const mockUsers = [
  mockUser,
  { ...mockUser, id: '1CgKKqiAsdsr9jezOPFK', email: 'user2@example.com' },
];

export const mockManagers = [
  {
    id: '0BfJJphzrcrqv8idzNEJ',
    email: 'manager@example.com',
    role: UserRole.MANAGER,
  },
];

export const mockInformation = {
  id: mockInformationId,
  title: 'Building Maintenance Notice',
  content: 'The elevator will be under maintenance.',
  category: InformationCategory.NOTIFICATION,
  priority: InformationPriority.NORMAL,
  target: InformationTarget.ALL,
  status: InformationStatus.SENT,
  schedule_at: new Date('2026-05-01T08:00:00.000Z'),
  created_at: new Date('2026-04-10T08:00:00.000Z'),
  created_by: mockUserId,
};

export const mockHighPriorityAllInfo = {
  ...mockInformation,
  priority: InformationPriority.HIGH,
  target: InformationTarget.ALL,
};

export const mockManagerTargetInfo = {
  ...mockInformation,
  target: InformationTarget.MANAGER,
};

export const mockInformationList = [
  mockInformation,
  { ...mockInformation, id: '1CgKKqiAsdsr9jezOPFK', title: 'Fire Drill Schedule' },
];

export const mockGetListInput = {
  query: {},
  pagination: { page: 1, page_size: 10 },
};

export const mockGetInfoInput = {
  user: { uid: mockUserId, role: UserRole.MANAGER },
  params: { id: mockInformationId },
};

export const mockCreateInfoInput = {
  user: { uid: mockUserId },
  body: {
    title: mockInformation.title,
    content: mockInformation.content,
    category: mockInformation.category,
    priority: InformationPriority.NORMAL,
    target: InformationTarget.ALL,
  },
};

export const mockCreateHighPriorityAllInput = {
  user: { uid: mockUserId },
  body: {
    ...mockCreateInfoInput.body,
    priority: InformationPriority.HIGH,
    target: InformationTarget.ALL,
  },
};

export const mockCreateHighPriorityManagerInput = {
  user: { uid: mockUserId },
  body: {
    ...mockCreateInfoInput.body,
    priority: InformationPriority.HIGH,
    target: InformationTarget.MANAGER,
  },
};

export const mockCreateScheduledInput = {
  user: { uid: mockUserId },
  body: {
    ...mockCreateInfoInput.body,
    schedule_at: '2026-06-01T08:00:00.000Z',
  },
};
