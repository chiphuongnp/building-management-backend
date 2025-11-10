import { ActiveStatus, UserRank, UserRole } from '../constants/enum';

export interface User {
  id: string;
  uid: string;
  email: string;
  username: string;
  password?: string;
  fullName: string;
  phone: string;
  image_urls?: string[] | null;
  ranks?: UserRank | null;
  points?: number | null;
  roles: UserRole;
  permissions?: string[] | null;
  status: ActiveStatus;
  created_at: Date | FirebaseFirestore.Timestamp;
  updated_at?: Date | FirebaseFirestore.Timestamp | null;
  created_by: string;
  updated_by?: string | null;
}
