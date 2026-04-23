import { ActiveStatus, UserRank, UserRole } from '../../constants/enum';

export const mockUser = {
  id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  phone: '0123456789',
  image_url: 'https://example.com/avatar.png',
  rank: UserRank.BRONZE,
  points: 0,
  role: UserRole.USER,
  status: ActiveStatus.ACTIVE,
  permissions: ['CREATE_USER'],
};

export const mockInactiveUser = {
  ...mockUser,
  id: 'F8TBShxahAVWgk1BibSNQj787Xw1',
  status: ActiveStatus.INACTIVE,
};

export const mockIdToken = '2Wv3zE7vsianIJyrafPFJ98Ytsts';

export const mockDecodedToken = {
  uid: mockUser.id,
  email: mockUser.email,
};

export const mockAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIyV3YzekU3dnNpYW5JSnlyYWZQRko5OFlXU2oyIiwiZW1haWwiOiJtYWlsY3Z2M0BnbWFpbC5jb20iLCJzaXRlIjoidG9reW8iLCJyb2xlIjoidXNlciIsInBlcm1pc3Npb25zIjpbXSwiaWF0IjoxNzY2MzkzOTA5LCJleHAiOjE3NjY5OTg3MDl9.cJn9Cr5NkSB4aZOhDn8vHU578G5ZaRsvEdyMucH1mpM';
export const mockRefreshToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIyV3YzekU3dnNpYW5JSnlyYWZQRko5OFlXU2oyIiwiZW1haWwiOiJtYWlsY3Z2M0BnbWFpbC5jb20iLCJzaXRlIjoidG9reW8iLCJyb2xlIjoidXNlciIsInBlcm1pc3Npb25zIjpbXSwiaWF0IjoxNzY2MzkzOTA5LCJleHAiOjE3NjY5OTg3MDl9.cJn9Cr5NkSB4aZOhDn8vHU578G5ZaRsvEdyMucH1eRe';
export const mockNewAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIyV3YzekU3dnNpYW5JSnlyYWZQRko5OFlXU2oyIiwiZW1haWwiOiJtYWlsY3Z2M0BnbWFpbC5jb20iLCJzaXRlIjoidG9reW8iLCJyb2xlIjoidXNlciIsInBlcm1pc3Npb25zIjpbXSwiaWF0IjoxNzY2MzkzOTA5LCJleHAiOjE3NjY5OTg3MDl9.cJn9Cr5NkSB4aZOhDn8vHU578G5ZaRsvEdyMucHMMMM';
export const mockActivationToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIyV3YzekU3dnNpYW5JSnlyYWZQRko5OFlXU2oyIiwiZW1haWwiOiJtYWlsY3Z2M0BnbWFpbC5jb20iLCJzaXRlIjoidG9reW8iLCJyb2xlIjoidXNlciIsInBlcm1pc3Npb25zIjpbXSwiaWF0IjoxNzY2MzkzOTA5LCJleHAiOjE3NjY5OTg3MDl9.cJn9Cr5NkSB4aZOhDn8vHU578G5ZaRsvEdyMucHYHSa';

export const mockTokenDoc = {
  id: 'F8TBShxahAVWgk1BibSNQj787sadsay',
  refreshToken: mockRefreshToken,
  revoked: false,
};

export const mockRegisterInput = {
  body: {
    email: mockUser.email,
    password: 'password123',
    username: mockUser.username,
    full_name: mockUser.full_name,
    phone: mockUser.phone,
  },
};

export const mockLoginInput = {
  headers: { authorization: `Bearer ${mockIdToken}` },
};

export const mockRefreshTokenInput = {
  body: { refreshToken: mockRefreshToken },
};

export const mockLogoutInput = {
  user: { uid: mockUser.id },
  body: { refreshToken: mockRefreshToken },
};

export const mockActivateInput = {
  query: { token: mockActivationToken },
};
