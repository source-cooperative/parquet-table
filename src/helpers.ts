import type { DataFrame } from 'hightable'
import { byteLengthFromUrl } from 'hyparquet'

interface Options {
  maxColumns: number
}

/**
 * Get the byte length of a URL, with fallback for servers that don't support HEAD requests.
 * Some servers return 500 on HEAD requests; this falls back to a GET with a Range header.
 * @param url URL to get the byte length of
 * @returns byte length of the resource
 */
export async function byteLengthFromUrlWithFallback(url: string): Promise<number> {
  try {
    return await byteLengthFromUrl(url)
  } catch {
    // Fall back to GET with Range header for servers that reject HEAD requests
    const response = await fetch(url, { headers: { Range: 'bytes=0-0' } })
    if (!response.ok && response.status !== 206) {
      throw new Error(`fetch failed ${response.status}`)
    }
    const contentRange = response.headers.get('content-range')
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)$/)
      if (match?.[1]) return parseInt(match[1], 10)
    }
    throw new Error('Could not determine file size from server')
  }
}

/**
 * Limit the number of columns in a DataFrame.
 * @param df DataFrame to limit
 * @param options options
 * @param options.maxColumns Maximum number of columns to keep
 * @returns Limited DataFrame
 */
export function limitColumns(df: DataFrame, options: Options): DataFrame {
  return {
    ...df,
    columnDescriptors: df.columnDescriptors.slice(0, options.maxColumns),
  }
}
