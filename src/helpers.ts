import type { DataFrame } from 'hightable'

interface Options {
  maxColumns: number
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
