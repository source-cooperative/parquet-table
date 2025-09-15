import { type ReactNode } from "react";

export default function Welcome(): ReactNode {
  return (
    <div id="welcome">
      <div>
        <h1>Parquet viewer</h1>
        <p>
          Drag and drop 🫳 a parquet file (or url) to see your parquet data, or
          click an example:
        </p>
        <ul className="quick-links">
          <li>
            <a
              className="source"
              href="?url=https://data.source.coop/vida/google-microsoft-osm-open-buildings/geoparquet/by_country/country_iso=BOL/BOL.parquet"
            >
              <h2>Open Buildings</h2>
              <p>A GeoParquet file of building footprints.</p>
            </a>
          </li>
          <li>
            <a
              className="huggingface"
              href="?url=https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet?download=true"
            >
              <h2>GitHub Code</h2>
              <p>Code files from GitHub in 32 programming languages.</p>
            </a>
          </li>
          <li>
            <a
              className="aws"
              href="?url=https://hyperparam-public.s3.amazonaws.com/wiki-en-00000-of-00041.parquet"
            >
              <h2>Wikipedia</h2>
              <p>All the articles from the English Wikipedia.</p>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
