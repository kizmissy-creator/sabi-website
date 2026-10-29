# Studio pages

Edit the shared header/footer in `template.html` and each page body in its named HTML file. `scripts/render-studio.mjs` writes the complete pages during the normal build, resolving assets and internal links for both the standalone Studio site and the company site's `/studio/` path.

The two collections own their product cards. The home and shop pages only introduce them. Product details use the shared `studio/studio.js`; sample selection, code validation and checkout use `studio/samples/`. Cart storage contains only one catalogue product ID, never delivery details. Existing backend code enforces invitation and stock limits.

Use `node scripts/build-site.mjs --studio` for the standalone local preview and `npm test` for routing, catalogue, sample and preview-authentication checks. Do not hand-edit generated `dist` pages.

The home collage links directly to the two collections. Its hoodie uses `sb-hoodie-back-cutout.png`, a background-extraction derivative created with the built-in image tool on 29 October 2026, with the unchanged Social Battery artwork layered separately at the saved supplier placement. The original supplier photo remains in the product details. This is a styled mockup, not a photograph of a manufactured sample.

Image-edit prompt: “Use case: background-extraction. Edit target: the supplied blank black hoodie back supplier photograph. Remove ONLY the white background to actual alpha transparency. Keep the identical black hoodie, exact shape, hood, cuffs, seams, texture, lighting, dimensions and position. Do not redesign, recolour, add a print or invent folds. Preserve the full original 1024 x 1200 framing and margins and all garment pixels as closely as possible. No shadows outside the original garment, no text, no new background. This is a precise background cutout for a product website.”
