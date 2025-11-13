export enum ErrorMessage {
  // Restaurant messages
  RESTAURANT_NOT_FOUND = 'Restaurant(s) not found!',
  RESTAURANT_NAME_EXISTS = 'Restaurant with the same name already exists!',
  CANNOT_CREATE_RESTAURANT = 'Cannot create restaurant!',
  CANNOT_UPDATE_RESTAURANT = 'Cannot update restaurant!',
  CANNOT_GET_RESTAURANT_LIST = 'Cannot get list of restaurants!',
  CANNOT_GET_RESTAURANT_DETAIL = `Cannot get restaurant's detail!`,

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

  // Parking subscription messages
  CANNOT_GET_PARKING_SUBSCRIPTION_LIST = 'Can not get list of parking subscription!',
  PARKING_SUBSCRIPTION_NOT_FOUND = 'Parking subscription not found!',
  CANNOT_CREATE_PARKING_SUBSCRIPTION = 'Cannot create parking subscription!',

  //Permission messages
  PERMISSION_NOT_FOUND = 'Permission not found',
  PERMISSION_ALREADY_EXISTS = 'Permission already exists',
  CANNOT_CREATE_PERMISSION = 'Cannot create permission',
  CANNOT_UPDATE_PERMISSION = 'Cannot update permission',
  CANNOT_DELETE_PERMISSION = 'Cannot delete permission',
  CANNOT_GET_PERMISSION_LIST = 'Cannot get list of permissions',
  PERMISSION_GET_DETAIL = 'Cannot get permission detail',
  CANNOT_UPDATE_PARKING_SUBSCRIPTION = 'Cannot update parking subscription!',
  CANNOT_UPDATE_PARKING_SUBSCRIPTION_STATUS = 'Cannot update parking subscription status!',
}

export enum Message {
  // Restaurant messages
  RESTAURANT_CREATED = 'Restaurant created successfully.',
  RESTAURANT_UPDATED = 'Restaurant updated successfully.',
  RESTAURANT_GET_ALL = 'Get all restaurants successfully',
  RESTAURANT_GET_DETAIL = `Get restaurant's detail successfully`,
  DISH_CREATED = 'New dish has been added successfully.',
  DISH_UPDATED = 'Dish has been updated successfully.',
  DISH_GET_ALL = 'Get all available dishes successfully',
  DISH_GET_DETAIL = `Get restaurant's dish successfully`,

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
  GET_SITES = 'Get site(s) successfully.',

  // Site messages
  BUILDING_CREATED = 'Building created successfully.',
  BUILDING_UPDATED = 'Building has been updated successfully.',
  GET_BUILDINGS = 'Get building(s) successfully.',

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

  // Parking subscription messages
  PARKING_SUBSCRIPTION_CREATED = 'Parking subscription created successfully.',
  PARKING_SUBSCRIPTION_UPDATED = 'Parking subscription has been updated successfully.',
  GET_PARKING_SUBSCRIPTION = 'Get parking subscription(s) successfully.',

  //Permission messages
  PERMISSION_CREATED = 'Permission created successfully',
  PERMISSION_UPDATED = 'Permission updated successfully',
  PERMISSION_DELETED = 'Permission deleted successfully',
  PERMISSION_GET_ALL = 'Get all permissions successfully',
  PERMISSION_GET_DETAIL = 'Get permission detail successfully',
  PARKING_SUBSCRIPTION_STATUS_UPDATED = 'Parking subscription status has been updated successfully.',
}

export enum StatusCode {
  // User status codes
  USER_GET_ALL = 4001,
  USER_GET_PROFILE = 4002,
  USER_NOT_FOUND = 4003,
  USER_GET_DETAIL = 4004,
  ACCOUNT_NOT_FOUND = 4005,
  USER_UPDATE = 4006,

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

  //Permission
  PERMISSION_GET_ALL = 5001,
  PERMISSION_NOT_FOUND = 5002,
  PERMISSION_CREATE = 5003,
  PERMISSION_UPDATE = 5004,
  PERMISSION_DELETE = 5005,
  PERMISSION_GET_DETAIL = 5006,
  PERMISSION_ALREADY_EXISTS = 5007,

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

  // Parking space status codes
  CANNOT_GET_PARKING_SPACE_LIST = 4081,
  PARKING_SPACE_NOT_FOUND = 4082,
  PARKING_SPACE_CODE_ALREADY_EXISTS = 4083,
  CANNOT_CREATE_PARKING_SPACE = 4084,
  CANNOT_UPDATE_PARKING_SPACE = 4085,
  CANNOT_GET_AVAILABLE_PARKING_SPACE = 4086,
  CANNOT_UPDATE_PARKING_SPACE_STATUS = 4087,
  PARKING_SPACE_ALREADY_RESERVED = 4088,

  // Parking subscription codes
  CANNOT_GET_PARKING_SUBSCRIPTION_LIST = 4121,
  PARKING_SUBSCRIPTION_NOT_FOUND = 4122,
  CANNOT_CREATE_PARKING_SUBSCRIPTION = 4123,
  CANNOT_UPDATE_PARKING_SUBSCRIPTION = 4124,
  CANNOT_UPDATE_PARKING_SUBSCRIPTION_STATUS = 4125,
}
