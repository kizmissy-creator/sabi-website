# Personal codes and free samples

Friends visit `/studio/#samples` (or `/studio/samples/`) and enter a personal code. The shared preview password still protects the preview first. Code entry and checkout are dialogs on the existing Studio page; the brand copy, catalogue, images and public prices are unchanged.

Codes use 20 random characters from a 32-character alphabet. Only SHA-256 code digests are committed, mapped to the existing invitation identities. Old links and new codes therefore share the same one-person allowance. The private owner code sheet is outside the publish directory; give each friend a different code rather than sharing the sheet.

The flow is code → existing product → Add sample → size and delivery details → review → confirm. Review shows item £0, delivery £0, total £0. It creates no payment, collects no card information, and does not call Stripe or the supplier. Sam manually reviews, orders and pays. Confirmation means the request was saved, not dispatched.

The server sets the zero totals, ignoring client-provided amounts. The final confirmation atomically claims the invitation, email and product together. Before that point no item is reserved, so abandoned forms consume nothing. Simultaneous claims are resolved at confirmation; the losing person can return to the collection and choose another product. Retries return the same reference. Cancelling a saved request releases the product, but the invitation and email remain used until Sam handles any changes.

Synthetic test codes share the isolated test inventory and never consume the friends’ inventory. Existing concurrency, duplicate-email, validation, preview-access and retry tests also cover this checkout.
