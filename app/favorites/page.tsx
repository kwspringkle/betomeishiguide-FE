"use client"

import { useState, useEffect } from "react"
import { Heart, MessageCircle } from "lucide-react"
import Link from "next/link"
import { TopHeader } from "@/components/TopHeader"
import { AISupportModal } from "@/components/AISupportModal"
import { favoriteApi } from "@/api/api"
import { toast } from "sonner"
import { emitFavoritesChanged, useFavoritesChanged } from "@/lib/favoritesSync"

interface FavoriteDish {
  id: number
  dishesname: string        // Backend uses "dishesname"
  restaurantname?: string   // Only in top3 response
  distance?: number         // Only in top3 response
  imageUrl: string
  rate?: number            // Only in all favorites response
  description?: string     // Only in all favorites response
  likes: number            // Frontend calculated
  isFavorited: boolean     // Frontend state
  originalLikes: number    // Store original count for undo functionality
  dishId?: number          // Original dish ID for re-adding to favorites
  restaurantId?: number    // Original restaurant ID for re-adding to favorites
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteDish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAISupportOpen, setIsAISupportOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const availableImages = [
    "/pho-noodle-soup-authentic-vietnamese.jpg",
    "/banh-mi-vietnamese-sandwich.jpg", 
    "/spring-rolls-fresh-vietnamese.jpg",
    "/authentic-vietnamese-pho-restaurant-with-vibrant-c.jpg",
    "/vietnamese-food-table-spread.jpg"
  ]

  const getRandomImage = () => {
    return availableImages[Math.floor(Math.random() * availableImages.length)]
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  useFavoritesChanged(() => {
    fetchFavorites()
  })



  const fetchFavorites = async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Use getAllFavorites to get the full favorites list
      const response = await favoriteApi.getAllFavorites()
      
      if (response.status === 'success') {
        if (response.data && response.data.length > 0) {
          // Process favorites data according to actual API structure
          const favoritesWithLikes = response.data.map((item: any) => {
            const likeCount = item.likes || 0; // Use likes from API directly
            return {
              ...item,
              description: item.description || `Delicious ${item.dishesname}`, // Use dishesname from API
              likes: likeCount,
              originalLikes: likeCount, // Store original for undo functionality
              isFavorited: true, // All items in favorites list start as favorited
              // For demo purposes, generate mock IDs (in real app, these would come from API)
              dishId: item.dishId || Math.floor(Math.random() * 100) + 1,
              restaurantId: item.restaurantId || Math.floor(Math.random() * 50) + 1
            };
          })
          // Filter out items that are marked for deletion
          .sort((a: any, b: any) => (b.likes || 0) - (a.likes || 0))
          
          setFavorites(favoritesWithLikes)
        } else {
          // Empty favorites list is not an error
          setFavorites([])
        }
      } else {
        setFavorites([])
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
      // Only set error for actual API failures, not empty results
      if (err instanceof Error && !err.message.includes('No favourite items found')) {
        setError('お気に入りの取得に失敗しました')
      }
      setFavorites([])
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFavorite = async (favoriteId: number) => {
    try {
      // Call DELETE API with favoriteId for favorites list page
      const result = await favoriteApi.removeFavorite({ favoriteId: favoriteId })
      
      if (result.status === 'success') {
        // Remove from local state
        setFavorites(prev => prev.filter(item => item.id !== favoriteId))
        toast.success('お気に入りから削除しました')
        emitFavoritesChanged()
      } else {
        toast.error(result.message || 'お気に入りの削除に失敗しました')
      }
    } catch (err) {
      console.error('Failed to delete favorite:', err)
      toast.error('お気に入りの削除に失敗しました')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeader />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopHeader />
      
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground text-center">
            お気に入り一覧
          </h1>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-center">{error}</p>
            <p className="text-red-500 text-sm text-center mt-2">
              APIサーバーが起動していることを確認してください (http://localhost:8081)
            </p>
            <div className="text-center mt-4">
              <button 
                onClick={fetchFavorites}
                className="text-red-600 hover:text-red-700 underline"
              >
                再試行
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && favorites.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-6">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                まだお気に入りの料理がありません
              </h2>
              <p className="text-muted-foreground mb-6">
                新しい料理を発見しましょう！
              </p>
              <Link 
                href="/homepage"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all font-medium"
              >
                ホームに戻る
              </Link>
            </div>
          </div>
        )}

        {/* Favorites List */}
        {favorites.length > 0 && (
          <>
            <div className="space-y-4">
              {favorites
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((dish, index) => {
                  // Calculate global rank (not just page-local index)
                  const globalRank = (currentPage - 1) * itemsPerPage + index + 1
                  console.log('DEBUG: globalRank =', globalRank, 'type:', typeof globalRank)
                  return (
                <div 
                  key={dish.id}
                  className="bg-white border border-slate-200 rounded-lg p-6 shadow-md hover:shadow-xl hover:shadow-yellow-500/50 transition-all"
                >
                  <div className="flex items-center gap-6">
                    {/* Ranking Number */}
                    <div className="flex-shrink-0">
                      <div 
                        className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-lg border-2 border-white shadow-lg"
                        style={{
                          fontFamily: 'monospace, Arial, sans-serif',
                          fontFeatureSettings: '"tnum"',
                          fontVariantNumeric: 'tabular-nums',
                          textTransform: 'none',
                          letterSpacing: '0',
                          wordSpacing: '0'
                        }}
                      >
                        <span style={{display: 'inline-block', minWidth: '1ch'}}>{String(globalRank).replace(/\D/g, '')}</span>
                      </div>
                    </div>

                  {/* Dish Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shadow-md">
                      {/* Use regular img tag for external URLs to avoid Next.js image domain issues */}
                      <img
                        src={dish.imageUrl || getRandomImage()}
                        alt={dish.dishesname}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = getRandomImage()
                        }}
                      />
                    </div>
                  </div>

                  {/* Dish Name and Description */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
                      {dish.dishesname}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      {dish.description}
                    </p>
                  </div>

                  {/* Heart Icon and Like Count */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => deleteFavorite(dish.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 hover:shadow-md cursor-pointer transition-all"
                      title="お気に入りから削除"
                    >
                      <Heart 
                        className="w-6 h-6 fill-red-500 text-red-500 hover:text-red-600 transition-colors"
                      />
                      <span className="font-semibold text-foreground min-w-[60px] text-right">
                        {dish.likes.toLocaleString()}
                      </span>
                    </button>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>

            {/* Pagination Controls */}
            {favorites.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                >
                  前へ
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.ceil(favorites.length / itemsPerPage) }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-lg'
                          : 'bg-white border border-slate-200 text-gray-600 hover:bg-yellow-50 hover:shadow-md'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(favorites.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(favorites.length / itemsPerPage)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                >
                  次へ
                </button>
              </div>
            )}

            {/* Page Info */}
            {favorites.length > itemsPerPage && (
              <div className="text-center text-sm text-muted-foreground mt-4">
                {Math.min((currentPage - 1) * itemsPerPage + 1, favorites.length)} - {Math.min(currentPage * itemsPerPage, favorites.length)} / {favorites.length} 件
              </div>
            )}
          </>
        )}
      </main>

      {/* AI Support Chat Bubble */}
      <button
        onClick={() => setIsAISupportOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 z-30"
        aria-label="AI料理紹介サポート"
      >
        <MessageCircle className="w-8 h-8 text-white" />
      </button>

      {/* AI Support Modal */}
      <AISupportModal 
        isOpen={isAISupportOpen}
        onClose={() => setIsAISupportOpen(false)}
      />
    </div>
  )
}