import { BusSeatStatus, BusStatus } from '../../constants/enum';
import { Bus } from '../../interfaces/bus';

export const mockBusSeats = [
  { seat_number: '1', status: BusSeatStatus.AVAILABLE },
  { seat_number: '2', status: BusSeatStatus.AVAILABLE },
  { seat_number: '3', status: BusSeatStatus.AVAILABLE },
];

export const mockBuses = [
  {
    id: 'AjBfMRzDyXC8wbM4KHWb',
    type_name: 'Sleeper Bus',
    number: 1,
    plate_number: 'ABC-1234',
    capacity: 3,
    model: 'Toyota Coaster',
    description: 'Luxury sleeper bus',
    features: ['WiFi', 'Air Conditioning'],
    status: BusStatus.ACTIVE,
    seats: mockBusSeats,
    image_urls: ['uploads/bus1.jpg'],
    driver_id: 'driver_001',
  },
  {
    id: 'AjBfMRzDyXC8wbM4hgGtw',
    type_name: 'Standard Bus',
    number: 2,
    plate_number: 'XYZ-5678',
    capacity: 3,
    model: 'Hyundai Universe',
    description: 'Standard commuter bus',
    features: ['Air Conditioning'],
    status: BusStatus.INACTIVE,
    seats: mockBusSeats,
    image_urls: ['uploads/bus2.jpg'],
    driver_id: 'driver_002',
  },
  {
    id: 'xatrgjGstsC8wbM4hgGtw',
    type_name: 'Mini Bus',
    number: 3,
    plate_number: 'DEF-9012',
    capacity: 3,
    model: 'Ford Transit',
    status: BusStatus.MAINTENANCE,
    seats: mockBusSeats,
    image_urls: [],
    driver_id: undefined,
  },
  {
    id: 'xatrgjGstsC8wbM4aaaat',
    type_name: 'Bus',
    number: 5,
    plate_number: 'DEF-9012',
    capacity: 3,
    model: 'Ford Transit',
    status: BusStatus.MAINTENANCE,
    seats: mockBusSeats,
    image_urls: [],
    driver_id: undefined,
    created_by: undefined,
  },
];

export const mockEmptyBuses: Bus[] = [];

export const mockBusStats = {
  total: 3,
  active: 1,
  maintenance: 1,
  inactive: 1,
  drivers: ['driver_001', 'driver_002'],
};
