import type { ColumnChunk, ColumnMetaData, FileMetaData } from 'hyparquet'
import type { ReactNode } from 'react'

interface LayoutProps {
  byteLength: number
  metadata: FileMetaData
}

/**
 * Renders the file layout of a parquet file as nested rowgroups and columns.
 * @param {object} props
 * @param {number} props.byteLength
 * @param {FileMetaData} props.metadata
 * @returns {ReactNode}
 */
export default function ParquetLayout({
  byteLength,
  metadata,
}: LayoutProps): ReactNode {
  const metadataStart = byteLength - metadata.metadata_length - 4
  const metadataEnd = byteLength - 4

  return (
    <div className="viewer">
      <div className="layout">
        <Cell name="PAR1" start={0n} end={4n} />
        <RowGroups metadata={metadata} />
        <ColumnIndexes metadata={metadata} />
        <Cell name="Metadata" start={metadataStart} end={metadataEnd} />
        <Cell name="PAR1" start={metadataEnd} end={byteLength} />
      </div>
    </div>
  )
}

/**
 *
 * @param root0
 * @param root0.name
 * @param root0.start
 * @param root0.end
 */
function Cell<N extends bigint | number>({
  name,
  start,
  end,
}: {
  name: string
  start: N
  end: N
}) {
  const bytes = end - start
  return (
    <div className="cell">
      <label>{name}</label>
      <ul>
        <li>
          start
          {start.toLocaleString()}
        </li>
        <li>
          bytes
          {bytes.toLocaleString()}
        </li>
        <li>
          end
          {end.toLocaleString()}
        </li>
      </ul>
    </div>
  )
}

/**
 *
 * @param root0
 * @param root0.children
 * @param root0.name
 * @param root0.bytes
 */
function Group({
  children,
  name,
  bytes,
}: {
  children: ReactNode
  name?: string
  bytes?: bigint
}) {
  return (
    <div className="group">
      <div className="group-header">
        <label>{name}</label>
        <span>
          {bytes === undefined ? '' : `bytes ${bytes.toLocaleString()}`}
        </span>
      </div>
      {children}
    </div>
  )
}

/**
 *
 * @param root0
 * @param root0.metadata
 */
function RowGroups({ metadata }: { metadata: FileMetaData }) {
  return (
    <>
      {metadata.row_groups.map((rowGroup, i) => {
        const groupName = `RowGroup ${i.toString()}`
        return (
          <Group
            key={groupName}
            name={groupName}
            bytes={rowGroup.total_byte_size}
          >
            {rowGroup.columns.map((column, j) => {
              const key = `column-${i.toString()}-${j.toString()}`
              return (
                <Column
                  key={key}
                  column={column}
                  columnCount={`${(j + 1).toString()}/${rowGroup.columns.length.toString()}`}
                />
              )
            })}
          </Group>
        )
      })}
    </>
  )
}

/**
 *
 * @param root0
 * @param root0.column
 * @param root0.columnCount
 */
function Column({
  column,
  columnCount,
}: {
  column: ColumnChunk
  columnCount: string
}) {
  if (!column.meta_data) return null
  const { meta_data } = column
  const { dictionary_page_offset, data_page_offset, index_page_offset }
    = meta_data
  const end = getColumnRange(column.meta_data)[1]
  const pages = [
    { name: 'Dictionary', offset: dictionary_page_offset },
    { name: 'Data', offset: data_page_offset },
    { name: 'Index', offset: index_page_offset },
    { name: 'End', offset: end },
  ]
    .filter(
      (page): page is { name: string, offset: bigint } =>
        page.offset !== undefined,
    )
    .sort((a, b) => Number(a.offset - b.offset))

  const children = pages.slice(0, -1).map(({ name, offset }, index) => {
    const end = pages[index + 1]?.offset
    if (end === undefined) {
      throw new Error('Unexpected undefined end offset')
    }
    return <Cell key={name} name={name} start={offset} end={end} />
  })

  return (
    <Group
      name={`Column ${columnCount} • ${column.meta_data.path_in_schema.join('.')}`}
      bytes={column.meta_data.total_compressed_size}
    >
      {children}
    </Group>
  )
}

/**
 *
 * @param root0
 * @param root0.metadata
 */
function ColumnIndexes({ metadata }: { metadata: FileMetaData }) {
  // find column and offset indexes
  const indexPages = []
  for (const rowGroup of metadata.row_groups) {
    for (const column of rowGroup.columns) {
      const columnName = column.meta_data?.path_in_schema.join('.')
      if (column.column_index_offset) {
        indexPages.push({
          name: `ColumnIndex ${columnName ?? 'unknown column name'}`,
          start: column.column_index_offset,
          end:
            column.column_index_offset
            + BigInt(column.column_index_length ?? 0),
        })
      }
      if (column.offset_index_offset) {
        indexPages.push({
          name: `OffsetIndex ${columnName ?? 'unknown column name'}`,
          start: column.offset_index_offset,
          end:
            column.offset_index_offset
            + BigInt(column.offset_index_length ?? 0),
        })
      }
    }
  }

  if (indexPages.length === 0) return null
  return (
    <Group name="ColumnIndexes">
      {indexPages.map(({ name, start, end }, index) => {
        const key = `index-page-${index.toString()}`
        return <Cell key={key} name={name} start={start} end={end} />
      })}
    </Group>
  )
}

/**
 * Find the start byte offset for a column chunk.
 * @param {ColumnMetaData} columnMetadata
 * @returns {[bigint, bigint]} byte offset range
 */
function getColumnRange({
  dictionary_page_offset,
  data_page_offset,
  total_compressed_size,
}: ColumnMetaData): [bigint, bigint] {
  /// Copied from hyparquet because it's not exported
  let columnOffset = dictionary_page_offset
  if (!columnOffset || data_page_offset < columnOffset) {
    columnOffset = data_page_offset
  }
  return [columnOffset, columnOffset + total_compressed_size]
}
