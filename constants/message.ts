export enum ErrorMessage {
  // Restaurant messages
  RESTAURANT_NOT_FOUND = 'Restaurant(s) not found!',
  RESTAURANT_NAME_EXISTS = 'Restaurant with the same name already exists!',
  CANNOT_CREATE_RESTAURANT = 'Cannot create restaurant!',
  CANNOT_UPDATE_RESTAURANT = 'Cannot update restaurant!',
  CANNOT_GET_RESTAURANT_LIST = 'Cannot get list of restaurants!',
  CANNOT_GET_RESTAURANT_DETAIL = `Cannot get restaurant's detail!`,
  CANNOT_GET_RESTAURANT_STATS = `Cannot get restaurant's stats!`,

  // Dish messages
  DISH_NOT_FOUND = 'Dish(es) not found for this restaurant!',
  DISH_NAME_EXISTS = 'Dish with the same name already exists',
  CANNOT_GET_DISH_LIST = 'Cannot get restaurant dish list!',
  CANNOT_GET_DISH_DETAIL = `Cannot get dish's detail!`,
  CANNOT_CREATE_DISH = 'Cannot create restaurant dish!',
  CANNOT_UPDATE_DISH = 'Cannot update restaurant dish!',

  //User error messages
  USER_NOT_FOUND = 'User not found',
  USER_ALREADY_EXISTS = 'User already exists',
  INVALID_CREDENTIALS = 'Invalid username or password',
  CONFIRM_PASSWORD_UNMATCHED = 'Confirm password does not match',
  FORBIDDEN_PROFILE = 'You can only view your own profile',
  USER_INACTIVE = 'User is inactive',
  EMAIL_IS_REQUIRED = 'Email is required',
  PASSWORD_IS_REQUIRED = 'Password is required',
  USER_GET_DETAIL_FAULT = '',
  USER_GET_DETAIL = 'Get user detail failed',
  USER_GET_ALL = 'Get all user failed',
  USER_GET_PROFILE = 'Get user profile failed',
  USER_UPDATED = 'Update user failed',
  CANNOT_GET_USER_STATS = 'Cannot get stats for users',

  //Authenticate error messages
  UNAUTHORIZE_NOT_FOUND = 'Unauthorized: User ID not found',
  UNAUTHORIZED = 'Unauthorized!',

  // Site messages
  CANNOT_GET_SITE_LIST = 'Can not get list of sites!',
  SITE_NOT_FOUND = 'Site not found!',
  SITE_ID_ALREADY_EXISTS = 'Site id already exists!',
  SITE_CODE_ALREADY_EXISTS = 'Site code already exists!',
  CANNOT_CREATE_SITE = 'Cannot create site!',
  CANNOT_UPDATE_SITE = 'Cannot update site!',

  // Building messages
  CANNOT_GET_BUILDING_LIST = 'Can not get list of buildings!',
  BUILDING_NOT_FOUND = 'Building not found!',
  BUILDING_NAME_ALREADY_EXISTS = 'Building name already exists!',
  BUILDING_CODE_ALREADY_EXISTS = 'Building code already exists!',
  CANNOT_CREATE_BUILDING = 'Cannot create building!',
  CANNOT_UPDATE_BUILDING = 'Cannot update building!',
  CANNOT_UPDATE_BUILDING_STATUS = 'Cannot update building status!',
  CANNOT_GET_BUILDING_STATS = `Cannot get building's stats!`,

  // Parking space messages
  CANNOT_GET_PARKING_SPACE_LIST = 'Can not get list of parking space!',
  CANNOT_GET_AVAILABLE_PARKING_SPACE = 'Can not get list available of parking space!',
  PARKING_SPACE_NOT_FOUND = 'Parking space not found!',
  PARKING_SPACE_CODE_ALREADY_EXISTS = 'Parking space code already exists!',
  CANNOT_CREATE_PARKING_SPACE = 'Cannot create parking space!',
  CANNOT_UPDATE_PARKING_SPACE = 'Cannot update parking space!',
  CANNOT_UPDATE_PARKING_SPACE_STATUS = 'Cannot update parking space status!',
  PARKING_SPACE_ALREADY_RESERVED = 'This parking space is already reserved!',

  // General messages
  REQUEST_FAILED = 'Request failed!',
  ACCOUNT_NOT_FOUND = 'Account not found!',
  IMAGE_UPLOAD_FAILED = 'Image upload failed!',
  CANNOT_UPLOAD_IMAGES = 'Error processing uploaded images!',

  // Menu Schedule messages
  MENU_SCHEDULE_DAY_EXISTS = 'Menu schedule for the specified day already exists!',
  MENU_ITEM_NAME_EXISTS = 'Menu item(s) with the same name already exists!',
  CANNOT_CREATE_MENU_SCHEDULE = 'Cannot create menu schedule(s)!',
  CANNOT_UPDATE_MENU_SCHEDULE = 'Cannot update menu schedule!',
  GET_MENU_SCHEDULES = 'Cannot get menu schedule(s)!',
  MENU_SCHEDULE_NOT_FOUND = 'Menu schedule not found!',
  MENU_SCHEDULE_EMPTY = 'Menu schedule list is empty!',
  CANNOT_CREATE_MENU_ITEM = 'Cannot add item to menu schedule!',
  CANNOT_UPDATE_MENU_ITEM = 'Cannot update item in menu schedule!',
  MENU_ITEM_NOT_FOUND = 'Menu item not found in this menu schedule!',
  MENU_ITEM_LIST_NOT_FOUND = 'Menu not found for this restaurant!',
  CANNOT_GET_MENU_ITEM_LIST = 'Cannot get menu for this restaurant!',
  CANNOT_GET_DAILY_SALES = 'Cannot get daily sales for this restaurant!',
  CANNOT_GET_DISH_SALES = 'Cannot get dish sales for this restaurant!',
  DAILY_SALES_NOT_FOUND = 'Daily sales not found for this restaurant!',
  DISH_SALES_NOT_FOUND = 'Dish sales not found for this restaurant!',

  // Parking subscription messages
  CANNOT_GET_PARKING_SUBSCRIPTION_LIST = 'Can not get list of parking subscription!',
  PARKING_SUBSCRIPTION_NOT_FOUND = 'Parking subscription not found!',
  CANNOT_CREATE_PARKING_SUBSCRIPTION = 'Cannot create parking subscription!',
  CANNOT_UPDATE_PARKING_SUBSCRIPTION = 'Cannot update parking subscription!',
  CANNOT_UPDATE_PARKING_SUBSCRIPTION_STATUS = 'Cannot update parking subscription status!',
  CANNOT_CANCEL_PARKING_SUBSCRIPTION = 'Cannot cancel parking subscription!',
  CANCEL_PARKING_SUBSCRIPTION_FORBIDDEN = 'You are not allowed to cancel this parking subscription!',

  //Permission messages
  PERMISSION_NOT_FOUND = 'Permission not found',
  PERMISSION_ALREADY_EXISTS = 'Permission already exists',
  CANNOT_CREATE_PERMISSION = 'Cannot create permission',
  CANNOT_UPDATE_PERMISSION = 'Cannot update permission',
  CANNOT_GET_PERMISSION_LIST = 'Cannot get list of permissions',
  PERMISSION_GET_DETAIL = 'Cannot get permission detail',

  // Facility messages
  CANNOT_GET_FACILITY_LIST = 'Can not get list of facility!',
  CANNOT_GET_AVAILABLE_FACILITY = 'Can not get available facilities list!',
  FACILITY_NOT_FOUND = 'Facility not found!',
  FACILITY_NAME_ALREADY_EXISTS = 'Facility name already exists!',
  CANNOT_CREATE_FACILITY = 'Cannot create facility!',
  FACILITY_LOCATION_ALREADY_EXISTS = 'Facility location already exists!',
  CANNOT_UPDATE_FACILITY = 'Cannot update facility!',
  CANNOT_UPDATE_FACILITY_STATUS = 'Cannot update facility status!',
  CANNOT_GET_FACILITY_STATS = `Cannot get facility's stats!`,

  // Order messages
  CANNOT_CREATE_ORDER = 'Cannot create order!',
  ORDER_NOT_FOUND = 'Order not found!',
  ORDER_DETAIL_NOT_FOUND = 'Order details not found!',
  CANNOT_GET_ORDER_DETAILS = 'Cannot fetch order with details!',
  CANNOT_GET_ORDER_LIST = 'Cannot fetch list of orders!',
  CANNOT_GET_USER_ORDERS = 'Cannot fetch list of orders for user!',
  GET_ORDER_FORBIDDEN = 'You are not allowed to view this order!',
  UPDATE_ORDER_FORBIDDEN = 'You are not allowed to update this order!',
  CANNOT_UPDATE_ORDER_INFO = 'Cannot update order info!',
  CANNOT_GET_USER_ORDER_HISTORY = `Cannot get user's order history!`,
  CANNOT_UPDATE_ORDER_STATUS = 'Cannot update order status!',
  DISH_NOT_FOUND_IN_MENU = `Dish not found in menu items!`,
  DISH_QUANTITY_EXCEEDS_STOCK = 'Quantity for dish exceeds available stock!',

  // Bus error messages
  CANNOT_GET_BUS_LIST = 'Cannot get list of buses!',
  BUS_NOT_FOUND = 'Bus not found!',
  BUS_NUMBER_ALREADY_EXISTS = 'Bus number already exists!',
  BUS_CODE_ALREADY_EXISTS = 'Bus code already exists!',
  CANNOT_CREATE_BUS = 'Cannot create bus!',
  CANNOT_UPDATE_BUS = 'Cannot update bus!',
  CANNOT_GET_BUS_DETAIL = 'Cannot get bus detail!',

  // Bus Route error messages
  CANNOT_GET_BUS_ROUTE_LIST = 'Cannot get list of bus routes!',
  BUS_ROUTE_NOT_FOUND = 'Bus route not found!',
  BUS_ROUTE_ALREADY_EXISTS = 'Bus route with the same code already exists!',
  CANNOT_CREATE_BUS_ROUTE = 'Cannot create bus route!',
  CANNOT_UPDATE_BUS_ROUTE = 'Cannot update bus route!',
  CANNOT_GET_BUS_ROUTE_DETAIL = 'Cannot get bus route detail!',

  // Facility reservation messages
  CANNOT_GET_FACILITY_RESERVATION_LIST = 'Cannot get list of facility reservations!',
  CANNOT_GET_USER_FACILITY_RESERVATION = 'Cannot get list of facility reservations for user!',
  FACILITY_RESERVATION_NOT_FOUND = 'Facility reservations not found!',
  FACILITY_RESERVATION_ALREADY_EXISTS = 'Facility reservation already exists!',
  CANNOT_CREATE_FACILITY_RESERVATION = 'Cannot create facility reservation!',
  CANNOT_CANCEL_FACILITY_RESERVATION = 'Cannot cancel facility reservation!',
  FACILITY_RESERVATION_IS_CANCELLED = 'Facility reservation is cancelled!',
  FACILITY_RESERVATION_LATE_CANCELLATION = 'You cannot cancel after facility reservation time!',

  // Event booking messages
  CANNOT_CREATE_EVENT_BOOKING = 'Cannot create event booking!',
  CANNOT_GET_EVENT_BOOKING_LIST = 'Cannot get list of event bookings!',
  EVENT_BOOKING_NOT_FOUND = 'Event booking not found!',
  CANNOT_GET_AVAILABLE_EVENT_BOOKINGS = 'Can not get list available of parking space!',
  CANNOT_UPDATE_EVENT_BOOKING = 'Cannot update event booking!',
  CANNOT_UPDATE_EVENT_BOOKING_STATUS = 'Cannot update event booking status!',
  UPDATE_EVENT_BOOKING_FORBIDDEN = 'You are not allowed to update this event booking!',

  // Event registrations messages
  CANNOT_GET_USER_EVENT_REGISTRATIONS = `Cannot get user's event registrations!`,
  CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT = `Cannot list of participants by event!`,
  CANNOT_CREATE_EVENT_REGISTRATION = 'Cannot create event registration!',
  UPDATE_EVENT_REGISTRATION_FORBIDDEN = 'You are not allowed to update this event registration!',
  CANNOT_CANCEL_EVENT_REGISTRATION = 'Cannot cancel event registration!',
  CANNOT_GET_USER_EVENT_REGISTRATION_HISTORY = `Cannot get user's event registration history!`,

  // Payment errors
  CANNOT_GET_PAYMENT = 'Cannot get payment!',
  CANNOT_CREATE_PAYMENT = 'Cannot create payment!',
  INVALID_POINTS = `Points used exceed user's available points!`,
  PAYMENT_NOT_FOUND = 'Payment not found!',
  PAYMENT_FORBIDDEN = 'You are not allowed to handle this payment!',
  INVALID_SIGNATURE = 'Invalid signature!',
  CANNOT_CREATE_VNPAY_PAYMENT_URL = 'Cannot create vnpay payment url!',
  CANNOT_CALL_BACK_VNPAY_PAYMENT = 'Cannot callback vnpay payment!',
  CANNOT_CALL_BACK_VNPAY_IPN = 'Cannot callback vnpay ipn!',

  // Bus Booking error messages
  BUS_SUBSCRIPTION_NOT_FOUND = 'Bus subscription not found!',
  BUS_SUBSCRIPTION_ALREADY_EXISTS = 'You already have a subscription for this route!',
  CANNOT_CREATE_BUS_SUBSCRIPTION = 'Cannot create bus subscription!',
  CANNOT_CANCEL_BUS_SUBSCRIPTION = 'Cannot cancel bus subscription!',
  CANNOT_GET_BUS_SUBSCRIPTION_LIST = 'Cannot get list of bus subscriptions!',
  CANNOT_GET_USER_BUS_SUBSCRIPTIONS = 'Cannot get user bus subscription history!',
  BUS_SUBSCRIPTION_IS_CANCELLED = 'Bus subscription has already been cancelled!',
  BUS_SUBSCRIPTION_LATE_CANCELLATION = 'Cannot cancel subscription after departure time!',
  BUS_ROUTE_FULL = 'This bus route is fully booked!',
  BUS_ROUTE_NOT_AVAILABLE = 'Selected bus route is no longer available!',
  INVALID_SUBSCRIPTION_SEATS = 'Invalid number of seats requested!',
  SEAT_ALREADY_BOOKED = 'One or more selected seats are already taken!',
  CANNOT_GET_BUS_SUBSCRIPTION_DETAIL = 'Cannot get bus subscription detail!',

  // Momo errors
  CANNOT_CREATE_MOMO_PAYMENT = 'Cannot create momo payment',
  MOMO_CALLBACK_FAILED = 'Momo callback failed!',
  MOMO_IPN_CALLBACK_FAILED = 'Momo ipn callback failed!',

  // Information errors
  INFORMATION_TITLE_EXISTS = 'The title of this information already exists!',
  INFORMATION_NOT_FOUND = 'Information not found!',
  CANNOT_CREATE_INFORMATION = 'Cannot create information',
  CANNOT_GET_INFORMATION = 'Cannot get information',
  CANNOT_GET_INFORMATION_LIST = 'Cannot get information list',
  FORBIDDEN_INFORMATION = 'You are not allowed to view this information!',

  // Mailer errors
  RECIPIENT_MAIL_REQUIRED = 'Recipient email is required!',
  SENDER_MAIL_NOT_CONFIGURED = 'Sender email is not configured!',
  NO_RECIPIENT_EMAILS = 'No valid recipient email addresses!',
  SEND_INFORMATION_FAILED = 'Failed to send information notification!',
  INVALID_LINK = 'Invalid or expired activation link',

  // Auth errors
  INVALID_TOKEN = 'Invalid or already revoked token!',
  ACCOUNT_INACTIVE = 'Account is inactive or banned!',
  INVALID_PASSWORD = 'Invalid password!',
  LOGIN_FAILED = 'Login request failed!',
  REGISTER_FAILED = 'Register request failed!',
  FIREBASE_AUTH_FAILED = 'Firebase Auth error!',
  CANNOT_CREATE_USER = 'Cannot create user!',
  SEND_ACTIVATION_MAIL_FAILED = 'Failed to send activation mail!',
  ACCOUNT_EMAIL_EXISTS = 'Email already exists!',
  LOGOUT_FAILED = 'Login request failed!',
  REFRESH_TOKEN_REQUIRED = 'Refresh token is required!',
  CANNOT_CREATE_SUPER_MANAGER = 'Cannot create super manager!',
  CANNOT_UPDATE_PASSWORD = 'Cannot update password!',
}

export enum Message {
  // Restaurant messages
  RESTAURANT_CREATED = 'Restaurant created successfully.',
  RESTAURANT_UPDATED = 'Restaurant updated successfully.',
  RESTAURANT_GET_ALL = 'Get all restaurants successfully',
  RESTAURANT_GET_DETAIL = `Get restaurant's detail successfully`,
  RESTAURANT_GET_STATS = `Get restaurant's stats successfully`,
  DISH_CREATED = 'New dish has been added successfully.',
  DISH_UPDATED = 'Dish has been updated successfully.',
  DISH_GET_ALL = 'Get all available dishes successfully',
  DISH_GET_DETAIL = `Get restaurant's dish successfully`,

  //User messages
  SUPER_MANAGER_CREATED = 'First manager created successfully',
  USER_CREATED = 'User created successfully',
  USER_UPDATED = 'User updated successfully',
  USER_GET_ALL = 'Get all user successfully',
  USER_GET_DETAIL = `Get user's detail successfully`,
  USER_GET_PROFILE = `Get profile successfully`,
  USER_GET_STATS = `Get stats of users successfully`,
  UNAUTHORIZE_NOT_FOUND = 'Unauthorized not found',
  PASSWORD_UPDATED = 'Password updated successfully',

  // Site messages
  SITE_CREATED = 'Site created successfully.',
  SITE_UPDATED = 'Site has been updated successfully.',
  GET_SITES = 'Get site(s) successfully.',

  // Building messages
  BUILDING_CREATED = 'Building created successfully.',
  BUILDING_UPDATED = 'Building has been updated successfully.',
  GET_BUILDINGS = 'Get building(s) successfully.',
  BUILDING_STATUS_UPDATED = 'Building status has been updated successfully.',
  BUILDING_GET_STATS = `Get building's stats successfully`,

  // Parking space messages
  PARKING_SPACE_CREATED = 'Parking space created successfully.',
  PARKING_SPACE_UPDATED = 'Parking space has been updated successfully.',
  PARKING_SPACE_STATUS_UPDATED = 'Parking space status has been updated successfully.',
  GET_PARKING_SPACE = 'Get parking space(s) successfully.',
  GET_AVAILABLE_PARKING_SPACE = 'Get available parking space(s) successfully.',

  // Menu Schedule messages
  MENU_SCHEDULE_CREATED = 'Menu schedule(s) created successfully.',
  MENU_SCHEDULE_UPDATED = 'Menu schedule(s) has been updated successfully.',
  GET_MENU_SCHEDULES = 'Get menu schedule(s) successfully.',
  MENU_ITEM_CREATED = 'New item(s) has been added to menu schedule.',
  MENU_ITEM_UPDATED = 'Item(s) has been updated in menu schedule.',
  GET_MENU_ITEMS = `Get restaurant's menu successfully`,
  GET_DAILY_SALES = `Get restaurant's daily sales successfully`,
  GET_DISH_SALES = `Get restaurant's dish sales successfully`,
  NO_SALES_DATA = 'No sales data available for this date',

  // Parking subscription messages
  PARKING_SUBSCRIPTION_CREATED = 'Parking subscription created successfully.',
  PARKING_SUBSCRIPTION_UPDATED = 'Parking subscription has been updated successfully.',
  GET_PARKING_SUBSCRIPTION = 'Get parking subscription(s) successfully.',
  PARKING_SUBSCRIPTION_STATUS_UPDATED = 'Parking subscription status has been updated successfully.',
  PARKING_SUBSCRIPTION_CANCELED = 'Parking subscription canceled successfully.',

  // Order messages
  ORDER_CREATED = 'Order has been created successfully.',
  ORDER_UPDATED = 'Order has been updated successfully.',
  GET_ORDERS = 'Get list of orders successfully.',
  GET_ORDER_DETAILS = `Get order details successfully.`,
  GET_ORDER_LIST = 'Get list of orders successfully.',
  GET_USER_ORDERS = 'Get list of orders per user successfully.',
  GET_USER_ORDER_HISTORY = `Get user's order history successfully.`,
  ORDER_STATUS_UPDATED = 'Order status has been updated successfully.',

  //Permission messages
  PERMISSION_CREATED = 'Permission created successfully',
  PERMISSION_UPDATED = 'Permission updated successfully',
  PERMISSION_GET_ALL = 'Get all permissions successfully',
  PERMISSION_GET_DETAIL = 'Get permission detail successfully',

  // Facility messages
  FACILITY_CREATED = 'Facility created successfully.',
  GET_FACILITIES = 'Get facilities successfully.',
  GET_FACILITY_DETAIL = 'Get facility successfully.',
  GET_AVAILABLE_FACILITY = 'Get available facilities successfully.',
  FACILITY_UPDATED = 'Facility updated successfully.',
  FACILITY_STATUS_UPDATED = 'Facility status has been updated successfully.',
  FACILITY_GET_STATS = `Get facility's stats successfully`,

  // Bus messages
  BUS_CREATED = 'Bus created successfully.',
  BUS_UPDATED = 'Bus updated successfully.',
  BUS_GET_ALL = 'Get all buses successfully.',
  BUS_GET_DETAIL = 'Get bus detail successfully.',

  // Bus Route success messages
  BUS_ROUTE_CREATED = 'Bus route created successfully.',
  BUS_ROUTE_UPDATED = 'Bus route updated successfully.',
  BUS_ROUTE_GET_ALL = 'Get all bus routes successfully.',
  BUS_ROUTE_GET_DETAIL = 'Get bus route detail successfully.',

  // Facility reservations messages
  GET_FACILITY_RESERVATIONS = 'Get facility reservations successfully.',
  GET_FACILITY_RESERVATION_HISTORY = `Get user's facility reservations successfully.`,
  GET_FACILITY_RESERVATION_DETAIL = 'Get facility reservation successfully.',
  FACILITY_RESERVATION_CREATED = 'Facility reservation created successfully.',
  FACILITY_RESERVATION_CANCELED = 'Facility reservation canceled successfully.',

  // Event booking messages
  EVENT_BOOKING_CREATED = 'Event booking created successfully.',
  GET_EVENT_BOOKINGS = 'Get event bookings successfully.',
  GET_EVENT_BOOKING_DETAIL = 'Get event booking successfully.',
  GET_AVAILABLE_EVENT_BOOKING = 'Get available event booking successfully.',
  EVENT_BOOKING_UPDATED = 'Event booking updated successfully.',
  EVENT_BOOKING_STATUS_UPDATED = 'Event booking status has been updated successfully.',

  // Event registration messages
  GET_USER_EVENT_REGISTRATIONS = `Get user's list of events successfully.`,
  GET_EVENT_REGISTRATIONS_BY_EVENT = 'Get list of participants by event successfully.',
  EVENT_REGISTRATION_CREATED = 'Event registration created successfully.',
  EVENT_REGISTRATION_CANCELED = 'Event registration canceled successfully.',
  GET_USER_EVENT_REGISTRATION_HISTORY = `Get user's events history successfully.`,
  NO_REGISTERED_EVENT = `User hasn't registered any event!`,

  // Payment messages
  PAYMENT_CREATED = 'Payment has been created successfully',
  PAYMENT_URL_CREATED = 'Payment url has been created successfully',
  PAYMENT_SUCCESSFUL = 'Payment has been received successfully.',
  PAYMENT_FAILED = 'Payment failed.',
  MOMO_CREATED = 'Momo payment has been created successfully.',
  GET_PAYMENT = 'Get payment successfully.',

  // Bus Booking success messages
  BUS_SUBSCRIPTION_CREATED = 'Bus subscription created successfully.',
  BUS_SUBSCRIPTION_CANCELLED = 'Bus subscription cancelled successfully.',
  GET_BUS_SUBSCRIPTIONS = 'Get bus subscriptions successfully.',
  GET_USER_BUS_SUBSCRIPTIONS = 'Get user bus subscriptions successfully.',
  GET_BUS_SUBSCRIPTION_DETAIL = 'Get bus subscription detail successfully.',
  BUS_SUBSCRIPTION_GET_ALL = 'Get all bus subscription successfully.',

  // Information messages
  INFO_CREATED = 'New information has been created',
  GET_INFORMATION_LIST = 'Get list of information successfully.',
  GET_INFORMATION = 'Get information successfully.',
  INFORMATION_LIST_EMPTY = 'The list of information is empty',

  // Auth messages
  LOGIN_SUCCESS = 'Login successfully',
  REGISTER_SUCCESS = 'Register successfully',
  LOGOUT_SUCCESS = 'Logout successfully',
}

export enum StatusCode {
  // User status codes
  USER_GET_ALL = 4001,
  USER_GET_PROFILE = 4002,
  USER_NOT_FOUND = 4003,
  USER_GET_DETAIL = 4004,
  ACCOUNT_NOT_FOUND = 4005,
  USER_UPDATE = 4006,

  // Auth errors
  INVALID_TOKEN = 4007,
  ACCOUNT_INACTIVE = 4008,
  INVALID_PASSWORD = 4009,
  LOGIN_FAILED = 4010,
  REGISTER_FAILED = 4011,
  FIREBASE_AUTH_FAILED = 4012,
  CANNOT_CREATE_USER = 4013,
  SEND_ACTIVATION_MAIL_FAILED = 4014,
  ACCOUNT_EMAIL_EXISTS = 4015,
  LOGOUT_FAILED = 4016,
  REFRESH_TOKEN_REQUIRED = 4017,
  UNAUTHORIZED = 4018,
  CANNOT_CREATE_SUPER_MANAGER = 4019,
  CANNOT_UPDATE_PASSWORD = 4020,

  // Sites status codes
  CANNOT_GET_SITE_LIST = 4021,
  SITE_NOT_FOUND = 4022,
  SITE_ALREADY_EXISTS = 4023,
  SITE_CODE_ALREADY_EXISTS = 4024,
  CANNOT_CREATE_SITE = 4025,
  CANNOT_UPDATE_SITE = 4026,

  // Buildings status codes
  CANNOT_GET_BUILDING_LIST = 4041,
  BUILDING_NOT_FOUND = 4042,
  BUILDING_NAME_ALREADY_EXISTS = 4043,
  BUILDING_CODE_ALREADY_EXISTS = 4044,
  CANNOT_CREATE_BUILDING = 4045,
  CANNOT_UPDATE_BUILDING = 4046,
  CANNOT_UPDATE_BUILDING_STATUS = 4047,
  CANNOT_GET_BUILDING_STATS = 4048,

  // Menu Schedule status codes
  CANNOT_CREATE_MENU_SCHEDULE = 4061,
  CANNOT_UPDATE_MENU_SCHEDULE = 4062,
  MENU_SCHEDULE_DAY_EXISTS = 4063,
  MENU_ITEM_NAME_EXISTS = 4064,
  GET_MENU_SCHEDULES = 4065,
  MENU_SCHEDULE_NOT_FOUND = 4066,
  MENU_SCHEDULE_EMPTY = 4067,
  CANNOT_CREATE_MENU_ITEM = 4068,
  CANNOT_UPDATE_MENU_ITEM = 4069,
  MENU_ITEM_NOT_FOUND = 4070,
  IMAGE_UPLOAD_FAILED = 4071,
  CANNOT_UPLOAD_IMAGES = 4072,
  MENU_ITEM_LIST_NOT_FOUND = 4073,
  CANNOT_GET_MENU_ITEM_LIST = 4074,
  CANNOT_GET_DAILY_SALES = 4075,
  CANNOT_GET_DISH_SALES = 4076,
  DAILY_SALES_NOT_FOUND = 4077,
  DISH_SALES_NOT_FOUND = 4078,

  // Parking space status codes
  CANNOT_GET_PARKING_SPACE_LIST = 4081,
  PARKING_SPACE_NOT_FOUND = 4082,
  PARKING_SPACE_CODE_ALREADY_EXISTS = 4083,
  CANNOT_CREATE_PARKING_SPACE = 4084,
  CANNOT_UPDATE_PARKING_SPACE = 4085,
  CANNOT_GET_AVAILABLE_PARKING_SPACE = 4086,
  CANNOT_UPDATE_PARKING_SPACE_STATUS = 4087,
  PARKING_SPACE_ALREADY_RESERVED = 4088,

  // Restaurant messages
  RESTAURANT_NOT_FOUND = 4101,
  RESTAURANT_NAME_EXISTS = 4102,
  CANNOT_CREATE_RESTAURANT = 4103,
  CANNOT_UPDATE_RESTAURANT = 4104,
  CANNOT_GET_RESTAURANT_LIST = 4105,
  CANNOT_GET_RESTAURANT_DETAIL = 4106,

  // Dish messages
  DISH_NOT_FOUND = 4107,
  DISH_NAME_EXISTS = 4108,
  CANNOT_GET_DISH_LIST = 419,
  CANNOT_GET_DISH_DETAIL = 4110,
  CANNOT_CREATE_DISH = 4111,
  CANNOT_UPDATE_DISH = 4112,
  CANNOT_GET_RESTAURANT_STATS = 4113,

  // Parking subscription codes
  CANNOT_GET_PARKING_SUBSCRIPTION_LIST = 4121,
  PARKING_SUBSCRIPTION_NOT_FOUND = 4122,
  CANNOT_CREATE_PARKING_SUBSCRIPTION = 4123,
  CANNOT_UPDATE_PARKING_SUBSCRIPTION = 4124,
  CANNOT_UPDATE_PARKING_SUBSCRIPTION_STATUS = 4125,
  CANNOT_CANCEL_PARKING_SUBSCRIPTION = 4126,
  CANCEL_PARKING_SUBSCRIPTION_FORBIDDEN = 4127,

  // Facility codes
  CANNOT_GET_FACILITY_LIST = 4141,
  FACILITY_NOT_FOUND = 4142,
  FACILITY_NAME_ALREADY_EXISTS = 4143,
  CANNOT_CREATE_FACILITY = 4144,
  CANNOT_GET_AVAILABLE_FACILITY = 4145,
  FACILITY_LOCATION_ALREADY_EXISTS = 4146,
  CANNOT_UPDATE_FACILITY = 4147,
  CANNOT_UPDATE_FACILITY_STATUS = 4148,
  CANNOT_GET_FACILITY_STATS = 4149,

  // Order codes
  CANNOT_CREATE_ORDER = 4161,
  ORDER_NOT_FOUND = 4162,
  ORDER_DETAIL_NOT_FOUND = 4163,
  CANNOT_GET_ORDER_DETAILS = 4164,
  CANNOT_GET_ORDER_LIST = 4165,
  CANNOT_GET_USER_ORDERS = 4166,
  GET_ORDER_FORBIDDEN = 4167,
  UPDATE_ORDER_FORBIDDEN = 4168,
  CANNOT_UPDATE_ORDER_INFO = 4169,
  CANNOT_GET_USER_ORDER_HISTORY = 4170,
  CANNOT_UPDATE_ORDER_STATUS = 4171,
  DISH_NOT_FOUND_IN_MENU = 4172,
  DISH_QUANTITY_EXCEEDS_STOCK = 4173,

  // Facility reservation codes
  CANNOT_GET_FACILITY_RESERVATION_LIST = 4181,
  FACILITY_RESERVATION_NOT_FOUND = 4182,
  FACILITY_RESERVATION_ALREADY_EXISTS = 4183,
  CANNOT_CREATE_FACILITY_RESERVATION = 4184,
  CANNOT_GET_FACILITY_RESERVATION_HISTORY = 4185,
  CANNOT_CANCEL_FACILITY_RESERVATION = 4186,
  FACILITY_RESERVATION_IS_CANCELLED = 4187,
  FACILITY_RESERVATION_LATE_CANCELLATION = 4188,

  // Event booking codes
  CANNOT_CREATE_EVENT_BOOKING = 4201,
  CANNOT_GET_EVENT_BOOKING_LIST = 4202,
  EVENT_BOOKING_NOT_FOUND = 4203,
  CANNOT_GET_AVAILABLE_EVENT_BOOKINGS = 4204,
  CANNOT_UPDATE_EVENT_BOOKING = 4205,
  CANNOT_UPDATE_EVENT_BOOKING_STATUS = 4206,
  UPDATE_EVENT_BOOKING_FORBIDDEN = 4207,

  // Event registration codes
  CANNOT_GET_USER_EVENT_REGISTRATIONS = 4221,
  CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT = 4222,
  CANNOT_CREATE_EVENT_REGISTRATION = 4223,
  CANNOT_CANCEL_EVENT_REGISTRATION = 4224,
  UPDATE_EVENT_REGISTRATION_FORBIDDEN = 4225,
  CANNOT_GET_USER_EVENT_REGISTRATION_HISTORY = 4226,

  // Payment codes
  CANNOT_CREATE_PAYMENT = 4241,
  INVALID_POINTS = 4242,
  PAYMENT_NOT_FOUND = 4243,
  CANNOT_GET_PAYMENT = 4244,
  INVALID_SIGNATURE = 4245,
  CANNOT_CREATE_MOMO_PAYMENT = 4246,
  MOMO_CALLBACK_FAILED = 4247,
  MOMO_IPN_CALLBACK_FAILED = 4248,
  CANNOT_CREATE_VNPAY_PAYMENT_URL = 4249,
  CANNOT_CALL_BACK_VNPAY_PAYMENT = 4250,
  CANNOT_CALL_BACK_VNPAY_IPN = 4251,
  PAYMENT_FORBIDDEN = 4252,

  // Information codes
  INFORMATION_TITLE_EXISTS = 4261,
  INFORMATION_NOT_FOUND = 4262,
  CANNOT_CREATE_INFORMATION = 4263,
  CANNOT_GET_INFORMATION = 4264,
  CANNOT_GET_INFORMATION_LIST = 4265,
  FORBIDDEN_INFORMATION = 4266,

  // More user errors
  NO_RECIPIENT_EMAILS = 4275,
  SEND_INFORMATION_FAILED = 4276,
  CANNOT_GET_USER_STATS = 4277,

  // Bus subscription codes
  BUS_SUBSCRIPTION_NOT_FOUND = 4301,
  BUS_SUBSCRIPTION_GET_ALL_ERROR = 4302,
  SEAT_ALREADY_BOOKED = 4303,
  CANNOT_CREATE_BUS_SUBSCRIPTION = 4304,
  BUS_SUBSCRIPTION_GET_DETAIL_ERROR = 4305,

  //Permission
  PERMISSION_GET_ALL = 5001,
  PERMISSION_NOT_FOUND = 5002,
  PERMISSION_CREATE = 5003,
  PERMISSION_UPDATE = 5004,
  PERMISSION_GET_DETAIL = 5006,
  PERMISSION_ALREADY_EXISTS = 5007,

  // Bus status codes
  BUS_GET_ALL = 6001,
  BUS_GET_DETAIL = 6002,
  BUS_NOT_FOUND = 6003,
  BUS_CREATE = 6004,
  BUS_UPDATE = 6005,
  BUS_NUMBER_ALREADY_EXISTS = 6007,
  BUS_CODE_ALREADY_EXISTS = 6008,

  // Bus Route status codes
  BUS_ROUTE_GET_ALL = 7001,
  BUS_ROUTE_GET_DETAIL = 7002,
  BUS_ROUTE_NOT_FOUND = 7003,
  BUS_ROUTE_CREATE = 7004,
  BUS_ROUTE_UPDATE = 7005,
  BUS_ROUTE_ALREADY_EXISTS = 7006,
}
