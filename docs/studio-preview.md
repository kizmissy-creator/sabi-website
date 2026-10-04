# SABI Studio storefront preview

Route: `/studio/`. Static HTML/CSS/JS, served by the existing Netlify publish root. No change to public home or client routes. Branch: `feat/sabi-studio-storefront`.

Reference: https://www.canva.com/design/DAHVOVoqGQw/-n2-H3bBFMPHPO19bGQMVg/edit

Uses the revised four-product brief from “Brand Design Expertise”. The Canva editor still displayed the older six-product layout on 4 October 2026. The two hero assets were exported from that design; the model is labelled as a styling reference, not a verified launch product photograph. Header and footer use the approved transparent PNG from SABI Studio Design WEBLOGO (Canva DAHXEqnsSVA). CSS frames the centred horizontal mark from the original square export. Product cards use explicit photo placeholders.

Before selling: replace placeholders with approved Drive product photos, verify Printful garment IDs and variants, prices and shipping; add product measurement charts and feel notes; finalise delivery, returns, privacy and terms; integrate server-validated Stripe checkout and confirmed Printful fulfilment. No cart, payment, tracking or order submission exists in this preview. Page is noindex.

Deploy as a GitHub branch/PR Netlify Deploy Preview, not a production merge. Existing netlify.toml needs no change for this static route.
