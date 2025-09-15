# Parquet table

A webapp that displays the contents of a remote Parquet file in a table format.

This app is adapted from the [hyparquet demo](https://github.com/hyparam/demos/tree/master/hyparquet), and relies on [Hyparam](https://hyperparam.app/)'s tools: [hyparquet](https://github.com/hyparam/hyparquet) to read the Parquet files, [hyperparam](https://github.com/hyparam/hyperparam-cli) that provides web workers to run hyparquet in another thread, and [hightable](https://github.com/hyparam/hightable) to fetch and show the rows in a virtual table.

## Run the app locally

```bash
npm i
npm run dev
```

Then open http://localhost:5173 in your browser.

## Usage

The webapp can be configured using the following URL parameters:

- `url`: URL of the Parquet file to load
- `iframe`: if present, the app will be rendered in an iframe-friendly mode
- `lens`: initial view mode, can be `table`, `metadata`, or `layout` (default: `table`)
