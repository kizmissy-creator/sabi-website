type ServicePageKind = 'admin' | 'writing'

type ServicePageProps = {
  kind: ServicePageKind
  onBack: () => void
  onEnquire: () => void
}

type ServiceOffer = {
  name: string
  price: string
  range?: string
  fit: string
  outcome: string
}

const adminOffers: ServiceOffer[] = [
  {
    name: 'SABI Admin Tool Fix',
    price: 'From £75',
    range: 'Most projects £95–£175',
    fit: 'One existing admin item needs improving, or one simple new item has a clear brief.',
    outcome: 'One clearer form, spreadsheet, tracker, template, document or task board with a limited purpose and user journey.',
  },
  {
    name: 'SABI Workflow Reset',
    price: 'From £295',
    range: 'Commonly £350–£650',
    fit: 'A recurring process is awkward, duplicated, unclear or held mainly in someone’s memory.',
    outcome: 'A simplified workflow using the smallest effective intervention, with testing and plain-language handover.',
  },
]

const writingOffers: ServiceOffer[] = [
  { name: 'SABI Clarity Edit', price: 'From £75', fit: 'You already have a full or rough draft containing the message and most of the content.', outcome: 'A clearer, better-structured version of one existing document.' },
  { name: 'Case Studies & Impact Stories', price: 'From £225', fit: 'A real project, service outcome, participant experience or customer result needs to be captured responsibly.', outcome: 'A credible story showing context, action and meaningful change.' },
  { name: 'Reports & Briefings', price: 'From £250', fit: 'Findings, records, evidence, meeting outputs or several source documents need organising.', outcome: 'A coherent report, briefing or evidence summary.' },
  { name: 'Articles & Expert Content', price: 'From £175', fit: 'An idea, interview, expertise, source pack or topic needs to become publishable content.', outcome: 'An original article, explainer, resource or thought-led piece.' },
]

export function ServiceLandingPage({ kind, onBack, onEnquire }: ServicePageProps) {
  const isAdmin = kind === 'admin'
  const offers = isAdmin ? adminOffers : writingOffers
  const title = isAdmin ? 'Admin & Systems Support' : 'Writing & Clarity'
  const introduction = isAdmin
    ? 'One awkward tool or recurring process, simplified around how you actually work. SABI focuses on reducing friction rather than adding unnecessary software or complexity.'
    : 'Good information can still fail when it is buried, scattered or written for everyone at once. SABI turns existing drafts, real experiences, evidence and expertise into writing that is clear, credible and useful.'

  return <div className="min-h-screen">
    <header className="border-b border-teal-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-5 sm:px-8"><a href="../index.html" aria-label="SABI home" className="flex items-center gap-3"><img src="/sabi-mark-complete.png" alt="" className="h-11 w-11 object-contain" /><span className="font-display text-2xl font-semibold text-teal-900">SABI</span></a><button type="button" onClick={onBack} className="font-bold text-teal-800 underline decoration-2 underline-offset-4">← Find another starting point</button></div></header>
    <div className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm font-bold text-amber-950">Development page · public enquiry only · private intake, submission and payment are not enabled</div>
    <main>
      <section className="border-b border-teal-200/60"><div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16"><p className="eyebrow">SABI service area</p><h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold text-teal-900 sm:text-5xl">{title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">{introduction}</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onEnquire} className="rounded-xl bg-teal-800 px-6 py-3 text-center font-extrabold text-white">Start a short enquiry →</button><button type="button" onClick={onBack} className="rounded-xl border-2 border-teal-700 px-6 py-3 font-bold text-teal-800">Check a different service</button></div></div></section>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><div className="max-w-3xl"><p className="eyebrow">Choose by what you have now</p><h2 className="mt-2 font-display text-3xl font-semibold text-teal-900">Where might your work fit?</h2><p className="mt-3 leading-7 text-slate-700">Starting prices help with routing and budgeting. SABI reviews the brief and relevant source material before confirming suitability, scope and a fixed written quotation.</p></div><div className={`mt-8 grid gap-5 ${isAdmin ? 'lg:grid-cols-2' : 'md:grid-cols-2'}`}>{offers.map((offer) => <article key={offer.name} className="rounded-3xl border border-teal-200 bg-white p-6 shadow-card"><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="max-w-sm font-display text-2xl font-semibold text-teal-900">{offer.name}</h3><span className="rounded-full bg-gold-400 px-3 py-1 text-sm font-extrabold text-teal-950">{offer.price}</span></div>{offer.range && <p className="mt-2 text-sm font-bold text-teal-700">{offer.range}</p>}<dl className="mt-5 space-y-4"><div><dt className="text-xs font-extrabold uppercase tracking-wide text-teal-700">Best fit</dt><dd className="mt-1 leading-7 text-slate-700">{offer.fit}</dd></div><div><dt className="text-xs font-extrabold uppercase tracking-wide text-teal-700">Primary outcome</dt><dd className="mt-1 leading-7 text-slate-700">{offer.outcome}</dd></div></dl></article>)}</div></section>
      <section className="border-y border-teal-200 bg-teal-50"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-2"><div><p className="eyebrow">How it starts</p><h2 className="mt-2 font-display text-3xl font-semibold text-teal-900">A short enquiry before detailed information</h2><ol className="mt-5 space-y-3 leading-7 text-slate-700"><li><strong>1.</strong> Send a brief enquiry with no file upload.</li><li><strong>2.</strong> SABI checks fit, boundaries, sensitivity and likely route.</li><li><strong>3.</strong> If suitable, you receive the correct private service-specific intake.</li><li><strong>4.</strong> Scope and a fixed quotation are confirmed before booking or payment.</li></ol></div><aside className="rounded-3xl border border-teal-200 bg-white p-6"><h2 className="font-display text-2xl font-semibold text-teal-900">What this page does not do</h2><ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-slate-700"><li>It does not accept files or sensitive project material.</li><li>It does not create a booking, contract or payment.</li><li>It does not guarantee that a project is suitable or within scope.</li><li>It does not mix records with Career Support or another service.</li></ul></aside></div></section>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><div className="rounded-3xl bg-teal-900 p-7 text-white sm:p-9"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-200">Important service boundaries</p><h2 className="mt-2 font-display text-3xl font-semibold">Clear scope protects the client and the work</h2>{isAdmin ? <ul className="mt-5 grid gap-3 leading-7 sm:grid-cols-2"><li>Ongoing general administration is not a standard launch service.</li><li>Complex coding, advanced integrations and large-scale migration need separate review.</li><li>SABI recommends the least complicated responsible change, which may mean no new software.</li><li>Legal, HR, financial, cybersecurity and compliance sign-off are excluded.</li></ul> : <ul className="mt-5 grid gap-3 leading-7 sm:grid-cols-2"><li>No invented facts, quotations, evidence, credentials or outcomes.</li><li>No academic ghostwriting or work that misrepresents authorship.</li><li>No legal, clinical or regulated financial drafting represented as professional advice.</li><li>No identifiable case studies involving anyone under 18 at launch.</li></ul>}<button type="button" onClick={onEnquire} className="mt-7 rounded-xl bg-gold-400 px-6 py-3 font-extrabold text-teal-950">Start a short enquiry →</button></div></section>
    </main>
  </div>
}
