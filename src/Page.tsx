import HighTable, { type DataFrame } from "hightable";
import type { FileMetaData } from "hyparquet";
import { Dropdown } from "hyperparam";
import { type ReactNode, useState } from "react";
import ParquetLayout from "./ParquetLayout.js";
import ParquetMetadata from "./ParquetMetadata.js";

type Lens = "table" | "metadata" | "layout";

export interface PageProps {
  metadata: FileMetaData;
  df: DataFrame;
  name: string;
  byteLength?: number;
  setError: (e: unknown) => void;
  iframe?: boolean;
  initialLens?: string;
}

function validateLens(lens?: string): Lens | undefined {
  if (lens === "table" || lens === "metadata" || lens === "layout") {
    return lens;
  }
  return undefined;
}

/**
 * Hyparquet demo viewer page
 * @param {Object} props
 * @returns {ReactNode}
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
  const [lens, setLens] = useState<Lens>(validateLens(initialLens) ?? "table");

  return (
    <>
      {iframe ? "" : <div className="top-header">{name}</div>}
      <div className="view-header">
        {byteLength !== undefined && (
          <span title={byteLength.toLocaleString() + " bytes"}>
            {formatFileSize(byteLength)}
          </span>
        )}
        <span>{df.numRows.toLocaleString()} rows</span>
        <Dropdown label={lens}>
          <button
            type="button"
            onClick={() => {
              setLens("table");
            }}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => {
              setLens("metadata");
            }}
          >
            Metadata
          </button>
          {byteLength && (
            <button
              type="button"
              onClick={() => {
                setLens("layout");
              }}
            >
              Layout
            </button>
          )}
        </Dropdown>
      </div>
      {lens === "table" && (
        <HighTable
          cacheKey={name}
          data={df}
          onError={setError}
          className="hightable"
        />
      )}
      {lens === "metadata" && <ParquetMetadata metadata={metadata} />}
      {lens === "layout" && byteLength && (
        <ParquetLayout byteLength={byteLength} metadata={metadata} />
      )}
    </>
  );
}

/**
 * Returns the file size in human readable format.
 *
 * @param {number} bytes file size in bytes
 * @returns {string} formatted file size string
 */
function formatFileSize(bytes: number): string {
  const sizes = ["b", "kb", "mb", "gb", "tb"];
  if (bytes === 0) return "0 b";
  const i = Math.floor(Math.log2(bytes) / 10);
  if (i === 0) return `${bytes.toString()} b`;
  const base = bytes / Math.pow(1024, i);
  const size = sizes[i];
  if (!size) {
    throw new Error("File size too large");
  }
  return `${base < 10 ? base.toFixed(1) : Math.round(base).toString()} ${size}`;
}
