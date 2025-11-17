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
}

interface Driver {
  name: string;
  phone: string;
  image_url?: string;
}
