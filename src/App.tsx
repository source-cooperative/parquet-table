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
import Loading from "./Loading.js";
import { toGeoAwareDf } from "./helpers.js";
import { sortableDataFrame } from "hightable";

export default function App(): ReactNode {
  const params = new URLSearchParams(location.search);
  const url = params.get("url") ?? undefined;
  const iframe = params.get("iframe") ? true : false;
  const initialLens = params.get("lens") ?? undefined;

  const [error, setError] = useState<Error>();
  const [pageProps, setPageProps] = useState<PageProps>();
  const [loading, setLoading] = useState<boolean>(!pageProps && url !== undefined);

  const setUnknownError = useCallback((e: unknown) => {
    setError(e instanceof Error ? e : new Error(String(e)));
    setLoading(false);
  }, []);

  const setAsyncBuffer = useCallback(
    async function (name: string, from: AsyncBufferFrom) {
      const asyncBuffer = await asyncBufferFrom(from);
      const metadata = await parquetMetadataAsync(asyncBuffer);
      const df = sortableDataFrame(
        parquetDataFrame(from, metadata, {
          utf8: false,
        })
      );
      // TODO(SL): remove this once hyparquet/hyparparam support geoparquet
      const geoAwareDf = toGeoAwareDf(df, metadata);
      setPageProps({
        metadata,
        df: geoAwareDf,
        name,
        byteLength: from.byteLength,
        setError: setUnknownError,
        iframe,
        initialLens,
      });
      setLoading(false);
    },
    [setUnknownError, iframe, initialLens]
  );

  useEffect(() => {
    if (!pageProps && url !== undefined) {
      byteLengthFromUrl(url)
        .then((byteLength) => setAsyncBuffer(url, { url, byteLength }))
        .catch(setUnknownError);
    }
  }, [url, pageProps, setUnknownError, setAsyncBuffer]);

  const onUrlDrop = useCallback(
    (url: string) => {
      setLoading(true);
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

  function onFileDrop(file: File) {
    setLoading(true);
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
        {loading ? (
          <Loading />
        ) : pageProps ? (
          <Page {...pageProps} />
        ) : (
          <Welcome />
        )}
      </Dropzone>
    </Layout>
  );
}
