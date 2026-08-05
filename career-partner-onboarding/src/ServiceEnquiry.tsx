import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

type EnquiryKind = 'admin' | 'writing'
type Values = Record<string, string | boolean>

type ServiceEnquiryProps = {
  kind: EnquiryKind
  onBack: () => void
  onStartOver: () => void
}

const initialValues: Values = {
  enquiryFor: '', contactName: '', email: '', organisation: '', authority: '', ageBand: '', startingNeed: '', currentMaterial: '', problemSummary: '', intendedOutcome: '', systemsInvolved: '', sensitiveDataLikely: '', deadlineExists: '', deadlineSummary: '', accessNeeds: '', privacyAcknowledged: false,
}

const adminNeeds = [
  ['one-existing-item', 'Improve one existing admin item'],
  ['one-simple-new-item', 'Create one simple item from a clear brief'],
  ['recurring-process', 'Improve a recurring process or workflow'],
  ['problem-not-clear', 'Work out what the real problem is'],
  ['several-connected-processes', 'Review several connected processes'],
  ['not-sure', 'I am not sure'],
]

const writingNeeds = [
  ['improve-draft', 'Improve an existing draft'],
  ['case-study', 'Create a case study or impact story'],
  ['report-briefing', 'Create a report or briefing'],
  ['article-expert-content', 'Create an article or expert content'],
  ['not-sure', 'I am not sure'],
]

const writingMaterials = [
  ['complete-draft', 'A complete draft'],
  ['rough-draft', 'A rough draft'],
  ['notes-or-sources', 'Notes or sources'],
  ['interviews-or-people', 'Interviews or people to speak to'],
  ['findings-or-records', 'Findings or records'],
  ['idea-only', 'An idea only'],
]

export function ServiceEnquiry({ kind, onBack, onStartOver }: ServiceEnquiryProps) {
  const [values, setValues] = useState<Values>(initialValues)
  const [reviewed, setReviewed] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const isAdmin = kind === 'admin'

  const route = useMemo(() => {
    if (isAdmin) return ({
      'one-existing-item': 'Admin Tool Fix review',
      'one-simple-new-item': 'Admin Tool Fix review',
      'recurring-process': 'Workflow Reset review',
      'problem-not-clear': 'Clarity Review assessment',
      'several-connected-processes': 'Tailored Systems Project assessment',
      'not-sure': 'Manual routing review',
    } as Record<string, string>)[String(values.startingNeed)]
    return ({
      'improve-draft': 'Clarity Edit review',
      'case-study': 'Case Study safeguard and suitability review',
      'report-briefing': 'Reports & Briefings review',
      'article-expert-content': 'Articles & Expert Content review',
      'not-sure': 'Manual routing review',
    } as Record<string, string>)[String(values.startingNeed)]
  }, [isAdmin, values.startingNeed])

  function update(key: string, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }))
    setReviewed(false)
  }

  function review(event: FormEvent) {
    event.preventDefault()
    const missing: string[] = []
    if (!values.enquiryFor) missing.push('Choose who the enquiry is for.')
    if (!values.contactName) missing.push('Enter a contact name.')
    if (!values.email) missing.push('Enter an email address.')
    if (!isAdmin && values.enquiryFor === 'self' && !values.ageBand) missing.push('Choose the age group that applies.')
    if (!values.startingNeed) missing.push('Choose the closest starting need.')
    if (!isAdmin && !values.currentMaterial) missing.push('Choose what material you currently have.')
    if (!values.problemSummary) missing.push(isAdmin ? 'Describe what is currently difficult.' : 'Describe the intended reader and outcome.')
    if (!values.sensitiveDataLikely) missing.push('Choose whether sensitive or third-party information may be involved.')
    if (isAdmin && !values.deadlineExists) missing.push('Choose whether a deadline exists.')
    if (!values.privacyAcknowledged) missing.push('Confirm that you have seen the privacy reminder.')
    setErrors(missing)
    setReviewed(missing.length === 0)
    window.setTimeout(() => document.getElementById(missing.length ? 'enquiry-errors' : 'enquiry-review')?.focus(), 0)
  }

  const option = (name: string, value: string, label: string) => <label key={value} className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 ${values[name] === value ? 'border-teal-700 bg-teal-50' : 'border-teal-100 bg-white'}`}><input type="radio" name={name} value={value} checked={values[name] === value} onChange={() => update(name, value)} className="mt-1 h-5 w-5 accent-teal-800" /><span className="font-semibold text-teal-950">{label}</span></label>

  return <div className="min-h-screen">
    <header className="border-b border-teal-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-5 px-5 py-5 sm:px-8"><span className="font-display text-2xl font-semibold text-teal-900">SABI</span><button type="button" onClick={onBack} className="font-bold text-teal-800 underline decoration-2 underline-offset-4">← Back to {isAdmin ? 'Admin & Systems' : 'Writing & Clarity'}</button></div></header>
    <div className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm font-bold text-amber-950">Development enquiry · fictional information only · nothing is saved or submitted</div>
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <p className="eyebrow">Stage 1 · brief routing only</p><h1 className="mt-2 font-display text-4xl font-semibold text-teal-900">{isAdmin ? 'Admin & Systems enquiry' : 'Writing & Clarity enquiry'}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">Tell SABI enough to identify the likely route. Do not include documents, passwords, account access, detailed personal information or sensitive source material here.</p>
      <form onSubmit={review} className="mt-9 space-y-6" noValidate>
        {errors.length > 0 && <section id="enquiry-errors" role="alert" tabIndex={-1} className="rounded-2xl border-2 border-red-700 bg-red-50 p-5 text-red-950 outline-none"><h2 className="text-xl font-extrabold">Please complete the required parts</h2><ul className="mt-3 list-disc space-y-1 pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></section>}
        <Question title="Who is the enquiry for?" required><div className="grid gap-3 sm:grid-cols-2">{option('enquiryFor', 'self', 'Me')}{option('enquiryFor', 'business-organisation', 'A business or organisation')}{option('enquiryFor', 'another-person', 'Another person, with their knowledge')}{option('enquiryFor', 'not-sure', 'Not sure')}</div></Question>
        <Question title="Your contact details" required><div className="grid gap-4 sm:grid-cols-2"><Input label="Contact name" value={String(values.contactName)} onChange={(value) => update('contactName', value)} /><Input label="Email address" type="email" value={String(values.email)} onChange={(value) => update('email', value)} /></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Input label="Organisation, if relevant" value={String(values.organisation)} onChange={(value) => update('organisation', value)} /><Input label="Your role or authority, if relevant" value={String(values.authority)} onChange={(value) => update('authority', value)} /></div></Question>
        {!isAdmin && values.enquiryFor === 'self' && <Question title="Which age group applies?" required><div className="grid gap-3 sm:grid-cols-3">{option('ageBand', '16-17', '16 or 17')}{option('ageBand', '18-plus', '18 or over')}{option('ageBand', 'organisation', 'Organisation enquiry')}</div></Question>}
        <Question title={isAdmin ? 'Which starting point is closest?' : 'What do you need?'} required><div className="grid gap-3 sm:grid-cols-2">{(isAdmin ? adminNeeds : writingNeeds).map(([value, label]) => option('startingNeed', value, label))}</div></Question>
        {!isAdmin && <Question title="What do you currently have?" required><div className="grid gap-3 sm:grid-cols-2">{writingMaterials.map(([value, label]) => option('currentMaterial', value, label))}</div></Question>}
        <Question title={isAdmin ? 'What is currently difficult or unreliable?' : 'Who needs to read this, and what should it help them understand or do?'} required><TextArea value={String(values.problemSummary)} onChange={(value) => update('problemSummary', value)} /></Question>
        {isAdmin && <><Question title="What would a useful outcome look like?" required={false}><TextArea value={String(values.intendedOutcome)} onChange={(value) => update('intendedOutcome', value)} /></Question><Question title="Which files, tools or platforms are involved?" required={false}><TextArea value={String(values.systemsInvolved)} onChange={(value) => update('systemsInvolved', value)} /></Question></>}
        <Question title="Could third-party, personal, confidential or sensitive information be involved?" required><div className="grid gap-3 sm:grid-cols-3">{option('sensitiveDataLikely', 'yes', 'Yes')}{option('sensitiveDataLikely', 'no', 'No')}{option('sensitiveDataLikely', 'not-sure', 'Not sure')}</div><p className="mt-3 text-sm leading-6 text-slate-600">Do not describe that information here. This answer only flags that a controlled route may be needed.</p></Question>
        {isAdmin && <Question title="Is there a deadline?" required><div className="grid gap-3 sm:grid-cols-3">{option('deadlineExists', 'yes', 'Yes')}{option('deadlineExists', 'no', 'No')}{option('deadlineExists', 'not-sure', 'Not sure')}</div>{values.deadlineExists === 'yes' && <div className="mt-4"><Input label="Brief deadline summary" value={String(values.deadlineSummary)} onChange={(value) => update('deadlineSummary', value)} /></div>}</Question>}
        {!isAdmin && <Question title="Is there a deadline?" required={false}><Input label="Brief deadline summary" value={String(values.deadlineSummary)} onChange={(value) => update('deadlineSummary', value)} /><p className="mt-3 text-sm leading-6 text-slate-600">A requested deadline does not reserve urgent capacity or create an express service.</p></Question>}
        <Question title="Anything that would make communication or the next step more accessible?" required={false}><TextArea value={String(values.accessNeeds)} onChange={(value) => update('accessNeeds', value)} /></Question>
        <Question title="Privacy reminder" required><label className="flex gap-3 rounded-2xl border border-teal-200 bg-white p-4"><input type="checkbox" checked={Boolean(values.privacyAcknowledged)} onChange={(event) => update('privacyAcknowledged', event.target.checked)} className="mt-1 h-5 w-5 accent-teal-800" /><span>I understand this development page does not submit information and that a live form must show the approved Privacy Notice before use.</span></label></Question>
        <button type="submit" className="w-full rounded-2xl bg-teal-800 px-6 py-4 font-extrabold text-white">Review fictional enquiry</button>
      </form>
      {reviewed && <section id="enquiry-review" tabIndex={-1} className="mt-8 rounded-3xl border-2 border-teal-700 bg-teal-50 p-6 outline-none sm:p-8"><p className="eyebrow">Development routing result</p><h2 className="mt-2 font-display text-3xl font-semibold text-teal-900">{route}</h2><p className="mt-3 leading-7 text-slate-700">A live submission would require a dedicated {isAdmin ? 'Admin & Systems' : 'Writing & Clarity'} receiver and restricted record store. Neither is connected here.</p><button type="button" disabled className="mt-5 rounded-xl bg-slate-300 px-6 py-3 font-extrabold text-slate-600">Submission disabled</button><button type="button" onClick={onStartOver} className="ml-0 mt-3 rounded-xl border-2 border-teal-700 px-6 py-3 font-bold text-teal-800 sm:ml-3">Return to starting point</button></section>}
    </main>
  </div>
}

function Question({ title, required, children }: { title: string, required: boolean, children: ReactNode }) {
  return <fieldset className="rounded-3xl border border-teal-200 bg-white p-5 shadow-card sm:p-7"><legend className="px-2 font-display text-2xl font-semibold text-teal-900">{title}</legend><p className="mb-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">{required ? 'Required' : 'Optional'}</p>{children}</fieldset>
}

function Input({ label, value, onChange, type = 'text' }: { label: string, value: string, onChange: (value: string) => void, type?: string }) {
  return <label className="block font-bold text-teal-950">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="field mt-2 font-normal" /></label>
}

function TextArea({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  return <textarea aria-label="Your answer" value={value} onChange={(event) => onChange(event.target.value)} className="field min-h-32 resize-y" />
}
