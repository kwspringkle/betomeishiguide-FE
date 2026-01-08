"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, ChevronRight, Star, MessageCircle, ChevronLeft, Send, Pencil, Trash2, Check, X } from "lucide-react"
import { TopHeader } from "@/components/TopHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CustomInput } from "@/components/ui/custom-input"
import { AISupportModal } from "@/components/AISupportModal"
import { restaurantApi } from "@/api/api"
import type { RestaurantReview } from "@/api/types"
import { toast } from "sonner"
import { getCurrentUserId } from "@/lib/userScope"

interface RestaurantReviewsPageProps {
  restaurantId?: number
}

interface MockRestaurantReview {
  id: string
  name: string
  image: string
  rating: {
    all: number
    five: number
    four: number
    three: number
    oneTwo: number
  }
  averageRating: number
}

const mockRestaurants: MockRestaurantReview[] = [
  {
    id: "1",
    name: "名前のレストラン",
    image: "/pho-noodle-soup-authentic-vietnamese.jpg",
    rating: {
      all: 120,
      five: 45,
      four: 35,
      three: 25,
      oneTwo: 15,
    },
    averageRating: 4.2,
  },
  {
    id: "2",
    name: "名前のレストラン2",
    image: "/banh-mi-vietnamese-sandwich.jpg",
    rating: {
      all: 98,
      five: 40,
      four: 30,
      three: 20,
      oneTwo: 8,
    },
    averageRating: 4.5,
  },
  {
    id: "3",
    name: "名前のレストラン3",
    image: "/spring-rolls-fresh-vietnamese.jpg",
    rating: {
      all: 85,
      five: 35,
      four: 28,
      three: 15,
      oneTwo: 7,
    },
    averageRating: 4.3,
  },
  {
    id: "4",
    name: "名前のレストラン4",
    image: "/vietnamese-food-table-spread.jpg",
    rating: {
      all: 110,
      five: 50,
      four: 35,
      three: 20,
      oneTwo: 5,
    },
    averageRating: 4.6,
  },
  {
    id: "5",
    name: "名前のレストラン5",
    image: "/authentic-vietnamese-pho-restaurant-with-vibrant-c.jpg",
    rating: {
      all: 75,
      five: 30,
      four: 25,
      three: 15,
      oneTwo: 5,
    },
    averageRating: 4.1,
  },
  {
    id: "6",
    name: "名前のレストラン6",
    image: "/pho-noodle-soup-authentic-vietnamese.jpg",
    rating: {
      all: 95,
      five: 38,
      four: 32,
      three: 18,
      oneTwo: 7,
    },
    averageRating: 4.4,
  },
]

type SortOption = "rating" | "name" | "reviews"
type FilterOption = "all" | "5" | "4" | "3" | "1-2"

export function RestaurantReviewsPage({ restaurantId }: RestaurantReviewsPageProps) {
  const router = useRouter()
  const filterMenuRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("rating")
  const [filterOption, setFilterOption] = useState<FilterOption>("all")
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)

  const [nationalFilter, setNationalFilter] = useState<"ALL" | "日本" | "ベトナム">("ALL")
  const [mineOnly, setMineOnly] = useState(false)
  const currentUserId = getCurrentUserId()

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null)
  const [editRating, setEditRating] = useState<number>(5)
  const [editComment, setEditComment] = useState("")
  const [isMutating, setIsMutating] = useState(false)

  const normalizeNational = (value?: string | null): "日本" | "ベトナム" | null => {
    const v = (value ?? "").trim()
    if (!v) return null
    if (v === "日本" || v.includes("日本")) return "日本"
    const lower = v.toLowerCase()
    const lowerAscii = v
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    if (
      v === "ベトナム" ||
      v.includes("ベトナム") ||
      lower.includes("vietnam") ||
      lowerAscii.includes("vietnam") ||
      lowerAscii.includes("viet nam") ||
      lowerAscii === "vn"
    ) {
      return "ベトナム"
    }
    return null
  }

  const getDisplayNational = (value?: string | null): string | null => {
    const raw = (value ?? "").trim()
    if (!raw) return null
    return normalizeNational(raw) ?? raw
  }

  // Review form states
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Real reviews state (when restaurantId is provided)
  const [reviews, setReviews] = useState<RestaurantReview[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(10)

  useEffect(() => {
    setDisplayedCount(10)
  }, [nationalFilter, mineOnly])

  // Fetch reviews if restaurantId is provided
  useEffect(() => {
    if (restaurantId) {
      fetchReviews()
    }
  }, [restaurantId])

  const fetchReviews = async () => {
    if (!restaurantId) return
    try {
      setLoadingReviews(true)
      const response = await restaurantApi.getRestaurantReviews(restaurantId)
      if (response.data) {
        setReviews(response.data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('レビューの取得に失敗しました')
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId) {
      toast.error('レストランが選択されていません')
      return
    }
    if (!comment.trim()) {
      toast.error('コメントを入力してください')
      return
    }

    try {
      setIsSubmittingReview(true)
      await restaurantApi.addRestaurantReview({
        restaurantId,
        rating,
        comment: comment.trim(),
      })
      toast.success('レビューが投稿されました')
      setComment('')
      setRating(5)
      // Refresh reviews
      await fetchReviews()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('レビューの投稿に失敗しました')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleLoadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + 10, filteredAndSortedReviews.length))
  }

  const startEdit = (review: RestaurantReview) => {
    setEditingReviewId(review.restaurantReviewId)
    setEditRating(Math.round(review.rating) || 5)
    setEditComment(review.comment ?? "")
  }

  const cancelEdit = () => {
    setEditingReviewId(null)
    setEditRating(5)
    setEditComment("")
  }

  const saveEdit = async () => {
    if (editingReviewId == null) return
    if (!editComment.trim()) {
      toast.error('コメントを入力してください')
      return
    }

    try {
      setIsMutating(true)
      await restaurantApi.updateRestaurantReview({
        id: editingReviewId,
        rating: editRating,
        comment: editComment.trim(),
      })
      toast.success('レビューを更新しました')
      await fetchReviews()
      cancelEdit()
    } catch (error) {
      console.error('Error updating review:', error)
      toast.error('レビューの更新に失敗しました')
    } finally {
      setIsMutating(false)
    }
  }

  const deleteReview = async (restaurantReviewId: number) => {
    if (!confirm('このレビューを削除しますか？')) return
    try {
      setIsMutating(true)
      await restaurantApi.deleteRestaurantReview(restaurantReviewId)
      toast.success('レビューを削除しました')
      await fetchReviews()
      if (editingReviewId === restaurantReviewId) cancelEdit()
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('レビューの削除に失敗しました')
    } finally {
      setIsMutating(false)
    }
  }

  const filteredAndSortedReviews = reviews
    .filter((review) => {
      if (nationalFilter === "ALL") return true
      return normalizeNational(review.national) === nationalFilter
    })
    .filter((review) => {
      if (!mineOnly) return true
      if (!currentUserId) return false
      return review.userId === currentUserId
    })
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false)
      }
    }
    if (showFilterMenu) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showFilterMenu])

  // If restaurantId is provided, show reviews view; otherwise show mock restaurants list
  if (restaurantId) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeader />

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <section className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={18} />
              <span>戻る</span>
            </Button>
          </section>

          {/* Page Title */}
          <section className="mb-8">
            <h1 className="text-3xl font-bold text-foreground text-center">
              レストランレビュー
            </h1>
          </section>

          {/* Filter */}
          <section className="mb-4">
            <div className="flex items-center justify-end gap-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={mineOnly}
                  onChange={(e) => setMineOnly(e.target.checked)}
                  className="h-4 w-4"
                  aria-label="自分のレビューのみ表示"
                  disabled={!currentUserId}
                />
                自分のレビュー
              </label>

              <label className="text-sm text-muted-foreground">国籍</label>
              <select
                value={nationalFilter}
                onChange={(e) => setNationalFilter(e.target.value as "ALL" | "日本" | "ベトナム")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                aria-label="国籍でフィルター"
              >
                <option value="ALL">すべて</option>
                <option value="日本">日本</option>
                <option value="ベトナム">ベトナム</option>
              </select>
            </div>
          </section>

          {/* Add Review Form */}
          <section className="mb-8">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">レビューを追加</h2>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Rating Section */}
                  <div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          disabled={isSubmittingReview}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={
                              star <= rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground"
                            }
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-lg font-semibold text-foreground">{rating}.0</span>
                    </div>
                  </div>

                  {/* Comment Section */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      コメント
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="レビューコメントを入力してください..."
                      className="w-full p-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={4}
                      disabled={isSubmittingReview}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmittingReview || !comment.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 flex items-center gap-2"
                    >
                      <Send size={18} />
                      {isSubmittingReview ? '送信中...' : '送信'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Reviews List */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">レビュー一覧</h2>
            {loadingReviews ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredAndSortedReviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">レビューがありません</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredAndSortedReviews.slice(0, displayedCount).map((review) => {
                  const isMine = !!currentUserId && review.userId === currentUserId
                  const isEditing = editingReviewId === review.restaurantReviewId

                  return (
                    <Card
                      key={review.restaurantReviewId}
                      className="border-l-4 border-l-primary hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                      {/* Review Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          {review.avatar ? (
                            <img
                              src={review.avatar}
                              alt={review.fullName}
                              className="w-14 h-14 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-semibold text-lg ${
                              review.avatar ? 'hidden' : ''
                            }`}
                          >
                            {review.fullName.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground">{review.fullName}</p>
                                {(() => {
                                  const displayNational = getDisplayNational(review.national)
                                  return displayNational ? (
                                    <span className="text-xs text-muted-foreground">({displayNational})</span>
                                  ) : null
                                })()}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(review.date).toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={18}
                                    className={
                                      i < Math.floor(review.rating)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-muted-foreground'
                                    }
                                  />
                                ))}
                                <span className="text-sm font-medium text-foreground ml-2">
                                  {review.rating.toFixed(1)}
                                </span>
                              </div>

                              {isMine ? (
                                <div className="flex items-center gap-1">
                                  {isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={saveEdit}
                                        disabled={isMutating}
                                        className="p-1.5 rounded-md hover:bg-muted disabled:opacity-50"
                                        aria-label="保存"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelEdit}
                                        disabled={isMutating}
                                        className="p-1.5 rounded-md hover:bg-muted disabled:opacity-50"
                                        aria-label="キャンセル"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => startEdit(review)}
                                      disabled={isMutating}
                                      className="p-1.5 rounded-md hover:bg-muted disabled:opacity-50"
                                      aria-label="編集"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => deleteReview(review.restaurantReviewId)}
                                    disabled={isMutating}
                                    className="p-1.5 rounded-md hover:bg-muted disabled:opacity-50"
                                    aria-label="削除"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Review Comment */}
                      {isEditing ? (
                        <div className="space-y-3 pl-18">
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditRating(star)}
                                disabled={isMutating}
                                className="transition-transform hover:scale-110 disabled:opacity-50"
                                aria-label={`評価 ${star}`}
                              >
                                <Star
                                  size={22}
                                  className={
                                    star <= editRating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground"
                                  }
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm font-semibold text-foreground">{editRating}.0</span>
                          </div>
                          <textarea
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            rows={3}
                            disabled={isMutating}
                            className="w-full p-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-foreground mb-4 text-pretty leading-relaxed pl-18">
                          {review.comment}
                        </p>
                      )}
                      </CardContent>
                    </Card>
                  )
                })}

                {/* Load More Button */}
                {displayedCount < filteredAndSortedReviews.length && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={handleLoadMore}
                      size="lg"
                      className="rounded-full px-8 py-6 text-base font-medium bg-yellow-500 hover:bg-yellow-600 text-white transition-colors duration-200"
                    >
                      もっと見る ({filteredAndSortedReviews.length - displayedCount}件)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>

        {/* AI Support Chat Bubble */}
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

  // Mock restaurants view

  // Filter và sort restaurants
  const filteredAndSortedRestaurants = useMemo(() => {
    let filtered = [...mockRestaurants]

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    }

    // Filter by rating
    if (filterOption !== "all") {
      filtered = filtered.filter((restaurant) => {
        switch (filterOption) {
          case "5":
            return restaurant.rating.five > 0
          case "4":
            return restaurant.rating.four > 0
          case "3":
            return restaurant.rating.three > 0
          case "1-2":
            return restaurant.rating.oneTwo > 0
          default:
            return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "rating":
          return b.averageRating - a.averageRating
        case "name":
          return a.name.localeCompare(b.name)
        case "reviews":
          return b.rating.all - a.rating.all
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, sortOption, filterOption])

  const handleViewDetails = (restaurantId: string) => {
    router.push(`/restaurant/${restaurantId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <TopHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
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

        {/* Page Title */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-foreground text-center mb-8">
            レストランレビュー一覧
          </h1>
        </section>

        {/* Search Bar */}
        <section className="mb-6">
          <div className="relative max-w-2xl mx-auto">
            <CustomInput
              type="text"
              placeholder="料理名を入力してレビューを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </section>

        {/* Sort and Filter Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="relative" ref={filterMenuRef}>
              <Button
                variant="outline"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2"
              >
                <span>詳細</span>
                <ChevronRight className="w-4 h-4" />
              </Button>

              {showFilterMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-background border rounded-lg shadow-lg z-10 p-4">
                  <div className="space-y-4">
                    {/* Sort Options */}
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">並び替え</p>
                      <div className="space-y-2">
                        {[
                          { value: "rating", label: "評価順" },
                          { value: "name", label: "名前順" },
                          { value: "reviews", label: "レビュー数順" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortOption(option.value as SortOption)
                              setShowFilterMenu(false)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              sortOption === option.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80 text-foreground"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filter Options */}
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">フィルター</p>
                      <div className="space-y-2">
                        {[
                          { value: "all", label: "All" },
                          { value: "5", label: "5" },
                          { value: "4", label: "4+" },
                          { value: "3", label: "3+" },
                          { value: "1-2", label: "1-2" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setFilterOption(option.value as FilterOption)
                              setShowFilterMenu(false)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              filterOption === option.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80 text-foreground"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {filteredAndSortedRestaurants.length}件のレストランが見つかりました
            </p>
          </div>
        </section>

        {/* Restaurant Reviews Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAndSortedRestaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-0">
                  <div className="flex gap-4 p-6">
                    {/* Restaurant Image */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary">
                        <Image
                          src={restaurant.image || "/placeholder.svg"}
                          alt={restaurant.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Restaurant Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2 truncate">
                          {restaurant.name}
                        </h3>

                        {/* Rating Display */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium text-foreground">
                              {restaurant.averageRating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            (All / {restaurant.rating.five} / {restaurant.rating.four}+ /{" "}
                            {restaurant.rating.three}+ / {restaurant.rating.oneTwo})
                          </span>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <Button
                        onClick={() => handleViewDetails(restaurant.id)}
                        className="rounded-full px-8 py-6 text-base font-medium bg-blue-600 hover:bg-amber-500 text-white cursor-pointer transition-colors duration-200 w-full sm:w-auto"
                      >
                        詳細を見る
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredAndSortedRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">検索結果が見つかりませんでした</p>
            </div>
          )}
        </section>
      </main>

      {/* AI Support Chat Bubble */}
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

