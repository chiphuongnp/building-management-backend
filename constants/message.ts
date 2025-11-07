export enum ErrorMessage {
  // Restaurant messages
  RESTAURANT_NOT_FOUND = 'Restaurant not found!',
  RESTAURANT_NAME_EXISTS = 'Restaurant with the same name already exists',
  CANNOT_CREATE_RESTAURANT = 'Cannot create restaurant!',
  CANNOT_UPDATE_RESTAURANT = 'Cannot update restaurant!',

  // Dish messages
  DISH_ID_REQUIRED = 'Dish ID is required!',
  DISH_NOT_FOUND = 'Dish not found!',
  DISH_NAME_EXISTS = 'Dish with the same name already exists',
  CANNOT_GET_DISH_LIST = 'Cannot get restaurant dish list!',
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

  //Authenticate error messages
  UNAUTHORIZE_NOT_FOUND = 'Unauthorized: User ID not found',

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

  // Parking space messages
  CANNOT_GET_PARKING_SPACE_LIST = 'Can not get list of parking space!',
  CANNOT_GET_AVAILABLE_PARKING_SPACE = 'Can not get list available of parking space!',
  PARKING_SPACE_NOT_FOUND = 'Parking space not found!',
  PARKING_SPACE_CODE_ALREADY_EXISTS = 'Parking space code already exists!',
  CANNOT_CREATE_PARKING_SPACE = 'Cannot create parking space!',
  CANNOT_UPDATE_PARKING_SPACE = 'Cannot update parking space!',

  // General messages
  NO_UPDATE_DATA = 'No update data provided!',
  REQUEST_FAILED = 'Request failed',
  ACCOUNT_NOT_FOUND = 'Account not found',

  // Menu Schedule messages
  MENU_SCHEDULE_DAY_EXISTS = 'Menu schedule for the specified day already exists',
  MENU_ITEM_NAME_EXISTS = 'Menu item(s) with the same name already exists.',
  CANNOT_CREATE_MENU_SCHEDULE = 'Cannot create menu schedule(s)!',
  CANNOT_UPDATE_MENU_SCHEDULE = 'Cannot update menu schedule!',
  PARKING_SPACE_ALREADY_RESERVED = 'This parking space is already reserved!',

  // Parking subscription messages
  CANNOT_GET_PARKING_SUBSCRIPTION_LIST = 'Can not get list of parking subscription!',
  PARKING_SUBSCRIPTION_NOT_FOUND = 'Parking subscription not found!',
  CANNOT_CREATE_PARKING_SUBSCRIPTION = 'Cannot create parking subscription!',
}

export enum Message {
  // Restaurant messages
  RESTAURANT_CREATED = 'Restaurant created successfully.',
  RESTAURANT_UPDATED = 'Restaurant updated successfully.',
  DISH_CREATED = 'New dish has been added successfully.',
  DISH_UPDATED = 'Dish has been updated successfully.',

  //User messages
  USER_CREATED = 'User created successfully',
  USER_UPDATED = 'User updated successfully',
  USER_DELETED = 'User deleted successfully',
  USER_GET_ALL = 'Get all user successfully',
  USER_GET_DETAIL = `Get user's detail successfully`,
  USER_GET_PROFILE = `Get profile successfully`,
  UNAUTHORIZE_NOT_FOUND = 'UNAUTHORIZE_NOT_FOUND',

  // Site messages
  SITE_CREATED = 'Site created successfully.',
  SITE_UPDATED = 'Site has been updated successfully.',

  // Site messages
  BUILDING_CREATED = 'Building created successfully.',
  BUILDING_UPDATED = 'Building has been updated successfully.',

  // Parking space messages
  PARKING_SPACE_CREATED = 'Parking space created successfully.',
  PARKING_SPACE_UPDATED = 'Parking space has been updated successfully.',

  // Menu Schedule messages
  MENU_SCHEDULE_CREATED = 'Menu schedule(s) created successfully.',
  MENU_SCHEDULE_UPDATED = 'Menu schedule has been updated successfully.',

  // Parking subscription messages
  PARKING_SUBSCRIPTION_CREATED = 'Parking subscription created successfully.',
  PARKING_SUBSCRIPTION_UPDATED = 'Parking subscription has been updated successfully.',
}

export enum StatusCode {
  // User status codes
  USER_GET_ALL = 4001,
  USER_GET_PROFILE = 4002,
  USER_NOT_FOUND = 4003,
  USER_GET_DETAIL = 4004,
  ACCOUNT_NOT_FOUND = 4005,

  // Menu Schedule status codes
  CANNOT_CREATE_MENU_SCHEDULE = 4061,
  CANNOT_UPDATE_MENU_SCHEDULE = 4062,
  MENU_SCHEDULE_DAY_EXISTS = 4063,
  MENU_ITEM_NAME_EXISTS = 4064,
}
