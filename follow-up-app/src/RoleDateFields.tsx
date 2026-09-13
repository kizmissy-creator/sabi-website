import { TextInput } from './components'
import { isCurrentRole, type RoleDates } from './roleDates'

type Props = {
  startId: string
  endId: string
  name: string
  value: RoleDates
  onChange: (key: 'startYear' | 'endYear', value: string) => void
  onCurrentChange?: (checked: boolean) => void
  currentLabel?: string
}

export function RoleDateFields({ startId, endId, name, value, onChange, onCurrentChange, currentLabel = 'Current role' }: Props) {
  const current = isCurrentRole(value.endYear)
  return <div className="role-date-fields">
    <div className={`role-date-inputs${current && onCurrentChange ? ' role-date-inputs-current' : ''}`}>
      <TextInput id={startId} label="Start year" aria-label={`Start year: ${name}`} hideLabel={false} inputMode="numeric" placeholder="Year" value={value.startYear} onChange={event => onChange('startYear', event.target.value)} />
      {(!current || !onCurrentChange) && <TextInput id={endId} label="End year" aria-label={`End year: ${name}`} hideLabel={false} inputMode={current ? 'text' : 'numeric'} placeholder="Year" value={value.endYear} onChange={event => onChange('endYear', event.target.value)} />}
    </div>
    {onCurrentChange && <label className="role-current-choice">
      <input type="checkbox" aria-label={`${currentLabel}: ${name}`} checked={current} onChange={event => onCurrentChange(event.target.checked)} />
      <span>{currentLabel}</span>
    </label>}
  </div>
}
