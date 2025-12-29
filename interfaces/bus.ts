import { BusStatus, BusSeatStatus } from '../constants/enum';

export interface Bus {
  type_name: string;
  number: number;
  plate_number: string;
  capacity: number;
  description?: string;
  image_urls?: string[];
  model: string;
  features?: string[];
  driver_id?: string;
  status: BusStatus;
  seats?: BusSeat[];
}

export interface BusSeat {
  seat_number: string;
  status: BusSeatStatus;
}
