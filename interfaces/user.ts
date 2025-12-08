import { ActiveStatus, UserRank, UserRole } from '../constants/enum';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone: string;
  image_url?: string | null;
  rank?: UserRank;
  points?: number | null;
  role: UserRole;
  permissions?: string[] | null;
  status: ActiveStatus;
  created_at?: Date;
  updated_at?: Date | null;
  created_by?: string;
  updated_by?: string | null;
}
