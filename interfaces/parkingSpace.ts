import { ParkingSpaceStatus, ParkingSpaceType } from '../constants/enum';

export interface ParkingSpaceLocation {
  floor: number;
  area: string;
}

export interface ParkingSpace {
  id?: string;
  building_id: string;
  location: ParkingSpaceLocation;
  code: string;
  type: ParkingSpaceType;
  status: ParkingSpaceStatus;
  created_at?: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}
