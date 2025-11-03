import { ActiveStatus } from '../constants/enum';

export interface Building {
  id: string;
  name: string;
  code: string;
  address: string;
  manager_id: string;
  status: ActiveStatus;
  created_at: Date;
  updated_at?: Date | null;
  created_by: string;
  updated_by?: string | null;
}
