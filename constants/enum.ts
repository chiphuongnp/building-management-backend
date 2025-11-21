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
  BUSES = 'buses',
  ORDERS = 'orders',
  ORDER_DETAILS = 'order_details',
  BUS_ROUTES = 'bus_routes',
  FACILITY_RESERVATIONS = 'facility_reservations',
  DAILY_SALES = 'daily_sales',
  EVENT_BOOKINGS = 'event_bookings',
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
  DAILY_SALES = '0 0 * * *',
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

export enum BusStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum PickupMethod {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  COMPLETED = 'completed',
}

export enum VATRate {
  FOOD = 0.1,
  DEFAULT = 0.05,
}

export enum FacilityReservationStatus {
  PENDING = 'pending',
  RESERVED = 'reserved',
  CANCELLED = 'cancelled',
}

export enum EventBookingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
