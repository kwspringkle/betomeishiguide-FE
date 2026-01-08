export const USER_SCOPE_STORAGE_KEY = "userScope.v1"

export function getUserScopeFromToken(token: string | null): string | null {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    const sub: string | undefined = payload?.sub || payload?.username || payload?.email
    if (!sub) return null
    return String(sub)
  } catch {
    return null
  }
}

export function getUserIdFromToken(token: string | null): number | null {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    const userId = payload?.userId
    const n = typeof userId === "number" ? userId : Number(userId)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function getCurrentUserId(): number | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("token")
  return getUserIdFromToken(token)
}

export function getCurrentUserScope(): string | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("token")
  const scopeFromToken = getUserScopeFromToken(token)
  if (scopeFromToken) {
    localStorage.setItem(USER_SCOPE_STORAGE_KEY, scopeFromToken)
    return scopeFromToken
  }
  return localStorage.getItem(USER_SCOPE_STORAGE_KEY)
}

export function clearStoredUserScope() {
  if (typeof window === "undefined") return
  localStorage.removeItem(USER_SCOPE_STORAGE_KEY)
}
