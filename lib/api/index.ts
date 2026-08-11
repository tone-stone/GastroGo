export { ApiError, fromSupabaseError, getErrorMessage } from '@/lib/api/errors';
export type { CrudRepository, RestaurantScope } from '@/lib/api/types';
export { fetchRestaurantSnapshot, persistOrder, persistTable } from '@/lib/data/restaurant-data';
export {
  getMenuCategoriesRepository,
  getMenuItemsRepository,
  getOrdersRepository,
  getStaffRepository,
  getTablesRepository,
  getUsersRepository,
} from '@/lib/repositories';
export type {
  CreateCategoryInput,
  CreateMenuItemInput,
  CreateStaffInput,
  CreateTableInput,
  CreateUserInput,
  UpdateCategoryInput,
  UpdateMenuItemInput,
  UpdateStaffInput,
  UpdateTableInput,
  UpdateUserInput,
} from '@/lib/repositories';
