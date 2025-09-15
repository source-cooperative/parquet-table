import type { ReactNode } from "react";
import Page, { type PageProps } from "./Page.js";
import Welcome from "./Welcome.js";

import { byteLengthFromUrl, parquetMetadataAsync } from "hyparquet";
import {
  type AsyncBufferFrom,
  asyncBufferFrom,
  parquetDataFrame,
} from "hyperparam";
import { useCallback, useEffect, useState } from "react";
import Dropzone from "./Dropzone.js";
import Layout from "./Layout.js";
import { toGeoAwareDf } from "./helpers.js";
import type { SortableDataFrame } from "hightable";

export default function App(): ReactNode {
  const params = new URLSearchParams(location.search);
  const url = params.get("url") ?? undefined;
  const iframe = params.get("iframe") ? true : false;

  const [error, setError] = useState<Error>();
  const [pageProps, setPageProps] = useState<PageProps>();

  const setUnknownError = useCallback((e: unknown) => {
    setError(e instanceof Error ? e : new Error(String(e)));
  }, []);

  const setAsyncBuffer = useCallback(
    async function setAsyncBuffer(name: string, from: AsyncBufferFrom) {
      const asyncBuffer = await asyncBufferFrom(from);
      const metadata = await parquetMetadataAsync(asyncBuffer);
      const df = parquetDataFrame(from, metadata, {
        utf8: false,
      }) as SortableDataFrame; // parquetDataFrame always produces a SortableDataFrame, but it's not typed as such
      // TODO(SL): remove this once hyparquet/hyparparam support geoparquet / geometry columns
      const geoAwareDf = toGeoAwareDf(df, metadata);
      setPageProps({
        metadata,
        df: geoAwareDf,
        name,
        byteLength: from.byteLength,
        setError: setUnknownError,
        iframe,
      });
    },
    [setUnknownError]
  );

  const onUrlDrop = useCallback(
    (url: string) => {
      // Add url=url to query string
      const params = new URLSearchParams(location.search);
      params.set("url", url);
      history.pushState({}, "", `${location.pathname}?${params}`);
      byteLengthFromUrl(url)
        .then((byteLength) => setAsyncBuffer(url, { url, byteLength }))
        .catch(setUnknownError);
    },
    [setUnknownError, setAsyncBuffer]
  );

  useEffect(() => {
    if (!pageProps && url) {
      onUrlDrop(url);
    }
  }, [url, pageProps, onUrlDrop]);

  function onFileDrop(file: File) {
    // Clear query string
    history.pushState({}, "", location.pathname);
    setAsyncBuffer(file.name, { file, byteLength: file.size }).catch(
      setUnknownError
    );
  }

  return (
    <Layout error={error}>
      <Dropzone
        onError={(e) => {
          setError(e);
        }}
        onFileDrop={onFileDrop}
        onUrlDrop={onUrlDrop}
      >
        {pageProps ? <Page {...pageProps} /> : <Welcome />}
      </Dropzone>
    </Layout>
  );
}
