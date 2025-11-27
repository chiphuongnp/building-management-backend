import { BusStatus } from '../constants/enum';

export interface Bus {
  type_name: string;
  number: number;
  plate_number: string;
  capacity: number;
  description?: string;
  image_urls?: string[];
  model: string;
  features?: string[];
  driver: Driver;
  status: BusStatus;
  seats: BusSeat[];
}

interface Driver {
  name: string;
  phone: string;
  image_url?: string;
}

export interface BusSeat {
  seat_number: string;
  is_available: boolean;
  booked_by?: string | null;
  booking_id?: string | null;
}
