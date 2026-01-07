import HighTable, { type DataFrame } from 'hightable'
import type { FileMetaData } from 'hyparquet'
import { Dropdown } from 'hyperparam'
import { type ReactNode, useState } from 'react'

import { limitColumns } from './helpers.js'
import ParquetLayout from './ParquetLayout.js'
import ParquetMetadata from './ParquetMetadata.js'

type Lens = 'table' | 'metadata' | 'layout'

export interface PageProps {
  metadata: FileMetaData
  df: DataFrame
  name: string
  byteLength?: number
  setError: (e: unknown) => void
  iframe?: boolean
  initialLens?: string
}

/**
 * Validate lens value.
 * @param lens - lens string
 * @returns Validated lens or undefined
 */
function validateLens(lens?: string): Lens | undefined {
  if (lens === 'table' || lens === 'metadata' || lens === 'layout') {
    return lens
  }
  return undefined
}

/**
 * Hyparquet demo viewer page
 * @param props Component props
 * @param props.metadata - parquet file metadata
 * @param props.df - data frame
 * @param props.name - file name
 * @param props.byteLength - file size in bytes
 * @param props.setError - error handler
 * @param props.iframe - whether to render in iframe mode
 * @param props.initialLens - initial lens to display
 * @returns ReactNode
 */
export default function Page({
  metadata,
  df,
  name,
  byteLength,
  setError,
  iframe = false,
  initialLens,
}: PageProps): ReactNode {
  const [lens, setLens] = useState<Lens>(() => validateLens(initialLens) ?? 'table')
  // limit to 30 columns for performance (see https://github.com/source-cooperative/parquet-table/issues/13)
  const limitedDf = limitColumns(df, { maxColumns: 30 })
  const numColumns = df.columnDescriptors.length
  const limitedNumColumns = limitedDf.columnDescriptors.length

  return (
    <>
      {iframe ? '' : <div className="top-header">{name}</div>}
      <div className="view-header">
        {byteLength !== undefined && (
          <span title={byteLength.toLocaleString() + ' bytes'}>
            {formatFileSize(byteLength)}
          </span>
        )}
        <span>
          {df.numRows.toLocaleString()}
          {' '}
          row
          {df.numRows > 1 ? 's' : ''}
        </span>
        {numColumns === limitedNumColumns
          ? (
              <span>
                {numColumns.toLocaleString()}
                {' '}
                column
                {numColumns > 1 ? 's' : ''}
              </span>
            )
          : (
              <span>
                {numColumns.toLocaleString()}
                {' '}
                column
                {numColumns > 1 ? 's' : ''}
                {' '}
                (showing first
                {limitedNumColumns}
                )
              </span>
            )}
        <Dropdown label={lens}>
          <button
            type="button"
            onClick={() => {
              setLens('table')
            }}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => {
              setLens('metadata')
            }}
          >
            Metadata
          </button>
          {byteLength && (
            <button
              type="button"
              onClick={() => {
                setLens('layout')
              }}
            >
              Layout
            </button>
          )}
        </Dropdown>
      </div>
      {lens === 'table' && (
        <HighTable
          cacheKey={name}
          data={limitedDf}
          onError={setError}
          className="hightable"
        />
      )}
      {lens === 'metadata' && <ParquetMetadata metadata={metadata} />}
      {lens === 'layout' && byteLength && (
        <ParquetLayout byteLength={byteLength} metadata={metadata} />
      )}
    </>
  )
}

/**
 * Returns the file size in human readable format.
 * @param {number} bytes file size in bytes
 * @returns {string} formatted file size string
 */
function formatFileSize(bytes: number): string {
  const sizes = ['b', 'kb', 'mb', 'gb', 'tb']
  if (bytes === 0) return '0 b'
  const i = Math.floor(Math.log2(bytes) / 10)
  if (i === 0) return `${bytes.toString()} b`
  const base = bytes / Math.pow(1024, i)
  const size = sizes[i]
  if (!size) {
    throw new Error('File size too large')
  }
  return `${base < 10 ? base.toFixed(1) : Math.round(base).toString()} ${size}`
}
