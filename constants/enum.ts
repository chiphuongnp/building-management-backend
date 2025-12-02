export enum UserRole {
  MANAGER = 'manager',
  USER = 'user',
}

export enum UserRank {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
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
  DISH_SALES = 'dish_sales',
  EVENT_REGISTRATIONS = 'event_registrations',
  PAYMENTS = 'payments',
  BUS_SUBSCRIPTIONS = 'bus_subscriptions',
  INFORMATION = 'information',
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
  DISH_SALES = '0 0 * * *',
  EVENT_EXPIRATION = '0 0 * * *',
  USER_RANK = '0 0 1 * *',
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
  DELIVERING = 'delivering',
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
  EXPIRED = 'expired',
}

export enum Permission {
  CREATE_SITE = 'create_site',
  UPDATE_SITE = 'update_site',
  CREATE_BUILDING = 'create_building',
  UPDATE_BUILDING = 'update_building',
  GET_ALL_USERS = 'get_all_users',
  GET_USER_DETAIL = 'get_user_detail',
  UPDATE_USER = 'update_user',
  GET_ALL_PERMISSIONS = 'get_all_permissions',
  GET_PERMISSION = 'get_permission',
  CREATE_PERMISSION = 'create_permission',
  UPDATE_PERMISSION = 'update_permission',
  CREATE_RESTAURANT = 'create_restaurant',
  UPDATE_RESTAURANT = 'update_restaurant',
  VIEW_SALES = 'view_sales',
  VIEW_ORDER_LIST = 'view_order_list',
  UPDATE_ORDER_STATUS = 'update_order_status',
  CREATE_DISH = 'create_dish',
  UPDATE_DISH = 'update_dish',
  VIEW_MENU = 'view_menu',
  CREATE_MENU = 'create_menu',
  UPDATE_MENU = 'update_menu',
  CREATE_PARKING_SPACE = 'create_parking_space',
  UPDATE_PARKING_SPACE = 'update_parking_space',
  CREATE_FACILITY = 'create_facility',
  UPDATE_FACILITY = 'update_facility',
  UPDATE_EVENT_BOOKING_STATUS = 'update_event_booking_status',
  CREATE_BUS = 'create_bus',
  GET_ALL_BUSES = 'get_all_buses',
  GET_BUS = 'get_bus',
  UPDATE_BUS = 'update_bus',
  CREATE_BUS_ROUTE = 'create_bus_route',
  GET_ALL_BUS_ROUTES = 'get_all_bus_routes',
  GET_BUS_ROUTE_DETAIL = 'get_bus_route_detail',
  UPDATE_BUS_ROUTE = 'update_bus_route',
  UPDATE_BUS_ROUTE_STATUS = 'update_bus_route_status',
  GET_EVENT_PARTICIPANTS = 'get_event_participants',
  GET_BOOKING_BUS_DETAIL = 'get_booking_bus_detail',
  GET_ALL_BOOKING_BUS = 'get_all_booking_bus',
  CREATE_BOOKING_BUS = 'create_booking_bus',
  CREATE_INFORMATION = 'create_information',
  VIEW_INFORMATION_LIST = 'view_information_list',
}

export enum EventRegistrationsStatus {
  REGISTERED = 'registered',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export enum PaymentMethod {
  CASH = 'cash',
  WALLET = 'wallet',
}

export enum PaymentServiceProvider {
  MOMO = 'momo',
  VNPAY = 'vnpay',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentReferenceType {
  ORDER = 'order',
  BUS_SUBSCRIPTION = 'bus_subscription',
  PARKING_SUBSCRIPTION = 'parking_subscription',
  FACILITY_RESERVATION = 'facility_reservation',
}

export enum RankDiscount {
  BRONZE = 0,
  SILVER = 2,
  GOLD = 5,
  PLATINUM = 10,
}

export enum BusSubscriptionType {
  SINGLE = 'single',
  MONTHLY = 'monthly',
}

export enum BusSubscriptionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum BusSubscriptionChangeRequestType {
  CANCEL_SEAT = 'cancel_seat',
  CHANGE_ROUTE = 'change_route',
  CHANGE_STOP = 'change_stop',
  CHANGE_DATE = 'change_date',
}

export enum BusSubscriptionChangeRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum HmacAlgorithm {
  SHA256 = 'sha256',
  SHA512 = 'sha512',
}

export enum VnpayRspCode {
  SUCCESS = '00',
  INVALID_SIGNATURE = '97',
  SYSTEM_ERROR = '99',
}

export enum RankMinimumSpending {
  MIN_AMOUNT_PLATINUM = 10000000,
  MIN_AMOUNT_GOLD = 5000000,
  MIN_AMOUNT_SILVER = 2000000,
}

export enum InformationCategory {
  NOTIFICATION = 'notification',
  INFO = 'info',
  NEWS = 'news',
  EVENT = 'event',
}

export enum InformationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export enum InformationTarget {
  ALL = 'all',
  MANAGER = 'manager',
}

export enum InformationStatus {
  SCHEDULED = 'scheduled',
  SENT = 'sent',
}
