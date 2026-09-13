type RecordValue = Record<string, unknown>
type RowShape = Record<string, string | boolean>

const rowShapes: Record<string, RowShape> = {
  careerTimeline: { title: '', startYear: '', endYear: '', previousEndYear: '', isFirstRole: false, isSeeded: false },
  regionalResponsibilities: { id: '', label: '', startYear: '', endYear: '', previousEndYear: '', notSure: false },
  developmentExamples: { note: '', earlierNote: '', situation: '', action: '', result: '', answerMode: '' },
  commercialExamples: { measures: '', figure: '', period: '', scope: '', responsibility: '', outcome: '', certainty: '', note: '', earlierNote: '', source: '', answerMode: '', offPremise: false, topic: '' },
  jobTitleReactions: { roleId: '', titleReaction: '', descriptionReaction: '', revealed: false, reason: '' },
}
const evidenceShape = { figure: '', period: '', scope: '', responsibility: '', outcome: '', certainty: '' }

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function restoreRow(value: unknown, shape: RowShape): RecordValue {
  if (!isRecord(value)) throw new Error('Invalid saved row')
  const restored = { ...shape, ...value }
  for (const [key, fallback] of Object.entries(shape)) {
    if (typeof restored[key] !== typeof fallback) throw new Error('Invalid saved value')
  }
  return restored
}

// Missing fields in older drafts get defaults. Incorrect types are not discarded:
// the caller must preserve the original draft and offer recovery before writing.
export function restoreAnswers<T extends RecordValue>(stored: unknown, defaults: T): T {
  if (!isRecord(stored)) throw new Error('Invalid saved answers')
  const restored: RecordValue = { ...defaults, ...stored }
  for (const [key, fallback] of Object.entries(defaults)) {
    if (!(key in stored)) continue
    const value = stored[key]
    if (Array.isArray(fallback)) {
      if (!Array.isArray(value)) throw new Error('Invalid saved collection')
      if (rowShapes[key]) {
        const rows = value.map(item => restoreRow(item, rowShapes[key]))
        const idKey = key === 'jobTitleReactions' ? 'roleId' : key === 'regionalResponsibilities' ? 'id' : null
        if (idKey) {
          const ids = rows.map(row => row[idKey])
          if (ids.some(id => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length) throw new Error('Invalid saved identifiers')
        }
        restored[key] = rows
      } else if (value.some(item => typeof item !== 'string')) throw new Error('Invalid saved choices')
    } else if (isRecord(fallback)) {
      if (!isRecord(value)) throw new Error('Invalid saved details')
      if (key === 'commercialEvidence') {
        restored[key] = Object.fromEntries(Object.entries(value).map(([measure, entry]) => [measure, restoreRow(entry, evidenceShape)]))
      } else if (Object.values(value).some(item => typeof item !== 'string')) throw new Error('Invalid saved preferences')
    } else if (typeof value !== typeof fallback) throw new Error('Invalid saved answer')
  }
  // Move the former standalone first-role answer into the dated timeline once.
  if ('timelineIntegrated' in defaults && stored.timelineIntegrated !== true && Array.isArray(restored.careerTimeline)) {
    const rows = restored.careerTimeline as RecordValue[]
    const firstTitle = typeof restored.joinedAs === 'string' ? restored.joinedAs : ''
    if (firstTitle.trim()) {
      const existing = rows.findIndex(row => row.title === firstTitle)
      if (existing >= 0) restored.careerTimeline = [{ ...rows[existing], isFirstRole: true }, ...rows.filter((_, index) => index !== existing)]
      else if (rows[0]?.title === '') restored.careerTimeline = [{ ...rows[0], title: firstTitle, isFirstRole: true }, ...rows.slice(1)]
      else restored.careerTimeline = [{ ...rowShapes.careerTimeline, title: firstTitle, isFirstRole: true }, ...rows]
      restored.joinedAs = ''
    } else if (rows.length === 2 && rows[0].title === 'Buddy Trainer' && rows[1].title === 'Deputy/Assistant Manager') {
      restored.careerTimeline = [{ ...rowShapes.careerTimeline, isFirstRole: true }, ...rows]
    }
    restored.timelineIntegrated = true
  }
  // An old empty first-role prompt can keep its purpose, but a filled row's
  // position alone is not evidence that it was the respondent's first role.
  const oldRows = stored.careerTimeline
  if (Array.isArray(oldRows) && oldRows.length === 3 && isRecord(oldRows[0]) && !('isFirstRole' in oldRows[0]) && oldRows[0].title === '' && isRecord(oldRows[1]) && oldRows[1].title === 'Buddy Trainer' && isRecord(oldRows[2]) && oldRows[2].title === 'Deputy/Assistant Manager' && Array.isArray(restored.careerTimeline)) {
    const rows = restored.careerTimeline as RecordValue[]
    if (rows[0]?.title === '') restored.careerTimeline = [{ ...rows[0], isFirstRole: true }, ...rows.slice(1)]
  }
  // Only fill the untouched known management entry, never an edited or ended role.
  if (Array.isArray(restored.careerTimeline)) {
    restored.careerTimeline = restored.careerTimeline.map(row => {
      if (isRecord(row) && row.isSeeded === true && row.title === 'Deputy/Assistant Manager' && row.startYear === '' && row.endYear === '' && !row.previousEndYear) {
        return { ...row, endYear: 'Present' }
      }
      return row
    })
  }
  return restored as T
}
