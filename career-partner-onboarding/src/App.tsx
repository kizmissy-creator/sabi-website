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

type Answers = Record<string, string | string[] | boolean>
type RepeatItem = Record<string, string>

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
  const [answers, setAnswers] = useState<Answers>(initialAnswers)
  const [step, setStep] = useState(0)
  const [saveMessage, setSaveMessage] = useState('Development mode: fictional data only. Nothing is submitted.')
  const [roles, setRoles] = useState<RepeatItem[]>([{ title: '', organisation: '', dates: '', responsibilities: '', achievements: '', leaving: '' }])
  const [qualifications, setQualifications] = useState<RepeatItem[]>([{ title: '', provider: '', dates: '', status: '' }])
  const [examples, setExamples] = useState<RepeatItem[]>([{ title: '', link: '', appeal: '', concerns: '' }])
  const [simulatedFiles, setSimulatedFiles] = useState<string[]>([])

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
      setStep(Math.min(data.step ?? 0, sections.length - 1))
      setSaveMessage('Restored fictional development data from this browser.')
    } catch {
      setSaveMessage('The previous local development draft could not be restored.')
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem('sabi-career-form-development', JSON.stringify({ answers, roles, qualifications, examples, simulatedFiles, step }))
      setSaveMessage('Saved locally on this device. No information was transmitted.')
    }, 400)
    return () => window.clearTimeout(timer)
  }, [answers, roles, qualifications, examples, simulatedFiles, step])

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

  function toggle(key: string, value: string) {
    const values = (answers[key] as string[]) ?? []
    setValue(key, values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  function updateRepeat(setter: Dispatch<SetStateAction<RepeatItem[]>>, index: number, key: string, value: string) {
    setter((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item))
  }

  function move(next: number) {
    setStep(Math.max(0, Math.min(next, sections.length - 1)))
    window.setTimeout(() => document.getElementById('form-section')?.scrollIntoView({ block: 'start' }), 0)
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
  const choices = (key: string, label: string, options: string[], multiple = false, help?: string) => (
    <Field label={label} help={help}><div className="grid gap-3 sm:grid-cols-2">{options.map((option) => <SelectableOptionCard key={option} name={key} value={option} label={option} type={multiple ? 'checkbox' : 'radio'} selected={multiple ? ((answers[key] as string[]) ?? []).includes(option) : answers[key] === option} onChange={() => multiple ? toggle(key, option) : setValue(key, option)} />)}</div></Field>
  )

  return <div className="min-h-screen">
    <PageHeader currentStep={step + 1} totalSteps={sections.length} stepLabel={sections[step][1]} />
    <div className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm font-bold text-amber-950">Development shell · use fictional information only · uploads, verification, submission and payment are simulated</div>
    <main>
      <section className="border-b border-teal-200/60"><div className="mx-auto grid max-w-6xl gap-7 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_22rem]">
        <div><p className="eyebrow mb-3">SABI Career Support</p><h1 className="font-display text-4xl font-semibold text-teal-900 sm:text-5xl">A thoughtful intake, built around real life</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">Use existing documents where helpful, answer in your own words and skip optional details you would rather discuss directly.</p></div>
        <InformationCard title={service.name}><p className="text-3xl font-bold text-teal-800">£{service.price}</p><p className="mt-2 text-sm leading-6 text-slate-700">{service.summary}</p></InformationCard>
      </div></section>

      <section id="form-section" className="mx-auto max-w-5xl scroll-mt-4 px-5 py-10 sm:px-8">
        <nav aria-label="Form sections" className="mb-8 flex gap-2 overflow-x-auto pb-2">{sections.map(([id, title], index) => <button key={id} type="button" onClick={() => move(index)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${index === step ? 'bg-teal-800 text-white' : 'bg-white text-teal-800 ring-1 ring-teal-200'}`}>{index + 1}. {title}</button>)}</nav>
        <div className="mb-7 border-l-4 border-gold-400 pl-5"><p className="eyebrow">Section {step + 1} of {sections.length}</p><h2 className="mt-2 font-display text-3xl font-semibold text-teal-900">{sections[step][1]}</h2></div>

        <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
          {step === 0 && <>
            <Info title="Before you begin">This development form stores fictional answers only in this browser. The finished service will provide secure email verification, save-and-return and private records. Read the SABI Privacy Notice before entering detailed information.</Info>
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
            {text('currentRole', 'What is your current or most recent role?', 'Use the title you were given, describe the work, or enter Not applicable.')}
            {text('currentOrganisation', 'Organisation or setting')}
            {text('currentDates', 'When did you do this role?', 'Approximate month and year are enough.')}
            {area('currentLikes', 'What do you like about your current or most recent work?', 'Think about tasks, environment, people, pace, purpose or ways of working.')}
            {area('currentChange', 'What would you like to change about it?', 'You can mention tasks, hours, pay, progression, travel, pressure or anything else that matters.')}
          </>}

          {step === 3 && <>
            {choices('hasCv', 'Do you have an existing CV or work-history document?', ['Yes', 'No'])}
            <SimulatedUpload label="Existing CV or work-history document" files={simulatedFiles} onFiles={addSimulatedFiles} onRemove={(name) => setSimulatedFiles((items) => items.filter((item) => item !== name))} />
            <Repeating title="Work, self-employment or substantial roles" items={roles} onChange={(index, key, value) => updateRepeat(setRoles, index, key, value)} onAdd={() => setRoles((items) => [...items, { title: '', organisation: '', dates: '', responsibilities: '', achievements: '', leaving: '' }])} onRemove={(index) => setRoles((items) => items.filter((_, itemIndex) => itemIndex !== index))} fields={[['title','Role or activity'],['organisation','Organisation or setting'],['dates','Approximate dates and hours/type'],['responsibilities','Responsibilities'],['achievements','Achievements'],['leaving','Reason for leaving, optional']]} />
            {area('employmentGaps', 'Is there any gap or transition that you would like help presenting?', 'Not every gap needs to appear on a CV. SABI will not invent dates or activities.')}
          </>}

          {step === 4 && <>
            {choices('priorities', 'What matters most to you in your next role?', priorityOptions, true)}
            {choices('arrangements', 'What working arrangements would you consider?', arrangementOptions, true)}
            {choices('hours', 'What hours or working pattern could work for you?', hoursOptions, true)}
            {area('availabilityLimits', 'Are there days, times or practical limits SABI should take into account?')}
            {choices('travel', 'How are you able to travel for work?', travelOptions, true)}
            {text('commuteLimit', 'What is the longest journey you would usually consider for work?', 'Give a time, distance, area or Remote work only.', false)}
            {choices('payMinimum', 'Do you have a minimum level of pay you need?', singleOptions.payMinimum)}
            {(answers.payMinimum === 'Yes' || answers.payMinimum === 'Not sure') && text('payDetail', 'What pay level or range should SABI use as a practical guide?', 'State whether this is annual, hourly, daily or another basis.')}
            {choices('clarity', 'How clear do you currently feel about what you would like to do next?', singleOptions.clarity)}
            {area('roleIdeas', 'Are there any roles, sectors or types of work you are considering?')}
            {area('avoidWork', 'Is there any work, environment or condition you know you do not want?')}
          </>}

          {step === 5 && <>
            {choices('skills', 'Which of these do you feel confident doing?', skillOptions, true)}
            {area('skillsExamples', 'Tell me about anything you do well or people rely on you for', 'Examples can come from work, education, caring, volunteering, hobbies, advocacy, projects or daily life.')}
            {area('otherStrengths', 'If someone who knows you well described your strengths, what might they say?')}
            {area('tools', 'Which software, systems, equipment or digital tools have you used?')}
            {choices('technologyLearning', 'How do you usually feel about learning a new system or technology?', ['Comfortable', 'Comfortable with time or guidance', 'It depends', 'Often difficult', 'Not sure'])}
            {choices('hasQualifications', 'Do you have relevant qualifications, training, licences or memberships?', ['Yes', 'No'])}
            {answers.hasQualifications === 'Yes' && <Repeating title="Qualifications, training, licences or memberships" items={qualifications} onChange={(index, key, value) => updateRepeat(setQualifications, index, key, value)} onAdd={() => setQualifications((items) => [...items, { title: '', provider: '', dates: '', status: '' }])} onRemove={(index) => setQualifications((items) => items.filter((_, itemIndex) => itemIndex !== index))} fields={[['title','Official title'],['provider','Provider and level'],['dates','Dates or expiry'],['status','Grade, result or status']]} />}
            {area('unpaidExperience', 'Tell me about relevant volunteering, caring, advocacy, community work, projects or unpaid responsibility')}
            {area('achievement', 'Is there anything you have done, created, managed or overcome that you feel proud of?')}
            {area('interests', 'Are there interests, hobbies or subjects that show what you enjoy or are good at?')}
          </>}

          {step === 6 && <>
            {choices('searchStage', 'Where are you currently with looking or applying for work?', singleOptions.searchStage)}
            {choices('difficulties', 'Which parts currently feel difficult?', difficultyOptions, true)}
            {area('currentStrategies', 'What are you already doing that seems useful?')}
            <Repeating title="Example jobs, roles or organisations" items={examples} onChange={(index, key, value) => updateRepeat(setExamples, index, key, value)} onAdd={() => setExamples((items) => [...items, { title: '', link: '', appeal: '', concerns: '' }])} onRemove={(index) => setExamples((items) => items.filter((_, itemIndex) => itemIndex !== index))} fields={[['title','Role or organisation'],['link','Link, optional'],['appeal','What appeals'],['concerns','Any concerns']]} />
            {area('supportGoal', 'What would you most like this support to help you achieve?', 'Describe what would make the service feel useful to you.', false)}
            {choices('deadline', 'Do you have a vacancy, interview or other deadline?', singleOptions.deadline)}
            {answers.deadline !== 'No' && answers.deadline && area('deadlineDetail', 'Tell SABI about the deadline', 'Include the date, time, time zone and what must be completed.')}
            <SimulatedUpload label="Job advert, application draft or other supporting document" files={simulatedFiles} onFiles={addSimulatedFiles} onRemove={(name) => setSimulatedFiles((items) => items.filter((item) => item !== name))} />
          </>}

          {step === 7 && <ServiceQuestions serviceId={service.id} answers={answers} setValue={setValue} area={area} choices={choices} />}

          {step === 8 && <>
            {choices('accessibilityGate', 'Would you like to tell SABI about practical communication, accessibility or support needs?', singleOptions.accessibilityGate, false, 'Optional. You do not need a diagnosis.')}
            {answers.accessibilityGate === 'Yes' && <Field label="Optional special-category consent"><label className="flex gap-3 rounded-2xl border border-teal-200 bg-white p-4"><input type="checkbox" checked={Boolean(answers.specialConsent)} onChange={(event) => setValue('specialConsent', event.target.checked)} /><span>I explicitly consent to SABI using any health, disability or neurodivergence information I choose to provide for the purpose of adapting and delivering my career support. I understand that these questions are optional, I do not need to name a diagnosis, and I can withdraw my consent at any time.</span></label></Field>}
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
            <Review service={service} answers={answers} selectedAddOns={selectedAddOns} total={total} roles={roles} qualifications={qualifications} files={simulatedFiles} scopeFlags={scopeFlags} onEdit={(index) => move(index)} />
            <Info title="Privacy reminder">The live form must show the current Privacy Notice again here. Privacy information is not an agreement checkbox.</Info>
            <Field label="Terms and declarations"><div className="space-y-3">{[
              ['termsAccepted', 'I have read and agree to the SABI Career Support Terms and the Service Schedule for this purchase'],
              ['earlyStart', 'I ask SABI to begin providing my service during the 14-day cancellation period. I understand that a reasonable amount may be deducted if I cancel after work begins, and that I lose the right to cancel once the service has been fully performed.'],
              ['declaration', 'I confirm that the information supplied is accurate to the best of my knowledge and that I will review final documents before using them'],
            ].map(([key, label]) => <label key={key} className="flex gap-3 rounded-2xl border border-teal-200 bg-white p-4"><input type="checkbox" checked={Boolean(answers[key])} onChange={(event) => setValue(key, event.target.checked)} /><span>{label}</span></label>)}</div></Field>
            {scopeFlags.length > 0 && <Info tone="warning" title="Manual scope review required">{scopeFlags.join(' ')}</Info>}
            <button type="button" disabled className="w-full rounded-2xl bg-slate-300 px-6 py-4 font-extrabold text-slate-600">Secure payment disabled in development · £{total}</button>
          </>}

          <div className="rounded-3xl bg-teal-900 p-5 text-white sm:p-7"><div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-between"><button type="button" onClick={() => move(step + 1)} disabled={step === sections.length - 1 || answers.ageBand === 'Under 16'} className="rounded-xl bg-gold-400 px-6 py-3 font-extrabold text-teal-900 disabled:opacity-40">{step === sections.length - 2 ? 'Review answers' : 'Continue →'}</button><button type="button" onClick={() => move(step - 1)} disabled={step === 0} className="rounded-xl px-5 py-3 font-bold disabled:opacity-30">← Back</button></div><p className="mt-4 border-t border-white/20 pt-4 text-sm" aria-live="polite">{saveMessage}</p></div>
        </form>
      </section>
    </main>
  </div>
}

function Field({ label, help, optional = true, children }: { label: string, help?: string, optional?: boolean, children: ReactNode }) {
  return <section className="rounded-3xl border border-teal-200 bg-white p-5 shadow-card sm:p-7"><div className="mb-4"><h3 className="font-display text-2xl font-semibold text-ink">{label}</h3>{optional && <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Optional unless marked or required by your route</span>}{help && <p className="mt-2 leading-6 text-slate-600">{help}</p>}</div>{children}</section>
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

function Review({ service, answers, selectedAddOns, total, roles, qualifications, files, scopeFlags, onEdit }: any) {
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
  return <section className="rounded-3xl border border-teal-200 bg-white p-5 shadow-card sm:p-8"><h3 className="font-display text-3xl font-semibold text-teal-900">Review your development-form answers</h3><dl className="mt-6 divide-y divide-teal-100">{rows.map(([label, value, section]) => <div key={label} className="grid gap-2 py-4 sm:grid-cols-[12rem_1fr_auto]"><dt className="font-bold text-teal-800">{label}</dt><dd className="text-slate-700">{value}</dd><button type="button" onClick={() => onEdit(section)} className="font-bold text-teal-800">Edit</button></div>)}</dl>{scopeFlags.length === 0 ? <p className="mt-5 rounded-xl bg-teal-50 p-4 font-semibold text-teal-900">No simulated scope flag is currently active.</p> : <ul className="mt-5 list-disc rounded-xl bg-amber-50 p-5 pl-9 text-amber-950">{scopeFlags.map((flag: string) => <li key={flag}>{flag}</li>)}</ul>}</section>
}

export default App
