import { ActiveStatus, DishCategory } from '../constants/enum';

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: DishCategory;
  image_url?: string;
  status: ActiveStatus;
  created_at: Date;
  updated_at?: Date;
  created_by?: string;
  updated_by?: string;
}
