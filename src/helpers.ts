import type { DataFrame } from 'hightable'

interface Options {
  maxColumns: number
}

/**
 *
 * @param df
 * @param options
 */
export function limitColumns(df: DataFrame, options: Options): DataFrame {
  return {
    ...df,
    columnDescriptors: df.columnDescriptors.slice(0, options.maxColumns),
  }
}
