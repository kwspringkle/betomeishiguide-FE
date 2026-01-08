// Request Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  password: string;
  username: string;
  national: string;
}

// Response Types
export interface LoginResponse {
  token: string;
  message: string;
}

export interface RegisterResponse {
  message: string;
}

export interface UserInfoResponse {
  data: {
    name: string;
    national: string;
    email: string;
    avatar?: string;
  };
}

// API Error Response
export interface ApiError {
  error?: string;
  message?: string;
}

// Dish Types
export interface Dish {
  id: number;
  name: string;
  imageUrl: string;
  description: string;
  likes: number;
}

export interface DishListResponse {
  status: string;
  data: Dish[];
  message?: string;
}

// Favorite Types - Based on actual backend API
export interface Favorite {
  id: number;
  dishId?: number; // Dish ID for linking to dish detail page
  restaurantId?: number | null; // Optional: some APIs include this
  dishesname: string; // Note: backend uses "dishesname" not "dishName"
  restaurantname?: string; // Legacy field name
  restaurantName?: string; // New field name from API
  distance?: number; // Only in top3 response
  imageUrl: string;
  rate?: number; // Only in all favorites response
  description?: string; // Only in all favorites response
  // Frontend-only fields for UI
  likes?: number;
  isFavorited?: boolean;
}

export interface FavoriteListResponse {
  status: string;
  data: Favorite[];
  message?: string;
}

// Add Favorite Types - dishId required, restaurantId optional
export interface AddFavoriteRequest {
  dishId: number; // Required
  restaurantId?: number | null; // Optional - can be null
}

export interface FavoriteResponse {
  status: string;
  message: string;
}

// Delete Favorite Types - supports multiple parameter combinations
export interface DeleteFavoriteRequest {
  favoriteId?: number | null; // When deleting from favorites list page
  dishId?: number | null; // When deleting from dish detail or ranking page
  restaurantId?: number | null; // When deleting from dish detail page (with dishId)
}

// Update User Types
export interface UpdateUserRequest {
  fullname: string | null;
  national: string | null;
  avatar: string | null;
  email: string | null;
}

export interface UpdateUserResponse {
  message: string;
}

// Update Password Types
export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdatePasswordResponse {
  message: string;
}

// Restaurant Types
export interface Restaurant {
  id: number;
  name: string;
  imageUrl: string;
  address: string | null;
  // Optional coordinates (if backend provides them later)
  lat?: number | null;
  lng?: number | null;
  phone: string | null;
  openTime: string | null;
  closeTime: string | null;
  description: string | null;
  distance: number;
  minprice: number;
  maxprice: number;
  rate: number;
  review?: string | null;
}

export interface RestaurantListResponse {
  status: string;
  data: Restaurant[];
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  message?: string;
}

export interface RestaurantDetailResponse {
  status: string;
  data: Restaurant;
  message?: string;
}

// Dish Restaurant Association Types (for recommended dishes)
export interface DishRestaurant {
  id: number;
  dishesname: string;
  restaurantname: string;
  restaurantId?: number;
  restaurantAddress?: string | null;
  distance: number;
  imageUrl: string;
}

export interface DishRestaurantListResponse {
  status: string;
  data: DishRestaurant[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  message?: string;
}

// Restaurant Dishes Types (for restaurant detail page)
export interface DishByRestaurant {
  id: number;
  name: string;
  imageUrl: string;
  description?: string | null;
  likes?: number;
}

export interface DishByRestaurantListResponse {
  status: string;
  data: (DishByRestaurant | null)[];
  message?: string;
}

// Dish Restaurant Detail Types (for dish detail page)
export interface DishRestaurantDetail {
  countLike: number;
  description: string;
  dishId: number;
  dishImages: string | null;
  dishesname: string;
  distance: number;
  id: number;
  imageUrlDish: string;
  imageUrlRestaurant: string;
  ingredients: string;
  price: number;
  restaurantId: number;
  restaurantname: string;
}

export interface DishRestaurantDetailResponse {
  status: string;
  data: DishRestaurantDetail;
  message?: string;
}

// Restaurant By Dish Types (for dish detail page)
export interface RestaurantByDish {
  imageUrl: string;
  restaurantId: number;
  restaurantName: string;
}

export interface RestaurantByDishListResponse {
  status: string;
  data: RestaurantByDish[];
  message?: string;
}

// Related Dishes Types (dishes with same ingredients)
export interface RelatedDish {
  id: number;
  name: string;
  imageUrl: string;
}

export interface RelatedDishListResponse {
  status: string;
  data: RelatedDish[];
  message?: string;
}

// Dish Review Types
export interface DishReview {
  avatar: string | null;
  comment: string;
  date: string;
  dishReviewId: number;
  dishesName: string;
  fullName: string;
  national?: string | null;
  rate: number;
  userId: number;
}

export interface DishReviewListResponse {
  status: string;
  data: DishReview[];
  message?: string;
}

export interface AddDishReviewRequest {
  dishId: number;
  rating: number;
  comment: string;
}

export interface AddDishReviewResponse {
  status: string;
  message: string;
}

export interface AddRestaurantReviewRequest {
  restaurantId: number;
  rating: number;
  comment: string;
}

export interface AddRestaurantReviewResponse {
  status: string;
  message: string;
}

export interface RestaurantReview {
  avatar: string | null;
  comment: string;
  date: string;
  fullName: string;
  national?: string | null;
  rating: number;
  restaurantName: string;
  restaurantReviewId: number;
  userId: number;
}

export interface UpdateDishReviewRequest {
  id: number;
  rating: number;
  comment: string;
}

export interface UpdateDishReviewResponse {
  status: string;
  message: string;
}

export interface DeleteDishReviewResponse {
  status: string;
  message: string;
}

export interface UpdateRestaurantReviewRequest {
  id: number;
  rating: number;
  comment: string;
}

export interface UpdateRestaurantReviewResponse {
  status: string;
  message: string;
}

export interface DeleteRestaurantReviewResponse {
  status: string;
  message: string;
}

export interface RestaurantReviewListResponse {
  status: string;
  data: RestaurantReview[];
  message?: string;
}

// Search Types
export interface SearchDishResult {
  dishName: string;
  dishRestaurantId: number;
  imageUrl: string;
  price: number;
  rating: number;
  restaurantName: string;
}

export interface SearchResponse {
  totalItems: number;
  data: SearchDishResult[];
  totalPages: number;
  currentPage: number;
  status: string;
  message?: string;
}

// Categorized Search Types
export interface RestaurantSearchResult {
  restaurantId: number;
  restaurantName: string;
  address: string;
  distance: number;
  imageUrl: string;
  minPrice: number;
  maxPrice: number;
}

export interface CategorizedSearchData {
  restaurants: RestaurantSearchResult[];
  dishesByName: SearchDishResult[];
  dishesByIngredients: SearchDishResult[];
}

export interface CategorizedSearchResponse {
  status: string;
  data: CategorizedSearchData;
  message?: string;
}
