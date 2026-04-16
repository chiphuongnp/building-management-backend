import { FacilityStatus } from '../../constants/enum';
import { mockBuildings } from './building.mock';
import { mockUser } from './busSubscription.mock';

export const mockBuilding = mockBuildings[0];

export const mockFacility = {
  id: 'fA9sD3kL0pQwErTyUiOpZxCvBnM1',
  name: 'Conference Room A',
  building_id: mockBuilding.id,
  status: FacilityStatus.AVAILABLE,
  location: { area: 'East', floor: 2, outdoor: false },
  created_by: mockUser.id,
};

export const mockFacility2 = {
  id: 'gH7jK2lP0oIuYtR5eWqAsDfZxCvB3',
  name: 'Meeting Room B',
  building_id: mockBuilding.id,
  status: FacilityStatus.MAINTENANCE,
  location: { area: 'West', floor: 3, outdoor: false },
  created_by: mockUser.id,
};

export const mockFacilities = [mockFacility, mockFacility2];

export const mockCreateFacilityInput = {
  params: {},
  body: {
    name: mockFacility.name,
    building_id: mockBuilding.id,
    location: mockFacility.location,
  },
  user: { uid: mockUser.id },
};
