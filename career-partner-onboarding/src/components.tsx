import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'

type PageHeaderProps = {
  currentStep: number
  totalSteps: number
  stepLabel?: string
}

export function ProgressIndicator({ currentStep, totalSteps }: PageHeaderProps) {
  const percentage = (currentStep / totalSteps) * 100

  return (
    <div className="w-full sm:w-56" aria-label={`Step ${currentStep} of ${totalSteps}`}>
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-teal-800">
        <span>Getting started</span>
        <span>
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-teal-100"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStep}
      >
        <span
          className="block h-full rounded-full bg-gold-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function PageHeader({
  currentStep,
  totalSteps,
  stepLabel = 'Getting started',
}: PageHeaderProps) {
  return (
    <header className="border-b border-teal-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/sabi-mark-complete.png"
            alt=""
            className="h-10 w-10 object-contain"
            width="40"
            height="40"
          />
          <div>
            <div className="font-display text-3xl font-bold leading-none text-teal-800">
              SABI
            </div>
            <div className="mt-1 text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-teal-600">
              Career Partner
            </div>
          </div>
        </div>
        <div className="w-full sm:w-56">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-teal-800">
            <span>{stepLabel}</span>
            <span>
              Part {currentStep} of {totalSteps}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-teal-100"
            role="progressbar"
            aria-label={`${stepLabel}, part ${currentStep} of ${totalSteps}`}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={currentStep}
          >
            <span
              className="block h-full rounded-full bg-gold-400 transition-[width]"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

type InformationCardProps = {
  icon?: ReactNode
  title: string
  children: ReactNode
  className?: string
}

export function InformationCard({
  icon,
  title,
  children,
  className = '',
}: InformationCardProps) {
  return (
    <aside
      className={`rounded-3xl border border-teal-200 bg-white p-5 shadow-card sm:p-7 ${className}`}
    >
      <div className="mb-4 flex items-center gap-3">
        {icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-800 text-white">
            {icon}
          </span>
        )}
        <h2 className="font-display text-2xl font-semibold text-teal-900">{title}</h2>
      </div>
      {children}
    </aside>
  )
}

type QuestionBlockProps = {
  number: number
  title: string
  optional?: boolean
  supportingText?: string
  children: ReactNode
}

export function QuestionBlock({
  number,
  title,
  optional,
  supportingText,
  children,
}: QuestionBlockProps) {
  return (
    <section
      className="rounded-3xl border border-teal-200/80 bg-white p-5 shadow-card sm:p-8"
      aria-labelledby={`question-${number}`}
    >
      <div className="mb-5 flex items-start gap-4">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-100 text-sm font-extrabold text-teal-800"
          aria-hidden="true"
        >
          {number}
        </span>
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h2
              id={`question-${number}`}
              className="font-display text-2xl font-semibold leading-tight text-ink sm:text-[1.7rem]"
            >
              {title}
            </h2>
            {optional && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                Optional
              </span>
            )}
          </div>
          {supportingText && (
            <p
              id={`question-${number}-help`}
              className="mt-2 max-w-2xl text-sm leading-6 text-slate-600"
            >
              {supportingText}
            </p>
          )}
        </div>
      </div>
      <div className="sm:pl-[3.25rem]">{children}</div>
    </section>
  )
}

type SelectableOptionCardProps = {
  name: string
  value: string
  label: string
  selected: boolean
  onChange: (value: string) => void
  type?: 'radio' | 'checkbox'
}

export function SelectableOptionCard({
  name,
  value,
  label,
  selected,
  onChange,
  type = 'radio',
}: SelectableOptionCardProps) {
  return (
    <label
      className={`group relative flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition focus-within:ring-4 focus-within:ring-gold-400 focus-within:ring-offset-2 ${
        selected
          ? 'border-teal-700 bg-teal-50 shadow-sm'
          : 'border-teal-100 bg-white hover:border-teal-500 hover:bg-teal-50/60'
      }`}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center border-2 ${
          type === 'checkbox' ? 'rounded-md' : 'rounded-full'
        } ${
          selected ? 'border-teal-700 bg-teal-700' : 'border-teal-300 bg-white'
        }`}
        aria-hidden="true"
      >
        {selected && (
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-white" aria-hidden="true">
            <path d="m5 10 3 3 7-7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-[0.95rem] font-semibold leading-6 text-ink">{label}</span>
    </label>
  )
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hideLabel?: boolean
}

export function TextInput({ label, hideLabel = true, id, ...props }: TextInputProps) {
  const showLabel = !hideLabel || String(id).startsWith('experience-')
  return (
    <div>
      <label htmlFor={id} className={showLabel ? 'mb-2 block font-bold text-teal-950' : 'sr-only'}>
        {label}
      </label>
      <input id={id} className="field" {...props} />
    </div>
  )
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  hideLabel?: boolean
}

export function TextArea({ label, hideLabel = true, id, ...props }: TextAreaProps) {
  return (
    <div>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-2 block font-bold'}>
        {label}
      </label>
      <textarea id={id} className="field min-h-32 resize-y leading-7" {...props} />
    </div>
  )
}

type NavigationControlsProps = {
  onSave: () => void
  onContinue: () => void
  onBack: () => void
  saveMessage: string
  canGoBack: boolean
  continueLabel?: string
}

export function NavigationControls({
  onSave,
  onContinue,
  onBack,
  saveMessage,
  canGoBack,
  continueLabel = 'Continue',
}: NavigationControlsProps) {
  return (
    <section
      className="rounded-3xl bg-teal-900 p-5 text-white shadow-soft sm:p-7"
      aria-labelledby="navigation-title"
    >
      <h2 id="navigation-title" className="sr-only">
        Save and continue
      </h2>
      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-extrabold text-teal-900 shadow-sm transition hover:bg-gold-500"
          >
            {continueLabel}
            <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/50 bg-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/20"
          >
            Save and return later
          </button>
        </div>
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 font-semibold text-white transition hover:bg-white/10 sm:justify-start"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
      <div className="mt-5 min-h-7 border-t border-white/15 pt-4" aria-live="polite">
        {saveMessage ? (
          <p className="flex items-start gap-2 text-sm font-semibold text-white">
            <span aria-hidden="true" className="text-gold-400">
              ✓
            </span>
            {saveMessage}
          </p>
        ) : (
          <p className="flex items-start gap-2 text-sm text-white/75">
            <span aria-hidden="true">●</span>
            Your progress will be saved on this device.
          </p>
        )}
      </div>
    </section>
  )
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 fill-none stroke-current" aria-hidden="true">
      <path d="m4 10 4 4 8-8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>
