export enum ErrorMessage {
  // Restaurant messages
  RESTAURANT_NOT_FOUND = 'Restaurant not found!',
  CANNOT_CREATE_RESTAURANT = 'Cannot create restaurant!',
  CANNOT_UPDATE_RESTAURANT = 'Cannot update restaurant!',
  // Dish messages
  DISH_ID_REQUIRED = 'Dish ID is required.',
  DISH_NOT_FOUND = 'Dish not found!',
  CANNOT_CREATE_DISH = 'Cannot create restaurant dish!',
  CANNOT_UPDATE_DISH = 'Cannot update restaurant dish!',
  // General messages
  NO_UPDATE_DATA = 'No update data provided.',
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
}

export enum Message {
  // Restaurant messages
  RESTAURANT_CREATED = 'Restaurant created successfully.',
  RESTAURANT_UPDATED = 'Restaurant updated successfully.',
  DISH_CREATED = 'New dish has been added successfully.',
  DISH_UPDATED = 'Dish has been updated successfully.',
  // Site messages
  SITE_CREATED = 'Site created successfully.',
  SITE_UPDATED = 'Site has been updated successfully.',
  // Site messages
  BUILDING_CREATED = 'Building created successfully.',
  BUILDING_UPDATED = 'Building has been updated successfully.',
  // Parking space messages
  PARKING_SPACE_CREATED = 'Parking space created successfully.',
  PARKING_SPACE_UPDATED = 'Parking space has been updated successfully.',
}
