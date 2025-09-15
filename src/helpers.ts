import type { SortableDataFrame, OrderBy, ResolvedValue } from "hightable";
import type { FileMetaData } from "hyparquet";
import { decodeWKB } from "geoparquet";

type Geometry = ReturnType<typeof decodeWKB>;

export function toGeoAwareDf(
  df: SortableDataFrame,
  fileMetaData: FileMetaData
): SortableDataFrame {
  // detect geometry columns
  const geoMetadata = fileMetaData.key_value_metadata?.find(
    (kv) => kv.key === "geo"
  );
  if (!geoMetadata?.value) {
    return df;
  }

  // Geoparquet metadata
  const geoSchema: unknown = JSON.parse(geoMetadata.value);
  if (
    typeof geoSchema !== "object" ||
    geoSchema === null ||
    !("primary_column" in geoSchema) ||
    typeof geoSchema.primary_column !== "string"
  ) {
    return df;
  }
  const primaryColumn = geoSchema.primary_column;
  const cachedGeometry = new Map<number, ResolvedValue<Geometry>>();

  // prepare the data frame
  const header = [...df.header];
  const metadata = df.metadata ? structuredClone(df.metadata ?? {}) : undefined;

  function getRowNumber({ row, orderBy }: { row: number; orderBy?: OrderBy }) {
    return df.getRowNumber({ row, orderBy });
  }

  function getCell({
    row,
    column,
    orderBy,
  }: {
    row: number;
    column: string;
    orderBy?: OrderBy;
  }) {
    if (column === primaryColumn) {
      const rowNumber = df.getRowNumber({ row, orderBy });
      return rowNumber ? cachedGeometry.get(rowNumber.value) : undefined;
    }
    return df.getCell({ row, column, orderBy });
  }

  async function fetch({
    rowStart,
    rowEnd,
    orderBy,
    columns,
    signal,
  }: {
    rowStart: number;
    rowEnd: number;
    orderBy?: OrderBy;
    columns?: string[] | undefined;
    signal?: AbortSignal | undefined;
  }) {
    await df.fetch({ rowStart, rowEnd, orderBy, columns, signal });

    if (!columns || columns.includes(primaryColumn)) {
      for (let r = rowStart; r < rowEnd; r++) {
        const rowNumber = df.getRowNumber({ row: r, orderBy });
        if (rowNumber && !cachedGeometry.has(rowNumber.value)) {
          const wkb = df.getCell({
            row: r,
            column: primaryColumn,
            orderBy,
          });
          if (wkb && wkb.value instanceof Uint8Array) {
            const geometry = decodeWKB(wkb.value);
            cachedGeometry.set(rowNumber.value, { value: geometry });
          } else {
            // should not occur
            cachedGeometry.delete(rowNumber.value);
          }
        }
      }
    }

    df.eventTarget.dispatchEvent(new CustomEvent("resolve"));
  }

  return {
    sortable: true,
    numRows: df.numRows,
    metadata,
    header,
    getCell,
    getRowNumber,
    fetch,
    eventTarget: df.eventTarget,
  };
}
