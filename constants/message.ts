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
}

export enum Message {
  // Restaurant messages
  RESTAURANT_CREATED = 'Restaurant created successfully.',
  RESTAURANT_UPDATED = 'Restaurant updated successfully.',
  DISH_CREATED = 'New dish has been added successfully.',
  DISH_UPDATED = 'Dish has been updated successfully.',
}
