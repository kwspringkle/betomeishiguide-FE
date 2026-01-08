"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, MessageCircle, ChevronLeft } from "lucide-react"
import { TopHeader } from "@/components/TopHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AISupportModal } from "@/components/AISupportModal"
import { dishApi, favoriteApi } from "@/api/api"
import type { Dish } from "@/api/types"
import { toast } from "sonner"
import { emitFavoritesChanged, useFavoritesChanged } from "@/lib/favoritesSync"

interface RankingItem {
  id: string
  name: string
  description: string
  image: string
  likeCount: number
  address?: string
  type: "dish" | "restaurant"
}

const mockDishRankings: RankingItem[] = [
  {
    id: "1",
    name: "料理1",
    description: "新鮮な材料を使った伝統的なベトナム料理。香り豊かで、ボリュームたっぷりです。",
    image: "/pho-noodle-soup-authentic-vietnamese.jpg",
    likeCount: 363636,
    type: "dish",
  },
  {
    id: "2",
    name: "料理2",
    description: "サクサクのパンと新鮮な具材が絶妙なハーモニーを奏でる一品。",
    image: "/banh-mi-vietnamese-sandwich.jpg",
    likeCount: 183618,
    type: "dish",
  },
  {
    id: "3",
    name: "料理3",
    description: "春巻きのサクサクとした食感と、中身のジューシーさが魅力です。",
    image: "/spring-rolls-fresh-vietnamese.jpg",
    likeCount: 181818,
    type: "dish",
  },
  {
    id: "4",
    name: "料理4",
    description: "本格的なベトナムの味を楽しめる、こだわりの一品です。",
    image: "/vietnamese-food-table-spread.jpg",
    likeCount: 120000,
    type: "dish",
  },
  {
    id: "5",
    name: "料理5",
    description: "スパイシーな味わいが特徴的な、ベトナムの人気料理です。",
    image: "/authentic-vietnamese-pho-restaurant-with-vibrant-c.jpg",
    likeCount: 95000,
    type: "dish",
  },
  {
    id: "6",
    name: "料理6",
    description: "ヘルシーで栄養満点、毎日食べても飽きない味です。",
    image: "/pho-noodle-soup-authentic-vietnamese.jpg",
    likeCount: 85000,
    type: "dish",
  },
  {
    id: "7",
    name: "料理7",
    description: "伝統的なレシピを守りながら、現代的なアレンジも加えた一品。",
    image: "/banh-mi-vietnamese-sandwich.jpg",
    likeCount: 75000,
    type: "dish",
  },
  {
    id: "8",
    name: "料理8",
    description: "見た目も美しく、味も絶品のベトナム料理です。",
    image: "/spring-rolls-fresh-vietnamese.jpg",
    likeCount: 65000,
    type: "dish",
  },
  {
    id: "9",
    name: "料理9",
    description: "本場の味を再現した、こだわりのベトナム料理。",
    image: "/vietnamese-food-table-spread.jpg",
    likeCount: 55000,
    type: "dish",
  },
  {
    id: "10",
    name: "料理10",
    description: "新鮮な食材と丁寧な調理で作られた、心温まる一品です。",
    image: "/authentic-vietnamese-pho-restaurant-with-vibrant-c.jpg",
    likeCount: 45000,
    type: "dish",
  },
]

const mockRestaurantRankings: RankingItem[] = [
  {
    id: "1",
    name: "レストランA",
    description: "本格的なベトナム料理を提供する人気レストラン。",
    image: "/pho-noodle-soup-authentic-vietnamese.jpg",
    likeCount: 250000,
    address: "123 ベトナム通り, ホーチミン市",
    type: "restaurant",
  },
  {
    id: "2",
    name: "レストランB",
    description: "新鮮な食材と伝統的な味を大切にするレストラン。",
    image: "/banh-mi-vietnamese-sandwich.jpg",
    likeCount: 200000,
    address: "456 ベトナム通り, ホーチミン市",
    type: "restaurant",
  },
  {
    id: "3",
    name: "レストランC",
    description: "モダンな雰囲気でベトナム料理を楽しめるお店。",
    image: "/spring-rolls-fresh-vietnamese.jpg",
    likeCount: 180000,
    address: "789 ベトナム通り, ホーチミン市",
    type: "restaurant",
  },
  {
    id: "4",
    name: "レストランD",
    description: "家族連れにもおすすめの、温かみのあるレストラン。",
    image: "/vietnamese-food-table-spread.jpg",
    likeCount: 150000,
    address: "321 ベトナム通り, ホーチミン市",
    type: "restaurant",
  },
  {
    id: "5",
    name: "レストランE",
    description: "本場の味を再現した、こだわりのレストランです。",
    image: "/authentic-vietnamese-pho-restaurant-with-vibrant-c.jpg",
    likeCount: 120000,
    address: "654 ベトナム通り, ホーチミン市",
    type: "restaurant",
  },
]

type RankingType = "dish" | "restaurant"

export function RankingPage() {
  const router = useRouter()
  const [rankingType, setRankingType] = useState<RankingType>("dish")
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const [dishRankings, setDishRankings] = useState<RankingItem[]>([])
  const [loadingDishes, setLoadingDishes] = useState(true)
  const [favoriteDishNames, setFavoriteDishNames] = useState<Set<string>>(new Set())
  const [favoriteIdMap, setFavoriteIdMap] = useState<Map<string, number>>(new Map()) // Map dish name to favoriteId
  const [isLiking, setIsLiking] = useState(false) // Prevent double clicks on like button

  const availableImages = [
    "/pho-noodle-soup-authentic-vietnamese.jpg",
    "/banh-mi-vietnamese-sandwich.jpg",
    "/spring-rolls-fresh-vietnamese.jpg",
    "/vietnamese-food-table-spread.jpg",
    "/authentic-vietnamese-pho-restaurant-with-vibrant-c.jpg"
  ]

  const getImageUrl = (imageUrl: string) => {
    // If external image fails, return random local image
    if (!imageUrl || imageUrl.includes('example.com')) {
      return availableImages[Math.floor(Math.random() * availableImages.length)]
    }
    return imageUrl
  }

  // Function to fetch dish rankings from API
  const fetchDishRankings = async () => {
    try {
      setLoadingDishes(true)
      const result = await dishApi.getAllFamousDishes()
      if (result.status === 'success' && result.data) {
        // Convert API data to RankingItem format
        const rankings: RankingItem[] = result.data
          .sort((a, b) => b.likes - a.likes) // Sort by likes descending
          .map(dish => ({
            id: dish.id.toString(),
            name: dish.name,
            description: dish.description,
            image: dish.imageUrl,
            likeCount: dish.likes,
            type: "dish" as const
          }))
        setDishRankings(rankings)
      }
    } catch (error) {
      console.error('Error fetching dish rankings:', error)
    } finally {
      setLoadingDishes(false)
    }
  }

  // Fetch dish rankings on mount
  useEffect(() => {
    fetchDishRankings()
  }, [])

  const refreshFavorites = async () => {
    try {
      const result = await favoriteApi.getAllFavorites()
      if (result.status === 'success' && result.data) {
        // Create a set of favorite dish names for quick lookup
        const favoriteNames = new Set(result.data.map(fav => fav.dishesname))
        setFavoriteDishNames(favoriteNames)

        // Create a map of dish name to favoriteId for deletion
        const idMap = new Map<string, number>()
        result.data.forEach(fav => {
          idMap.set(fav.dishesname, fav.id)
        })
        setFavoriteIdMap(idMap)

        // Also update likedItems based on dish IDs that match
        const likedIds = new Set<string>()
        dishRankings.forEach(dish => {
          if (favoriteNames.has(dish.name)) {
            likedIds.add(dish.id)
          }
        })
        setLikedItems(likedIds)
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  // Fetch user's favorites to check which dishes are already favorited
  useEffect(() => {
    refreshFavorites()
  }, [dishRankings])

  useFavoritesChanged(() => {
    refreshFavorites()
  })

  const currentRankings = rankingType === "dish" ? dishRankings : mockRestaurantRankings

  const handleLike = async (id: string, currentCount: number) => {
    // Prevent double clicks
    if (isLiking) return
    setIsLiking(true)
    
    try {
      const dishName = dishRankings.find(d => d.id === id)?.name || ''
      
      // Check if already liked - remove from favorites
      if (likedItems.has(id) || favoriteDishNames.has(dishName)) {
        // Use dishId for ranking page deletion
        const dishId = parseInt(id)
        let result: any = null
        try {
          result = await favoriteApi.removeFavorite({ dishId: dishId })
        } catch {
          // fallback below
        }

        // Fallback: delete by favoriteId if available
        if (!result || result.status !== 'success') {
          const favoriteId = favoriteIdMap.get(dishName)
          if (typeof favoriteId === 'number') {
            try {
              result = await favoriteApi.removeFavorite({ favoriteId })
            } catch {
              // keep failure
            }
          }
        }
        
        if (result.status === 'success') {
          setLikedItems((prev) => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
          // Remove from favoriteDishNames
          setFavoriteDishNames((prev) => {
            const newSet = new Set(prev)
            newSet.delete(dishName)
            return newSet
          })
          // Remove from favoriteIdMap
          setFavoriteIdMap((prev) => {
            const newMap = new Map(prev)
            newMap.delete(dishName)
            return newMap
          })
          toast.success("お気に入りから削除しました")
          emitFavoritesChanged()
          // Refresh ranking list from API
          await fetchDishRankings()
        } else {
          toast.error(result.message || "お気に入りから削除できませんでした")
        }
        return
      }

      // Add to favorites via API
      const dishId = parseInt(id)
      const result = await favoriteApi.addFavorite({
        dishId: dishId,
        restaurantId: null  // Ranking page only has dishId, no restaurantId
      })

      if (result.status === 'success') {
        setLikedItems((prev) => {
          const newSet = new Set(prev)
          newSet.add(id)
          return newSet
        })
        toast.success("お気に入りに追加しました")
        emitFavoritesChanged()
        // Refresh ranking list from API
        await fetchDishRankings()
      } else if (result.status === 'info') {
        toast.info("すでにお気に入りに追加されています")
        setLikedItems((prev) => {
          const newSet = new Set(prev)
          newSet.add(id)
          return newSet
        })
      } else {
        toast.error(result.message || "お気に入りに追加できませんでした")
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error)
      if (error.message && error.message.includes('already exists')) {
        toast.info("すでにお気に入りに追加されています")
      } else {
        toast.error("操作に失敗しました")
      }
    } finally {
      setIsLiking(false)
    }
  }

  const handleViewDetails = (item: RankingItem) => {
    if (item.type === "dish") {
      router.push(`/dish/${item.id}`)
    } else {
      router.push(`/restaurant/${item.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Back Button */}
        <section className="mb-6">
          <Link href="/homepage">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={18} />
              <span>戻る</span>
            </Button>
          </Link>
        </section>

        {/* Section 1: ページタイトル - Page Title */}
        <section className="mb-8">
          <h1 className="text-4xl font-bold text-foreground text-center">
            {rankingType === "dish" ? "人気料理ランキング" : "人気レストランランキング"}
          </h1>
        </section>

        {/* Tabs for switching between Dish and Restaurant rankings */}
        {/* <section className="mb-8">
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setRankingType("dish")}
              className={`rounded-full px-8 py-6 text-base font-medium transition-colors duration-200 ${
                rankingType === "dish"
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              料理ランキング
            </Button>
            <Button
              onClick={() => setRankingType("restaurant")}
              className={`rounded-full px-8 py-6 text-base font-medium transition-colors duration-200 ${
                rankingType === "restaurant"
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              レストランランキング
            </Button>
          </div>
        </section> */}

        {/* Section 2: ランキング一覧 - Ranking List */}
        <section className="mb-8">
          {loadingDishes && rankingType === "dish" ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          ) : currentRankings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {rankingType === "dish" ? "料理のランキングはまだありません" : "レストランのランキングはまだありません"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentRankings.map((item, index) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-primary"
                >
                  <CardContent className="p-6">
                    <div className="flex gap-6 items-center">
                      {/* Rank Number */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                          {index + 1}
                        </div>
                      </div>

                      {/* Section 3: 料理画像 - Dish Image */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = availableImages[0]
                            }}
                          />
                        </div>
                      </div>

                      {/* Section 4: 料理名と説明 - Dish Name and Description */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-foreground mb-2">{item.name}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                          {item.description}
                        </p>
                        {item.address && (
                          <p className="text-xs text-muted-foreground">{item.address}</p>
                        )}
                      </div>

                      {/* Section 5: いいね数 - Like Count */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-3">
                        <button
                          onClick={() => handleLike(item.id, item.likeCount)}
                          disabled={isLiking}
                          className={`p-2 hover:bg-muted rounded-lg transition-colors ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                          aria-label="Like"
                        >
                          <Heart
                            size={24}
                            className={`transition-all ${
                              likedItems.has(item.id) || favoriteDishNames.has(item.name)
                                ? "fill-red-500 text-red-500"
                                : "text-red-500"
                            } ${isLiking ? 'animate-pulse' : ''}`}
                          />
                        </button>
                        <span className="text-lg font-semibold text-foreground">
                          {item.likeCount.toLocaleString()}
                        </span>
                      </div>

                      {/* View Details Button */}
                      <div className="flex-shrink-0">
                        <Button
                          onClick={() => handleViewDetails(item)}
                          className="rounded-full px-8 py-6 text-base font-medium bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer transition-colors duration-200"
                        >
                          詳細を見る
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Section 6: 料理紹介サポート - AI Support Chat Bubble */}
      <button
        onClick={() => setShowSupportModal(!showSupportModal)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 z-30"
        aria-label="AI food recommendation support"
      >
        <MessageCircle className="w-8 h-8 text-white" />
      </button>

      {/* AI Support Modal */}
      <AISupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(!showSupportModal)}
      />
    </div>
  )
}

