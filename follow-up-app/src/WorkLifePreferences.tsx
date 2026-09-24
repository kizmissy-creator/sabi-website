import { TextInput } from './components'

export const salaryOptions = [
  ['minimum_30000', 'Yes, at least \u00a330,000'],
  ['could_consider_less', 'I could consider less'],
  ['minimum_higher', 'My minimum is higher'],
  ['unsure', 'Not sure yet'],
] as const

export function salarySummary(choice: string, detail: string) {
  const label = salaryOptions.find(([value]) => value === choice)?.[1] || ''
  const includeDetail = ['could_consider_less', 'minimum_higher'].includes(choice)
  return [label, includeDetail ? detail : ''].filter(Boolean).join(': ')
}

const preferences = [
  ['Permanent contract', 'How important is a permanent contract?'],
  ['Full-time', 'How important are full-time hours?'],
  ['Monday-Friday', 'How important is working Monday to Friday?'],
  ['Maximum 30-minute commute', 'How important is keeping your commute within 30 minutes?'],
  ['Flexible start/finish times', 'How important is being able to vary your start and finish times?'],
  ['Compressed hours', 'How important is working your usual weekly hours over fewer days?'],
] as const
const priorities = [
  ['Must-have', 'Essential'],
  ['Strong preference', 'A strong preference'],
  ['Flexible for the right job', 'Flexible for the right job'],
  ['Not important', 'Not important to me'],
  ['Not sure yet', 'Not sure yet'],
] as const

type Props = {
  salaryMinimumChoice: string
  salaryMinimumDetail: string
  constraintFlexibility: Record<string, string>
  onSalaryChoice: (value: string) => void
  onSalaryDetail: (value: string) => void
  onPriority: (key: string, value: string) => void
}

export function WorkLifePreferences(props: Props) {
  const showAmount = ['could_consider_less', 'minimum_higher'].includes(props.salaryMinimumChoice)
  return <div className="follow-up-question-card work-life-preferences">
    <h2 id="salary-minimum-heading" className="mb-3 text-base font-semibold text-teal-950">Is £30,000 the lowest annual starting salary you would consider? (optional)</h2>
    <fieldset className="space-y-3" aria-labelledby="salary-minimum-heading" aria-describedby="salary-minimum-help">
      <p id="salary-minimum-help" className="text-sm text-slate-600">You previously selected £30,000–£34,999. This helps distinguish your preferred pay from your minimum, before tax.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {salaryOptions.map(([value, label]) => <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-teal-950">
          <input type="radio" name="salaryMinimumChoice" value={value} checked={props.salaryMinimumChoice === value} onChange={() => props.onSalaryChoice(value)} className="h-4 w-4 shrink-0 accent-teal-800" />
          <span>{label}</span>
        </label>)}
      </div>
      {showAmount && <TextInput id="salaryMinimumDetail" label={props.salaryMinimumChoice === 'minimum_higher' ? 'What minimum would work for you? (optional)' : 'What lower amount or circumstances could work? (optional)'} value={props.salaryMinimumDetail} onChange={event => props.onSalaryDetail(event.target.value)} />}
      {!showAmount && props.salaryMinimumDetail.trim() && <details className="text-sm text-slate-600"><summary className="cursor-pointer py-2">Earlier pay note</summary><p className="whitespace-pre-wrap break-words">{props.salaryMinimumDetail}</p><p className="mt-2">Kept separately, not part of your current choice.</p></details>}
      {props.constraintFlexibility['\u00a330,000+ salary'] && <details className="text-sm text-slate-600"><summary className="cursor-pointer py-2">Your earlier salary preference</summary><p>£30,000+ salary: {props.constraintFlexibility['\u00a330,000+ salary']}. This did not specify a minimum.</p></details>}
    </fieldset>
    <div className="mt-7 border-t border-slate-200 pt-5">
      <h2 className="text-sm font-semibold text-teal-950">Your working week</h2>
      <p className="mt-2 mb-3 text-sm text-slate-600">These came up in your onboarding. Which are essential, and where is there room to be flexible? You can leave anything undecided.</p>
      {preferences.map(([key, question], index) => <details key={key} className="border-b border-slate-200">
        <summary className="cursor-pointer py-4 text-sm text-teal-950"><span className="font-semibold">{key}</span>{props.constraintFlexibility[key] && <span className="text-slate-600">: {priorities.find(([value]) => value === props.constraintFlexibility[key])?.[1] || props.constraintFlexibility[key]}</span>}</summary>
        <fieldset className="pb-4">
          <legend className="mb-3 text-sm font-semibold">{question} (optional)</legend>
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">{priorities.map(([value, label]) => <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-slate-700"><input type="radio" name={`work-priority-${index}`} value={value} checked={props.constraintFlexibility[key] === value} onChange={() => props.onPriority(key, value)} className="h-4 w-4 shrink-0 accent-teal-800" /><span>{label}</span></label>)}</div>
        </fieldset>
      </details>)}
    </div>
  </div>
}
