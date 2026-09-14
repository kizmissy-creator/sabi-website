import { examplePrompts, singleExampleAnswer, type ExampleKind } from './exampleAnswers'
import { checkboxNoteQuestions, checkboxNoteApplies, nonExperienceChoices } from './checkboxNotes'
import { experiencePrompts, experienceGroupSections, experiencePromptApplies } from './experiencePrompts'
import { previouslyKnownMeasures } from './commercialQuestions'
import { isCurrentWorkStyleAnswer } from './exploration'

type AnswerRecord = Record<string, unknown>
type ConditionalField = {
  key: string
  label: string
  section: number
  applies: (answers: AnswerRecord) => boolean
}

const includes = (answers: AnswerRecord, key: string, value: string) =>
  Array.isArray(answers[key]) && answers[key].includes(value)

// These are precisely the fields hidden by a parent choice, not optional fields
// or collapsed supporting details that still belong to the current answer.
export const conditionalFields: ConditionalField[] = [
  { key: 'salaryMinimumDetail', label: 'Earlier minimum-pay detail', section: 12, applies: a => ['could_consider_less', 'minimum_higher'].includes(String(a.salaryMinimumChoice)) },
  { key: 'directReportsCount', label: 'Number of direct reports', section: 2, applies: a => ['I have specific direct reports', 'A mixture of both'].includes(String(a.directReportsModel)) },
  { key: 'directReportsOther', label: 'Other reporting arrangement', section: 2, applies: a => a.directReportsModel === 'Something else' },
  { key: 'recruitmentAuthority', label: 'Recruitment responsibility', section: 3, applies: a => Array.isArray(a.recruitmentScope) && a.recruitmentScope.some(value => !nonExperienceChoices.includes(value)) },
  { key: 'employeeRelationsAuthority', label: 'Your role in management situations', section: 3, applies: a => Array.isArray(a.employeeRelations) && a.employeeRelations.some(value => value !== 'None of these are really part of my role') },
  ...([
    ['recruitmentOther', 'Other recruitment detail', 'recruitmentScope', 3],
    ['employeeRelationsOther', 'Other management situations', 'employeeRelations', 3],
    ['commercialOther', 'Other financial measure', 'commercialMeasures', 4],
    ['excelOther', 'Other Excel use', 'excelUse', 5],
    ['lookerOther', 'Other Looker use', 'lookerUse', 5],
    ['rotageekOther', 'Other Rotageek use', 'rotageekUse', 5],
    ['rolesToReduceOther', 'Other work you want less of', 'rolesToReduce', 7],
    ['councilOther', 'Other reasons for council work', 'councilReasons', 10],
    ['finishTimeOther', 'Other finish-time detail', 'finishTime', 12],
  ] as const).map(([key, label, parent, section]) => ({ key, label, section, applies: (a: AnswerRecord) => includes(a, parent, 'Something else') })),
]

export const withoutFigures = 'I\u2019d rather describe the result without figures'

export const legacyFields = [
  ['titleChanged', 'Earlier job-title answer', 1],
  ['highestGrossingPreviousAnswer', 'Earlier highest-grossing answer', 2],
  ['numberUse', 'Earlier use-of-figures answer', 4],
  ['numberUseExample', 'Earlier financial example', 4],
  ['offPremiseEvidenceLink', 'Earlier Off-Premise reference', 4],
  ['licenceTypes', 'Earlier licence or certificate selections', 6],
  ['licences', 'Earlier licence or certificate answer', 6],
  ['drivingTypes', 'Earlier driving selections', 6],
  ['driving', 'Earlier driving answer', 6],
] as const

export type RetainedAnswer = {
  key: string
  label: string
  section: number
  value: string
  reason: 'changed_choice' | 'earlier_form' | 'without_figures'
  originalValue?: unknown
}

const isRecord = (value: unknown): value is AnswerRecord => value !== null && typeof value === 'object' && !Array.isArray(value)

export function currentAnswerView<T extends AnswerRecord>(answers: T): { current: T; retained: RetainedAnswer[] } {
  const current = { ...answers }
  const retained: RetainedAnswer[] = []
  if (isRecord(answers.workStyle)) {
    const choices: AnswerRecord = {}
    for (const [id, value] of Object.entries(answers.workStyle)) {
      if (typeof value === 'string' && isCurrentWorkStyleAnswer(id, value)) choices[id] = value
      else if (typeof value === 'string' && value.trim()) retained.push({ key: `workStyle.${id}`, label: `Earlier work-balance answer: ${id}`, section: 13, value, reason: 'earlier_form' })
    }
    ;(current as AnswerRecord).workStyle = choices
  }
  if (isRecord(answers.workStyleEarlier)) {
    for (const [id, value] of Object.entries(answers.workStyleEarlier)) {
      if (typeof value === 'string' && value.trim()) retained.push({ key: `workStyleEarlier.${id}`, label: `Earlier work-balance answer: ${id}`, section: 13, value, reason: 'earlier_form' })
    }
    ;(current as AnswerRecord).workStyleEarlier = {}
  }
  if (answers.salaryMinimumChoice && isRecord(answers.constraintFlexibility)) {
    const { ['£30,000+ salary']: earlierSalary, ...preferences } = answers.constraintFlexibility
    if (typeof earlierSalary === 'string' && earlierSalary.trim()) retained.push({ key: 'constraintFlexibility.£30,000+ salary', label: 'Earlier salary preference, not a confirmed minimum', section: 12, value: earlierSalary, reason: 'earlier_form' })
    ;(current as AnswerRecord).constraintFlexibility = preferences
  }
  for (const [key, section] of [['careerTimeline', 1], ['regionalResponsibilities', 18]] as const) {
    if (!Array.isArray(answers[key])) continue
    ;(current as AnswerRecord)[key] = answers[key].map((saved, index) => {
      if (!isRecord(saved)) return saved
      const { previousEndYear, ...role } = saved
      if (typeof previousEndYear === 'string' && previousEndYear.trim()) retained.push({ key: `${key}.${index}.previousEndYear`, label: `Earlier end year: ${role.title || role.label || `role ${index + 1}`}`, section, value: previousEndYear, reason: 'changed_choice' })
      return role
    })
  }
  for (const [key, kind, section] of [['developmentExamples', 'development', 3], ['commercialExamples', 'financial', 4]] as const) {
    if (!Array.isArray(answers[key])) continue
    ;(current as AnswerRecord)[key] = answers[key].map((saved, index) => {
      if (!isRecord(saved)) return saved
      const item: AnswerRecord = { ...singleExampleAnswer(saved, kind as ExampleKind) }
      for (const [field, label] of [...examplePrompts[kind], ['earlierNote', 'Earlier written answer']] as const) {
        if (typeof item[field] === 'string' && item[field].trim()) retained.push({ key: `${key}.${index}.${field}`, label: `${label}: example ${index + 1}`, section, value: item[field], reason: 'earlier_form', originalValue: item[field] })
        item[field] = ''
      }
      return item
    })
  }
  for (const field of conditionalFields) {
    if (field.applies(answers)) continue
    const value = answers[field.key]
    if (typeof value === 'string' && value.trim()) retained.push({ key: field.key, label: field.label, section: field.section, value, reason: 'changed_choice' })
    if (field.key in current) (current as AnswerRecord)[field.key] = ''
  }
  if (isRecord(answers.commercialDetails)) {
    const activeDetails: AnswerRecord = {}
    for (const [measure, value] of Object.entries(answers.commercialDetails)) {
      if (includes(answers, 'commercialMeasures', measure) || previouslyKnownMeasures.includes(measure)) activeDetails[measure] = value
      else if (typeof value === 'string' && value.trim()) retained.push({ key: 'commercialDetails.' + measure, label: measure + ' detail', section: 4, value, reason: 'changed_choice' })
    }
    ;(current as AnswerRecord).commercialDetails = activeDetails
  }
  if (isRecord(answers.checkboxNotes)) {
    const activeNotes: AnswerRecord = {}
    for (const [key, value] of Object.entries(answers.checkboxNotes)) {
      const question = checkboxNoteQuestions.find(item => item.key === key)
      if (question && checkboxNoteApplies(key, answers)) activeNotes[key] = value
      else if (typeof value === 'string' && value.trim()) retained.push({ key: 'checkboxNotes.' + key, label: question?.question || 'Earlier checkbox detail', section: question?.section ?? 17, value, reason: question ? 'changed_choice' : 'earlier_form' })
    }
    ;(current as AnswerRecord).checkboxNotes = activeNotes
  }
  if (isRecord(answers.experienceNotes)) {
    const activeNotes: AnswerRecord = {}
    for (const [key, value] of Object.entries(answers.experienceNotes)) {
      const prompt = experiencePrompts.find(item => item.id === key)
      if (prompt && experiencePromptApplies(prompt, answers)) activeNotes[key] = value
      else if (typeof value === 'string' && value.trim()) retained.push({ key: 'experienceNotes.' + key, label: prompt?.question || 'Earlier experience note', section: prompt ? experienceGroupSections[prompt.group] : 17, value, reason: prompt ? 'changed_choice' : 'earlier_form' })
    }
    ;(current as AnswerRecord).experienceNotes = activeNotes
  }
  for (const [key, label, section] of legacyFields) {
    if (!(key in answers)) continue
    const originalValue = answers[key]
    const value = Array.isArray(originalValue) ? originalValue.join(', ') : String(originalValue ?? '')
    if (value.trim()) retained.push({ key, label, section, value, reason: 'earlier_form', originalValue })
    ;(current as AnswerRecord)[key] = Array.isArray(originalValue) ? [] : ''
  }
  if (isRecord(answers.commercialEvidence)) {
    const labels: Record<string, string> = { figure: 'Amount or score', period: 'Time period', scope: 'Scope', responsibility: 'Your part', outcome: 'Result', certainty: 'Certainty' }
    for (const [measure, entry] of Object.entries(answers.commercialEvidence)) {
      if (!isRecord(entry) || !Object.values(entry).some(Boolean)) continue
      const value = Object.entries(labels).filter(([key]) => entry[key]).map(([key, label]) => label + ': ' + entry[key]).join('\n')
      retained.push({ key: 'commercialEvidence:' + measure, label: 'Earlier figure: ' + measure, section: 4, value: value || 'Saved detail from an earlier form', reason: 'earlier_form', originalValue: { [measure]: entry } })
    }
    ;(current as AnswerRecord).commercialEvidence = {}
  }
  if (Array.isArray(current.commercialExamples)) {
    ;(current as AnswerRecord).commercialExamples = current.commercialExamples.map((item, index) => {
      if (!isRecord(item) || item.certainty !== withoutFigures) return item
      if (typeof item.figure === 'string' && item.figure.trim()) retained.push({ key: `commercialExamples.${index}.figure`, label: `Amount or score from example ${index + 1}`, section: 4, value: item.figure, reason: 'without_figures' })
      return { ...item, figure: '' }
    })
  }
  return { current, retained }
}
