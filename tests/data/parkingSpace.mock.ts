import { ParkingSpaceStatus } from '../../constants/enum';
import { mockBuildings } from './building.mock';
import { mockUid } from './user.mock';

export const mockBuilding = mockBuildings[0];

export const mockParkingSpace = {
  id: '1Wv3zE7vsianIJyrafPFJ9aswefW',
  code: 'A-01',
  building_id: mockBuilding.id,
  status: ParkingSpaceStatus.AVAILABLE,
};

export const mockParkingSpaces = [
  mockParkingSpace,
  {
    ...mockParkingSpace,
    id: '2Wv3zE7vsianIJyrafPFJ9aswefW',
    code: 'A-02',
    status: ParkingSpaceStatus.RESERVED,
  },
  {
    ...mockParkingSpace,
    id: '3Wv3zE7vsianIJyrafPFJ9aswefW',
    code: 'A-03',
    status: ParkingSpaceStatus.MAINTENANCE,
  },
];

export const mockUser = {
  uid: mockUid,
};

export const mockCreateParkingSpaceInput = {
  user: mockUser,
  body: {
    code: 'A-04',
    building_id: mockBuilding.id,
    status: ParkingSpaceStatus.AVAILABLE,
  },
};

export const mockUpdateParkingSpaceInput = {
  user: mockUser,
  params: { id: mockParkingSpace.id },
  body: {
    code: 'A-01-UPDATED',
    status: ParkingSpaceStatus.MAINTENANCE,
  },
};
