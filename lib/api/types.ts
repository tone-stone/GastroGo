export interface RestaurantScope {
  restaurantId: string;
}

export interface CrudRepository<T, CreateInput, UpdateInput = Partial<CreateInput>> {
  list(scope: RestaurantScope): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(input: CreateInput): Promise<T>;
  update(id: string, input: UpdateInput): Promise<T>;
  remove(id: string): Promise<void>;
}
