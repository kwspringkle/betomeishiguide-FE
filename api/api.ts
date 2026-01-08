import { API_BASE_URL, getAuthToken } from './config';
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  UserInfoResponse,
  ApiError,
  DishListResponse,
  FavoriteListResponse,
  AddFavoriteRequest,
  FavoriteResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  RestaurantListResponse,
  RestaurantDetailResponse,
  DishRestaurantListResponse,
  DishByRestaurantListResponse,
  DishRestaurantDetailResponse,
  RestaurantByDishListResponse,
  RelatedDishListResponse,
  DishReviewListResponse,
  AddDishReviewRequest,
  AddDishReviewResponse,
  UpdateDishReviewRequest,
  UpdateDishReviewResponse,
  DeleteDishReviewResponse,
  AddRestaurantReviewRequest,
  AddRestaurantReviewResponse,
  UpdateRestaurantReviewRequest,
  UpdateRestaurantReviewResponse,
  DeleteRestaurantReviewResponse,
  RestaurantReviewListResponse,
  SearchResponse,
  CategorizedSearchResponse,
} from './types';

/**
 * Generic API fetch function with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    console.log(`API Request: ${config.method || 'GET'} ${url}`);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        
        // Special case: Backend returns 404 for "No favourite items found" 
        // This should be treated as empty data, not an error
        if (response.status === 404 && 
            (errorMessage.includes('No favourite items found') || 
             errorData.message === 'No favourite items found')) {
          console.log('No favorites found - treating as empty result');
          return {
            status: 'success',
            data: [],
            message: 'No favorites found'
          } as T;
        }

        // Special case: Backend returns 404 for "No dishes found with same ingredients"
        // This should be treated as empty data, not an error
        if (response.status === 404 && 
            errorMessage.includes('No dishes found with same ingredients')) {
          console.log('No related dishes found - treating as empty result');
          return {
            status: 'success',
            data: [],
            message: 'No dishes found'
          } as T;
        }

        // Special case: Backend returns error for reviews not found
        // This should be treated as empty data, not an error
        if (errorMessage.includes('retrieving reviews') || 
            errorMessage.includes('No reviews found') ||
            (response.status === 404 && url.includes('Review'))) {
          console.log('No reviews found - treating as empty result');
          return {
            status: 'success',
            data: [],
            message: 'No reviews found'
          } as T;
        }

        // Special case: Backend returns error for search
        // This should be treated as empty data, not an error
        if (errorMessage.includes('searching') || 
            errorMessage.includes('No results found') ||
            (url.includes('search') && (response.status === 404 || response.status === 500))) {
          console.log('No search results found - treating as empty result');

          // /search-categorized expects an object with 3 arrays
          if (url.includes('/search-categorized')) {
            return {
              status: 'success',
              data: {
                restaurants: [],
                dishesByName: [],
                dishesByIngredients: [],
              },
              message: 'No results found'
            } as T;
          }

          // /search expects a paginated response shape
          if (url.includes('/search?')) {
            return {
              status: 'success',
              data: [],
              totalItems: 0,
              totalPages: 0,
              currentPage: 0,
              message: 'No results found'
            } as T;
          }

          // Fallback: treat as empty list
          return {
            status: 'success',
            data: [],
            message: 'No results found'
          } as T;
        }

        // Special case: Backend returns error for fetching dishes for restaurant
        // This should be treated as empty data, not an error
        if (errorMessage.includes('fetching dishes') || 
            errorMessage.includes('No dishes found') ||
            (url.includes('dish') && url.includes('restaurant') && (response.status === 404 || response.status === 500))) {
          console.log('No dishes found for restaurant - treating as empty result');
          return {
            status: 'success',
            data: [],
            message: 'No dishes found'
          } as T;
        }

        // Special case: Backend returns 400 for "already exist" in favorites
        // This should be treated as info, not an error
        if (response.status === 400 && 
            errorMessage.toLowerCase().includes('already exist')) {
          console.log('Item already in favorites - treating as success');
          return {
            status: 'info',
            message: 'Already in favorites'
          } as T;
        }

        // Special case: Backend returns 403 Forbidden (no access or not authenticated)
        // Return empty data to prevent page from breaking
        if (response.status === 403) {
          console.log('Access forbidden - treating as empty result');
          return {
            status: 'success',
            data: [],
            message: 'Access denied or not authenticated'
          } as T;
        }
      } catch (parseError) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        } catch (textError) {
          // Keep default error message
        }
      }
      
      // Only log non-auth errors (skip 401, 403 for cleaner console)
      if (response.status !== 401 && response.status !== 403) {
        console.error(`API Error: ${errorMessage}`, { url, status: response.status });
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`API Response: ${config.method || 'GET'} ${url}`, data);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      // Only log non-auth errors for cleaner console
      if (!error.message.includes('favourite') && !error.message.includes('favorite')) {
        console.error('API Error:', error.message, { url, options });
      }
      throw error;
    }
    throw new Error('Network error occurred');
  }
}

/**
 * Auth API Functions
 */
export const authApi = {
  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return apiFetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get current user info
   */
  getCurrentUser: async (): Promise<UserInfoResponse> => {
    return apiFetch<UserInfoResponse>('/me', {
      method: 'GET',
    });
  },

  /**
   * Update user profile information
   */
  updateUser: async (data: UpdateUserRequest): Promise<UpdateUserResponse> => {
    return apiFetch<UpdateUserResponse>('/updateUser', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update user password
   */
  updatePassword: async (data: UpdatePasswordRequest): Promise<UpdatePasswordResponse> => {
    return apiFetch<UpdatePasswordResponse>('/updatePassword', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Dish API Functions
 */
export const dishApi = {
  /**
   * Get famous dishes list (top 3 by rate)
   */
  getFamousDishes: async (): Promise<DishListResponse> => {
    return apiFetch<DishListResponse>('/disharmonious', {
      method: 'GET',
    });
  },

  /**
   * Get all famous dishes for ranking page
   */
  getAllFamousDishes: async (): Promise<DishListResponse> => {
    return apiFetch<DishListResponse>('/disharmonious-all', {
      method: 'GET',
    });
  },

  /**
   * Get all dish-restaurant associations with pagination
   * @param page - Page number (default: 1)
   * @param size - Number of items per page (default: 10)
   */
  getAllDishRestaurants: async (page: number = 1, size: number = 10): Promise<DishRestaurantListResponse> => {
    return apiFetch<DishRestaurantListResponse>(`/dish-restaurant-all?page=${page}&size=${size}`, {
      method: 'GET',
    });
  },

  /**
   * Get dish restaurant detail by ID
   * @param id - Dish-Restaurant association ID
   */
  getDishRestaurantDetail: async (id: number): Promise<DishRestaurantDetailResponse> => {
    return apiFetch<DishRestaurantDetailResponse>(`/dish-restaurant-detail?id=${id}`, {
      method: 'GET',
    });
  },

  /**
   * Get dish restaurant detail by dishId and restaurantId
   * Used when clicking a dish from restaurant detail page
   * @param dishId - Dish ID
   * @param restaurantId - Restaurant ID
   */
  getDishRestaurantDetailByDishAndRestaurant: async (dishId: number, restaurantId: number): Promise<DishRestaurantDetailResponse> => {
    return apiFetch<DishRestaurantDetailResponse>(`/dish-restaurant-detail-2?dishId=${dishId}&restaurantId=${restaurantId}`, {
      method: 'GET',
    });
  },

  /**
   * Get dishes with same ingredients
   * @param dishId - Dish ID
   */
  getDishesWithSameIngredients: async (dishId: number, restaurantId: number): Promise<RelatedDishListResponse> => {
    return apiFetch<RelatedDishListResponse>(`/dishWithSameIngredients?dishId=${dishId}&restaurantId=${restaurantId}`, {
      method: 'GET',
    });
  },

  /**
   * Get dish reviews
   * @param dishId - Dish ID
   */
  getDishReviews: async (dishId: number): Promise<DishReviewListResponse> => {
    return apiFetch<DishReviewListResponse>(`/dishReview?dishId=${dishId}`, {
      method: 'GET',
    });
  },

  /**
   * Add a dish review
   * @param request - Review request data
   */
  addDishReview: async (request: AddDishReviewRequest): Promise<AddDishReviewResponse> => {
    return apiFetch<AddDishReviewResponse>(`/dishReview`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Update a dish review (only owner can update)
   */
  updateDishReview: async (request: UpdateDishReviewRequest): Promise<UpdateDishReviewResponse> => {
    return apiFetch<UpdateDishReviewResponse>(`/dishReview`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * Delete a dish review (only owner can delete)
   */
  deleteDishReview: async (dishReviewId: number): Promise<DeleteDishReviewResponse> => {
    return apiFetch<DeleteDishReviewResponse>(`/dishReview?dishReviewId=${dishReviewId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Favorite API Functions
 */
export const favoriteApi = {
  /**
   * Get top 3 favorite dishes for current user
   */
  getTop3Favorites: async (): Promise<FavoriteListResponse> => {
    return apiFetch<FavoriteListResponse>('/favourite-top3', {
      method: 'GET',
    });
  },

  /**
   * Get all favorite dishes for current user
   */
  getAllFavorites: async (): Promise<FavoriteListResponse> => {
    return apiFetch<FavoriteListResponse>('/favourites', {
      method: 'GET',
    });
  },

  /**
   * Add item to favorites (dish or restaurant)
   */
  addFavorite: async (request: AddFavoriteRequest): Promise<FavoriteResponse> => {
    return apiFetch<FavoriteResponse>('/favourite', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Remove item from favorites
   * Supports multiple parameter combinations:
   * - favoriteId: When deleting from favorites list page
   * - dishId + restaurantId: When unliking from dish detail page
   * - dishId only: When unliking from ranking page
   */
  removeFavorite: async (params: {
    favoriteId?: number | null;
    dishId?: number | null;
    restaurantId?: number | null;
  }): Promise<FavoriteResponse> => {
    // Build request body with null for undefined values
    const requestBody = {
      favoriteId: params.favoriteId ?? null,
      dishId: params.dishId ?? null,
      restaurantId: params.restaurantId ?? null,
    };
    
    return apiFetch<FavoriteResponse>('/favourite', {
      method: 'DELETE',
      body: JSON.stringify(requestBody),
    });
  },
};

/**
 * Restaurant API Functions
 */
export const restaurantApi = {
  /**
   * Get nearby restaurants
   * @param page - Page number (default 1)
   */
  getNearbyRestaurants: async (page: number = 1): Promise<RestaurantListResponse> => {
    return apiFetch<RestaurantListResponse>(`/restaurant-recently?page=${page}`, {
      method: 'GET',
    });
  },

  /**
   * Get restaurant detail by ID
   * @param id - Restaurant ID
   */
  getRestaurantDetail: async (id: number): Promise<RestaurantDetailResponse> => {
    return apiFetch<RestaurantDetailResponse>(`/restaurant-detail?id=${id}`, {
      method: 'GET',
    });
  },

  /**
   * Get dishes by restaurant ID
   * @param restaurantId - Restaurant ID
   */
  getDishesByRestaurant: async (restaurantId: number): Promise<DishByRestaurantListResponse> => {
    return apiFetch<DishByRestaurantListResponse>(`/dish-restaurant?restaurantId=${restaurantId}`, {
      method: 'GET',
    });
  },

  /**
   * Get restaurants by dish ID
   * @param dishId - Dish ID
   * @param dishRestaurantId - Dish-Restaurant association ID
   */
  getRestaurantsByDish: async (dishId: number, dishRestaurantId: number): Promise<RestaurantByDishListResponse> => {
    return apiFetch<RestaurantByDishListResponse>(`/restaurant-by-dish?dishId=${dishId}&dishRestaurantId=${dishRestaurantId}`, {
      method: 'GET',
    });
  },

  /**
   * Add a restaurant review
   * @param request - Review request data
   */
  addRestaurantReview: async (request: AddRestaurantReviewRequest): Promise<AddRestaurantReviewResponse> => {
    return apiFetch<AddRestaurantReviewResponse>(`/restaurantReview`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get restaurant reviews
   * @param restaurantId - Restaurant ID
   */
  getRestaurantReviews: async (restaurantId: number): Promise<RestaurantReviewListResponse> => {
    return apiFetch<RestaurantReviewListResponse>(`/restaurantReview?restaurantId=${restaurantId}`, {
      method: 'GET',
    });
  },

  /**
   * Update a restaurant review (only owner can update)
   */
  updateRestaurantReview: async (request: UpdateRestaurantReviewRequest): Promise<UpdateRestaurantReviewResponse> => {
    return apiFetch<UpdateRestaurantReviewResponse>(`/restaurantReview`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * Delete a restaurant review (only owner can delete)
   */
  deleteRestaurantReview: async (restaurantReviewId: number): Promise<DeleteRestaurantReviewResponse> => {
    return apiFetch<DeleteRestaurantReviewResponse>(`/restaurantReview?restaurantReviewId=${restaurantReviewId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Search API Functions
 */
export const searchApi = {
  /**
   * Search dishes by keyword
   * @param keyword - Search keyword
   */
  searchDishes: async (keyword: string): Promise<SearchResponse> => {
    return apiFetch<SearchResponse>(`/search?keyword=${encodeURIComponent(keyword)}`, {
      method: 'GET',
    });
  },

  /**
   * Search with categorized results (restaurants, dishes by name, dishes by ingredients)
   * @param keyword - Search keyword
   */
  searchCategorized: async (keyword: string): Promise<CategorizedSearchResponse> => {
    return apiFetch<CategorizedSearchResponse>(`/search-categorized?keyword=${encodeURIComponent(keyword)}`, {
      method: 'GET',
    });
  },
};
