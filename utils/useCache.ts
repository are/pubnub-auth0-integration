import { useMemo, useState } from 'react'

export type GetCacheEntry<T> = (key: string) => Promise<T>

export type Cache<T> = {
  has(key: string): boolean
  get(key: string): T | undefined
  set(key: string, entry: T): T
}

const fetching = new Set()

export default function useCache<T>(getCacheEntry: GetCacheEntry<T>) {
  const [cache, updateCache] = useState<Map<string, T>>(new Map())

  return useMemo(
    () => ({
      has(key: string) {
        return cache.has(key)
      },
      get(key: string) {
        async function fetchEntry(key: string) {
          fetching.add(key)
          const entry = await getCacheEntry(key)

          fetching.delete(key)
          updateCache(() => new Map(cache.set(key, entry)))
        }

        if (cache.has(key)) {
          return cache.get(key)
        } else {
          if (!fetching.has(key)) {
            fetchEntry(key).catch(console.error)
          }

          return undefined
        }
      },
      set(key: string, entry: T) {
        updateCache(() => new Map(cache.set(key, entry)))

        return entry
      },
    }),
    [cache, getCacheEntry]
  )
}
