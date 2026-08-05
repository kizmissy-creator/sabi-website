import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { InformationCard, PageHeader, SelectableOptionCard, TextArea, TextInput } from './components'
import {
  addOns,
  arrangementOptions,
  contactOptions,
  difficultyOptions,
  employmentOptions,
  hoursOptions,
  priorityOptions,
  sections,
  services,
  skillOptions,
  travelOptions,
  type ServiceId,
} from './framework'
import { createDevelopmentControlRecord, type ControlKey, type DevelopmentControlRecord } from './developmentRecords'
import { ServiceLandingPage } from './ServicePages'
import { ServiceEnquiry } from './ServiceEnquiry'

type Answers = Record<string, string | string[] | boolean>
type RepeatItem = Record<string, string>
type ValidationIssue = { key: string, message: string }

const initialAnswers: Answers = {
  service: 'career-partner', ageBand: '', firstName: '', lastName: '', preferredName: '', pronouns: '', email: '', phone: '', location: '',
  contactAllowed: ['Email'], contactPrimary: 'Email', employmentStatus: [], priorities: [], arrangements: [], hours: [], travel: [], skills: [], difficulties: [], addOns: [],
  accessibilityGate: '', specialConsent: false, payerDifferent: 'No', termsAccepted: false, earlyStart: false, declaration: false,
}

const singleOptions: Record<string, string[]> = {
  ageBand: ['16 or 17', '18 or over', 'Under 16'],
  lifeStageImpact: ['Yes', 'No', 'Not sure'],
  payMinimum: ['Yes', 'No', 'Not sure'],
  clarity: ['I know exactly what role I want', 'I have a few possible ideas', 'I know the type of work but not the title', 'I know what I want to avoid', 'I am completely unsure'],
  searchStage: ['Not started', 'Preparing', 'Looking', 'Applying', 'Interviewing', 'Paused'],
  deadline: ['No', 'Yes, more than 10 working days away', 'Yes, within 10 working days', 'Not sure'],
  consultation: ['Written process', 'Telephone', 'Video', 'No preference'],
  accessibilityGate: ['Yes', 'No', 'Prefer to discuss privately'],
  supporter: ['Yes', 'No'], payerDifferent: ['Yes', 'No'],
}

function App() {
  const [journey, setJourney] = useState<'router' | 'career' | 'admin' | 'writing' | 'admin-enquiry' | 'writing-enquiry'>('router')
  const [answers, setAnswers] = useState<Answers>(initialAnswers)
  const [step, setStep] = useState(0)
  const [saveMessage, setSaveMessage] = useState('Development mode: fictional data only. Nothing is submitted.')
  const [roles, setRoles] = useState<RepeatItem[]>([{ title: '', organisation: '', dates: '', responsibilities: '', achievements: '', leaving: '' }])
  const [qualifications, setQualifications] = useState<RepeatItem[]>([{ title: '', provider: '', dates: '', status: '' }])
  const [examples, setExamples] = useState<RepeatItem[]>([{ title: '', link: '', appeal: '', concerns: '' }])
  const [simulatedFiles, setSimulatedFiles] = useState<string[]>([])
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [controlRecords, setControlRecords] = useState<Partial<Record<ControlKey, DevelopmentControlRecord>>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sabi-career-form-development')
      if (!saved) return
      const data = JSON.parse(saved)
      setAnswers({ ...initialAnswers, ...data.answers })
      setRoles(data.roles?.length ? data.roles : roles)
      setQualifications(data.qualifications?.length ? data.qualifications : qualifications)
      setExamples(data.examples?.length ? data.examples : examples)
      setSimulatedFiles(data.simulatedFiles ?? [])
      setControlRecords(data.controlRecords ?? {})
      setStep(Math.min(data.step ?? 0, sections.length - 1))
      setSaveMessage('Restored fictional development data from this browser.')
    } catch {
      setSaveMessage('The previous local development draft could not be restored.')
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem('sabi-career-form-development', JSON.stringify({ answers, roles, qualifications, examples, simulatedFiles, controlRecords, step }))
      setSaveMessage('Saved locally on this device. No information was transmitted.')
    }, 400)
    return () => window.clearTimeout(timer)
  }, [answers, roles, qualifications, examples, simulatedFiles, controlRecords, step])

  const service = services.find((item) => item.id === answers.service) ?? services[2]
  const selectedAddOns = addOns.filter((item) => (answers.addOns as string[]).includes(item.id) && !(service.id === 'career-partner-plus' && item.id === 'interview'))
  const total = service.price + selectedAddOns.reduce((sum, item) => sum + item.price, 0)
  const scopeFlags = useMemo(() => {
    const flags: string[] = []
    if (answers.deadline === 'Yes, within 10 working days') flags.push('An urgent deadline needs manual acceptance before payment.')
    if ((service.id === 'career-partner' || service.id === 'career-partner-plus') && (!answers.cpDirection || answers.clarity === 'I am completely unsure')) flags.push('Career Partner needs a usable broad direction; Career Change or a tailored option may fit better.')
    if ((service.id === 'career-partner' || service.id === 'career-partner-plus') && answers.applicationExists === 'I need most or all of it written') flags.push('From-scratch or specialist application writing needs a tailored quotation.')
    if (service.id === 'starter-cv' && answers.starterEligible === 'No') flags.push('This history may need Professional CV or a tailored quotation.')
    return flags
  }, [answers, service.id])

  function setValue(key: string, value: string | string[] | boolean) {
    setAnswers((current) => ({ ...current, [key]: value }))
  }

  function recordControl(key: ControlKey, selected: boolean) {
    setValue(key, selected)
    setControlRecords((current) => ({ ...current, [key]: createDevelopmentControlRecord(key, selected) }))
  }

  function setServiceFit(value: string) {
    const suggested: Record<string, ServiceId> = {
      'I know the target and need one strong CV': 'professional-cv',
      'I want to change direction or work out what fits': 'career-change',
      'I have a broad direction and need coordinated application documents': 'career-partner',
      'I also need interview preparation and short follow-up support': 'career-partner-plus',
      'I need a first CV for a limited, straightforward history': 'starter-cv',
    }
    setAnswers((current) => ({ ...current, serviceFit: value, service: suggested[value] }))
  }

  function toggle(key: string, value: string) {
    const values = (answers[key] as string[]) ?? []
    setValue(key, values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  function updateRepeat(setter: Dispatch<SetStateAction<RepeatItem[]>>, index: number, key: string, value: string) {
    setter((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item))
  }

  function move(next: number) {
    setValidationIssues([])
    setStep(Math.max(0, Math.min(next, sections.length - 1)))
    window.setTimeout(() => document.getElementById('form-section')?.scrollIntoView({ block: 'start' }), 0)
  }

  function issuesForStep(): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    const requireValue = (condition: boolean, key: string, message: string) => { if (!condition) issues.push({ key, message }) }
    if (step === 0) {
      requireValue(Boolean(answers.serviceFit), 'service-fit-first', 'Choose the statement closest to what you need.')
      requireValue(Boolean(answers.ageBand), 'ageBand', 'Choose your age group.')
    }
    if (step === 1) {
      requireValue(Boolean(answers.firstName), 'firstName', 'Enter your first name.')
      requireValue(Boolean(answers.lastName), 'lastName', 'Enter your last name.')
      requireValue(Boolean(answers.email), 'email', 'Enter your email address.')
      requireValue(Boolean(answers.location), 'location', 'Enter your town, city or postcode area.')
    }
    if (step === 2) {
      requireValue((answers.employmentStatus as string[]).length > 0, 'employmentStatus', 'Choose at least one current situation.')
      requireValue(Boolean(answers.currentRoleApplies), 'currentRoleApplies', 'Tell us whether a current or recent role applies.')
    }
    if (step === 3) requireValue(Boolean(answers.workHistoryMethod), 'workHistoryMethod', 'Choose how you would like to provide your work history.')
    if (step === 4) {
      requireValue(Boolean(answers.clarity), 'clarity', 'Choose how clear you feel about your next role.')
      requireValue(Boolean(answers.preferenceDetail), 'preferenceDetail', 'Choose whether to add practical preferences now.')
    }
    if (step === 5) requireValue(((answers.evidenceSources as string[]) ?? []).length > 0, 'evidenceSources', 'Choose at least one possible source of skills evidence.')
    if (step === 6) {
      requireValue(Boolean(answers.searchStage), 'searchStage', 'Choose where you are with looking or applying for work.')
      requireValue(Boolean(answers.applicationSupportNow), 'applicationSupportNow', 'Tell us whether active applications should be considered.')
    }
    return issues
  }

  function requestMove(next: number) {
    const issues = issuesForStep()
    if (issues.length > 0) {
      setValidationIssues(issues)
      window.setTimeout(() => document.getElementById('validation-summary')?.focus(), 0)
      return
    }
    move(next)
  }

  function focusIssue(key: string) {
    const target = key === 'service-fit-first'
      ? document.querySelector<HTMLButtonElement>('button[data-service-fit]')
      : document.querySelector<HTMLElement>(`[name="${key}"]`)
    target?.focus()
  }

  function addSimulatedFiles(files: FileList | null) {
    if (!files) return
    setSimulatedFiles((current) => [...current, ...Array.from(files).map((file) => file.name)])
  }

  const text = (key: string, label: string, help?: string, optional = true) => (
    <Field label={label} help={help} optional={optional}><TextInput id={key} name={key} label={label} value={(answers[key] as string) ?? ''} onChange={(event) => setValue(key, event.target.value)} /></Field>
  )
  const area = (key: string, label: string, help?: string, optional = true) => (
    <Field label={label} help={help} optional={optional}><TextArea id={key} name={key} label={label} value={(answers[key] as string) ?? ''} onChange={(event) => setValue(key, event.target.value)} /></Field>
  )
  const choices = (key: string, label: string, options: string[], multiple = false, help?: string, optional = true) => (
    <Field label={label} help={help} optional={optional}><div className="grid gap-3 sm:grid-cols-2">{options.map((option) => <SelectableOptionCard key={option} name={key} value={option} label={option} type={multiple ? 'checkbox' : 'radio'} selected={multiple ? ((answers[key] as string[]) ?? []).includes(option) : answers[key] === option} onChange={() => multiple ? toggle(key, option) : setValue(key, option)} />)}</div></Field>
  )
  const sectionReady = [
    Boolean(answers.serviceFit && answers.ageBand) && answers.ageBand !== 'Under 16',
    Boolean(answers.firstName && answers.lastName && answers.email && answers.location),
    (answers.employmentStatus as string[]).length > 0 && Boolean(answers.currentRoleApplies),
    Boolean(answers.workHistoryMethod),
    Boolean(answers.clarity && answers.preferenceDetail),
    ((answers.evidenceSources as string[]) ?? []).length > 0,
    Boolean(answers.searchStage && answers.applicationSupportNow),
    true, true, true, true,
  ]

  if (journey === 'router') return <StartingPointRouter onOpenJourney={setJourney} />
  if (journey === 'admin' || journey === 'writing') return <ServiceLandingPage kind={journey} onBack={() => setJourney('router')} onEnquire={() => setJourney(journey === 'admin' ? 'admin-enquiry' : 'writing-enquiry')} />
  if (journey === 'admin-enquiry' || journey === 'writing-enquiry') {
    const kind = journey === 'admin-enquiry' ? 'admin' : 'writing'
    return <ServiceEnquiry kind={kind} onBack={() => setJourney(kind)} onStartOver={() => setJourney('router')} />
  }

  return <div className="min-h-screen">
    <PageHeader currentStep={step + 1} totalSteps={sections.length} stepLabel={sections[step][1]} />
    <div className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm font-bold text-amber-950">Development shell · use fictional information only · uploads, verification, submission and payment are simulated</div>
    <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8"><button type="button" onClick={() => setJourney('router')} className="font-bold text-teal-800 underline decoration-2 underline-offset-4">← Back to Find Your Starting Point</button></div>
    <main>
      <section className="border-b border-teal-200/60"><div className="mx-auto grid max-w-6xl gap-7 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_22rem]">
        <div><p className="eyebrow mb-3">SABI Career Support</p><h1 className="font-display text-4xl font-semibold text-teal-900 sm:text-5xl">A thoughtful intake, built around real life</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">Use existing documents where helpful, answer in your own words and skip optional details you would rather discuss directly.</p></div>
        <InformationCard title={service.name}><p className="text-3xl font-bold text-teal-800">£{service.price}</p><p className="mt-2 text-sm leading-6 text-slate-700">{service.summary}</p></InformationCard>
      </div></section>

      <section id="form-section" className="mx-auto max-w-5xl scroll-mt-4 px-5 py-10 sm:px-8">
        <nav aria-label="Form sections" className="mb-8 flex gap-2 overflow-x-auto pb-2">{sections.map(([id, title], index) => <button key={id} type="button" onClick={() => move(index)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${index === step ? 'bg-teal-800 text-white' : 'bg-white text-teal-800 ring-1 ring-teal-200'}`}>{index + 1}. {title}</button>)}</nav>
        <div className="mb-7 border-l-4 border-gold-400 pl-5"><p className="eyebrow">Section {step + 1} of {sections.length}</p><h2 className="mt-2 font-display text-3xl font-semibold text-teal-900">{sections[step][1]}</h2></div>

        <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
          {validationIssues.length > 0 && <section id="validation-summary" role="alert" aria-labelledby="validation-title" tabIndex={-1} className="rounded-2xl border-2 border-red-700 bg-red-50 p-5 text-red-950 outline-none focus:ring-4 focus:ring-red-300"><h3 id="validation-title" className="text-xl font-extrabold">Please answer the required questions</h3><p className="mt-2">Your other answers are still saved. Choose a message below to move to that question.</p><ul className="mt-3 list-disc space-y-2 pl-5">{validationIssues.map((issue) => <li key={issue.key}><button type="button" onClick={() => focusIssue(issue.key)} className="font-bold underline decoration-2 underline-offset-2">{issue.message}</button></li>)}</ul></section>}
          {step === 0 && <>
            <Info title="Before you begin">This development form stores fictional answers only in this browser. The finished service will provide secure email verification, save-and-return and private records. Read the SABI Privacy Notice before entering detailed information.</Info>
            <Field label="Which statement is closest to what you need?" help="This suggests a starting service. You can still choose a different service below." optional={false}><div className="grid gap-3">{Object.entries({
              'I know the target and need one strong CV': 'Professional CV',
              'I want to change direction or work out what fits': 'Career Change',
              'I have a broad direction and need coordinated application documents': 'Career Partner',
              'I also need interview preparation and short follow-up support': 'Career Partner Plus',
              'I need a first CV for a limited, straightforward history': 'Starter CV',
            }).map(([answer, result], index) => <button type="button" key={answer} data-service-fit={index === 0 ? 'first' : undefined} onClick={() => setServiceFit(answer)} className={`rounded-2xl border-2 p-4 text-left ${answers.serviceFit === answer ? 'border-teal-700 bg-teal-50' : 'border-teal-100 bg-white'}`}><strong className="block text-teal-900">{answer}</strong><span className="mt-1 block text-sm text-slate-600">Suggested starting point: {result}</span></button>)}</div></Field>
            {answers.serviceFit && <Info title={`Suggested starting point: ${service.name}`}>This is a guide, not an automatic suitability decision. Any combined, urgent, specialist or materially different work is reviewed before payment.</Info>}
            <h3 className="font-display text-2xl font-semibold text-teal-900">Confirm the service you want to explore</h3>
            <div className="grid gap-3 sm:grid-cols-2">{services.map((item) => <button type="button" key={item.id} onClick={() => setValue('service', item.id)} className={`rounded-2xl border-2 p-4 text-left ${service.id === item.id ? 'border-teal-700 bg-teal-50' : 'border-teal-100 bg-white'}`}><span className="font-display text-xl font-semibold text-teal-900">{item.name}</span><span className="float-right font-bold text-teal-800">£{item.price}</span><p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p></button>)}</div>
            {choices('ageBand', 'Which age group applies to you?', singleOptions.ageBand, false, 'Career Support is available from age 16 at launch. A full date of birth is not required.')}
            {answers.ageBand === 'Under 16' && <Info tone="warning" title="This service is currently available from age 16">Please speak with a school, college or appropriate careers-support service. No email verification, detailed intake or payment will be started.</Info>}
            {answers.ageBand === '16 or 17' && <Info title="You can continue directly">You do not need a parent or guardian solely because of your age. A supporter or different payer remains optional.</Info>}
          </>}

          {step === 1 && <>
            <div className="grid gap-5 sm:grid-cols-2">{text('firstName', 'First name', undefined, false)}{text('lastName', 'Last name', undefined, false)}{text('preferredName', 'What name would you like me to use?')}{text('pronouns', 'Pronouns')}</div>
            {text('email', 'Email address', 'Secure verification is simulated in this development build.', false)}
            {choices('contactAllowed', 'How are you happy for SABI to contact you?', contactOptions, true)}
            {choices('contactPrimary', 'Which contact method should I normally try first?', (answers.contactAllowed as string[]).length ? answers.contactAllowed as string[] : ['Email'])}
            {(answers.contactAllowed as string[]).some((item) => item === 'Telephone' || item === 'SMS where available') && text('phone', 'Telephone number', undefined, false)}
            {text('location', 'Where are you based?', 'Town, city or postcode area is enough. A full home address is not needed.', false)}
            {choices('lifeStageImpact', 'Does your current stage of life affect the opportunities, timing or support that may suit you?', singleOptions.lifeStageImpact)}
            {(answers.lifeStageImpact === 'Yes' || answers.lifeStageImpact === 'Not sure') && area('lifeStageDetail', 'Tell me anything about this that would be useful')}
          </>}

          {step === 2 && <>
            {choices('employmentStatus', 'Which of these best describe your current situation?', employmentOptions, true)}
            {choices('currentRoleApplies', 'Do you have a current or recent role you want to describe here?', ['Yes', 'No', 'Not sure or prefer to discuss'], false, 'Choose No if your most useful experience comes from education, caring, volunteering, projects or another setting.', false)}
            {answers.currentRoleApplies === 'Yes' && <>{text('currentRole', 'What is your current or most recent role?', 'Use the title you were given or describe the work.')}{text('currentOrganisation', 'Organisation or setting')}{text('currentDates', 'When did you do this role?', 'Approximate month and year are enough.')}{area('currentLikes', 'What do you like about your current or most recent work?', 'Think about tasks, environment, people, pace, purpose or ways of working.')}{area('currentChange', 'What would you like to change about it?', 'You can mention tasks, hours, pay, progression, travel, pressure or anything else that matters.')}</>}
            {answers.currentRoleApplies === 'No' && area('currentSituationDetail', 'What experience or current situation would be more useful to start with?', 'This could be education, caring, volunteering, projects, recovery, job seeking or another part of your life.')}
            {answers.currentRoleApplies === 'Not sure or prefer to discuss' && <Info title="You can leave the detailed role fields for later">SABI can identify the most useful starting point through follow-up questions or an agreed discussion.</Info>}
          </>}

          {step === 3 && <>
            {choices('workHistoryMethod', 'What is the easiest way to give SABI your work history?', ['Upload a reasonably complete CV or work-history document', 'Upload a document, then add or correct missing details', 'Enter the relevant history here', 'I am not sure or would prefer to discuss it'], false, 'Manual history is only needed when an uploaded document is absent or incomplete.', false)}
            {(answers.workHistoryMethod === 'Upload a reasonably complete CV or work-history document' || answers.workHistoryMethod === 'Upload a document, then add or correct missing details') && <SimulatedUpload label="Existing CV or work-history document" files={simulatedFiles} onFiles={addSimulatedFiles} onRemove={(name) => setSimulatedFiles((items) => items.filter((item) => item !== name))} />}
            {(answers.workHistoryMethod === 'Upload a document, then add or correct missing details' || answers.workHistoryMethod === 'Enter the relevant history here') && <Repeating title="Work, self-employment or substantial roles" items={roles} onChange={(index, key, value) => updateRepeat(setRoles, index, key, value)} onAdd={() => setRoles((items) => [...items, { title: '', organisation: '', dates: '', responsibilities: '', achievements: '', leaving: '' }])} onRemove={(index) => setRoles((items) => items.filter((_, itemIndex) => itemIndex !== index))} fields={[['title','Role or activity'],['organisation','Organisation or setting'],['dates','Approximate dates and hours/type'],['responsibilities','Responsibilities'],['achievements','Achievements'],['leaving','Reason for leaving, optional']]} />}
            {answers.workHistoryMethod && answers.workHistoryMethod !== 'Upload a reasonably complete CV or work-history document' && area('employmentGaps', 'Is there any gap or transition that you would like help presenting?', 'Not every gap needs to appear on a CV. SABI will not invent dates or activities.')}
            {answers.workHistoryMethod === 'I am not sure or would prefer to discuss it' && <Info title="That is fine">SABI can agree a written or discussion-based way to collect only the history needed for your service.</Info>}
          </>}

          {step === 4 && <>
            {choices('clarity', 'How clear do you currently feel about what you would like to do next?', singleOptions.clarity, false, undefined, false)}
            {answers.clarity && answers.clarity !== 'I am completely unsure' && area('roleIdeas', 'Are there any roles, sectors or types of work you are considering?')}
            {answers.clarity === 'I am completely unsure' && <Info title="You do not need a finished career idea">The Career Change route can explore realistic directions before a CV target is agreed.</Info>}
            {choices('preferenceDetail', 'Would you like to add practical preferences and limits now?', ['Yes, show the detailed questions', 'No, I have no important limits to add', 'I would prefer to discuss these'], false, 'These details help rule in realistic work rather than making assumptions.', false)}
            {answers.preferenceDetail === 'Yes, show the detailed questions' && <>{choices('priorities', 'What matters most to you in your next role?', priorityOptions, true)}{choices('arrangements', 'What working arrangements would you consider?', arrangementOptions, true)}{choices('hours', 'What hours or working pattern could work for you?', hoursOptions, true)}{area('availabilityLimits', 'Are there days, times or practical limits SABI should take into account?')}{choices('travel', 'How are you able to travel for work?', travelOptions, true)}{text('commuteLimit', 'What is the longest journey you would usually consider for work?', 'Give a time, distance, area or Remote work only.', false)}{choices('payMinimum', 'Do you have a minimum level of pay you need?', singleOptions.payMinimum)}{(answers.payMinimum === 'Yes' || answers.payMinimum === 'Not sure') && text('payDetail', 'What pay level or range should SABI use as a practical guide?', 'State whether this is annual, hourly, daily or another basis.')}{area('avoidWork', 'Is there any work, environment or condition you know you do not want?')}</>}
            {answers.preferenceDetail === 'I would prefer to discuss these' && <Info title="Practical preferences can be discussed">A written alternative remains available; choosing discussion here does not require video.</Info>}
          </>}

          {step === 5 && <>
            {choices('evidenceSources', 'Where might useful evidence about your skills come from?', ['Paid work or self-employment', 'Education or training', 'Volunteering or community activity', 'Caring or household responsibilities', 'Advocacy or lived experience', 'Projects, hobbies or interests', 'I am not sure yet'], true, 'Choose every source that might be relevant. You do not need to translate it into polished career language.', false)}
            {((answers.evidenceSources as string[]) ?? []).length > 0 && <>{choices('skills', 'Which of these do you feel confident doing?', skillOptions, true)}{area('skillsExamples', 'Tell me about anything you do well or people rely on you for', 'Examples can come from work, education, caring, volunteering, hobbies, advocacy, projects or daily life.')}{area('otherStrengths', 'If someone who knows you well described your strengths, what might they say?')}{area('tools', 'Which software, systems, equipment or digital tools have you used?')}{choices('technologyLearning', 'How do you usually feel about learning a new system or technology?', ['Comfortable', 'Comfortable with time or guidance', 'It depends', 'Often difficult', 'Not sure'])}{choices('hasQualifications', 'Do you have relevant qualifications, training, licences or memberships?', ['Yes', 'No'])}{answers.hasQualifications === 'Yes' && <Repeating title="Qualifications, training, licences or memberships" items={qualifications} onChange={(index, key, value) => updateRepeat(setQualifications, index, key, value)} onAdd={() => setQualifications((items) => [...items, { title: '', provider: '', dates: '', status: '' }])} onRemove={(index) => setQualifications((items) => items.filter((_, itemIndex) => itemIndex !== index))} fields={[['title','Official title'],['provider','Provider and level'],['dates','Dates or expiry'],['status','Grade, result or status']]} />}{(answers.evidenceSources as string[]).some((item) => ['Volunteering or community activity', 'Caring or household responsibilities', 'Advocacy or lived experience', 'Projects, hobbies or interests'].includes(item)) && area('unpaidExperience', 'Tell me about relevant unpaid experience, responsibility or projects')}{area('achievement', 'Is there anything you have done, created, managed or overcome that you feel proud of?')}{(answers.evidenceSources as string[]).includes('Projects, hobbies or interests') && area('interests', 'Are there interests, hobbies or subjects that show what you enjoy or are good at?')}</>}
          </>}

          {step === 6 && <>
            {choices('searchStage', 'Where are you currently with looking or applying for work?', singleOptions.searchStage)}
            {answers.searchStage && choices('applicationSupportNow', 'Do you have active jobs, applications or interviews you want this service to consider?', ['Yes', 'No', 'Not yet, but I want preparation', 'Not sure'], false, undefined, false)}
            {answers.applicationSupportNow && <>{choices('difficulties', 'Which parts currently feel difficult?', difficultyOptions, true)}{area('currentStrategies', 'What are you already doing that seems useful?')}</>}
            {(answers.applicationSupportNow === 'Yes' || answers.applicationSupportNow === 'Not sure') && <Repeating title="Example jobs, roles or organisations" items={examples} onChange={(index, key, value) => updateRepeat(setExamples, index, key, value)} onAdd={() => setExamples((items) => [...items, { title: '', link: '', appeal: '', concerns: '' }])} onRemove={(index) => setExamples((items) => items.filter((_, itemIndex) => itemIndex !== index))} fields={[['title','Role or organisation'],['link','Link, optional'],['appeal','What appeals'],['concerns','Any concerns']]} />}
            {area('supportGoal', 'What would you most like this support to help you achieve?', 'Describe what would make the service feel useful to you.', false)}
            {choices('deadline', 'Do you have a vacancy, interview or other deadline?', singleOptions.deadline)}
            {answers.deadline !== 'No' && answers.deadline && area('deadlineDetail', 'Tell SABI about the deadline', 'Include the date, time, time zone and what must be completed.')}
            {(answers.applicationSupportNow === 'Yes' || (answers.deadline && answers.deadline !== 'No')) && <SimulatedUpload label="Job advert, application draft or other supporting document" files={simulatedFiles} onFiles={addSimulatedFiles} onRemove={(name) => setSimulatedFiles((items) => items.filter((item) => item !== name))} />}
          </>}

          {step === 7 && <ServiceQuestions serviceId={service.id} answers={answers} setValue={setValue} area={area} choices={choices} />}

          {step === 8 && <>
            {choices('accessibilityGate', 'Would you like to tell SABI about practical communication, accessibility or support needs?', singleOptions.accessibilityGate, false, 'Optional. You do not need a diagnosis.')}
            {answers.accessibilityGate === 'Yes' && <Field label="Optional special-category consent"><label className="flex gap-3 rounded-2xl border border-teal-200 bg-white p-4"><input type="checkbox" checked={Boolean(answers.specialConsent)} onChange={(event) => recordControl('specialConsent', event.target.checked)} /><span>I explicitly consent to SABI using any health, disability or neurodivergence information I choose to provide for the purpose of adapting and delivering my career support. I understand that these questions are optional, I do not need to name a diagnosis, and I can withdraw my consent at any time.</span></label>{controlRecords.specialConsent && <ControlEvidence record={controlRecords.specialConsent} />}</Field>}
            {answers.accessibilityGate === 'Yes' && !answers.specialConsent && <Info tone="warning" title="Sensitive questions remain locked">You can give consent, choose No, or continue without providing sensitive information.</Info>}
            {Boolean(answers.specialConsent) && area('accessPractical', 'What would help you take part in the service?', 'Examples include written questions, processing time, shorter sections, reminders, captions or reduced video use.')}
            {Boolean(answers.specialConsent) && choices('disclosureSupport', 'Would you like support thinking about reasonable adjustments or disclosure?', ['Yes', 'No', 'Not sure'])}
            {choices('consultation', 'How would you prefer any useful consultation or follow-up discussion?', singleOptions.consultation)}
            {(answers.consultation === 'Telephone' || answers.consultation === 'Video') && area('consultAvailability', 'When are you usually available?', 'Broad days and times are enough; this does not book an appointment.')}
            {choices('supporter', 'Would you like another person to support you with the form, consultation or communication?', singleOptions.supporter)}
            {answers.supporter === 'Yes' && area('supporterDetails', 'Who will be involved and what would you like them to do?', 'Include contact details only where needed and explain any information-sharing authority.')}
          </>}

          {step === 9 && <>
            <Field label="Optional additions"><div className="grid gap-3 sm:grid-cols-2">{addOns.map((item) => { const unavailable = service.id === 'career-partner-plus' && item.id === 'interview'; return <label key={item.id} className={`flex gap-3 rounded-2xl border p-4 ${unavailable ? 'bg-slate-100 text-slate-500' : 'bg-white border-teal-200'}`}><input type="checkbox" disabled={unavailable} checked={(answers.addOns as string[]).includes(item.id)} onChange={() => toggle('addOns', item.id)} /><span><strong>{item.name} · £{item.price}</strong>{unavailable && <small className="block">Already included in Career Partner Plus</small>}</span></label> })}</div></Field>
            {choices('payerDifferent', 'Is someone else paying for this service?', singleOptions.payerDifferent)}
            {answers.payerDifferent === 'Yes' && <><Info title="Client information remains private">Payment does not authorise the payer to receive intake answers, documents or career decisions.</Info>{text('payerName', 'Payer name', undefined, false)}{text('payerEmail', 'Payer email', undefined, false)}{text('payerRole', 'Relationship or funding role')}</>}
            {area('additionalInfo', 'Is there anything else you would like SABI to know?')}
            {choices('source', 'How did you first hear about SABI?', ['Search engine', 'Social media', 'Recommendation', 'Existing contact', 'Event or community', 'Other'])}
          </>}

          {step === 10 && <>
            <Review service={service} answers={answers} selectedAddOns={selectedAddOns} total={total} roles={roles} qualifications={qualifications} files={simulatedFiles} scopeFlags={scopeFlags} controlRecords={controlRecords} onEdit={(index: number) => move(index)} />
            <Info title="Privacy reminder">The live form must show the current Privacy Notice again here. Privacy information is not an agreement checkbox.</Info>
            <Field label="Terms and declarations"><div className="space-y-3">{[
              ['termsAccepted', 'I have read and agree to the SABI Career Support Terms and the Service Schedule for this purchase'],
              ['earlyStart', 'I ask SABI to begin providing my service during the 14-day cancellation period. I understand that a reasonable amount may be deducted if I cancel after work begins, and that I lose the right to cancel once the service has been fully performed.'],
              ['declaration', 'I confirm that the information supplied is accurate to the best of my knowledge and that I will review final documents before using them'],
            ].map(([key, label]) => <div key={key}><label className="flex gap-3 rounded-2xl border border-teal-200 bg-white p-4"><input type="checkbox" checked={Boolean(answers[key])} onChange={(event) => recordControl(key as ControlKey, event.target.checked)} /><span>{label}</span></label>{controlRecords[key as ControlKey] && <ControlEvidence record={controlRecords[key as ControlKey]!} />}</div>)}</div></Field>
            {scopeFlags.length > 0 && <Info tone="warning" title="Manual scope review required">{scopeFlags.join(' ')}</Info>}
            {!answers.termsAccepted && <section role="alert" className="rounded-2xl border-2 border-red-700 bg-red-50 p-5 text-red-950"><h3 className="font-extrabold">Terms acceptance is required before payment</h3><p className="mt-2">Review and accept the Career Support Terms and Service Schedule above. Your form answers remain saved.</p></section>}
            <button type="button" disabled className="w-full rounded-2xl bg-slate-300 px-6 py-4 font-extrabold text-slate-600">Secure payment disabled in development · £{total}</button>
          </>}

          <div className="rounded-3xl bg-teal-900 p-5 text-white sm:p-7"><div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-between"><button type="button" onClick={() => requestMove(step + 1)} disabled={step === sections.length - 1 || answers.ageBand === 'Under 16'} className="rounded-xl bg-gold-400 px-6 py-3 font-extrabold text-teal-900 disabled:opacity-40">{step === sections.length - 2 ? 'Review answers' : 'Continue →'}</button><button type="button" onClick={() => move(step - 1)} disabled={step === 0} className="rounded-xl px-5 py-3 font-bold disabled:opacity-30">← Back</button></div>{!sectionReady[step] && step < 7 && <p className="mt-3 text-sm font-semibold text-amber-200">Answer the gateway questions shown above to continue. Detailed questions appear only when relevant.</p>}<p className="mt-4 border-t border-white/20 pt-4 text-sm" aria-live="polite">{saveMessage}</p></div>
        </form>
      </section>
    </main>
  </div>
}

type StartingArea = 'career' | 'admin' | 'writing' | 'unsure'
type StartingStyle = 'defined' | 'explore' | 'enquiry'

const startingAreas: Array<{ id: StartingArea, title: string, description: string }> = [
  { id: 'career', title: 'Career & Job Support', description: 'CVs, applications, interviews, career direction or a coordinated job-search package.' },
  { id: 'admin', title: 'Admin & Systems Support', description: 'Organising administration, improving practical systems or creating a clearer way of working.' },
  { id: 'writing', title: 'Writing & Clarity', description: 'Making important information, documents or communications clearer and more effective.' },
  { id: 'unsure', title: 'I am not sure, or it crosses more than one area', description: 'Start with a brief enquiry so SABI can help identify the right route without collecting a full intake.' },
]

const startingStyles: Array<{ id: StartingStyle, title: string, description: string }> = [
  { id: 'defined', title: 'I know the outcome I need', description: 'You can describe a fairly specific piece of work or result.' },
  { id: 'explore', title: 'I need help working out the right starting point', description: 'You know the general area, but the service or scope is not yet clear.' },
  { id: 'enquiry', title: 'I only want to ask a brief question first', description: 'Use the short general enquiry rather than a detailed service form.' },
]

function StartingPointRouter({ onOpenJourney }: { onOpenJourney: (journey: 'career' | 'admin' | 'writing') => void }) {
  const [area, setArea] = useState<StartingArea | ''>('')
  const [style, setStyle] = useState<StartingStyle | ''>('')
  const result = useMemo(() => {
    if (!area || !style) return null
    if (area === 'unsure' || style === 'enquiry') return {
      eyebrow: 'Brief enquiry',
      title: 'Start with the general enquiry',
      body: 'This keeps the first contact short. You do not need to complete a detailed service form until the right route is clear.',
      action: 'enquiry' as const,
    }
    if (area === 'career') return {
      eyebrow: style === 'explore' ? 'Career route · guided start' : 'Career route',
      title: style === 'explore' ? 'Explore Career & Job Support' : 'Continue to Career & Job Support',
      body: 'The Career development journey can suggest a service from your answers. It is a guide rather than an automatic acceptance or suitability decision.',
      action: 'career' as const,
    }
    if (area === 'admin') return {
      eyebrow: 'Admin & Systems route',
      title: 'Admin & Systems Support is the closest starting point',
      body: 'Review the two launch offers, then use the brief enquiry. The private Admin intake is still being built and remains separate from Career records.',
      action: 'admin' as const,
    }
    return {
      eyebrow: 'Writing & Clarity route',
      title: 'Writing & Clarity is the closest starting point',
      body: 'Review the four launch routes, then use the brief enquiry. The private Writing intake is still being built and remains separate from Career records.',
      action: 'writing' as const,
    }
  }, [area, style])

  return <div className="min-h-screen">
    <header className="border-b border-teal-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-5 sm:px-8"><a href="../index.html" aria-label="SABI home" className="flex items-center gap-3"><img src="/sabi-mark.png" alt="" className="h-11 w-11 object-contain" /><span className="font-display text-2xl font-semibold text-teal-900">SABI</span></a><span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">Find Your Starting Point</span></div></header>
    <div className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm font-bold text-amber-950">Development shell · fictional information only · this router does not submit or transmit answers</div>
    <main>
      <section className="border-b border-teal-200/60"><div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16"><p className="eyebrow">One short route into SABI</p><h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold text-teal-900 sm:text-5xl">What would you like help with?</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">Answer two broad questions. We will point you towards a service or the brief enquiry form. These answers stay in this page and are not saved.</p></div></section>
      <section className="mx-auto max-w-5xl space-y-7 px-5 py-10 sm:px-8">
        <fieldset className="rounded-3xl border border-teal-200 bg-white p-5 shadow-card sm:p-7"><legend className="px-2 font-display text-2xl font-semibold text-teal-900">1. Which area is closest to what you need?</legend><div className="mt-5 grid gap-3 sm:grid-cols-2">{startingAreas.map((item) => <label key={item.id} className={`block cursor-pointer rounded-2xl border-2 p-4 transition ${area === item.id ? 'border-teal-700 bg-teal-50' : 'border-teal-100 bg-white hover:border-teal-400'}`}><span className="flex gap-3"><input type="radio" name="starting-area" value={item.id} checked={area === item.id} onChange={() => setArea(item.id)} className="mt-1 h-5 w-5 shrink-0 accent-teal-800" /><span><strong className="block text-lg text-teal-900">{item.title}</strong><span className="mt-1 block leading-6 text-slate-600">{item.description}</span></span></span></label>)}</div></fieldset>
        <fieldset className="rounded-3xl border border-teal-200 bg-white p-5 shadow-card sm:p-7"><legend className="px-2 font-display text-2xl font-semibold text-teal-900">2. How clear is the help you need?</legend><div className="mt-5 grid gap-3">{startingStyles.map((item) => <label key={item.id} className={`block cursor-pointer rounded-2xl border-2 p-4 transition ${style === item.id ? 'border-teal-700 bg-teal-50' : 'border-teal-100 bg-white hover:border-teal-400'}`}><span className="flex gap-3"><input type="radio" name="starting-style" value={item.id} checked={style === item.id} onChange={() => setStyle(item.id)} className="mt-1 h-5 w-5 shrink-0 accent-teal-800" /><span><strong className="block text-lg text-teal-900">{item.title}</strong><span className="mt-1 block leading-6 text-slate-600">{item.description}</span></span></span></label>)}</div></fieldset>
        {!result && <aside aria-live="polite" className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-teal-950"><strong>Choose one answer in each section.</strong><p className="mt-1">Your suggested starting point will appear here.</p></aside>}
        {result && <section aria-live="polite" aria-labelledby="starting-result" className="rounded-3xl border-2 border-teal-700 bg-teal-50 p-6 sm:p-8"><p className="eyebrow">{result.eyebrow}</p><h2 id="starting-result" className="mt-2 font-display text-3xl font-semibold text-teal-900">{result.title}</h2><p className="mt-3 max-w-3xl leading-7 text-slate-700">{result.body}</p><div className="mt-6 flex flex-col gap-3 sm:flex-row">{result.action === 'enquiry' ? <a href="../index.html#contact" className="rounded-xl bg-teal-800 px-6 py-3 text-center font-extrabold text-white">Go to the brief enquiry →</a> : <button type="button" onClick={() => onOpenJourney(result.action)} className="rounded-xl bg-teal-800 px-6 py-3 font-extrabold text-white">{result.action === 'career' ? 'Continue to the Career development journey' : 'View this service area'} →</button>}<button type="button" onClick={() => { setArea(''); setStyle('') }} className="rounded-xl border-2 border-teal-700 px-6 py-3 font-bold text-teal-800">Start again</button></div></section>}
        <p className="text-sm leading-6 text-slate-600">This tool suggests where to begin. It does not decide eligibility, create a booking, agree scope or enable payment.</p>
      </section>
    </main>
  </div>
}

function Field({ label, help, optional = true, children }: { label: string, help?: string, optional?: boolean, children: ReactNode }) {
  return <section className="rounded-3xl border border-teal-200 bg-white p-5 shadow-card sm:p-7"><div className="mb-4"><h3 className="font-display text-2xl font-semibold text-ink">{label}</h3><span className={`text-xs font-bold uppercase tracking-wide ${optional ? 'text-slate-500' : 'text-teal-700'}`}>{optional ? 'Optional unless marked or required by your route' : 'Required gateway question'}</span>{help && <p className="mt-2 leading-6 text-slate-600">{help}</p>}</div>{children}</section>
}

function Info({ title, children, tone = 'normal' }: { title: string, children: ReactNode, tone?: 'normal' | 'warning' }) {
  return <aside className={`rounded-2xl border p-5 ${tone === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-teal-200 bg-teal-50 text-teal-950'}`}><h3 className="font-bold">{title}</h3><div className="mt-2 leading-7">{children}</div></aside>
}

function SimulatedUpload({ label, files, onFiles, onRemove }: { label: string, files: string[], onFiles: (files: FileList | null) => void, onRemove: (name: string) => void }) {
  return <Field label={label} help="Development simulation only: the browser records filenames but does not upload file contents."><input type="file" multiple onChange={(event) => onFiles(event.target.files)} className="field" />{files.length > 0 && <ul className="mt-4 space-y-2">{files.map((name) => <li key={name} className="flex justify-between rounded-xl bg-teal-50 px-4 py-2"><span>{name}</span><button type="button" onClick={() => onRemove(name)} className="font-bold text-teal-800">Remove</button></li>)}</ul>}</Field>
}

function Repeating({ title, items, fields, onChange, onAdd, onRemove }: { title: string, items: RepeatItem[], fields: string[][], onChange: (index: number, key: string, value: string) => void, onAdd: () => void, onRemove: (index: number) => void }) {
  return <Field label={title}><div className="space-y-5">{items.map((item, index) => <div key={index} className="rounded-2xl bg-teal-50 p-4"><div className="mb-3 flex justify-between"><strong>Entry {index + 1}</strong>{items.length > 1 && <button type="button" onClick={() => onRemove(index)} className="font-bold text-teal-800">Remove</button>}</div><div className="grid gap-3 sm:grid-cols-2">{fields.map(([key, label]) => <TextInput key={key} id={`${title}-${index}-${key}`} name={key} label={label} hideLabel={false} value={item[key] ?? ''} onChange={(event) => onChange(index, key, event.target.value)} />)}</div></div>)}<button type="button" onClick={onAdd} className="rounded-xl border-2 border-teal-700 px-4 py-2 font-bold text-teal-800">+ Add another</button></div></Field>
}

function ServiceQuestions({ serviceId, answers, setValue, area, choices }: { serviceId: ServiceId, answers: Answers, setValue: (key: string, value: string | string[] | boolean) => void, area: (key: string, label: string, help?: string, optional?: boolean) => ReactNode, choices: (key: string, label: string, options: string[], multiple?: boolean, help?: string) => ReactNode }) {
  if (serviceId === 'professional-cv') return <>{area('pcvTarget', 'Which role, vacancy, industry or career direction should this CV be positioned towards?', undefined, false)}{area('pcvEvidence', 'What makes this target feel suitable or important to you?')}</>
  if (serviceId === 'career-change') return <>{area('ccOptions', 'Which possible directions have you considered, even briefly?', 'No direction is required before starting.')}{choices('ccTradeoffs', 'What trade-offs or barriers need to be considered?', ['Pay', 'Hours', 'Location', 'Travel', 'Training', 'Accessibility', 'Caring responsibilities', 'Confidence', 'Prefer to discuss privately', 'Other'], true)}{choices('ccAlternatives', 'Would realistic alternatives be useful as well as one primary direction?', ['Yes', 'No', 'Not sure'])}</>
  if (serviceId === 'starter-cv') return <>{choices('starterEligible', 'Does your experience mainly come from education, projects, volunteering, caring, interests or a small number of roles?', ['Yes', 'No', 'Not sure'])}{area('starterEvidence', 'What education, projects, responsibilities, interests or achievements should the CV use?', undefined, false)}</>
  return <>{area('cpDirection', 'What broad direction should the Career Partner documents support?', 'A role group or sector is enough.', false)}{area('cpSecondTarget', 'What vacancy or industry should the additional CV version target?')}{area('cpCoverTarget', 'What role, vacancy or industry should the included cover letter address?')}{choices('applicationExists', 'Do you have a substantially completed application for SABI to review?', ['Yes', 'Not yet', 'I need most or all of it written'])}{serviceId === 'career-partner-plus' && <>{choices('interviewKnown', 'Do you have an interview booked or a particular role to prepare for?', ['Interview booked', 'Particular role', 'Not yet'])}{answers.interviewKnown !== 'Not yet' && area('interviewDetail', 'Add the role, employer, interview date and supplied information')}</>}</>
}

function ControlEvidence({ record }: { record: DevelopmentControlRecord }) {
  return <p className="mt-2 rounded-xl bg-slate-100 px-4 py-2 text-xs text-slate-700" aria-live="polite">Development record: {record.selected ? 'selected' : 'not selected'} · wording {record.wordingVersion} · {new Date(record.recordedAt).toLocaleString()}</p>
}

function Review({ service, answers, selectedAddOns, total, roles, qualifications, files, scopeFlags, controlRecords, onEdit }: any) {
  const rows = [
    ['Service', `${service.name} · £${service.price}`, 0],
    ['Client', [answers.firstName, answers.lastName].filter(Boolean).join(' ') || 'Not answered', 1],
    ['Current situation', (answers.employmentStatus as string[]).join(', ') || 'Not answered', 2],
    ['Work-history entries', String(roles.length), 3],
    ['Direction', answers.cpDirection || answers.pcvTarget || answers.roleIdeas || 'Not answered', 7],
    ['Qualifications', String(qualifications.length), 5],
    ['Documents selected', files.join(', ') || 'None', 6],
    ['Add-ons', selectedAddOns.map((item: any) => `${item.name} (£${item.price})`).join(', ') || 'None', 9],
    ['Total shown', `£${total} · payment disabled`, 9],
  ]
  const scheduleRows = [
    ['Service', `${service.name} · £${service.price}`],
    ['Agreed target', answers.cpDirection || answers.pcvTarget || answers.roleIdeas || 'To be confirmed'],
    ['Included outputs', service.includes.join('; ')],
    ['Provisional additions', selectedAddOns.map((item: any) => `${item.name} (£${item.price})`).join('; ') || 'None'],
    ['Provisional total', `£${total}`],
    ['Deadline', answers.deadlineDetail || answers.deadline || 'No deadline supplied'],
    ['Delivery preference', answers.consultation || 'Not selected'],
    ['Payer', answers.payerDifferent === 'Yes' ? `${answers.payerName || 'Different payer'} — transaction information only` : 'Client'],
    ['Scope status', scopeFlags.length ? 'Manual review required before payment' : 'No development scope flag'],
  ]
  return <><section className="rounded-3xl border border-teal-200 bg-white p-5 shadow-card sm:p-8"><h3 className="font-display text-3xl font-semibold text-teal-900">Review your development-form answers</h3><dl className="mt-6 divide-y divide-teal-100">{rows.map(([label, value, section]) => <div key={label} className="grid gap-2 py-4 sm:grid-cols-[12rem_1fr_auto]"><dt className="font-bold text-teal-800">{label}</dt><dd className="text-slate-700">{value}</dd><button type="button" onClick={() => onEdit(section)} className="font-bold text-teal-800">Edit</button></div>)}</dl>{scopeFlags.length === 0 ? <p className="mt-5 rounded-xl bg-teal-50 p-4 font-semibold text-teal-900">No simulated scope flag is currently active.</p> : <ul className="mt-5 list-disc rounded-xl bg-amber-50 p-5 pl-9 text-amber-950">{scopeFlags.map((flag: string) => <li key={flag}>{flag}</li>)}</ul>}</section><section className="rounded-3xl border-2 border-teal-700 bg-teal-50 p-5 sm:p-8" aria-labelledby="schedule-title"><p className="eyebrow">Development preview · not a contract</p><h3 id="schedule-title" className="mt-2 font-display text-3xl font-semibold text-teal-900">Draft Service Schedule</h3><p className="mt-3 leading-7 text-slate-700">This preview shows the values that a secure backend would freeze at checkout. It cannot create a booking or payment.</p><dl className="mt-5 divide-y divide-teal-200">{scheduleRows.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]"><dt className="font-bold text-teal-900">{label}</dt><dd>{value}</dd></div>)}</dl><h4 className="mt-5 font-bold text-teal-900">Recorded controls</h4><ul className="mt-2 space-y-2 text-sm">{(['specialConsent','termsAccepted','earlyStart','declaration'] as ControlKey[]).map((key) => <li key={key}><strong>{key}:</strong> {controlRecords[key] ? `${controlRecords[key].selected ? 'selected' : 'not selected'} at ${new Date(controlRecords[key].recordedAt).toLocaleString()} (${controlRecords[key].wordingVersion})` : 'no development event recorded'}</li>)}</ul></section></>
}

export default App
