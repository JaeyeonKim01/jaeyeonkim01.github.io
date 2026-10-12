# Jaeyeon Kim’s homepage

Personal website at https://jaeyeonkim01.github.io/, migrated from al-folio to the current Jay homepage design. Home, Research, Collaboration, and CV are included. The blog is excluded.

## Edit and preview

The published site is entirely in `dist/`. Edit `dist/content.js` for biography, publications, news, collaborators, and CV; `dist/app.js` for page structure and hash routes; and `dist/styles.css` for appearance. Assets and font licenses are in `dist/assets/`.

Run `npm run dev` and open http://localhost:5173. The preview server uses Node’s standard library and needs no package installation. Use `PORT=5174 npm run dev` if needed. VS Code can forward the port for a remote preview.

Run `npm run check` for JavaScript syntax checks. For browser checks, run `npm ci`, start the preview server, and run `npm test`. `CHROMIUM_PATH` and `PREVIEW_URL` can override the browser and server defaults. Screenshots and results are written to `qa/`.

## Publish

A push to `main` runs `.github/workflows/deploy.yml`, checks JavaScript and desktop/mobile behavior, and publishes `dist/` to `gh-pages`. GitHub Pages continues to serve the root of `gh-pages` at the existing homepage URL. No Jekyll or build step is required. The `.nojekyll` file tells Pages to serve the files directly.

The former `/publications/`, `/research/`, `/collaboration/`, `/cv/`, `/about/`, and `/news/` URLs redirect to the corresponding pages in the new site. The downloadable CV is `dist/assets/Jaeyeon_CV.pdf`.

## Migration history

The last al-folio main commit is `101dd8358ff1c994ea67b2764be2502b04cd9943`. Its content remains in Git history, and the existing `backup/origin-main` branch is retained. The original al-folio license and self-hosted font licenses are preserved.

The local preview workspace also holds private imported source snapshots under `source-content/` and migration backups under `qa/`. These are excluded from the published repository and the hosted site.
