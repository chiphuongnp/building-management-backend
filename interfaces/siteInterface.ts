import { ActiveStatus } from '../constants/enum';

export interface Site {
  id: string;
  code: string;
  address: string;
  status: ActiveStatus;
  created_at: Date;
  updated_at?: Date | null;
  created_by: string;
  updated_by?: string | null;
}
