import { useEffect, useState } from 'react'
import {
  CheckIcon,
  InformationCard,
  NavigationControls,
  PageHeader,
  QuestionBlock,
  SelectableOptionCard,
  TextArea,
  TextInput,
} from './components'

const situationOptions = [
  'Employed full time',
  'Employed part time',
  'Self employed',
  'Not currently working',
  'On sick leave',
  'Returning to work after a break',
  'In education or training',
  'Something else',
]

const clarityOptions = [
  'I know exactly what role I want',
  'I have a few possible ideas',
  'I know the type of work I want, but not the job title',
  'I know what I want to avoid',
  'I am completely unsure',
]

const formParts = [
  {
    label: 'About you',
    title: 'Start with what you know',
    description: 'Just the basics to begin. You can change these details later.',
  },
  {
    label: 'Your situation',
    title: 'Where things are now',
    description: 'Select everything that applies. Real circumstances rarely fit one box.',
  },
  {
    label: 'What brings you here',
    title: 'Tell me what has changed',
    description: 'One or two sentences is enough. We can explore the detail together.',
  },
  {
    label: 'Your direction',
    title: 'It is fine to be unsure',
    description: 'This simply helps me understand where our conversation should begin.',
  },
  {
    label: 'Review',
    title: 'Check what you have shared',
    description: 'Nothing is final. You can go back and change any answer.',
  },
]

const packageItems = [
  'Career consultation',
  'Career direction summary',
  'Transferable skills analysis',
  'Personalised job search plan',
  'Tailored Career CV',
  'Cover letter',
  'Application review',
  'Interview coaching',
  'Two weeks of follow up support',
]

function App() {
  const [fullName, setFullName] = useState('Brona')
  const [preferredName, setPreferredName] = useState('')
  const [situation, setSituation] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [clarity, setClarity] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [formPart, setFormPart] = useState(0)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sabi-brona-career-partner-progress')
      if (!saved) return

      const progress = JSON.parse(saved) as {
        fullName?: string
        preferredName?: string
        situation?: string | string[]
        reason?: string
        clarity?: string
        formPart?: number
      }

      setFullName(progress.fullName ?? 'Brona')
      setPreferredName(progress.preferredName ?? '')
      setSituation(
        Array.isArray(progress.situation)
          ? progress.situation
          : progress.situation
            ? [progress.situation]
            : [],
      )
      setReason(progress.reason ?? '')
      setClarity(progress.clarity ?? '')
      setFormPart(Math.min(Math.max(progress.formPart ?? 0, 0), formParts.length - 1))
      setSaveMessage('Your saved progress has been restored from this device.')
    } catch {
      // Ignore missing or invalid local prototype data and start with a clean form.
    } finally {
      setHasLoaded(true)
    }
  }, [])

  function persistProgress(message: string) {
    const progress = {
      fullName,
      preferredName,
      situation,
      reason,
      clarity,
      formPart,
      savedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem('sabi-brona-career-partner-progress', JSON.stringify(progress))
      setSaveMessage(message)
    } catch {
      setSaveMessage(
        'This browser could not save your progress. Please leave this page open while you continue.',
      )
    }
  }

  useEffect(() => {
    if (!hasLoaded) return

    const saveTimer = window.setTimeout(() => {
      persistProgress('Saved just now on this device.')
    }, 450)

    return () => window.clearTimeout(saveTimer)
  }, [clarity, formPart, fullName, hasLoaded, preferredName, reason, situation])

  function saveProgress() {
    persistProgress('Your progress has been saved on this device.')
  }

  function moveToPart(nextPart: number) {
    setFormPart(Math.min(Math.max(nextPart, 0), formParts.length - 1))
    window.setTimeout(() => {
      document.getElementById('question-flow')?.scrollIntoView({ block: 'start' })
    }, 0)
  }

  function toggleSituation(value: string) {
    setSituation((current) =>
      current.includes(value)
        ? current.filter((option) => option !== value)
        : [...current, value],
    )
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        currentStep={formPart + 1}
        totalSteps={formParts.length}
        stepLabel={formParts[formPart].label}
      />

      <main>
        <section className="relative overflow-hidden border-b border-teal-200/60">
          <div
            className="absolute -right-24 -top-32 h-80 w-80 rounded-full border-[42px] border-teal-100/70"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)] lg:items-start lg:py-20">
            <div className="max-w-3xl">
              <p className="eyebrow mb-4">Welcome, Brona</p>
              <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-teal-900 sm:text-5xl lg:text-[3.55rem]">
                Let’s get to know where you are now
              </h1>
              <p className="mt-5 max-w-2xl text-xl font-medium leading-8 text-teal-700 sm:text-2xl sm:leading-9">
                You do not need to know exactly what you want to do yet.
              </p>
              <div className="mt-8 max-w-2xl space-y-5 text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                <p>
                  This form will help me understand your experience, circumstances,
                  strengths and what you need from your next step before our career
                  consultation.
                </p>
                <p className="font-semibold text-teal-800">
                  Answer what you comfortably can. You can skip anything you would rather
                  discuss with me directly.
                </p>
              </div>

              <details className="group mt-7 max-w-2xl rounded-2xl border border-teal-200 bg-white/80 px-5 py-4 text-sm leading-6 text-teal-900 shadow-card sm:text-base">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                  <span>What to expect</span>
                  <span
                    className="text-xl text-teal-700 transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <ul className="mt-4 grid gap-3 border-t border-teal-100 pt-4 text-slate-700">
                  <li>Allow around 20 to 30 minutes in total.</li>
                  <li>Your answers save automatically on this device.</li>
                  <li>You can leave and return whenever you need to.</li>
                  <li>You will be able to upload your CV and other documents later.</li>
                </ul>
              </details>
            </div>

            <InformationCard
              title="Your chosen support"
              icon={<span className="text-lg" aria-hidden="true">♥</span>}
              className="lg:sticky lg:top-6"
            >
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-teal-100 pb-5">
                <div>
                  <p className="eyebrow mb-1">Career Partner</p>
                  <p className="font-display text-[2.75rem] font-semibold leading-none text-teal-800">
                    £135
                  </p>
                </div>
                <span className="rounded-full bg-gold-100 px-3 py-1.5 text-xs font-extrabold text-teal-900">
                  Confirmed
                </span>
              </div>
              <p className="mb-5 text-sm font-semibold leading-6 text-ink">
                Complete support from planning your next step to applying with confidence.
              </p>
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-teal-50 px-4 py-2.5 text-sm font-extrabold text-teal-800">
                  <span>View what’s included</span>
                  <span
                    className="text-lg transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <ul className="mt-4 grid gap-2.5 text-sm leading-5 text-slate-700">
                  {packageItems.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-teal-700">
                        <CheckIcon />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </InformationCard>
          </div>
        </section>

        <section
          id="question-flow"
          className="mx-auto max-w-4xl scroll-mt-6 px-5 py-12 sm:px-8 sm:py-16"
        >
          <div className="mb-9 flex flex-col gap-3 border-l-4 border-gold-400 pl-5">
            <p className="eyebrow">
              Part {formPart + 1} of {formParts.length} · {formParts[formPart].label}
            </p>
            <h2 className="font-display text-3xl font-semibold text-teal-900 sm:text-4xl">
              {formParts[formPart].title}
            </h2>
            <p className="max-w-2xl leading-7 text-slate-600">
              {formParts[formPart].description}
            </p>
          </div>

          <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
            {formPart === 0 && (
              <>
                <QuestionBlock number={1} title="Full name">
                  <TextInput
                    id="full-name"
                    name="fullName"
                    label="Full name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </QuestionBlock>

                <QuestionBlock
                  number={2}
                  title="What would you like me to call you?"
                  optional
                >
                  <TextInput
                    id="preferred-name"
                    name="preferredName"
                    label="What would you like me to call you?"
                    placeholder="For example, Brona"
                    value={preferredName}
                    onChange={(event) => setPreferredName(event.target.value)}
                  />
                </QuestionBlock>
              </>
            )}

            {formPart === 1 && (
              <QuestionBlock
                number={3}
                title="Which best describes your current situation?"
                supportingText="Select all that apply. You can skip this and talk it through with me instead."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {situationOptions.map((option) => (
                    <SelectableOptionCard
                      key={option}
                      type="checkbox"
                      name="current-situation"
                      value={option}
                      label={option}
                      selected={situation.includes(option)}
                      onChange={toggleSituation}
                    />
                  ))}
                </div>
              </QuestionBlock>
            )}

            {formPart === 2 && (
              <QuestionBlock
                number={4}
                title="What has led you to look for career support now?"
                supportingText="One or two sentences is enough. You might mention what has changed, what feels difficult, or what you would like to be different."
              >
                <TextArea
                  id="support-reason"
                  name="supportReason"
                  label="What has led you to look for career support now?"
                  aria-describedby="question-4-help"
                  placeholder="A short note is absolutely fine…"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  This helps me prepare for our conversation and avoid suggesting options
                  that do not fit your circumstances.
                </p>
              </QuestionBlock>
            )}

            {formPart === 3 && (
              <QuestionBlock
                number={5}
                title="How clear do you currently feel about your next step?"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {clarityOptions.map((option) => (
                    <SelectableOptionCard
                      key={option}
                      name="career-clarity"
                      value={option}
                      label={option}
                      selected={clarity === option}
                      onChange={setClarity}
                    />
                  ))}
                </div>
              </QuestionBlock>
            )}

            {formPart === 4 && (
              <section className="rounded-3xl border border-teal-200 bg-white p-5 shadow-card sm:p-8">
                <dl className="grid gap-6">
                  <div>
                    <dt className="eyebrow mb-2">Name</dt>
                    <dd className="text-lg font-semibold text-ink">
                      {preferredName || fullName || 'Not answered'}
                    </dd>
                  </div>
                  <div className="border-t border-teal-100 pt-5">
                    <dt className="eyebrow mb-2">Current situation</dt>
                    <dd className="leading-7 text-slate-700">
                      {situation.length ? situation.join(', ') : 'Not answered'}
                    </dd>
                  </div>
                  <div className="border-t border-teal-100 pt-5">
                    <dt className="eyebrow mb-2">What brings you here</dt>
                    <dd className="whitespace-pre-wrap leading-7 text-slate-700">
                      {reason || 'Not answered'}
                    </dd>
                  </div>
                  <div className="border-t border-teal-100 pt-5">
                    <dt className="eyebrow mb-2">Clarity about your next step</dt>
                    <dd className="leading-7 text-slate-700">
                      {clarity || 'Not answered'}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            <NavigationControls
              onSave={saveProgress}
              onContinue={() =>
                formPart === formParts.length - 1
                  ? saveProgress()
                  : moveToPart(formPart + 1)
              }
              onBack={() => moveToPart(formPart - 1)}
              saveMessage={saveMessage}
              canGoBack={formPart > 0}
              continueLabel={
                formPart === formParts.length - 2
                  ? 'Review answers'
                  : formPart === formParts.length - 1
                    ? 'Save for now'
                    : 'Continue'
              }
            />
          </form>
        </section>
      </main>

      <footer className="border-t border-teal-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-7 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-semibold text-teal-800">SABI Career Partner</p>
          <p>Thoughtful support, built around real life.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
