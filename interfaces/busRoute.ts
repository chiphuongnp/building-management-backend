import { ActiveStatus, DayOfWeek } from '../constants/enum';

export interface BusRoute {
  id: string;
  route_name: string;
  route_code: string;
  description?: string;
  bus_id?: string[];
  departure_time: Date;
  estimated_duration: number;
  status: ActiveStatus;
  operating_dates?: DayOfWeek[];
  inactive_dates?: string[];
  stops?: BusStop[];
  created_by: string;
  updated_at?: Date;
  updated_by?: string;
}

export interface BusStop {
  stop_id: string;
  stop_name: string;
  building_id?: string | null;
  order: number;
  estimated_arrival: number;
  location: string;
}
