export enum UserRole {
  MANAGER = 'manager',
  USER = 'user',
}

export enum UserRank {
  GOLD = 'gold',
  SILVER = 'silver',
  BRONZE = 'bronze',
}

export enum ActiveStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum DishCategory {
  MAIN = 'main_dish',
  SIDE = 'side_dish',
  DRINK = 'drink',
  DESSERT = 'dessert',
  COMBO = 'combo',
  OTHER = 'other',
  APPETIZER = 'appetizer',
}

export enum Sites {
  TOKYO = 'sites/tokyo',
}

export enum SitesName {
  TOKYO = 'tokyo',
}

export enum Collection {
  AUTH = 'auth',
  SITES = 'sites',
  USERS = 'users',
  RESTAURANTS = 'restaurants',
  DISHES = 'available_dishes',
  BUILDINGS = 'buildings',
  PARKING_SPACES = 'parking_spaces',
  MENU_SCHEDULES = 'menu_schedules',
  ITEMS = 'items',
  PARKING_SUBSCRIPTIONS = 'parking_subscriptions',
  PERMISSIONS = 'permissions',
  MENU_ITEMS = 'menu_items',
  FACILITIES = 'facilities',
  ORDERS = 'orders',
  ORDER_DETAILS = 'order_details',
}

export enum ParkingSpaceType {
  MOTORBIKE = 'motorbike',
  CAR = 'car',
}

export enum ParkingSpaceStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
}

export enum ParkingSubscriptionStatus {
  PENDING = 'pending',
  RESERVED = 'reserved',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum CronSchedule {
  MENU_ITEMS = '0 0 * * *',
  PARKING_EXPIRATION = '0 0 * * *',
}

export enum FacilityType {
  FIELD = 'field',
  ROOM = 'room',
}

export enum FacilityStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export enum PickupMethod {
  DINE_IN = 'dine-in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum VATRate {
  FOOD = 0.1,
  DEFAULT = 0.05,
}
