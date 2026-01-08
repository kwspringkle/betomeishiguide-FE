"use client"

import { useEffect } from "react"

const STORAGE_KEY = "betomeishi.favoritesChanged.v1"
const EVENT_NAME = "betomeishi:favorites-changed"

export function emitFavoritesChanged() {
  if (typeof window === "undefined") return

  try {
    // Same-tab listeners
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  } catch {
    // ignore
  }

  try {
    // Cross-tab listeners
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  } catch {
    // ignore
  }
}

export function useFavoritesChanged(onChanged: () => void) {
  useEffect(() => {
    if (typeof window === "undefined") return

    const handle = () => onChanged()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) onChanged()
    }

    window.addEventListener(EVENT_NAME, handle as EventListener)
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener(EVENT_NAME, handle as EventListener)
      window.removeEventListener("storage", handleStorage)
    }
  }, [onChanged])
}
