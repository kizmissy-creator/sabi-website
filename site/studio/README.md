# Studio pages

Edit the shared header/footer in `template.html` and each page body in its named HTML file. `scripts/render-studio.mjs` writes the complete pages during the normal build, resolving assets and internal links for both the standalone Studio site and the company site's `/studio/` path.

The two collections own their product cards. The home and shop pages only introduce them. Product details use the shared `studio/studio.js`; sample selection, code validation and checkout use `studio/samples/`. Cart storage contains only one catalogue product ID, never delivery details. Existing backend code enforces invitation and stock limits.

Use `node scripts/build-site.mjs --studio` for the standalone local preview and `npm test` for routing, catalogue, sample and preview-authentication checks. Do not hand-edit generated `dist` pages.
