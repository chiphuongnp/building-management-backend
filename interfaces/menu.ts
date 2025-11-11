import { DayOfWeek, DishCategory } from '../constants/enum';

export interface MenuSchedule {
  id: DayOfWeek;
  created_at: Date;
  created_by: string;
  updated_at?: Date;
  updated_by?: string;
  items: Item[];
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: DishCategory;
  image_urls?: string[];
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}
