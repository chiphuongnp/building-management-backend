import { ActiveStatus } from '../constants/enum';

export interface OperatingHours {
  open: string;
  close: string;
  days?: string[];
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  facebook?: string;
  zalo?: string;
}

export interface Restaurant {
  id: string;
  building_id: string;
  floor: number;
  name: string;
  description?: string;
  operating_hours?: OperatingHours;
  contact?: ContactInfo;
  status: ActiveStatus;
  today_menu: string[];
  created_at: Date;
  updated_at?: Date;
  created_by?: string;
  updated_by?: string;
}
