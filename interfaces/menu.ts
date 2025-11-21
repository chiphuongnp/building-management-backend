import { DayOfWeek, DishCategory } from '../constants/enum';

export interface MenuSchedule {
  id: DayOfWeek;
  created_at: Date;
  created_by: string;
  updated_at?: Date;
  updated_by?: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: DishCategory;
  quantity: number;
  image_urls?: string[];
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}
