"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Star, MessageCircle, Send, Pencil, Trash2, Check, X } from "lucide-react"
import { TopHeader } from "@/components/TopHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AISupportModal } from "@/components/AISupportModal"
import { dishApi } from "@/api/api"
import type { DishReview } from "@/api/types"
import { toast } from "sonner"
import { getCurrentUserId } from "@/lib/userScope"

interface DishReviewsPageProps {
  dishId: string
}

export function DishReviewsPage({ dishId }: DishReviewsPageProps) {
  const router = useRouter()
  const [reviews, setReviews] = useState<DishReview[]>([])
  const [loading, setLoading] = useState(true)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(10)
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

  // Review form states
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Fetch reviews from API
  useEffect(() => {
    fetchReviews()
  }, [dishId])

  useEffect(() => {
    setDisplayedCount(10)
  }, [nationalFilter, mineOnly])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const result = await dishApi.getDishReviews(Number(dishId))
      if (result.status === 'success' && result.data) {
        setReviews(result.data)
      } else {
        toast.error('レビューの取得に失敗しました')
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
      toast.error('レビューの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      toast.error('コメントを入力してください')
      return
    }

    try {
      setIsSubmittingReview(true)
      await dishApi.addDishReview({
        dishId: Number(dishId),
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

  const startEdit = (review: DishReview) => {
    setEditingReviewId(review.dishReviewId)
    setEditRating(Math.round(review.rate) || 5)
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
      await dishApi.updateDishReview({
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

  const deleteReview = async (dishReviewId: number) => {
    if (!confirm('このレビューを削除しますか？')) return
    try {
      setIsMutating(true)
      await dishApi.deleteDishReview(dishReviewId)
      toast.success('レビューを削除しました')
      await fetchReviews()
      if (editingReviewId === dishReviewId) cancelEdit()
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
    .sort((a, b) => {
      const aTime = new Date(a.date).getTime()
      const bTime = new Date(b.date).getTime()
      return bTime - aTime
    })

  const displayedReviews = filteredAndSortedReviews.slice(0, displayedCount)

  return (
    <div className="min-h-screen bg-background">
      <TopHeader />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Title Section with Back Button */}
        <section className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full"
              aria-label="戻る"
            >
              <ChevronLeft size={24} className="text-foreground" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">料理レビュー</h1>
            </div>
          </div>
        </section>

        {/* Reviews List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">レビューがありません</p>
          </div>
        ) : (
          <>
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
                        className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-6 py-2 flex items-center gap-2"
                      >
                        <Send size={18} />
                        {isSubmittingReview ? '送信中...' : '送信'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-6 mb-8">
              {filteredAndSortedReviews.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">該当するレビューがありません</p>
                </div>
              ) : (
                displayedReviews.map((review) => (
                  (() => {
                    const rawNational = (review.national ?? "").trim()
                    const normalized = normalizeNational(rawNational)
                    const displayNational = normalized ?? rawNational
                    const isMine = !!currentUserId && review.userId === currentUserId
                    const isEditing = editingReviewId === review.dishReviewId

                    return (
                  <Card key={review.dishReviewId} className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
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
                          <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-semibold text-lg ${review.avatar ? 'hidden' : ''}`}>
                            {review.fullName.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground">{review.fullName}</p>
                                {displayNational ? (
                                  <span className="text-xs text-muted-foreground">({displayNational})</span>
                                ) : null}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(review.date).toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
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
                                      i < Math.floor(review.rate)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-muted-foreground"
                                    }
                                  />
                                ))}
                                <span className="text-sm font-medium text-foreground ml-2">
                                  {review.rate.toFixed(1)}
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
                                    onClick={() => deleteReview(review.dishReviewId)}
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
                  })()
                ))
              )}
            </section>

            {/* Load More Button */}
            {displayedCount < filteredAndSortedReviews.length && (
              <div className="flex justify-center mb-8">
                <Button
                  onClick={handleLoadMore}
                  size="lg"
                  className="rounded-full px-8 py-6 text-base font-medium bg-yellow-500 hover:bg-yellow-600 text-white transition-colors duration-200"
                >
                  もっと見る ({filteredAndSortedReviews.length - displayedCount}件)
                </Button>
              </div>
            )}
          </>
        )}
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
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  )
}
