# Jaeyeon Kim’s homepage

Personal website at https://jaeyeonkim01.github.io/, migrated from al-folio to the current Jay homepage design. The public homepage includes Home, Research, Collaboration, and CV. Blog drafts stay in the local preview.

## Edit and preview

Edit `dist/content.js` for biography, publications, news, collaborators, and CV; `dist/app.js` for page structure and hash routes; and `dist/styles.css` for appearance. Assets and font licenses are in `dist/assets/`. The local preview serves `dist/`; the public build is generated separately in `public-dist/`.

The homepage’s Easter egg shares the paper palette as `dist/assets/jay_colors_util.tex`.

The private local workspace keeps blog prose in `posts/` and metadata in `posts/index.json`. There, run `npm run build:blog` to update `dist/posts.js`. Draft equations in LaTeX using `\[...\]` and `\(...\)`; the generator renders them with locally served KaTeX. Blog sources, compiled posts, and figure assets are excluded from the public repository and public build. Keep blog edits local unless publication is explicitly requested.

Run `npm run dev` and open http://localhost:5173. The preview server uses Node’s standard library and needs no package installation. Use `PORT=5174 npm run dev` if needed. VS Code can forward the port for a remote preview.

For ongoing homepage edits, keep the local preview running so changes reload immediately. In VS Code, forward port **5173**, then open its local address in **Browser: Open Integrated Browser** or **Simple Browser: Show**. The workspace labels this port “Jay homepage preview” and opens it as a preview when automatically forwarded. **Tasks: Run Task → Preview homepage** can restart the server.

Run `npm run check` for JavaScript syntax checks. For browser checks, run `npm ci`, start the preview server, and run `npm test`. `CHROMIUM_PATH` and `PREVIEW_URL` can override the browser and server defaults. Screenshots and results are written to `qa/`.

## Publish

A push to `main` runs `.github/workflows/deploy.yml`, generates `public-dist/` with `npm run build:public`, checks the public homepage, and publishes only `public-dist/` to `gh-pages`. The build excludes blog navigation, routes, compiled posts, and figure assets, and replaces collaboration links to the private post with its public code link. GitHub Pages serves the root of `gh-pages` at the existing homepage URL. The `.nojekyll` file tells Pages to serve the files directly.

To check the public build locally, run `npm run build:public`, then `SITE_DIR=public-dist PORT=5174 npm run dev`. Run `PUBLIC_SITE=1 PREVIEW_URL=http://127.0.0.1:5174 npm test` against this server. `node scripts/build-public.mjs --check` verifies that blog artifacts are absent.

The former `/publications/`, `/research/`, `/collaboration/`, `/cv/`, `/about/`, and `/news/` URLs redirect to the corresponding pages in the new site. The downloadable CV is `dist/assets/Jaeyeon_CV.pdf`.

## Migration history

The last al-folio main commit is `101dd8358ff1c994ea67b2764be2502b04cd9943`. Its content remains in Git history, and the existing `backup/origin-main` branch is retained. The original al-folio license and self-hosted font licenses are preserved.

The local preview workspace also holds private imported source snapshots under `source-content/` and migration backups under `qa/`. These are excluded from the published repository and the hosted site.
