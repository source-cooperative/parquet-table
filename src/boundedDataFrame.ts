import type { DataFrame, DataFrameEvents } from 'hightable'
import { createEventTarget, TypedCustomEvent } from 'hightable/dataframe'

// parquetDataFrame caches every fetched row permanently with no eviction.
// This wrapper recreates the inner DataFrame (freeing its cache) when the
// number of unique 1000-row groups exceeds MAX_GROUPS, preventing unbounded
// memory growth when the user scrolls through large files.
const GROUP_SIZE = 1000
const MAX_GROUPS = 100 // ~100,000 rows before cache reset

/**
 * Creates a typed 'resolve' CustomEvent for DataFrame eventTargets.
 * @returns TypedCustomEvent for the resolve event
 */
function resolveEvent() {
  return new TypedCustomEvent<DataFrameEvents, 'resolve'>('resolve', { detail: undefined })
}

/**
 * Wraps a DataFrame factory with a row-group cache limit.
 * When the limit is exceeded the inner DataFrame is recreated,
 * freeing its accumulated cache. The outer eventTarget is stable
 * so HighTable's subscriptions are preserved across resets.
 * @param createInner factory that creates the inner DataFrame
 * @returns bounded DataFrame
 */
export function boundedDataFrame(createInner: () => DataFrame): DataFrame {
  let inner = createInner()
  const eventTarget = createEventTarget<DataFrameEvents>()
  const cachedGroups = new Set<number>()

  const forward = () => eventTarget.dispatchEvent(resolveEvent())
  inner.eventTarget?.addEventListener('resolve', forward)

  /**
   * Recreates the inner DataFrame to free its accumulated row cache.
   */
  function reset() {
    inner.eventTarget?.removeEventListener('resolve', forward)
    inner = createInner()
    cachedGroups.clear()
    inner.eventTarget?.addEventListener('resolve', forward)
    // Tell HighTable cells are stale so it re-fetches the visible range
    eventTarget.dispatchEvent(resolveEvent())
  }

  return {
    get columnDescriptors() { return inner.columnDescriptors },
    get numRows() { return inner.numRows },
    get metadata() { return inner.metadata },
    eventTarget,
    getRowNumber: params => inner.getRowNumber(params),
    getCell: params => inner.getCell(params),
    async fetch(params) {
      const { rowStart, rowEnd } = params
      if (rowEnd > rowStart) {
        const firstGroup = Math.floor(rowStart / GROUP_SIZE)
        const lastGroup = Math.floor((rowEnd - 1) / GROUP_SIZE)
        for (let g = firstGroup; g <= lastGroup; g++) {
          cachedGroups.add(g)
        }
        if (cachedGroups.size > MAX_GROUPS) {
          reset()
        }
      }
      return inner.fetch?.(params)
    },
  }
}
