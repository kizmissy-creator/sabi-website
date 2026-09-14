import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { currentAnswerView, withoutFigures } from './conditionalAnswers'
import { readableReview, sendFollowUp } from './delivery'
import { restoreAnswers } from './restoreAnswers'
import { hasTimelineAddition, reviewText } from './experienceReview'
import { examplePrompts, singleExampleAnswer, type ExampleKind } from './exampleAnswers'
import { useDraftOwnership } from './useDraftOwnership'
import { roleOrder, initialExplorationUi, restoreExplorationUi, workStylePairs, workStylePrompts, workStyleAlternatives, isCurrentWorkStyleAnswer, type ExplorationUi } from './exploration'
import { adjacentPosition, experienceProgress, normalisePosition, positionHash, readPositionHash, sectionOrder, sectionPageCounts, type FollowUpPosition } from './followUpFlow'
import { PageHeader, SelectableOptionCard, TextArea, TextInput } from './components'
import { WorkLifePreferences, salarySummary } from './WorkLifePreferences'
import { roleIdeas, roleInterestGroup, updateRoleReaction } from './roleIdeas'
import { RoleDateFields } from './RoleDateFields'
import { setCurrentRole, type RoleDates } from './roleDates'
import { restoreTimelineRole, timelineDateSummary, timelineEditLabel, updateTimelineRole, type TimelineRole } from './timelineRoles'
import { commercialQuestions, commercialGroups, previouslyKnownMeasures } from './commercialQuestions'
import { checkboxNoteQuestions, checkboxNoteApplies, checkboxChoiceLabels, nonExperienceChoices } from './checkboxNotes'
import { experiencePrompts, legacyExperiencePrompts, sharedExperiencePrompts, savedOnlyExperiencePromptIds, experienceGroupSections, experiencePromptApplies, performanceSupportChoice, performanceSupportValues, type ExperienceGroup } from './experiencePrompts'

type RegionalRole = RoleDates & { id: string; label: string; notSure: boolean }
type DevelopmentExample = { note?: string; earlierNote?: string; situation: string; action: string; result: string; answerMode?: string }
type RoleReaction = { roleId: string; titleReaction: string; descriptionReaction: string; revealed: boolean; reason?: string }
type CommercialEvidence = { figure: string; period: string; scope: string; responsibility: string; outcome: string; certainty: string }
type CommercialExample = CommercialEvidence & { measures: string; note?: string; earlierNote?: string; source?: string; answerMode?: string; offPremise?: boolean; topic?: string }
type Answers = {
  commercialKnownCorrection: string
  commercialResponsibility?: string
  offPremiseEvidenceLink: string
  commercialExamples: CommercialExample[]
  directReportsOther: string
  recruitmentAuthority: string
  employeeRelationsAuthority: string
  regionalTrainingPeople: string
  regionalTrainingDates: string
  regionalResultsPeriod: string
  regionalTrainingDetail: string
  learningAmbassadorDetail: string
  areaMeetingsDetail: string
  commercialEvidence: Record<string, CommercialEvidence>
  timelineUnsure: boolean
  joinedAs: string
  timelineIntegrated: boolean
  careerTimeline: TimelineRole[]
  titleChanged: string
  titleChanges: string
  roleOverlap: string
  regionalResponsibilities: RegionalRole[]
  awardYear: string
  awardReason: string
  busyShiftPeople: string
  directReportsModel: string
  directReportsCount: string
  turnoverType: string
  turnoverValue: string
  highestGrossingRestaurant: string
  highestGrossingComfort: string
  highestGrossingPreviousAnswer: string
  gmCover: string[]
  gmCoverOther: string
  recruitmentScope: string[]
  recruitmentOther: string
  employeeRelations: string[]
  employeeRelationsOther: string
  developmentExamples: DevelopmentExample[]
  commercialMeasures: string[]
  commercialDetails: Record<string, string>
  commercialGroupDetails: Record<string, string>
  checkboxNotes: Record<string, string>
  experienceNotes: Record<string, string>
  commercialOther: string
  numberUse: string
  numberUseExample: string
  offPremiseProblem: string
  offPremiseAction: string
  offPremiseResult: string
  offPremiseNote: string
  excelUse: string[]
  excelOther: string
  lookerUse: string[]
  lookerOther: string
  rotageekUse: string[]
  rotageekOther: string
  workflowExample: string
  otherSoftware: string
  licenceTypes: string[]
  licenceDetails: string
  licences: string
  drivingTypes: string[]
  drivingDetails: string
  driving: string
  rolesToReduce: string[]
  rolesToReduceOther: string
  managementPreference: string
  influenceProgression: string
  comfortableChange: string[]
  possibleChange: string[]
  tooFarChange: string[]
  councilReasons: string[]
  councilOther: string
  workplacePreference: string
  workplaceNotes: string
  constraintFlexibility: Record<string, string>
  workStyleEarlier: Record<string, string>
  salaryMinimumChoice: string
  salaryMinimumDetail: string
  finishTime: string[]
  finishTimeOther: string
  latestFinishTime: string
  workStyle: Record<string, string>
  jobTitleReactions: RoleReaction[]
  surprise: string
  reviewNotes: string
  existingEvidence: string[]
}

const formVersion = 'bronagh-career-follow-up-2026-09-v1'
const clientReference = 'CL-2026-001'
// Owner-requested clean review. Old test drafts stay isolated as a safety copy.
// Keep this revision stable on future deployments so new answers survive updates.
const testDelivery = new URLSearchParams(window.location.search).get('test') === '1'
const reviewRevision = testDelivery ? 'delivery-test-v1' : 'client-v1'
const draftKey = `sabi-${formVersion}-${reviewRevision}-draft`
const submissionKey = `sabi-${formVersion}-${reviewRevision}-submission`
const pendingKey = submissionKey + '-pending'

const sections = [
  'Start',
  'Timeline',
  'Team and restaurant',
  'Working with others',
  'Numbers and results',
  'Software',
  'Licences and driving',
  'Less of',
  'Management',
  'Different roles',
  'Council',
  'Where you work',
  'Work that fits your life',
  'Work style',
  'Explore possibilities',
  'Documents',
  'Finish',
  'Your starting point',
  'Regional work',
  'Check additional details',
]

// Keep section IDs stable so existing drafts survive the new sequence.
const stageNames = ['Your experience', 'What matters next', 'Explore possibilities']
const stageFor = (step: number) => [0, 1, 18, 2, 3, 4, 5, 6, 15, 19].includes(step) ? 0 : [12, 11, 10, 7, 8].includes(step) ? 1 : 2


const regionalRows = [
  ['health_safety_lead', 'Regional Health & Safety Lead'],
  ['off_premise', 'Off-Premise regional work'],
  ['area_meetings', 'Assistant Manager area-meeting work'],
  ['learning_ambassador', 'Learning Ambassador training/development'],
]

const reactionOptions = [
  ['would_click', "Yes, I'd click"],
  ['maybe_click', 'Maybe'],
  ['would_skip', "No, I'd scroll past"],
  ['unclear_title', "I don't know what that means"],
]

const roleTests = [
  ['learning_development_officer', 'Learning & Development Officer', 'Helps people develop at work. This can include working out what training people need, creating or organising training, supporting learners and managers, delivering sessions and checking whether the training actually helped.'],
  ['training_quality_manager', 'Training & Quality Manager', 'Looks at performance and quality, spots where things are going wrong, and uses coaching, training and better processes to help teams improve standards and results.'],
  ['workforce_development_coordinator', 'Workforce Development Coordinator', 'Helps an organisation develop its workforce. This can involve organising training, identifying development needs, working with managers, supporting learners and tracking whether people are gaining the skills they need.'],
  ['service_improvement_officer', 'Service Improvement Officer', 'Looks at how a service is performing, works out what is causing problems, works with staff to improve the way things are done and uses information or KPIs to see whether the changes worked.'],
  ['programme_implementation_officer', 'Programme / Implementation Officer', 'Helps turn a new project, service or organisational change into something that actually works in practice. Usually involves coordinating people, actions and information, solving implementation problems, communicating changes and keeping delivery on track.'],
  ['service_delivery_manager', 'Service Delivery Manager', 'Takes responsibility for making sure a service runs well day to day. Usually involves people, resources, performance, standards, problems and improvement, although the actual service could be completely different from hospitality.'],
  ['apprenticeship_skills_coach', 'Apprenticeship Skills Coach', 'Supports apprentices through their qualification. Usually involves coaching, progress reviews, helping learners gather evidence, keeping them on track, working with employers and preparing them for their End Point Assessment.'],
  ['quality_performance_officer', 'Quality & Performance Officer', 'Monitors things like standards, audits, KPIs or service performance, identifies problems or risks and works with teams to create and follow improvement plans.'],
]

function emptyCommercialExample(): CommercialExample {
  return { measures: '', figure: '', period: '', scope: '', responsibility: '', outcome: '', certainty: '', note: '', source: '', answerMode: 'current', offPremise: false }
}

const initialAnswers: Answers = {
  commercialKnownCorrection: '',
  commercialResponsibility: '',
  highestGrossingPreviousAnswer: '',
  offPremiseEvidenceLink: '',
  commercialExamples: [emptyCommercialExample()],
  directReportsOther: '', recruitmentAuthority: '', employeeRelationsAuthority: '',
  regionalTrainingPeople: '', regionalTrainingDates: '', regionalResultsPeriod: '',
  regionalTrainingDetail: '', learningAmbassadorDetail: '', areaMeetingsDetail: '',
  commercialEvidence: {},
  commercialGroupDetails: {}, otherSoftware: '',
  timelineUnsure: false,
  joinedAs: '',
  timelineIntegrated: true,
  careerTimeline: [{ title: '', startYear: '', endYear: '', isFirstRole: true }, { title: 'Buddy Trainer', startYear: '', endYear: '', isSeeded: true }, { title: 'Deputy/Assistant Manager', startYear: '', endYear: 'Present', isSeeded: true }],
  titleChanged: '', titleChanges: '', roleOverlap: '',
  regionalResponsibilities: regionalRows.map(([id, label]) => ({ id, label, startYear: '', endYear: '', notSure: false })),
  awardYear: '', awardReason: '', busyShiftPeople: '', directReportsModel: '', directReportsCount: '', turnoverType: '', turnoverValue: '', highestGrossingRestaurant: '', highestGrossingComfort: '',
  gmCover: [], gmCoverOther: '', recruitmentScope: [], recruitmentOther: '', employeeRelations: [], employeeRelationsOther: '',
  developmentExamples: [{ note: '', situation: '', action: '', result: '', answerMode: 'current' }],
  commercialMeasures: [], commercialDetails: {}, checkboxNotes: {}, experienceNotes: {}, commercialOther: '', numberUse: '', numberUseExample: '', offPremiseProblem: '', offPremiseAction: '', offPremiseResult: '', offPremiseNote: '',
  excelUse: [], excelOther: '', lookerUse: [], lookerOther: '', rotageekUse: [], rotageekOther: '', workflowExample: '', licenceTypes: [], licenceDetails: '', licences: '', drivingTypes: [], drivingDetails: '', driving: '',
  rolesToReduce: [], rolesToReduceOther: '', managementPreference: '', influenceProgression: '', comfortableChange: [], possibleChange: [], tooFarChange: [],
  councilReasons: [], councilOther: '', workplacePreference: '', workplaceNotes: '',
  constraintFlexibility: {}, salaryMinimumChoice: '', salaryMinimumDetail: '', workStyleEarlier: {},
  finishTime: [], finishTimeOther: '', latestFinishTime: '',
  workStyle: {},
  jobTitleReactions: roleTests.map(([roleId]) => ({ roleId, titleReaction: '', descriptionReaction: '', revealed: false })),
  surprise: '',
  reviewNotes: '',
  existingEvidence: [],
}

const oldHighestGrossingOptions = [
  'Yes, definitely',
  'I believe so, but I’d rather phrase it cautiously',
  'It’s more informal/internal knowledge',
  'I’m not sure',
  'I’d rather not use it',
  'Confident enough to say clearly',
  'Use it, but phrase it cautiously',
  'Treat it as informal/internal knowledge',
  'I’d rather leave it out',
]

export function BronaghFollowUp() {
  const [position, setPosition] = useState<FollowUpPosition>({ step: 0, questionIndex: 0 })
  const { step, questionIndex } = position
  const questionCount = sectionPageCounts[step]
  const experiencePage = experienceProgress(position)
  const [reviewReturn, setReviewReturn] = useState<FollowUpPosition | null>(null)
  const [answers, setAnswers] = useState<Answers>(initialAnswers)
  const [explorationUi, setExplorationUi] = useState<ExplorationUi>(initialExplorationUi)
  const [saveMessage, setSaveMessage] = useState('Your answers save as you go.')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [pendingDelivery, setPendingDelivery] = useState<string | null>(null)
  const deliveryBusy = useRef(false)
  const [deliveryError, setDeliveryError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const draftSnapshot = useRef('')
  const [saveFailed, setSaveFailed] = useState(false)
  const [paused, setPaused] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const recoveryBlocked = useRef(true)
  const recoveryRaw = useRef<string | null>(null)
  const lastStored = useRef<string | null>(null)
  const conflictSnapshot = useRef<string | null>(null)
  const [conflictMessage, setConflictMessage] = useState('')
  const ownership = useDraftOwnership(draftKey + '-writer', () => { saveDraft() })

  function restoreSavedDraft() {
    recoveryBlocked.current = true
    recoveryRaw.current = null
    try {
      const saved = localStorage.getItem(draftKey)
      recoveryRaw.current = saved
      lastStored.current = saved
      const data = saved === null ? null : JSON.parse(saved)
      const restoredAnswers = saved === null ? { ...initialAnswers } : restoreAnswers(data?.answers, initialAnswers)
      if (!(data?.answerMigrationVersion >= 1) && oldHighestGrossingOptions.includes(restoredAnswers.highestGrossingComfort)) {
        restoredAnswers.highestGrossingPreviousAnswer = [...new Set([restoredAnswers.highestGrossingPreviousAnswer, restoredAnswers.highestGrossingComfort].filter(Boolean))].join('\n')
        restoredAnswers.highestGrossingComfort = ''
      }
      if (data?.answers.licenceDetails === undefined && restoredAnswers.licences) restoredAnswers.licenceDetails = restoredAnswers.licences
      if (data?.answers.drivingDetails === undefined && restoredAnswers.driving) restoredAnswers.drivingDetails = restoredAnswers.driving
      if (data && data.answers.commercialExamples === undefined) {
        restoredAnswers.commercialExamples = Object.entries(restoredAnswers.commercialEvidence).filter(([, entry]) => Object.values(entry).some(Boolean)).map(([measures, entry]) => ({ measures, ...entry }))
      }
      restoredAnswers.developmentExamples = restoredAnswers.developmentExamples.map(item => singleExampleAnswer(item, 'development'))
      restoredAnswers.commercialExamples = restoredAnswers.commercialExamples.map(item => singleExampleAnswer(item, 'financial'))
      setAnswers(restoredAnswers)
      setExplorationUi(restoreExplorationUi(data?.explorationUi, restoredAnswers.workStyle, restoredAnswers.jobTitleReactions, roleTests.map(([id]) => id)))
      setPosition(readPositionHash(window.location.hash) || normalisePosition(data?.step, data?.questionIndex))
      setPaused(data?.paused === true)
      setRecoveryMessage('')
      setConflictMessage('')
      conflictSnapshot.current = null
      setSaveFailed(false)
      setSaveMessage(saved === null ? 'Your answers save as you go.' : 'Restored your saved follow-up draft from this device.')
      recoveryBlocked.current = false
    } catch {
      setRecoveryMessage('The saved draft could not be opened. It has not been replaced.')
    }
  }

  useEffect(() => {
    if (ownership.status !== 'owned') return
    restoreSavedDraft()
    try { setSubmitted(Boolean(localStorage.getItem(submissionKey))) } catch { /* Draft recovery handles unavailable storage. */ }
    try { setPendingDelivery(localStorage.getItem(pendingKey)) } catch { /* Saving must succeed before sending. */ }
    const savedReturn = window.history.state?.followUp?.reviewReturn
    if (savedReturn && [17, 19].includes(savedReturn.step)) setReviewReturn(normalisePosition(savedReturn.step, savedReturn.questionIndex))
    setLoaded(true)
  }, [ownership.status])

  function startSeparateDraft() {
    if (!ownership.isOwner()) return
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved !== null) {
        const backupKey = draftKey + '-recovery-' + crypto.randomUUID()
        localStorage.setItem(backupKey, saved)
        if (localStorage.getItem(backupKey) !== saved) throw new Error('Backup could not be verified')
      }
      const fresh = JSON.stringify({ clientReference, formType: 'career_partner_follow_up', formVersion, flowRevision: 4, answerMigrationVersion: 1, step: 0, questionIndex: 0, paused: false, explorationUi: initialExplorationUi, answers: initialAnswers, savedAt: new Date().toISOString() })
      localStorage.setItem(draftKey, fresh)
    } catch {
      setRecoveryMessage('A separate draft could not be saved. The earlier draft has not been replaced. Keep this page open and try again.')
      return
    }
    window.history.replaceState({ ...window.history.state, followUp: { position: { step: 0, questionIndex: 0 }, reviewReturn: null } }, '', positionHash({ step: 0, questionIndex: 0 }))
    setReviewReturn(null)
    restoreSavedDraft()
  }

  function downloadSavedDraft() {
    if (recoveryRaw.current === null) return
    downloadSnapshot(recoveryRaw.current)
  }

  function clearSavedAnswers() {
    if (pendingDelivery || sending) return
    if (!ownership.isOwner() || !window.confirm('Clear all answers saved for this review form in this browser? This cannot be undone. Your original onboarding information is not affected.')) return
    recoveryBlocked.current = true
    try {
      const keys = Object.keys(localStorage).filter(key => key === draftKey || key === submissionKey || key.startsWith(draftKey + '-recovery-') || key.startsWith(draftKey + '-conflict-'))
      keys.forEach(key => localStorage.removeItem(key))
      window.history.replaceState({ ...window.history.state, followUp: { position: { step: 0, questionIndex: 0 }, reviewReturn: null } }, '', positionHash({ step: 0, questionIndex: 0 }))
      setReviewReturn(null)
      setSubmitted(false)
      restoreSavedDraft()
      setSaveMessage('Saved answers cleared. You can start again.')
    } catch {
      setRecoveryMessage('Not all saved answers could be cleared. Keep this page open and try again.')
    }
  }

  function downloadSnapshot(snapshot: string) {
    const url = URL.createObjectURL(new Blob([snapshot], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'bronagh-follow-up-recovery.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  useLayoutEffect(() => {
    if (!loaded) return
    window.history.replaceState({ ...window.history.state, followUp: { position, reviewReturn } }, '', positionHash(position))
    const onPopState = (event: PopStateEvent) => {
      const saved = event.state?.followUp
      const target = readPositionHash(window.location.hash)
      if (target) {
        if (window.location.hash !== positionHash(target)) window.history.replaceState({ ...window.history.state, followUp: { ...saved, position: target } }, '', positionHash(target))
        setPaused(false)
        setPosition(target)
        setReviewReturn(saved?.reviewReturn ? normalisePosition(saved.reviewReturn.step, saved.reviewReturn.questionIndex) : null)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [loaded])

  draftSnapshot.current = JSON.stringify({ clientReference, formType: 'career_partner_follow_up', formVersion, flowRevision: 4, answerMigrationVersion: 1, step, questionIndex, paused, explorationUi, answers, savedAt: new Date().toISOString() })

  function saveSnapshot(snapshot: string) {
    if (!loaded || recoveryBlocked.current || !ownership.isOwner()) return false
    try {
      if (localStorage.getItem(draftKey) !== lastStored.current) {
        showConflict()
        return false
      }
      localStorage.setItem(draftKey, snapshot)
      lastStored.current = snapshot
      setSaveFailed(false)
      setSaveMessage('Draft saved on this device.')
      return true
    } catch {
      setSaveFailed(true)
      setSaveMessage('This browser could not save your latest answers. Keep this page open.')
      return false
    }
  }

  function saveDraft() { return saveSnapshot(draftSnapshot.current) }

  function showConflict() {
    recoveryBlocked.current = true
    conflictSnapshot.current ??= draftSnapshot.current
    setConflictMessage('Another tab changed the saved draft. This tab has stopped saving so neither version is silently overwritten.')
  }

  function resolveConflict(keepThisTab: boolean) {
    if (!ownership.isOwner() || !conflictSnapshot.current) return
    try {
      const remote = localStorage.getItem(draftKey)
      const backup = keepThisTab ? remote : conflictSnapshot.current
      if (backup !== null) {
        const backupKey = draftKey + '-conflict-' + crypto.randomUUID()
        localStorage.setItem(backupKey, backup)
        if (localStorage.getItem(backupKey) !== backup) throw new Error('Backup not saved')
      }
      if (localStorage.getItem(draftKey) !== remote) throw new Error('Draft changed again')
      if (!keepThisTab) { setConflictMessage(''); restoreSavedDraft(); return }
      lastStored.current = remote
      recoveryBlocked.current = false
      if (!saveSnapshot(conflictSnapshot.current)) { recoveryBlocked.current = true; setConflictMessage('This version could not be saved. Keep this page open, or download your answers before trying again.'); return }
      conflictSnapshot.current = null
      setConflictMessage('')
    } catch {
      setConflictMessage('The versions could not be safely saved. Both are unchanged. Keep this page open, or download this tab\'s answers before trying again.')
    }
  }

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (!loaded || !ownership.isOwner() || recoveryBlocked.current || (event.key !== draftKey && event.key !== null)) return
      try { if (localStorage.getItem(draftKey) !== lastStored.current) showConflict() }
      catch { setSaveFailed(true); setSaveMessage('This browser could not check your saved draft. Keep this page open.') }
    }
    window.addEventListener('storage', changed)
    return () => window.removeEventListener('storage', changed)
  }, [loaded, ownership.status])

  function pauseDraft() {
    const snapshot = JSON.stringify({ ...JSON.parse(draftSnapshot.current), paused: true })
    if (saveSnapshot(snapshot)) {
      draftSnapshot.current = snapshot
      setPaused(true)
    }
  }

  useEffect(() => {
    if (!loaded || recoveryBlocked.current) return
    const timer = window.setTimeout(saveDraft, 350)
    const flushWhenHidden = () => { if (document.visibilityState === 'hidden') saveDraft() }
    window.addEventListener('pagehide', saveDraft)
    document.addEventListener('visibilitychange', flushWhenHidden)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pagehide', saveDraft)
      document.removeEventListener('visibilitychange', flushWhenHidden)
    }
  }, [answers, step, questionIndex, explorationUi, loaded, paused, recoveryMessage])

  useLayoutEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.follow-up-panel-body > .follow-up-question-card'))
    cards.forEach((card, index) => {
      card.hidden = step !== 17 && cards.length > 1 && index !== questionIndex
    })
  })

  useEffect(() => {
    if (!loaded && ownership.status === 'checking') return
    const main = document.getElementById('follow-up-main')
    const heading = main?.querySelector<HTMLElement>('.follow-up-panel-body > .follow-up-question-card:not([hidden]) h2, .follow-up-panel-body > .follow-up-question-card:not([hidden]) > h2') || main?.querySelector<HTMLElement>('h1')
    if (heading) {
      document.title = heading.textContent + ' | SABI follow-up'
      heading.tabIndex = -1
      heading.dataset.pageHeadingFocus = 'true'
      heading.focus({ preventScroll: true })
    }
    main?.scrollIntoView({ block: 'start' })
  }, [loaded, step, questionIndex, paused, recoveryMessage, conflictMessage, ownership.status])

  function setValue<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }))
  }

  function toggle(key: keyof Answers, value: string) {
    const current = answers[key]
    if (!Array.isArray(current)) return
    const selected = current as string[]
    const exclusive = nonExperienceChoices
    if (key === 'employeeRelations' && value === performanceSupportChoice) {
      // Show one choice without rewriting the meaning of earlier selections.
      const alreadySelected = selected.some(item => performanceSupportValues.includes(item))
      const remaining = selected.filter(item => !performanceSupportValues.includes(item) && !exclusive.includes(item))
      setAnswers(draft => ({ ...draft, employeeRelations: alreadySelected ? remaining : [...remaining, value] }))
      return
    }
    const next = selected.includes(value) ? selected.filter((item) => item !== value) : exclusive.includes(value) ? [value] : [...selected.filter((item) => !exclusive.includes(item)), value]
    setAnswers((draft) => ({ ...draft, [key]: next }))
  }

  function chooseChange(group: 'comfortableChange' | 'possibleChange' | 'tooFarChange', value: string) {
    setAnswers((current) => {
      const next = { ...current }
      ;(['comfortableChange', 'possibleChange', 'tooFarChange'] as const).forEach((key) => {
        next[key] = key === group
          ? (next[key].includes(value) ? next[key].filter((item) => item !== value) : [...next[key], value])
          : next[key].filter((item) => item !== value)
      })
      return next
    })
  }

  function navigate(target: FollowUpPosition, returnTo = reviewReturn) {
    if (!ownership.isOwner() || conflictSnapshot.current) return
    const next = normalisePosition(target.step, target.questionIndex)
    if (returnTo?.step === next.step && returnTo.questionIndex === next.questionIndex) returnTo = null
    if (next.step === step && next.questionIndex === questionIndex && returnTo === reviewReturn) return
    if (loaded) saveDraft()
    if (conflictSnapshot.current) return
    window.history.pushState({ ...window.history.state, followUp: { position: next, reviewReturn: returnTo } }, '', positionHash(next))
    setPosition(next)
    setReviewReturn(returnTo)
  }

  function move(next: number) {
    navigate({ step: next, questionIndex: 0 })
  }

  function editFromReview(next: number, questionIndex = 0) {
    navigate({ step: next, questionIndex }, position)
  }

  function goBack() {
    if (step === 14 && explorationUi.roleIndex > 0) {
      setExplorationUi(current => ({ ...current, roleIndex: current.roleIndex - 1 }))
      return
    }
    if (step === 13 && explorationUi.workStyleIndex > 0) {
      setExplorationUi(current => ({ ...current, workStyleIndex: current.workStyleIndex - 1 }))
      return
    }
    navigate(adjacentPosition(position, -1))
  }

  function goNext() {
    if (step === 14 && explorationUi.roleIndex < roleOrder.length - 1) {
      setExplorationUi(current => ({ ...current, roleIndex: current.roleIndex + 1 }))
      return
    }
    if (step === 13 && explorationUi.workStyleIndex < workStylePairs.length - 1) {
      setExplorationUi(current => ({ ...current, workStyleIndex: current.workStyleIndex + 1 }))
      return
    }
    navigate(adjacentPosition(position, 1))
  }

  async function submitPreview() {
    if (deliveryBusy.current || recoveryBlocked.current || !ownership.isOwner() || !saveDraft()) return
    const { current, retained } = currentAnswerView(answers)
    deliveryBusy.current = true
    setSending(true)
    setDeliveryError('')
    try {
      const form = document.querySelector<HTMLElement>('main form')
      const payload = pendingDelivery || JSON.stringify({ clientReference, formType: 'career_partner_follow_up', formVersion,
        submissionId: crypto.randomUUID(), testMode: testDelivery, answers: current, retainedAnswers: retained,
        reviewText: (form ? readableReview(form) : '') + '\n\nAdditional note\n' + answers.reviewNotes })
      localStorage.setItem(pendingKey, payload)
      setPendingDelivery(payload)
      const submissionId = await sendFollowUp(payload)
      localStorage.setItem(submissionKey, JSON.stringify({ submissionId, receivedAt: new Date().toISOString() }))
      localStorage.removeItem(pendingKey)
      setPendingDelivery(null)
      setSubmitted(true)
      move(16)
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : 'Receipt was not confirmed. Your draft is still saved. Please try again.')
    } finally {
      deliveryBusy.current = false
      setSending(false)
    }
  }

  const field = (key: keyof Answers, label: string, help?: string) => (
    <Question title={label} help={help}>
      <TextArea id={String(key)} name={String(key)} label={label} hideLabel value={String(answers[key] ?? '')} onChange={(event) => setValue(key as any, event.target.value)} />
    </Question>
  )

  const stageSections = sectionOrder.filter(id => stageFor(id) === stageFor(step))
  const withinSection = questionCount > 1 ? questionIndex / questionCount : 0
  const progressPercent = step === 16 ? 100 : Math.round((stageFor(step) + (stageSections.indexOf(step) + withinSection) / stageSections.length) / 3 * 100)
  return <div className="follow-up-compact min-h-screen">
    <PageHeader progressPercent={progressPercent} currentStep={stageFor(step) + 1} totalSteps={3} stepLabel={stageNames[stageFor(step)]} logoSrc="/follow-up/sabi-mark-complete.png" />
    {testDelivery && <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-950">TEST MODE · fictional answers only · saves to the separate test record</div>}
    <main id="follow-up-main" className="mx-auto max-w-4xl px-4 pb-8 pt-5 sm:px-6 sm:py-6">
      {ownership.status === 'elsewhere' || ownership.status === 'unavailable' ? <section aria-labelledby="ownership-title" className="space-y-4 py-6">
        <h1 id="ownership-title" className="font-display text-2xl font-semibold text-teal-950">{ownership.status === 'elsewhere' ? 'Your draft is open in another tab' : 'Safe editing is unavailable in this browser'}</h1>
        <p role="status" className="text-sm leading-6 text-slate-700">{ownership.status === 'elsewhere' ? 'Continue in that tab, or close it and try here again. Your saved answers have not been changed.' : 'This browser cannot protect the draft from two tabs editing at once. Use a current browser to continue. Your saved answers have not been changed.'}</p>
        <button type="button" onClick={ownership.claim} className="min-h-11 rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-teal-950">Try opening here</button>
      </section> : !loaded || ownership.status === 'checking' ? <p role="status">Opening your draft...</p> : conflictMessage ? <section aria-labelledby="conflict-title" className="space-y-4 py-6">
        <h1 id="conflict-title" className="font-display text-2xl font-semibold text-teal-950">This draft changed in another tab</h1>
        <p role="alert" className="text-sm leading-6 text-slate-700">{conflictMessage}</p>
        <p className="text-sm text-slate-600">The version you do not choose will be kept as a separate backup in this browser.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => resolveConflict(false)} className="min-h-11 rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-teal-950">Open the newer saved draft</button>
          <button type="button" onClick={() => resolveConflict(true)} className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-teal-950">Keep this tab's answers</button>
          <button type="button" onClick={() => downloadSnapshot(conflictSnapshot.current || draftSnapshot.current)} className="min-h-11 px-2 text-sm font-semibold text-teal-800 underline">Download this tab's answers</button>
        </div>
      </section> : recoveryMessage ? <section aria-labelledby="recovery-title" className="space-y-4 py-6">
        <h1 id="recovery-title" className="font-display text-2xl font-semibold text-teal-950">Your saved draft needs attention</h1>
        <p role="alert" className="text-sm leading-6 text-slate-700">{recoveryMessage}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={restoreSavedDraft} className="min-h-11 rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-teal-950">Try opening again</button>
          {recoveryRaw.current !== null && <button type="button" onClick={downloadSavedDraft} className="min-h-11 px-2 text-sm font-semibold text-teal-800 underline">Download saved answers</button>}
        </div>
        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm leading-6 text-slate-600">Starting again keeps a separate backup of the earlier saved data in this browser.</p>
          <button type="button" onClick={startSeparateDraft} className="mt-2 min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-teal-900">Start a new draft, keeping a backup</button>
        </div>
      </section> : paused ? <section aria-labelledby="paused-title" className="space-y-4 py-6">
        <h1 id="paused-title" className="font-display text-2xl font-semibold text-teal-950">{saveFailed ? 'Keep this page open' : 'Saved for later'}</h1>
        <p role={saveFailed ? 'alert' : 'status'} className="text-sm leading-6 text-slate-700">{saveFailed ? saveMessage : 'Your draft is saved in this browser on this device. Nothing has been sent.'}</p>
        <p className="text-sm text-slate-600">Your place: {sections[step]}{questionCount > 1 ? `, question ${questionIndex + 1} of ${questionCount}` : ''}.</p>
        <button type="button" onClick={() => setPaused(false)} className="min-h-11 rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-teal-950">Continue your follow-up</button>
      </section> : <>
      <nav aria-label="Follow-up sections" className="mb-6 space-y-3">
        <details><summary className="cursor-pointer text-sm text-teal-800">Jump to a section</summary>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-600">Section</span>
          <select aria-label="Jump to a section" value={step} onChange={(event) => move(Number(event.target.value))} className="field field-compact min-h-10 text-sm">
            {stageNames.map((name, stage) => <optgroup key={name} label={name}>{sectionOrder.filter((id) => stageFor(id) === stage && id !== 16).map((id) => <option key={id} value={id}>{sections[id]}</option>)}</optgroup>)}
                {step === 16 && <option value={16}>Finish</option>}
          </select>
        </label><button type="button" onClick={clearSavedAnswers} className="mt-3 min-h-11 text-sm text-slate-600 underline">Clear saved answers</button></details>
        {experiencePage && <p className="text-xs text-slate-600">Your experience: page {experiencePage.page} of {experiencePage.total}</p>}
      </nav>
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      <fieldset disabled={Boolean(pendingDelivery) || sending} className="min-w-0 space-y-5">
        {step === 0 && <Panel eyebrow="Career Partner follow-up" title="Building on what you’ve shared"><p>We will fill a few gaps in your experience, then explore what matters in your next job.</p><p>The written follow-ups are optional. One or two figures or results across the whole form are helpful; you do not need one for every topic.</p><p>If you have already told me something, here or in your onboarding, there is no need to write it again. Rough answers are fine, and you can skip anything.</p><p className="mt-4 text-sm font-semibold text-teal-900">Your answers save as you go, so you can come back later.</p></Panel>}
        {step === 1 && <><Panel title="Your Nando’s timeline"><TimelineEditor answers={answers} setAnswers={setAnswers} setValue={setValue} /></Panel></>}
        {step === 18 && <Panel title="Your regional work" intro="You have already described supporting 11 restaurants across the North East. These extra details can help show the scale and timing of that work on your CV."><RegionalEditor answers={answers} setAnswers={setAnswers} setValue={setValue} /></Panel>}
        {step === 2 && <Panel title="The scale of your responsibility" intro="This helps me describe the responsibility you held, beyond what your job title tells us.">
          <Question title="How many people are you responsible for?" help="You’ve described recruitment and retention across a workforce of over 95 people. These two details help distinguish the whole workforce from your day-to-day team.">
            <div className="space-y-5">{subField('busyShiftPeople', 'Roughly how many people are on a busy shift you manage?')}
              <fieldset><legend className="mb-2 text-sm font-semibold">Do you have your own team to manage, or share that responsibility with other managers?</legend><ChoiceList name="directReportsModel" options={['I have specific direct reports', 'Responsibility is mostly shared between managers', 'A mixture of both', 'Something else', 'I’m not sure']} selected={[answers.directReportsModel]} onChange={option => setValue('directReportsModel', option)} /></fieldset>
              {['I have specific direct reports', 'A mixture of both'].includes(answers.directReportsModel) && subField('directReportsCount', 'Roughly how many people report directly to you?')}
              {answers.directReportsModel === 'Something else' && subField('directReportsOther', 'How does it work?')}
              <OptionalTextAnswer id="gmCoverOther" title="How often do you cover the General Manager?" hint="A rough frequency is enough; your responsibilities while covering are already noted." value={answers.gmCoverOther} onChange={value => setValue('gmCoverOther', value)} />
            </div>
          </Question>
          <Question title="Which restaurant is it, and roughly how big is the operation?" help="You described it as the highest-grossing Nando’s in the North East. Estimates are fine.">
            <div className="space-y-4">{subField('highestGrossingRestaurant', 'Which Nando’s?')}
              <TextArea id="highestGrossingComfort" rows={2} label="Where does the highest-grossing detail come from?" hideLabel={false} value={answers.highestGrossingComfort} onChange={event => setValue('highestGrossingComfort', event.target.value)} />
              {answers.highestGrossingPreviousAnswer && <details><summary className="cursor-pointer py-2 text-sm text-teal-800">Earlier answer about this detail</summary><p className="whitespace-pre-wrap text-sm text-slate-600">{answers.highestGrossingPreviousAnswer}</p></details>}
              <div>{subField('turnoverValue', 'Roughly how much does the restaurant take in sales? (optional)')}<p className="mt-2 text-sm text-slate-600">An approximate amount or range and currency are enough. Leave out any confidential figures.</p></div>
              {(answers.turnoverValue.trim() || answers.turnoverType) && <div><label className="block" htmlFor="turnoverType">Is that per week, month or year?</label><select id="turnoverType" className="field mt-2" value={answers.turnoverType} onChange={event => setValue('turnoverType', event.target.value)}><option value="">Not specified</option>{[['Weekly figure', 'Weekly'], ['Monthly figure', 'Monthly'], ['Annual figure', 'Annual'], ['I don’t know', 'Not sure']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}{answers.turnoverType === 'Rough range' && <option value="Rough range">Range (period not yet specified)</option>}</select></div>}
            </div>
          </Question>
        </Panel>}
        {step === 3 && <Panel title="Working with others" intro="This helps show what you personally do, alongside the team’s wider responsibilities."><>{checks('recruitmentScope', 'What role do you play in recruiting new staff?', ['Decide/identify that recruitment is needed', 'Shortlist candidates', 'Interview candidates', 'Make hiring decisions', 'Recommend hiring decisions', 'Something else', 'I’m not involved in choosing new staff'], 'You have already described recruitment, induction, training and staff retention. These choices just clarify your part in selecting new people.')}{checks('employeeRelations', 'Which of these situations have you personally dealt with as a manager?', ['Attendance/absence', performanceSupportChoice, 'Conflict between staff', 'Disciplinary matters', 'Grievances', 'Investigations', 'Welfare/support conversations', 'None of these are really part of my role', 'Something else'])}</></Panel>}
        {step === 4 && <Panel title="Numbers, decisions and results"><CommercialNumbers answers={answers} setAnswers={setAnswers} /></Panel>}
        {step === 5 && <Panel title="How you use the software">
          <Question title="What do you use each tool for?" help="Word, PowerPoint and Slack are already noted. Tick what you use below; no examples needed.">
            <div className="space-y-5">{([
              ['excelUse', 'Excel', ['Entering/updating data', 'Sorting/filtering', 'Formulas', 'Charts', 'Pivot tables', 'Lookups', 'Building trackers', 'Analysing trends/data', 'Reporting', 'Something else', 'I hardly use Excel'], 'excelOther'],
              ['lookerUse', 'Looker', ['Viewing dashboards', 'Comparing time periods', 'Spotting trends/problems', 'Creating reports', 'Creating dashboards', 'Something else'], 'lookerOther'],
              ['rotageekUse', 'Rotageek', ['Building rotas', 'Forecasting staffing requirements', 'Labour planning', 'Reporting', 'Something else'], 'rotageekOther']
            ] as const).map(([key, title, options, other]) => <AnswerDetails key={key} className="border-b border-slate-200 pb-3" initiallyOpen={answers[key].length > 0}><summary className="cursor-pointer py-3 text-sm font-semibold">{title}{answers[key].length ? ' · ' + answers[key].length + ' selected' : ''}</summary><ChoiceList name={key} options={[...options, ...answers[key].filter(value => !(options as readonly string[]).includes(value))]} selected={answers[key]} multiple onChange={value => toggle(key, value)} />{answers[key].includes('Something else') && <div className="mt-3"><TextArea id={other} label={'Anything else you use ' + title + ' for? (optional)'} hideLabel={false} value={answers[other]} onChange={event => setValue(other, event.target.value)} /></div>}</AnswerDetails>)}</div>
            <SoftwareFollowUps answers={answers} setAnswers={setAnswers} /><div className="mt-4"><OptionalTextAnswer id="otherSoftware" title="Any other systems worth including?" hint="The name and a few words about what you use it for are enough. Leave this blank if the tools above cover it." value={answers.otherSoftware} onChange={value => setValue('otherSoftware', value)} /></div>
          </Question>
        </Panel>}
        {step === 6 && <Panel title="Licences and driving"><Question title="Any additional qualifications or driving experience?" help="I have your degree, foundation diploma and apprenticeship details. You also ticked licences or certificates and driving skills. Add what you had in mind; I’ll work out what is relevant for your CV.">
          <div className="space-y-5"><div className="space-y-2"><p id="licenceDetails-help" className="text-sm text-slate-600">Include the provider, level, year and whether it is still valid, if you remember. Driving licences go in the next box.</p><TextArea id="licenceDetails" aria-describedby="licenceDetails-help" label="Any other certificates or qualifications? (optional)" hideLabel={false} value={answers.licenceDetails} onChange={event => setValue('licenceDetails', event.target.value)} /></div>
          <TextArea id="drivingDetails" aria-describedby="drivingDetails-help" label="What driving licences, training or work-related driving experience do you have? (optional)" hideLabel={false} value={answers.drivingDetails} onChange={event => setValue('drivingDetails', event.target.value)} /><p id="drivingDetails-help" className="text-sm text-slate-600">Any licence, advanced driving, work-related driving or vehicle categories you had in mind.</p></div>
        </Question></Panel>}
        {step === 7 && <Panel title="What would you like less of?" intro="This helps us avoid roles that would bring back the parts of work you want to move away from."><>{checks('rolesToReduce', 'Which would you like to do less of in your next job?', ['Direct line management', 'Staff disciplinary/conflict situations', 'Recruitment', 'Customer complaints', 'Being the person every problem escalates to', 'Stock and ordering', 'Building rotas', 'Financial/cost responsibility', 'Hospitality/food-specific work', 'Constant firefighting', 'Repetitive administrative work', 'Telephone-heavy work', 'Sitting at a computer most of the day', 'Working mostly alone', 'None of these particularly bother me', 'Something else'], 'Pick as many as you like. Not ticking something doesn’t mean you love it.')}</></Panel>}
        {step === 8 && <Panel title="How would you like to lead?"><LeadershipPreference answers={answers} setValue={setValue} /></Panel>}
        {step === 9 && <Panel title="Which changes would you consider?" intro="Consider each possibility separately. More than one can feel right."><ChangeScale answers={answers} chooseChange={chooseChange} /></Panel>}
        {step === 10 && <Panel title="Council work">{checks('councilReasons', 'What is it about council work that appeals to you?', ['Security/stability', 'Pension/benefits', 'Monday-Friday hours', 'Flexible/hybrid working', 'Being local', 'Public service / doing something useful', 'Clear pay grades', 'Clear progression', 'A different culture from hospitality', 'I think my experience would transfer there', 'Someone I know works there', 'I’m not really sure, it just appeals to me', 'Something else'])}</Panel>}
        {step === 11 && <Panel title="Where would you like to work?" intro="You selected remote and hybrid in your onboarding. Which arrangement would suit you best?"><div className="grid gap-2 sm:grid-cols-2">{['Mainly on-site would suit me best', 'Hybrid would suit me best', 'Remote would suit me best', 'I’m genuinely open to all three', 'It completely depends on the job'].map((option) => <SelectableOptionCard key={option} name="workplacePreference" value={option} label={option} selected={answers.workplacePreference === option} onChange={() => setValue('workplacePreference', option)} />)}</div><SavedWorkplaceNote value={answers.workplaceNotes} onChange={value => setValue('workplaceNotes', value)} /></Panel>}
        {step === 12 && <Panel title="Work that fits your life"><WorkLifePreferences salaryMinimumChoice={answers.salaryMinimumChoice} salaryMinimumDetail={answers.salaryMinimumDetail} constraintFlexibility={answers.constraintFlexibility} onSalaryChoice={value => setValue('salaryMinimumChoice', value)} onSalaryDetail={value => setValue('salaryMinimumDetail', value)} onPriority={(key, value) => setAnswers(current => ({ ...current, constraintFlexibility: { ...current.constraintFlexibility, [key]: value } }))} /><Question title="What finish time would usually work best for you?" help="You mentioned not wanting to work past 9pm. Your usual preference may be earlier; add a different limit only if there is something to clarify."><ChoiceList name="finishTime" options={['Around 4pm', 'Around 5pm', 'Around 6pm', 'Around 7pm', 'Later is fine occasionally', 'It depends on the job', 'Something else']} selected={answers.finishTime} multiple onChange={value => toggle('finishTime', value)} />
          <OptionalFollowUps>
            {answers.finishTime.includes('Something else') && <OptionalTextAnswer id="finishTimeOther" title="What would work better?" value={answers.finishTimeOther} onChange={value => setValue('finishTimeOther', value)} />}
            <OptionalEvidenceQuestion id="latestFinishTime-optional" title="Is there anything to clarify about your latest finish?" preview={answers.latestFinishTime}>
              <p className="mb-3 text-sm text-slate-600">Only add a different limit or an occasional exception. If 9pm still captures it, no need to repeat that.</p>
              <TextInput id="latestFinishTime" label="Latest finish or exception" hideLabel value={answers.latestFinishTime} onChange={event => setValue('latestFinishTime', event.target.value)} />
            </OptionalEvidenceQuestion>
          </OptionalFollowUps>
        </Question></Panel>}
        {step === 13 && <Panel title="What balance would suit you?" intro="These preferences help us choose work to explore, not rule jobs out. A mixture or an uncertain answer is useful too."><WorkStyle answers={answers} setAnswers={setAnswers} ui={explorationUi} setUi={setExplorationUi} onSkip={() => navigate(adjacentPosition(position, 1))} /></Panel>}
        {step === 14 && <Panel eyebrow="Explore possibilities" title="Start with the work" intro="These are examples of work we could explore, not confirmed job matches. Titles and requirements vary between employers."><RoleSwipe answers={answers} setAnswers={setAnswers} ui={explorationUi} setUi={setExplorationUi} onSkip={() => navigate(adjacentPosition(position, 1))} /></Panel>}
        {step === 19 && <Panel title="Ready to think about your next role?" intro="You can continue straight to your preferences, check any answers below, or pause here and return later."><ExperienceReview answers={answers} move={editFromReview} /></Panel>}
        {step === 17 && <Panel eyebrow="Your starting point" title="What we can explore next" intro="These are your reactions and preferences so far. We can use them as a starting point for our next conversation.">
          <RoleDirectionsSummary answers={answers} move={editFromReview} />
          <Question title="What matters in your next job">
            <p className="text-sm">From your onboarding: £30,000–£34,999, permanent full-time work, Monday to Friday and a commute of up to 30 minutes.</p>
            {answers.salaryMinimumChoice && <p className="mt-3 text-sm">Starting salary: {salarySummary(answers.salaryMinimumChoice, answers.salaryMinimumDetail)}</p>}
            <dl className="mt-3 space-y-2 text-sm">{Object.entries(currentAnswerView(answers).current.constraintFlexibility).map(([key, value]) => <div key={key} className="flex flex-wrap justify-between gap-2"><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
            {answers.workplacePreference && <p className="mt-3 text-sm">{answers.workplacePreference}</p>}
            {answers.finishTime.length > 0 && <p className="mt-2 text-sm">Finish-time preferences: {answers.finishTime.join(', ')}{answers.finishTime.includes('Something else') && answers.finishTimeOther ? ': ' + answers.finishTimeOther : ''}</p>}
            {answers.latestFinishTime && <p className="mt-2 text-sm">Latest acceptable finish: {answers.latestFinishTime}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4"><button type="button" className="min-h-11 text-sm font-semibold text-teal-800 underline" onClick={() => editFromReview(12)}>Review priorities</button><button type="button" className="min-h-11 text-sm font-semibold text-teal-800 underline" onClick={() => editFromReview(12, 1)}>Edit finish times</button><button type="button" className="min-h-11 text-sm font-semibold text-teal-800 underline" onClick={() => editFromReview(11)}>Edit workplace preference</button></div>
          </Question>
          <AnswerDetails><summary className="cursor-pointer py-3 text-sm font-semibold text-teal-800">Review other preferences and reactions</summary><PreferencesReview answers={answers} move={editFromReview} /></AnswerDetails>
          <AnswerDetails><summary className="cursor-pointer py-3 text-sm font-semibold text-teal-800">Review your experience answers</summary><ExperienceReview answers={answers} move={editFromReview} /></AnswerDetails>
          {field('reviewNotes', 'Anything you would like me to know before we explore these?', 'Optional. What appeals, what puts you off, or anything we have missed.')}
        </Panel>}
        {step === 16 && <Panel title={submitted ? 'Thank you, Bronagh' : 'Your follow-up is not sent yet'}><p>This gives us a clearer starting point for exploring work that suits your experience and the life you want around it.</p><p>I’ll use your answers alongside your onboarding to guide our next conversation.</p><p className="text-sm font-semibold text-teal-900">{submitted ? testDelivery ? 'Your test response was received in the separate test record.' : 'Your follow-up has been received by SABI and saved with your client records.' : 'Review your answers, then send your follow-up when you are ready.'}</p><button type="button" onClick={() => move(17)} className="text-sm font-semibold text-teal-800 underline">Review your answers</button></Panel>}

      </fieldset></form>
      {reviewReturn && step !== reviewReturn.step && <button type="button" className="mt-5 min-h-11 text-sm font-semibold text-teal-800 underline" onClick={() => navigate(reviewReturn, null)}>Return to your review</button>}
      <footer className="follow-up-navigation mt-6 border-t border-slate-200 pt-4">
        {deliveryError && <p role="alert" className="mb-3 text-sm text-red-800">{deliveryError}</p>}
        {pendingDelivery && <div className="mb-3 border border-slate-300 bg-white p-3"><p className="text-sm">{sending ? 'Sending your saved response. Please keep this page open.' : 'Your last send has not been confirmed. Retry that response before making further changes.'}</p><button type="button" disabled={sending} onClick={submitPreview} className="min-h-11 text-sm font-semibold text-teal-800 underline disabled:opacity-50">{sending ? 'Sending…' : 'Retry sending saved response'}</button></div>}
        <p className="max-w-2xl text-xs leading-5 text-slate-600" role={saveFailed ? 'alert' : 'status'}>{saveMessage}<span>{!experiencePage && step !== 17 && questionCount > 1 ? ` · Question ${questionIndex + 1} of ${questionCount} in this section` : ''}</span></p>
        <nav aria-label="Question navigation" className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={goBack} disabled={step === 0 && questionIndex === 0} className="min-h-11 rounded-lg px-3 py-2 text-sm font-semibold text-teal-900 disabled:opacity-40">Back</button>
          {step !== 16 && <button type="button" onClick={pauseDraft} className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-teal-900 underline underline-offset-4">Save and pause</button>}
          {step !== 16 && step !== 17 && <button type="button" onClick={goNext} className="min-h-11 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-teal-950">{step === 19 ? 'Continue to preferences' : step === 13 && explorationUi.workStyleIndex === workStylePairs.length - 1 ? 'Continue to role ideas' : step === 14 ? explorationUi.roleIndex < roleOrder.length - 1 ? 'Next idea' : 'Continue' : 'Next'}</button>}
          {step === 17 && !pendingDelivery && <button type="button" disabled={sending} onClick={submitPreview} className="min-h-11 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-teal-950 disabled:opacity-50">{testDelivery ? 'Send test response' : 'Send follow-up to SABI'}</button>}
        </nav>
      </footer>
      </>}
    </main>
  </div>

  function short(key: keyof Answers, label: string, help?: string) {
    return <Question title={label} help={help}><TextInput id={String(key)} name={String(key)} label={label} hideLabel value={String(answers[key] ?? '')} onChange={(event) => setValue(key as any, event.target.value)} /></Question>
  }

  function radio(key: keyof Answers, label: string, options: string[]) {
    return <Question title={label}><div className="grid gap-2 sm:grid-cols-2">{options.map((option) => <SelectableOptionCard key={option} name={String(key)} value={option} label={option} selected={answers[key] === option} onChange={() => setValue(key as any, option)} />)}</div></Question>
  }

  function checks(key: keyof Answers, label: string, options: string[], help?: string) {
    const selected = answers[key] as string[]
    const otherFields: Partial<Record<keyof Answers, keyof Answers>> = { recruitmentScope: 'recruitmentOther', employeeRelations: 'employeeRelationsOther', excelUse: 'excelOther', lookerUse: 'lookerOther', rotageekUse: 'rotageekOther', rolesToReduce: 'rolesToReduceOther', councilReasons: 'councilOther', finishTime: 'finishTimeOther' }
    const other = otherFields[key]
    const active = selected.some(value => !nonExperienceChoices.includes(value))
    const hiringSelected = selected.some(value => ['Decide/identify that recruitment is needed', 'Request/advertise vacancies', 'Shortlist candidates', 'Interview candidates', 'Make hiring decisions', 'Recommend hiring decisions', 'Make/send offers'].includes(value))
    const noteQuestion = checkboxNoteQuestions.find(item => item.key === key && checkboxNoteApplies(item.key, answers))
    const savedDevelopment = answers.developmentExamples.some(item => [item.note, item.situation, item.action, item.result, item.earlierNote].some(Boolean))
    const earlierSupport = legacyExperiencePrompts.some(prompt => ['hire-probation', 'hire-retention'].includes(prompt.id) && experiencePromptApplies(prompt, answers) && answers.experienceNotes[prompt.id]?.trim())
    const hasCoaching = key === 'recruitmentScope' && (savedDevelopment || !earlierSupport)
    const hasFollowUps = (other && selected.includes('Something else')) || (active && ['recruitmentScope', 'employeeRelations', 'gmCover'].includes(key)) || noteQuestion
    const question = <Question title={label} help={help}>
      <ChoiceList name={String(key)} options={[...options, ...selected.filter(value => !options.includes(value) && !(key === 'employeeRelations' && performanceSupportValues.includes(value)))]} selected={key === 'employeeRelations' && selected.some(value => performanceSupportValues.includes(value)) ? [...selected, performanceSupportChoice] : selected} multiple onChange={option => toggle(key, option)} />
      {hasFollowUps && <OptionalFollowUps choicesAreEnough>
        {selected.includes('Something else') && other && <OptionalTextAnswer id={other} title={['recruitmentScope', 'employeeRelations'].includes(key) ? 'Anything else about your involvement?' : 'What else would you like to include?'} value={String(answers[other] || '')} onChange={value => setValue(other, value)} />}
        {key in experienceGroupSections && <ExperiencePrompts group={key as ExperienceGroup} answers={answers} setAnswers={setAnswers} />}
        {key === 'recruitmentScope' && (hiringSelected || answers.recruitmentAuthority.trim()) && <OptionalTextAnswer id="recruitmentAuthority" title={hiringSelected ? 'Roughly how many people have you helped recruit?' : 'Your saved recruitment note'} hint="An estimate and roughly what period it covers are enough. Leave this blank if you’re unsure." value={answers.recruitmentAuthority} onChange={value => setValue('recruitmentAuthority', value)} />}
        {key === 'employeeRelations' && active && <OptionalTextAnswer id="employeeRelationsAuthority" title="Anything to clarify about your responsibility in these situations?" hint="For example, whether you led meetings, gathered information or made decisions, with support from HR or another manager. No case history needed, and no need to repeat an earlier answer." value={answers.employeeRelationsAuthority} onChange={value => setValue('employeeRelationsAuthority', value)} />}
        {key === 'gmCover' && active && <OptionalTextAnswer id="gmCoverOther" title="Anything to add about the responsibility you take on when covering?" hint="For example, how often you cover or anything you handle independently. No need to repeat something you’ve already mentioned. The tick boxes are enough if there is nothing to add." value={answers.gmCoverOther} onChange={value => setValue('gmCoverOther', value)} />}
        {noteQuestion && <OptionalTextAnswer id={key + '-note'} title={noteQuestion.question} hint={noteQuestion.hint} value={answers.checkboxNotes[key] || ''} onChange={value => setAnswers(current => ({ ...current, checkboxNotes: { ...current.checkboxNotes, [key]: value } }))} />}
      </OptionalFollowUps>}
    </Question>
    return hasCoaching ? <div className="follow-up-question-card space-y-4">{question}<section aria-labelledby="training-development-title" className="px-1">
      <h2 id="training-development-title" className="text-sm font-semibold">Training and development</h2>
      <p className="mt-1 mb-2 text-sm text-slate-600">Optional, whether or not you recruit staff.</p>
      <DevelopmentExamples answers={answers} setAnswers={setAnswers} />
    </section></div> : question
  }

  function subField(key: keyof Answers, label: string) {
    return <TextInput id={String(key)} name={String(key)} label={label} hideLabel={false} value={String(answers[key] ?? '')} onChange={(event) => setValue(key as any, event.target.value)} />
  }
}

function Panel({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children: ReactNode }) {
  return <section><div className="border-l-4 border-gold-400 pl-4"><>{eyebrow && <p className="eyebrow text-[0.68rem]">{eyebrow}</p>}</><h1 className="mt-1.5 max-w-3xl font-display text-2xl font-semibold leading-tight text-teal-900">{title}</h1></div>{intro && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{intro}</p>}<div className="follow-up-panel-body mt-4 space-y-3 text-[0.95rem] leading-6 text-slate-700">{children}</div></section>
}

function Question({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  const id = useId()
  return <section role={title ? 'group' : undefined} aria-labelledby={title ? id : undefined} aria-describedby={help ? id + '-help' : undefined} className="follow-up-question-card rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">{title && <h2 id={id} className="text-base font-bold leading-snug text-ink">{title}</h2>}{help && <p id={id + '-help'} className="mt-1.5 text-sm leading-5 text-slate-600">{help}</p>}<div className={title || help ? 'mt-3' : ''}>{children}</div></section>
}

function AnswerDetails({ initiallyOpen = false, className, children }: { initiallyOpen?: boolean; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(initiallyOpen)
  return <details className={className} open={open} onToggle={event => setOpen(event.currentTarget.open)}>{children}</details>
}

function SavedWorkplaceNote({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [hasNote] = useState(Boolean(value))
  if (!hasNote) return null
  return <div className="mt-5"><TextArea id="workplaceNotes" label="Your saved workplace note" hideLabel={false} value={value} onChange={event => onChange(event.target.value)} /><p className="mt-2 text-sm text-slate-600">Keep, change or clear this earlier note so it reflects what suits you now.</p></div>
}

function ExampleAnswer({ id, kind, item, onConfirm, children, showPrompt = true }: { id: string; kind: ExampleKind; item: DevelopmentExample | CommercialExample; onConfirm: () => void; children: ReactNode; showPrompt?: boolean }) {
  const saved = item as unknown as Record<string, string>
  const earlier = [...examplePrompts[kind], ['earlierNote', 'Earlier written answer']].filter(([key]) => saved[key]?.trim())
  return <div data-answer-editor={id} className="space-y-3">
    {item.answerMode === 'review_pending' && <p className="text-sm text-slate-600">An earlier version saved this answer in separate boxes. All that wording is included below. Please check it, keeping the details that still apply.</p>}
    {children}
    {item.answerMode === 'review_pending' && <button type="button" onClick={onConfirm} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold">Use this wording</button>}
    {showPrompt && <AnswerDetails>
      <summary className="cursor-pointer py-2 text-sm text-teal-800">Need a starting point?</summary>
      <p className="py-2 text-sm text-slate-600">{kind === 'development' ? 'What help did they need? What did you do, and what changed for them?' : 'What did you do, and what happened afterwards? Where and roughly when was this, and which decisions were yours or needed approval?'}</p>
    </AnswerDetails>}
    {earlier.length > 0 && <AnswerDetails>
      <summary className="cursor-pointer py-2 text-sm text-slate-600">Earlier answer details</summary>
      <p className="mb-3 text-sm text-slate-600">Original entries are kept for reference. {item.answerMode === 'review_pending' ? 'The combined answer above still needs checking.' : 'The answer above is your current wording.'}</p>
      <dl className="space-y-3 text-sm">{earlier.map(([key, label]) => <div key={key}><dt className="font-semibold">{label}</dt><dd className="whitespace-pre-wrap break-words text-slate-600">{saved[key]}</dd></div>)}</dl>
    </AnswerDetails>}
  </div>
}

function focusAnswerField(id: string) {
  const target = document.getElementById(id)
  const visible = (element: HTMLElement) => !element.closest('[hidden]') && element.getClientRects().length > 0
  const fallback = Array.from(target?.closest('[data-answer-editor]')?.querySelectorAll<HTMLElement>('input, textarea, select') || []).find(visible)
  if (target && visible(target)) target.focus()
  else fallback?.focus()
}

function TimelineEditor({ answers, setAnswers, setValue }: { answers: Answers; setAnswers: (fn: (current: Answers) => Answers) => void; setValue: <K extends keyof Answers>(key: K, value: Answers[K]) => void }) {
  const [editing, setEditing] = useState<number | null>(answers.careerTimeline[0]?.title === '' ? 0 : null)
  const [removedRoles, setRemovedRoles] = useState<{ role: TimelineRole; index: number }[]>([])
  const [hasSavedUncertainty] = useState(answers.timelineUnsure)
  const [hasSavedTitleNote] = useState(Boolean(answers.titleChanges.trim()))
  const pendingFocus = useRef<string | null>(null)
  useLayoutEffect(() => {
    if (pendingFocus.current) focusAnswerField(pendingFocus.current)
    pendingFocus.current = null
  })
  const update = (index: number, key: keyof RoleDates | 'title', value: string) => setAnswers(current => ({ ...current, careerTimeline: current.careerTimeline.map((item, i) => i === index ? updateTimelineRole(item, key, value) : item) }))
  const remove = (index: number) => {
    setRemovedRoles(current => [...current, { role: { ...answers.careerTimeline[index] }, index }])
    const remaining = answers.careerTimeline.length - 1
    setEditing(null)
    pendingFocus.current = remaining ? `role-edit-${Math.min(index, remaining - 1)}` : 'timeline-add-role'
    setAnswers(current => ({ ...current, careerTimeline: current.careerTimeline.filter((_, i) => i !== index) }))
  }
  const undoRemove = () => {
    const removed = removedRoles[removedRoles.length - 1]
    if (!removed) return
    const index = Math.min(removed.index, answers.careerTimeline.length)
    setAnswers(current => ({ ...current, careerTimeline: restoreTimelineRole(current.careerTimeline, removed.role, index) }))
    setRemovedRoles(current => current.slice(0, -1))
    setEditing(null)
    pendingFocus.current = `role-edit-${index}`
  }
  const add = () => {
    setEditing(answers.careerTimeline.length)
    pendingFocus.current = `role-${answers.careerTimeline.length}`
    setAnswers(current => ({ ...current, careerTimeline: [...current.careerTimeline, { title: '', startYear: '', endYear: '' }] }))
  }
  return <Question title="Roughly when did you hold each role?" help="My notes show October 2008 for both Buddy Trainer and Deputy Restaurant Manager. Approximate dates are fine, including any overlap.">
    <div className="space-y-3">
      <div className="space-y-2">{answers.careerTimeline.map((item, index) => <div key={index} role="group" aria-label={`Career role ${index + 1}`} className="timeline-role-row border-b border-slate-200 py-4">
        {editing !== index ? <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><p className="font-semibold text-teal-950 break-words">{item.title || (item.isFirstRole ? 'First role' : 'Additional role')}</p><p className="mt-1 text-sm text-slate-600">{[item.isFirstRole && item.title ? 'First role' : '', timelineDateSummary(item)].filter(Boolean).join(' · ')}</p></div>
          <button id={`role-edit-${index}`} type="button" aria-label={`${timelineEditLabel(item)}: ${item.title || 'role ' + (index + 1)}`} aria-expanded={false} onClick={() => { setEditing(index); pendingFocus.current = item.title.trim() && !item.startYear && !item.endYear ? `role-start-${index}` : `role-${index}` }} className="min-h-11 shrink-0 px-2 text-sm text-teal-800 underline">{timelineEditLabel(item)}</button>
        </div> : <>
        {item.isFirstRole && <h3 className="mb-3 text-sm font-semibold text-teal-950">When you joined</h3>}
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2.75rem] items-end gap-2">
          <TextInput id={`role-${index}`} label="Role/title" hideLabel={false} value={item.title} onChange={event => update(index, 'title', event.target.value)} />
          <button type="button" aria-label={`Remove role ${index + 1}`} onClick={() => remove(index)} title="Remove role" className="timeline-remove-role h-11 w-11 rounded-lg text-xl text-slate-500 hover:bg-slate-100"><span aria-hidden="true">×</span></button>
        </div>
        <RoleDateFields startId={`role-start-${index}`} endId={`role-end-${index}`} name={`role ${index + 1}`} value={item} onChange={(key, value) => update(index, key, value)} />
        <div className="w-full"><button type="button" onClick={() => { setEditing(null); pendingFocus.current = `role-edit-${index}` }} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-teal-800">Done</button></div>
        </>}
      </div>)}</div>
      {removedRoles.length > 0 && <div className="flex flex-wrap items-center gap-2 text-sm"><p role="status">{removedRoles[removedRoles.length - 1].role.title || 'Role'} removed.</p><button type="button" onClick={undoRemove} className="min-h-11 px-2 font-semibold text-teal-800 underline">Undo removal</button></div>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button id="timeline-add-role" type="button" onClick={add} className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-teal-800 hover:border-slate-400 hover:bg-white">Add another role</button>
        {hasSavedUncertainty && <label className="flex min-h-11 items-center gap-2 px-1 py-2 text-sm font-medium text-teal-900"><input type="checkbox" checked={answers.timelineUnsure} onChange={event => setValue('timelineUnsure', event.target.checked)} className="h-4 w-4 accent-teal-800" />Your saved note: dates are uncertain</label>}
      </div>
    </div>
    <AnswerDetails initiallyOpen={Boolean(answers.roleOverlap.trim())} className="mt-5 border-t border-slate-200 pt-4">
      <summary className="cursor-pointer py-2 text-sm text-teal-800">Did any of these responsibilities overlap? (optional)</summary>
      <p id="roleOverlap-help" className="mb-3 text-sm text-slate-600">A few words about which roles ran alongside each other are enough. Leave this blank if the dates already make it clear.</p>
      <TextArea id="roleOverlap" name="roleOverlap" label="Overlapping responsibilities (optional)" aria-describedby="roleOverlap-help" value={answers.roleOverlap} onChange={event => setValue('roleOverlap', event.target.value)} />
    </AnswerDetails>
    {hasSavedTitleNote && <AnswerDetails className="mt-3">
      <summary className="cursor-pointer py-2 text-sm text-teal-800">Your saved job-title note</summary>
      <TextArea id="titleChanges" name="titleChanges" label="Your saved job-title note" value={answers.titleChanges} onChange={event => setValue('titleChanges', event.target.value)} />
    </AnswerDetails>}
  </Question>
}

function RegionalEditor({ answers, setAnswers, setValue }: { answers: Answers; setAnswers: (fn: (current: Answers) => Answers) => void; setValue: <K extends keyof Answers>(key: K, value: Answers[K]) => void }) {
  const update = (id: string, key: keyof RegionalRole, value: string | boolean) => setAnswers((current) => ({ ...current, regionalResponsibilities: current.regionalResponsibilities.map((item) => item.id === id ? { ...item, [key]: value } : item) }))
  // Keep earlier dates editable without asking new respondents to date every activity.
  const [savedDateIds] = useState(answers.regionalResponsibilities.filter(item => item.startYear || item.endYear || item.previousEndYear || item.notSure).map(item => item.id))
  const [savedUncertainIds] = useState(answers.regionalResponsibilities.filter(item => item.notSure).map(item => item.id))
  const [hasSavedAreaDetail] = useState(Boolean(answers.areaMeetingsDetail.trim()))
  const [hasSavedAwardDetail] = useState(Boolean(answers.awardReason.trim()))
  const dates = (item: RegionalRole) => <div className="space-y-2">
    <p className="text-sm text-slate-600">Approximate years are fine. Leave dates blank if you cannot remember.</p>
    <RoleDateFields startId={`${item.id}-start`} endId={`${item.id}-end`} name={item.label} value={item} currentLabel="Still doing this" onChange={(key, value) => update(item.id, key, value)} onCurrentChange={checked => setAnswers(current => ({ ...current, regionalResponsibilities: current.regionalResponsibilities.map(role => role.id === item.id ? setCurrentRole(role, checked) : role) }))} />
    {savedUncertainIds.includes(item.id) && <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={item.notSure} onChange={event => update(item.id, 'notSure', event.target.checked)} className="h-4 w-4 accent-teal-800" />These saved dates are approximate or uncertain</label>}
  </div>
  const shortField = (key: 'regionalTrainingPeople' | 'regionalTrainingDates' | 'regionalResultsPeriod', label: string) => <TextInput id={key} label={label} hideLabel={false} value={answers[key]} onChange={event => setValue(key, event.target.value)} />
  return <Question title="Any details you can add?" help="Everything here is optional. Open only the topics where something comes to mind. No need to repeat anything you have already told me.">
    <div className="space-y-3">
      {answers.regionalResponsibilities.map(item => {
        const healthSafety = item.id === 'health_safety_lead'
        const offPremise = item.id === 'off_premise'
        const learning = item.id === 'learning_ambassador'
        if (!healthSafety && !offPremise && !learning && !hasSavedAreaDetail && !savedDateIds.includes(item.id)) return null
        const title = healthSafety ? 'Regional Health & Safety Lead' : offPremise ? 'Off-Premise regional work' : learning ? 'Learning Ambassador' : 'Assistant Manager area meetings'
        const note = offPremise ? answers.offPremiseNote : learning ? answers.learningAmbassadorDetail : !healthSafety ? answers.areaMeetingsDetail : ''
        const preview = [dateRange(item.startYear, item.endYear), item.notSure ? 'Dates uncertain' : '', note, ...(healthSafety ? [answers.regionalTrainingPeople, answers.regionalTrainingDates, answers.regionalResultsPeriod] : [])].filter(Boolean).join(' · ')
        return <OptionalEvidenceQuestion key={item.id} id={`regional-${item.id}`} title={title} preview={preview}>
          <div className="space-y-4">
            {healthSafety || offPremise ? <><p className="text-sm font-semibold">Roughly when did you do this?</p>{dates(item)}</> : savedDateIds.includes(item.id) ? <AnswerDetails><summary className="cursor-pointer py-2 text-sm">Your earlier dates</summary>{dates(item)}</AnswerDetails> : null}
            {healthSafety && <>
              <p className="text-sm text-slate-600">You have already described the learning days, training and audit results. No need to explain them again.</p>
              {shortField('regionalTrainingPeople', 'About how many people did you train? (optional)')}
              <p className="text-sm text-slate-600">Per session or overall is fine; just say which.</p>
              <AnswerDetails initiallyOpen={Boolean(answers.regionalTrainingDates.trim() || answers.regionalResultsPeriod.trim())}>
                <summary className="cursor-pointer py-2 text-sm text-teal-800">Different dates? (optional)</summary>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-slate-600">Only add dates here if the training or results fell outside the role dates above.</p>
                  {shortField('regionalTrainingDates', 'Training dates (optional)')}
                  {shortField('regionalResultsPeriod', 'Audit or EHO results dates (optional)')}
                </div>
              </AnswerDetails>
            </>}
            {offPremise && <><p className="text-sm text-slate-600">You mentioned supporting the region when Off-Premise was introduced. A rough period is enough; no need to look it up.</p><TextArea id="offPremiseNote" label="Was there a particular change you helped introduce? (optional)" hideLabel={false} aria-describedby="offPremiseNote-help" value={answers.offPremiseNote} onChange={event => setValue('offPremiseNote', event.target.value)} /><p id="offPremiseNote-help" className="text-sm text-slate-600">A few words about the change and any result you remember are enough. No need to repeat something you have already mentioned.</p></>}
            {learning && <><p className="text-sm text-slate-600">In your onboarding you said you had started learning this role.</p><TextArea id="learningAmbassadorDetail" label="If you’ve started taking on Learning Ambassador work, what have you been involved in? (optional)" hideLabel={false} value={answers.learningAmbassadorDetail} onChange={event => setValue('learningAmbassadorDetail', event.target.value)} /></>}
            {!healthSafety && !offPremise && !learning && hasSavedAreaDetail && <TextArea id="areaMeetingsDetail" label="Your saved area-meetings note" hideLabel={false} value={answers.areaMeetingsDetail} onChange={event => setValue('areaMeetingsDetail', event.target.value)} />}
          </div>
        </OptionalEvidenceQuestion>
      })}
      <OptionalEvidenceQuestion id="regional-award" title="Assistant Manager of the Year" preview={[answers.awardYear, answers.awardReason].filter(Boolean).join(' · ')}>
        <p className="mb-3 text-sm text-slate-600">You linked this award to your regional compliance and training work. I already have that context.</p>
        <div className="max-w-40"><TextInput id="awardYear" name="awardYear" label="Roughly what year? (optional)" hideLabel={false} inputMode="numeric" value={answers.awardYear} onChange={event => setValue('awardYear', event.target.value)} /></div>
        {hasSavedAwardDetail && <div className="mt-4"><TextArea id="awardReason" label="Your saved award detail" hideLabel={false} value={answers.awardReason} onChange={event => setValue('awardReason', event.target.value)} /></div>}
      </OptionalEvidenceQuestion>
      <OptionalTextAnswer id="regionalTrainingDetail" title="Anything else about your regional work?" hint="Only add something not already covered. A few words are enough." value={answers.regionalTrainingDetail} onChange={value => setValue('regionalTrainingDetail', value)} />
    </div>
  </Question>
}

function DevelopmentExamples({ answers, setAnswers }: { answers: Answers; setAnswers: (fn: (current: Answers) => Answers) => void }) {
  const pendingFocus = useRef<string | null>(null)
  useLayoutEffect(() => {
    if (pendingFocus.current) focusAnswerField(pendingFocus.current)
    pendingFocus.current = null
  })
  const add = () => {
    pendingFocus.current = `dev-${answers.developmentExamples.length}-note`
    setAnswers(current => ({ ...current, developmentExamples: [...current.developmentExamples, { note: '', situation: '', action: '', result: '', answerMode: 'current' }] }))
  }
  const remove = (index: number) => {
    const remaining = answers.developmentExamples.length - 1
    pendingFocus.current = remaining ? `dev-${Math.min(index, remaining - 1)}-note` : 'add-development-example'
    setAnswers(current => ({ ...current, developmentExamples: current.developmentExamples.filter((_, i) => i !== index) }))
  }
  const update = (index: number, key: keyof DevelopmentExample, value: string) => setAnswers((current) => ({ ...current, developmentExamples: current.developmentExamples.map((item, i) => i === index ? { ...item, [key]: value } : item) }))
  return <OptionalEvidenceQuestion id="people-example" title="Roughly how many colleagues have you trained or helped progress?" preview={answers.developmentExamples.map(exampleNote).filter(Boolean).join(' ')}>
    <p className="mb-3 text-sm text-slate-600">Either is useful: an approximate number and period, or a promotion you helped someone achieve. No names or regional training already mentioned.</p>
    <div className="space-y-4">{answers.developmentExamples.map((item, index) => <fieldset key={index} className="space-y-3 border-b border-slate-200 pb-4">
      <legend className="sr-only">Development example {index + 1}</legend>
      <ExampleAnswer id={`development-${index}`} kind="development" item={item} showPrompt={false} onConfirm={() => update(index, 'answerMode', 'current')}>
        <TextArea id={`dev-${index}-note`} label="Additional training or progression, and roughly when" hideLabel value={item.note || ''} onChange={event => update(index, 'note', event.target.value)} />
      </ExampleAnswer>
      {(answers.developmentExamples.length > 1 || [item.note, item.situation, item.action, item.result, item.earlierNote].some(Boolean)) && <button type="button" aria-label={`Remove development example ${index + 1}`} onClick={() => remove(index)} className="min-h-11 text-sm text-slate-600 underline">Remove example</button>}
    </fieldset>)}</div>
    {answers.developmentExamples.length === 0 && <button id="add-development-example" type="button" onClick={add} className="mt-3 min-h-11 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Add a note</button>}
  </OptionalEvidenceQuestion>
}

function LeadershipPreference({ answers, setValue }: { answers: Answers; setValue: <K extends keyof Answers>(key: K, value: Answers[K]) => void }) {
  const options = ['Managing a team', 'Coaching and developing people without direct reports', 'Less people management', 'Open to either', 'I’m not sure yet.']
  const earlierPreference = answers.managementPreference && !options.includes(answers.managementPreference) ? answers.managementPreference : ''
  const needsClarification = [options[3], options[4], 'I mainly said manager because that feels like the level my experience is suited to.'].includes(answers.managementPreference)
  const progression = <fieldset className="space-y-3">
    <legend className="mb-2 text-sm font-semibold">Could a role without direct reports still feel like a step forward, if you had responsibility and influence?</legend>
    <ChoiceList name="influenceProgression" options={['Yes', 'Probably', 'Maybe', 'Probably not', 'No', 'I’m not sure']} selected={[answers.influenceProgression]} onChange={value => setValue('influenceProgression', value)} />
  </fieldset>
  return <Question title="How would you like people management to feature in your next role?">
    <div className="grid gap-2 sm:grid-cols-2">{options.map(option => <SelectableOptionCard key={option} name="managementPreference" value={option} label={option} selected={answers.managementPreference === option} onChange={() => setValue('managementPreference', option)} />)}</div>
    {earlierPreference && <p className="mt-4 text-sm text-slate-600">Your earlier answer: {earlierPreference}</p>}
    {needsClarification ? <div className="mt-6 border-t border-slate-200 pt-5">{progression}</div> : answers.influenceProgression && <AnswerDetails className="mt-5 border-t border-slate-200 pt-4"><summary className="cursor-pointer py-2 text-sm text-teal-800">Your saved answer about progression</summary>{progression}</AnswerDetails>}
  </Question>
}
function ChangeScale({ answers, chooseChange }: { answers: Answers; chooseChange: (group: 'comfortableChange' | 'possibleChange' | 'tooFarChange', value: string) => void }) {
  const levels = ['A similar management role with a different employer.', 'Similar responsibility in a different sector.', 'A different type of role that uses skills I already have.', 'A specialist role in training, improvement or quality.', 'A completely different career.']
  return <div className="space-y-3">{levels.map((label, index) => <article key={label} role="group" aria-label={label} className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="text-sm font-semibold leading-5 text-slate-800">{label}</p>
    <div className="change-scale-options mt-3">{([['comfortableChange', 'Yes'], ['possibleChange', 'Maybe'], ['tooFarChange', 'No']] as const).map(([key, text]) => <button key={key} type="button" aria-pressed={answers[key].includes(String(index + 1))} onClick={() => chooseChange(key, String(index + 1))} className={`min-h-11 min-w-0 rounded-lg border px-1.5 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 ${answers[key].includes(String(index + 1)) ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{text}</button>)}</div>
  </article>)}</div>
}

type ExplorationProps = {
  answers: Answers
  setAnswers: (fn: (current: Answers) => Answers) => void
  ui: ExplorationUi
  setUi: (fn: (current: ExplorationUi) => ExplorationUi) => void
}

function WorkStyle({ answers, setAnswers, ui, onSkip }: ExplorationProps & { onSkip: () => void }) {
  const pairs = workStylePairs
  const currentIndex = ui.workStyleIndex
  const [id, left, right] = pairs[currentIndex]
  const selected = answers.workStyle[id]
  const earlier = selected && !isCurrentWorkStyleAnswer(id, selected) ? selected : answers.workStyleEarlier[id]
  const group = useRef<HTMLDivElement>(null)
  const previousIndex = useRef(currentIndex)
  const optionId = useId()
  const choose = (value: string) => {
    setAnswers(current => {
      const previous = current.workStyle[id]
      return {
        ...current,
        workStyle: { ...current.workStyle, [id]: value },
        workStyleEarlier: previous && !isCurrentWorkStyleAnswer(id, previous) ? { ...current.workStyleEarlier, [id]: previous } : current.workStyleEarlier,
      }
    })
  }
  useEffect(() => {
    if (previousIndex.current === currentIndex) return
    previousIndex.current = currentIndex
    group.current?.focus({ preventScroll: true })
    group.current?.closest('.follow-up-question-card')?.scrollIntoView({ block: 'nearest' })
    document.title = `Work balance ${currentIndex + 1} of ${pairs.length} | SABI follow-up`
  }, [currentIndex])
  const choice = (value: string, index: number) => <label key={value} className={`work-style-choice ${selected === value ? 'work-style-choice-selected' : ''}`}>
    <input type="radio" name={`work-style-${id}`} checked={selected === value} onChange={() => choose(value)} className="h-4 w-4 shrink-0 accent-teal-800" />
    <span id={optionId + index} className="work-style-choice-text">{value}</span>
  </label>
  return <Question title={workStylePrompts[id]}><div ref={group} tabIndex={-1} role="group" aria-label={`Work balance choice ${currentIndex + 1} of ${pairs.length}: ${workStylePrompts[id]}`} className="space-y-3">
    <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center"><p className="text-xs font-bold text-slate-500">{currentIndex + 1} of {pairs.length}</p><div className="flex items-center gap-1" aria-hidden="true">{pairs.map(([pairId], index) => <span key={pairId} className={`h-1.5 flex-1 rounded-full ${index === currentIndex ? 'bg-amber-300' : isCurrentWorkStyleAnswer(pairId, answers.workStyle[pairId]) ? 'bg-teal-700' : 'bg-slate-200'}`} />)}</div></div>
    <div className="follow-up-choice-list grid gap-2">{[left, right, ...workStyleAlternatives].map(choice)}</div>
    {earlier && <details className="text-sm text-slate-600"><summary className="cursor-pointer py-2">Earlier answer</summary><p>{earlier}</p><p className="mt-2">The wording has changed. This answer is kept separately; you can choose again if you want to update it.</p></details>}
    {currentIndex < pairs.length - 1 && <button type="button" onClick={onSkip} className="min-h-11 text-sm text-slate-600 underline">Skip remaining choices</button>}
    {pairs.every(([pairId]) => isCurrentWorkStyleAnswer(pairId, answers.workStyle[pairId])) && <p role="status" className="pt-2 text-sm text-slate-600">All six answered.</p>}
  </div></Question>
}

function RoleSwipe({ answers, setAnswers, ui, onSkip }: ExplorationProps & { onSkip: () => void }) {
  const order = roleOrder
  const currentIndex = Math.min(ui.roleIndex, order.length - 1)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const content = useRef<HTMLDivElement>(null)
  const [roleId, title, description] = roleTests[order[currentIndex]]
  const editing = editingRoleId === roleId
  const setEditing = (value: boolean) => setEditingRoleId(value ? roleId : null)
  const idea = roleIdeas[roleId]
  const reaction = answers.jobTitleReactions.find(item => item.roleId === roleId) || { roleId, titleReaction: '', descriptionReaction: '', revealed: false }
  const options = [['would_click', 'Interested'], ['maybe_click', 'Maybe'], ['would_skip', 'Not for me'], ['need_detail', 'Need more detail']]
  const latest = reaction.titleReaction || reaction.descriptionReaction
  const needsDetail = ['need_detail', 'unclear_title'].includes(latest)
  const labelFor = (value: string) => options.find(([id]) => id === value)?.[1] || reactionOptions.find(([id]) => id === value)?.[1] || 'Not answered'
  const previousView = useRef({ roleId, revealed: reaction.revealed, editing })
  useEffect(() => {
    const previous = previousView.current
    if (previous.roleId === roleId && previous.revealed === reaction.revealed && previous.editing === editing) return
    previousView.current = { roleId, revealed: reaction.revealed, editing }
    const target = editing ? content.current?.querySelector<HTMLElement>('[aria-label="Your reaction to this work"] button') : content.current?.closest('.follow-up-question-card')?.querySelector<HTMLElement>('h2')
    if (target) {
      target.tabIndex = editing ? 0 : -1
      target.focus({ preventScroll: true })
    }
    document.title = (reaction.revealed ? title : `Role idea ${currentIndex + 1}`) + ' | SABI follow-up'
  }, [roleId, reaction.revealed, editing])
  const choose = (value: string) => {
    setAnswers(current => {
      const existing = current.jobTitleReactions.find(item => item.roleId === roleId) || reaction
      const patch = existing.revealed ? { titleReaction: value } : { descriptionReaction: value, revealed: true }
      return { ...current, jobTitleReactions: updateRoleReaction(current.jobTitleReactions, roleId, patch) }
    })
    setEditing(false)
  }
  return <Question title={reaction.revealed ? `One title you might see: ${title}` : 'Would you enjoy this kind of work?'}>
    <div ref={content} className="space-y-5">
      <p className="text-xs text-slate-500">Possibility {currentIndex + 1} of {order.length}</p>
      <p className="text-sm leading-6 text-slate-700">{idea?.summary || description}</p>
      {idea && <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">{idea.activities.map(activity => <li key={activity}>{activity}</li>)}</ul>}
      {needsDetail && idea && <section aria-label="A closer look" className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold">A closer look</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">{idea.detail}</p>
        <p className="mt-2 text-sm text-slate-600">We can look at a real vacancy together before deciding whether it suits you.</p>
      </section>}
      {(!reaction.revealed || editing) && <div className="follow-up-choice-list grid gap-3" role="group" aria-label="Your reaction to this work">
        {options.map(([value, label]) => <button type="button" key={value} aria-pressed={latest === value} onClick={() => choose(value)} className={`min-h-12 rounded-lg border px-3 py-3 text-sm font-semibold ${latest === value ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>{label}</button>)}
      </div>}
      {reaction.revealed && <div className="border-t border-slate-200 pt-4" aria-live="polite">
        <p className="text-sm">Your reaction: <strong>{labelFor(latest)}</strong></p>
        {reaction.descriptionReaction && reaction.titleReaction && reaction.titleReaction !== reaction.descriptionReaction && <p className="mt-1 text-xs text-slate-500">Before seeing the title: {labelFor(reaction.descriptionReaction)}</p>}
        <button type="button" onClick={() => setEditing(!editing)} className="mt-2 min-h-11 text-sm font-semibold text-teal-800 underline">{editing ? 'Keep current reaction' : 'Change reaction'}</button>
      </div>}
      <AnswerDetails key={roleId}><summary className="cursor-pointer py-2 text-sm text-teal-800">{reaction.reason ? 'Your note about this idea' : 'Anything that appeals or puts you off? (optional)'}</summary><TextArea id={`role-reason-${roleId}`} label="Anything you would like me to know about this idea? (optional)" value={reaction.reason || ''} onChange={event => setAnswers(current => ({ ...current, jobTitleReactions: updateRoleReaction(current.jobTitleReactions, roleId, { reason: event.target.value }) }))} /></AnswerDetails>
      {answers.surprise && <AnswerDetails><summary className="cursor-pointer py-2 text-sm text-teal-800">Your earlier comment about the job titles</summary><TextArea id="surprise" label="Your earlier comment" hideLabel={false} value={answers.surprise} onChange={event => setAnswers(current => ({ ...current, surprise: event.target.value }))} /></AnswerDetails>}
      {currentIndex < order.length - 1 && <button type="button" onClick={onSkip} className="min-h-11 text-sm text-slate-600 underline">Skip remaining ideas</button>}
    </div>
  </Question>
}


function RoleDirectionsSummary({ answers, move }: { answers: Answers; move: (step: number, questionIndex?: number) => void }) {
  const reactions = roleTests.flatMap(([id, title]) => {
    const reaction = answers.jobTitleReactions.find(item => item.roleId === id)
    return reaction ? [{ title, reaction, group: roleInterestGroup(reaction) }] : []
  })
  const answered = reactions.filter(item => item.group !== 'unanswered')
  const hasPossibilities = answered.some(item => item.group !== 'not_for_now')
  return <Question title="Your reactions to the role ideas">
    {!answered.length && <p className="text-sm text-slate-600">You have not recorded a reaction yet. We can explore ideas together.</p>}
    {answered.length > 0 && !hasPossibilities && <p className="text-sm text-slate-600">None of the ideas you reacted to appealed this time. That is useful to know; we can look at different possibilities.</p>}
    <div className="space-y-5">{([['interested', 'Interested'], ['maybe', 'Maybe'], ['clarify', 'Would like to understand better']] as const).map(([group, label]) => {
      const items = reactions.filter(item => item.group === group)
      return items.length ? <section key={group} aria-label={label}>
        <h3 className="mb-2 text-sm font-semibold">{label}</h3>
        <ul className="space-y-3 text-sm">{items.map(({ title, reaction }) => <li key={reaction.roleId}>
          <p>{title}</p>
          {!reaction.titleReaction && <p className="mt-1 text-xs text-slate-500">Based on the description, before seeing the title.</p>}
          {reaction.reason && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">Your note: {reaction.reason}</p>}
        </li>)}</ul>
      </section> : null
    })}</div>
    <button type="button" className="mt-3 min-h-11 text-sm font-semibold text-teal-800 underline" onClick={() => move(14)}>Review role reactions</button>
  </Question>
}

function isOffPremiseExample(item: CommercialExample) {
  return item.source === 'off_premise' || item.offPremise === true
}

function commercialTopicLabel(topic?: string) {
  return topic === 'costs' ? 'Costs, waste or stock losses' : topic === 'other' ? 'Additional result or responsibility' : ''
}

function exampleNote(item: DevelopmentExample | CommercialExample) {
  return [item.answerMode === 'review_pending' ? 'Needs checking: wording combined from earlier answer boxes.' : '', item.note].filter(Boolean).join('\n')
}

function OffPremiseFields({ answers, setValue }: { answers: Answers; setValue: <K extends keyof Answers>(key: K, value: Answers[K]) => void }) {
  const [hasEarlier] = useState([answers.offPremiseProblem, answers.offPremiseAction, answers.offPremiseResult].some(Boolean))
  return <div className="space-y-4">
    {hasEarlier && <AnswerDetails initiallyOpen>
      <summary className="cursor-pointer py-2 text-sm text-teal-800">Your saved example</summary>
      <div className="space-y-3">
        <TextArea id="offPremiseProblem" label="What needed improving?" hideLabel={false} value={answers.offPremiseProblem} onChange={event => setValue('offPremiseProblem', event.target.value)} />
        <TextArea id="offPremiseAction" label="What you did" hideLabel={false} value={answers.offPremiseAction} onChange={event => setValue('offPremiseAction', event.target.value)} />
        <TextArea id="offPremiseResult" label="What happened afterwards" hideLabel={false} value={answers.offPremiseResult} onChange={event => setValue('offPremiseResult', event.target.value)} />
      </div>
    </AnswerDetails>}
    <TextArea id="offPremiseNote" label={hasEarlier ? 'Anything to add? (optional)' : 'Your Off-Premise example'} hideLabel={!hasEarlier} value={answers.offPremiseNote} onChange={event => setValue('offPremiseNote', event.target.value)} />
  </div>
}

function OffPremiseAnswer({ answers, setAnswers, children }: { answers: Answers; setAnswers: (fn: (current: Answers) => Answers) => void; children: ReactNode }) {
  const examples = currentAnswerView(answers).current.commercialExamples
  const candidates = examples.map((item, index) => ({ item, index })).filter(({ item }) => [item.note, item.figure, item.outcome, item.responsibility].some(Boolean))
  const linked = candidates.filter(({ item }) => isOffPremiseExample(item))
  const written = [answers.offPremiseNote, answers.offPremiseProblem, answers.offPremiseAction, answers.offPremiseResult].some(Boolean)
  const [showEarlier, setShowEarlier] = useState(!written)
  const summaryId = useId()
  const pickerId = useId()
  const pendingFocus = useRef<string | null>(null)
  useLayoutEffect(() => {
    if (pendingFocus.current) focusAnswerField(pendingFocus.current)
    pendingFocus.current = null
  })
  const useExample = (index: number) => {
    pendingFocus.current = summaryId
    setAnswers(current => ({ ...current, commercialExamples: current.commercialExamples.map((item, i) => i === index ? { ...item, offPremise: true } : item) }))
  }
  const unlink = (index: number) => {
    pendingFocus.current = linked.length > 1 ? summaryId : pickerId
    setShowEarlier(true)
    setAnswers(current => ({ ...current, commercialExamples: current.commercialExamples.map((item, i) => i === index ? { ...item, offPremise: false, source: item.source === 'off_premise' ? '' : item.source } : item) }))
  }
  const exampleText = (item: CommercialExample) => [commercialTopicLabel(item.topic), exampleNote(item), item.measures, item.figure, item.period, item.scope, item.responsibility, item.outcome].filter(Boolean).join('\n')
  const picker = <div className="space-y-4">
    <p id={pickerId} tabIndex={-1} className="text-sm font-semibold">Does one of your earlier examples cover this?</p>
    {candidates.filter(({ item }) => !isOffPremiseExample(item)).map(({ item, index }) => <div key={index} className="border-b border-slate-200 pb-3">
      <blockquote className="whitespace-pre-wrap break-words border-l-2 border-slate-300 pl-3 text-sm text-slate-700">{exampleText(item)}</blockquote>
      <button type="button" aria-label={`Use this example for Off-Premise: example ${index + 1}`} className="mt-2 min-h-11 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => useExample(index)}>Use this example</button>
    </div>)}
{linked.length === 0 && <button type="button" className="min-h-11 text-sm font-semibold text-teal-800 underline" onClick={() => { pendingFocus.current = 'offPremiseNote'; setShowEarlier(false) }}>Add a different example</button>}
  </div>
  if (linked.length) return <div className="space-y-4">
    <p id={summaryId} tabIndex={-1} role="status" className="text-sm text-slate-600">Your earlier example is included here. You can continue without repeating it.</p>
    {linked.map(({ item, index }) => <div key={index}>
      <blockquote className="whitespace-pre-wrap break-words border-l-2 border-slate-300 pl-3 text-sm text-slate-700">{exampleText(item)}</blockquote>
      <button type="button" aria-label={`Remove link to example ${index + 1}`} className="mt-2 min-h-11 text-sm text-slate-600 underline" onClick={() => unlink(index)}>Remove link</button>
    </div>)}
    <AnswerDetails initiallyOpen={written}><summary className="cursor-pointer py-2 text-sm text-teal-800">Add or edit further detail (optional)</summary>{children}</AnswerDetails>
    {candidates.length > linked.length && <AnswerDetails><summary className="cursor-pointer py-2 text-sm text-teal-800">Use another earlier example</summary>{picker}</AnswerDetails>}
  </div>
  if (!candidates.length) return <>{children}</>
  return <div className="space-y-4">
    {showEarlier ? picker : <><button type="button" className="min-h-11 text-sm font-semibold text-teal-800 underline" onClick={() => { pendingFocus.current = pickerId; setShowEarlier(true) }}>Use an earlier example</button>{children}</>}
  </div>
}

function ChoiceList({ name, options, selected, onChange, multiple = false }: { name: string; options: string[]; selected: string[]; onChange: (value: string) => void; multiple?: boolean }) {
  return <div className={`follow-up-choice-list ${['recruitmentScope', 'employeeRelations'].includes(name) ? 'people-choice-list ' : ''}grid gap-x-4 gap-y-1`}>{options.map(option => <label key={option} className="flex min-h-11 min-w-0 cursor-pointer items-start gap-2 py-2 text-sm leading-5 text-slate-700">
    <input className="mt-0.5 h-4 w-4 shrink-0 accent-teal-800" type={multiple ? 'checkbox' : 'radio'} name={name} value={option} checked={selected.includes(option)} onChange={() => onChange(option)} />
    <span className="min-w-0 break-words">{checkboxChoiceLabels[option] || option}</span>
  </label>)}</div>
}

function OptionalEvidenceQuestion({ id, title, preview, context, children }: { id: string; title: string; preview: string; context?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <details className="optional-evidence-question" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary id={id + '-toggle'}>
      <span>{title}</span>
      {context && <span className="block mt-1 text-sm font-normal text-slate-600">{context}</span>}
      {preview.trim() && <span className="optional-evidence-status">Answer added</span>}
      {!open && preview.trim() && <span aria-hidden="true" className="optional-evidence-preview">{preview}</span>}
    </summary>
    <div className="pb-4 pt-1">{children}</div>
  </details>
}

function OptionalFollowUps({ children, choicesAreEnough = false }: { children: ReactNode; choicesAreEnough?: boolean }) {
  return <div className="mt-5 border-t border-slate-200 pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-semibold text-ink">A little more detail (optional)</p>
    </div>
    <p className="mt-1 mb-3 text-sm text-slate-600">{choicesAreEnough ? 'The tick boxes are enough. Answer below only if something comes to mind; no need to repeat anything you’ve already shared.' : 'Only add something new; these can be left blank.'}</p>
    <div className="optional-evidence-list">{children}</div>
  </div>
}

function OptionalTextAnswer({ id, title, hint, value, onChange }: { id: string; title: string; hint?: string; value: string; onChange: (value: string) => void }) {
  return <OptionalEvidenceQuestion id={id + '-optional'} title={title} preview={value}>
    {hint && <p id={id + '-help'} className="mb-3 text-sm text-slate-600">{hint}</p>}
    <TextArea id={id} label={title} hideLabel aria-describedby={hint ? id + '-help' : undefined} value={value} onChange={event => onChange(event.target.value)} />
  </OptionalEvidenceQuestion>
}

function SavedOptionalAnswer(props: { id: string; title: string; value: string; onChange: (value: string) => void }) {
  const [hadAnswer] = useState(Boolean(props.value))
  return hadAnswer ? <OptionalTextAnswer {...props} /> : null
}

function ExperiencePrompts({ group, answers, setAnswers }: { group: ExperienceGroup; answers: Answers; setAnswers: (fn: (current: Answers) => Answers) => void }) {
  // Keep an existing editor mounted when its last character is cleared.
  const [earlierIds] = useState(() => legacyExperiencePrompts.filter(prompt => answers.experienceNotes[prompt.id]?.trim()).map(prompt => prompt.id))
  const [writtenGroups, setWrittenGroups] = useState(() => sharedExperiencePrompts.filter(prompt => answers.experienceNotes[prompt.id]?.trim()).map(prompt => prompt.id))
  const earlier = legacyExperiencePrompts.filter(prompt => prompt.group === group && earlierIds.includes(prompt.id) && experiencePromptApplies(prompt, answers))
  const shared = sharedExperiencePrompts.filter(prompt => prompt.group === group && experiencePromptApplies(prompt, answers) && (writtenGroups.includes(prompt.id) || (!savedOnlyExperiencePromptIds.has(prompt.id) && !earlier.some(item => prompt.members.includes(item.id)))))
  return <>{[...earlier, ...shared].map(prompt => <OptionalTextAnswer
    key={prompt.id} id={'experience-' + prompt.id} title={prompt.question}
    hint={'hint' in prompt ? prompt.hint : group === 'employeeRelations' ? 'A few words about your part are enough. Please leave out names and identifying details.' : 'Your earlier note is kept here. There is no need to write it again.'}
    value={answers.experienceNotes[prompt.id] || ''}
    onChange={value => {
      if ('members' in prompt) setWrittenGroups(current => current.includes(prompt.id) ? current : [...current, prompt.id])
      setAnswers(current => ({ ...current, experienceNotes: { ...current.experienceNotes, [prompt.id]: value } }))
    }}
  />)}</>
}

function SoftwareFollowUps({ answers, setAnswers }: { answers: Answers; setAnswers: (fn: (current: Answers) => Answers) => void }) {
  const [hadWorkflow] = useState(Boolean(answers.workflowExample))
  const groups = ['excelUse', 'lookerUse', 'rotageekUse'] as const
  const hasPrompt = experiencePrompts.some(prompt => groups.includes(prompt.group as typeof groups[number]) && experiencePromptApplies(prompt, answers) && (Boolean(answers.experienceNotes[prompt.id]?.trim()) || ('members' in prompt && !savedOnlyExperiencePromptIds.has(prompt.id))))
  if (!hadWorkflow && !hasPrompt) return null
  return <OptionalFollowUps>
    {groups.map(group => <ExperiencePrompts key={group} group={group} answers={answers} setAnswers={setAnswers} />)}
    <SavedOptionalAnswer id="workflowExample" title="Your earlier note about processes or tools" value={answers.workflowExample} onChange={value => setAnswers(current => ({ ...current, workflowExample: value }))} />
  </OptionalFollowUps>
}

function hasCommercialDetail(item: CommercialExample) {
  return [item.note, item.measures, item.figure, item.period, item.scope, item.certainty, item.source, item.responsibility, item.outcome, item.earlierNote, item.offPremise].some(Boolean)
}

function CommercialNumbers({ answers, setAnswers }: { answers: Answers; setAnswers: (fn: (current: Answers) => Answers) => void }) {
  const [earlierKnownChoices] = useState(answers.commercialMeasures.filter(value => previouslyKnownMeasures.includes(value)))
  const choices = commercialQuestions.filter(item => !previouslyKnownMeasures.includes(item.value) || earlierKnownChoices.includes(item.value))
  const [savedMeasureKeys] = useState(commercialQuestions.filter(item => (item.value === 'Something else' ? answers.commercialOther : answers.commercialDetails[item.value])?.trim()).map(item => item.value))
  const selected = commercialQuestions.filter(item => savedMeasureKeys.includes(item.value))
  const unknownSelections = answers.commercialMeasures.filter(value => !commercialQuestions.some(item => item.value === value))
  const [hadBudget] = useState(Boolean(answers.commercialResponsibility))
  const groups = commercialGroups.filter(group => group.members.some(value => answers.commercialMeasures.includes(value) || previouslyKnownMeasures.includes(value) || savedMeasureKeys.some(saved => saved === value)) || Object.prototype.hasOwnProperty.call(answers.commercialGroupDetails, group.id) || (group.id === 'budget' && hadBudget))
  const [hadCorrection] = useState(Boolean(answers.commercialKnownCorrection))
  const [hadOffPremise] = useState([answers.offPremiseProblem, answers.offPremiseAction, answers.offPremiseResult].some(Boolean))
  const [hadExample] = useState(answers.commercialExamples.some(hasCommercialDetail))
  const setValue = <K extends keyof Answers>(key: K, value: Answers[K]) => setAnswers(current => ({ ...current, [key]: value }))
  const toggle = (value: string) => setAnswers(current => ({ ...current, commercialMeasures: current.commercialMeasures.includes(value) ? current.commercialMeasures.filter(item => item !== value) : [...current.commercialMeasures, value] }))
  const readDetail = (value: string) => value === 'Something else' ? answers.commercialOther : answers.commercialDetails[value] ?? (value === 'Budgets' ? answers.commercialResponsibility || '' : '')
  const writeDetail = (value: string, note: string) => {
    if (value === 'Something else') setValue('commercialOther', note)
    else if (value === 'Budgets') setAnswers(current => ({ ...current, commercialResponsibility: '', commercialDetails: { ...current.commercialDetails, [value]: note } }))
    else setAnswers(current => ({ ...current, commercialDetails: { ...current.commercialDetails, [value]: note } }))
  }
  const sharedPreview = answers.commercialExamples.map(item => exampleNote(item) || item.figure).filter(Boolean).join(' ')

  return <div className="follow-up-question-card space-y-5">
    <Question title="Which of these are part of your work?" help="You have already mentioned sales forecasting, staffing schedules and reading monthly P&L. Tick any other figures or targets you work with.">
      <div className="follow-up-choice-list commercial-choice-list grid gap-x-4 gap-y-1">{choices.map(item => <label key={item.value} className="flex min-h-11 min-w-0 cursor-pointer items-start gap-2 py-2 text-sm leading-5 text-slate-700">
        <input type="checkbox" name="commercialMeasures" value={item.value} checked={answers.commercialMeasures.includes(item.value)} onChange={() => toggle(item.value)} className="mt-0.5 h-4 w-4 shrink-0 accent-teal-800" />
        <span className="min-w-0 break-words">{item.label}</span>
      </label>)}</div>
      {unknownSelections.length > 0 && <ChoiceList name="commercialMeasuresOtherSaved" options={unknownSelections} selected={answers.commercialMeasures} multiple onChange={toggle} />}
    </Question>
    <section aria-labelledby="commercial-details-title" className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 id="commercial-details-title" className="text-base font-bold text-ink">Any figures or results to add? (optional)</h2>
      <p className="mt-2 mb-3 text-sm text-slate-600">One or two across the form are plenty. Estimates or results without numbers are welcome; skip anything already covered or confidential.</p>
      <div className="optional-evidence-list">
        {groups.map(group => {
          const selectedAreas = commercialQuestions.filter(item => group.members.includes(item.value) && answers.commercialMeasures.includes(item.value)).map(item => item.label)
          const earlier = selected.filter(item => group.members.includes(item.value))
          const earlierBudget = group.id === 'budget' && hadBudget && !Object.prototype.hasOwnProperty.call(answers.commercialDetails, 'Budgets')
          const preview = [answers.commercialGroupDetails[group.id], ...earlier.map(item => readDetail(item.value)), earlierBudget ? answers.commercialResponsibility : ''].filter(Boolean).join(' ')
          return <OptionalEvidenceQuestion key={group.id} id={'commercial-group-' + group.id} title={group.title} preview={preview} context={group.id === 'costs' && selectedAreas.length === 0 ? 'Based on the forecasting, staffing schedules and P&L work you already mentioned.' : undefined}>
            <p id={'commercial-group-' + group.id + '-prompt'} className="mb-2 text-sm font-semibold">{group.prompt}</p>
            {selectedAreas.length > 0 && <p id={'commercial-group-' + group.id + '-context'} className="mb-3 text-sm text-slate-600">You selected: {selectedAreas.join(', ')}.</p>}
            {(earlier.length > 0 || earlierBudget) && <div className="mb-4 space-y-3">
              <p className="text-sm text-slate-600">Already supplied. No need to write this again.</p>
              {earlier.map(item => <TextArea key={item.value} id={'measure-' + item.id + '-note'} label={'Saved answer: ' + item.label} hideLabel={false} value={readDetail(item.value)} onChange={event => writeDetail(item.value, event.target.value)} />)}
              {earlierBudget && <TextArea id="commercialResponsibility" label="Saved budget or spending details" hideLabel={false} value={answers.commercialResponsibility || ''} onChange={event => setValue('commercialResponsibility', event.target.value)} />}
            </div>}
            <p id={`commercial-group-${group.id}-hint`} className="mb-3 text-sm text-slate-600">{group.hint}</p>
            <TextArea id={'commercial-group-' + group.id + '-note'} label={earlier.length > 0 || earlierBudget ? 'Anything to add? (optional)' : group.title} hideLabel={earlier.length === 0 && !earlierBudget} aria-describedby={[`commercial-group-${group.id}-prompt`, `commercial-group-${group.id}-hint`, selectedAreas.length > 0 ? `commercial-group-${group.id}-context` : ''].filter(Boolean).join(' ')} value={answers.commercialGroupDetails[group.id] || ''} onChange={event => setAnswers(current => ({ ...current, commercialGroupDetails: { ...current.commercialGroupDetails, [group.id]: event.target.value } }))} />
          </OptionalEvidenceQuestion>
        })}
        {hadExample && <OptionalEvidenceQuestion id="commercial-example" title="Your saved results example" preview={sharedPreview}>
          <CommercialExampleAnswers answers={answers} setAnswers={setAnswers} />
        </OptionalEvidenceQuestion>}
        {hadOffPremise && <OptionalEvidenceQuestion id="commercial-off-premise-saved" title="Your saved Off-Premise answer" preview={[answers.offPremiseNote, answers.offPremiseProblem, answers.offPremiseAction, answers.offPremiseResult].filter(Boolean).join(' ')}>
          <OffPremiseAnswer answers={answers} setAnswers={setAnswers}><OffPremiseFields answers={answers} setValue={setValue} /></OffPremiseAnswer>
        </OptionalEvidenceQuestion>}
        {hadCorrection && <OptionalEvidenceQuestion id="commercial-correction" title="Your correction to my earlier notes" preview={answers.commercialKnownCorrection}>
          <TextArea id="commercialKnownCorrection" label="What should I change or clarify?" hideLabel value={answers.commercialKnownCorrection} onChange={event => setValue('commercialKnownCorrection', event.target.value)} />
        </OptionalEvidenceQuestion>}
      </div>
    </section>
    <RetainedDetails answers={answers} move={() => document.getElementById('commercial-details-title')?.scrollIntoView({ block: 'start' })} sections={[4]} />
  </div>
}

function CommercialExampleAnswers({ answers, setAnswers }: { answers: Answers; setAnswers: (fn: (current: Answers) => Answers) => void }) {
  const [removed, setRemoved] = useState<{ item: CommercialExample; index: number } | null>(null)
  const [hasSavedSource] = useState(answers.commercialExamples.some(item => Boolean(item.source)))
  const [hasSavedFigures] = useState(answers.commercialExamples.some(item => [item.measures, item.figure, item.period, item.scope, item.certainty].some(Boolean)))
  const undoId = useId()
  const pendingFocus = useRef<string | null>(null)
  const update = (index: number, key: keyof CommercialExample, value: string | boolean) => setAnswers(current => {
    if (!current.commercialExamples[index]) return { ...current, commercialExamples: [...current.commercialExamples, { ...emptyCommercialExample(), [key]: value }] }
    return { ...current, commercialExamples: current.commercialExamples.map((item, i) => i === index ? { ...item, [key]: value } : item) }
  })
  useLayoutEffect(() => {
    if (pendingFocus.current) focusAnswerField(pendingFocus.current)
    pendingFocus.current = null
  })
  const remove = (index: number) => {
    setRemoved({ item: answers.commercialExamples[index], index })
    pendingFocus.current = undoId
    setAnswers(current => ({ ...current, commercialExamples: current.commercialExamples.filter((_, i) => i !== index) }))
  }
  const undo = () => {
    if (!removed) return
    const index = Math.min(removed.index, answers.commercialExamples.length)
    pendingFocus.current = 'commercial-' + index + '-note'
    setAnswers(current => ({ ...current, commercialExamples: [...current.commercialExamples.slice(0, index), removed.item, ...current.commercialExamples.slice(index)] }))
    setRemoved(null)
  }
  const rows = answers.commercialExamples.length ? answers.commercialExamples : [emptyCommercialExample()]
  const sourceLabels: Record<string, string> = { regional_compliance: 'Regional compliance and training', people_development: 'Developing people', off_premise: 'Off-Premise work' }

  return <div className="space-y-4">
    {rows.map((item, index) => <fieldset key={index} data-financial-example className="space-y-3">
      <legend className="sr-only">Example {index + 1}</legend>
      <ExampleAnswer id={'financial-' + index} kind="financial" item={item} showPrompt={false} onConfirm={() => update(index, 'answerMode', 'current')}>
        <TextArea id={'commercial-' + index + '-note'} label={commercialTopicLabel(item.topic) || 'Your example'} hideLabel={rows.length === 1 && !item.topic} value={item.note || ''} onChange={event => update(index, 'note', event.target.value)} />
      </ExampleAnswer>
      {hasSavedFigures && <AnswerDetails>
        <summary className="cursor-pointer py-2 text-sm text-teal-800">Your saved figure details</summary>
        <div className="mt-3 space-y-4">
          <TextInput id={'commercial-' + index + '-measures'} label="What does this relate to?" hideLabel={false} value={item.measures} onChange={event => update(index, 'measures', event.target.value)} />
          <div hidden={item.certainty === withoutFigures}><TextInput id={'commercial-' + index + '-figure'} label="Amount, percentage or score" hideLabel={false} value={item.figure} onChange={event => update(index, 'figure', event.target.value)} /></div>
          <TextInput id={'commercial-' + index + '-period'} label="Time period" hideLabel={false} value={item.period} onChange={event => update(index, 'period', event.target.value)} />
          <TextInput id={'commercial-' + index + '-scope'} label="Restaurant, team or region covered" hideLabel={false} value={item.scope} onChange={event => update(index, 'scope', event.target.value)} />
          <label className="block" htmlFor={'commercial-' + index + '-certainty'}>Is that exact or an estimate?
            <select id={'commercial-' + index + '-certainty'} className="field mt-2" value={item.certainty} onChange={event => update(index, 'certainty', event.target.value)}>
              <option value="">Not specified</option>
              {['Exact figure', 'Estimate or range', 'I would need to check', 'I don’t remember the figures', withoutFigures].map(option => <option key={option} value={option}>{option === withoutFigures ? 'Prefer no figures' : option}</option>)}
            </select>
          </label>
          {item.certainty === withoutFigures && <p role="status" className="text-sm text-slate-600">The separate figure is left out of your current answer. Any numbers in your written answer are still there for you to edit.</p>}
        </div>
      </AnswerDetails>}
      {hasSavedSource && <label className="block text-sm" htmlFor={'commercial-' + index + '-source'}>Your saved example link
        <select id={'commercial-' + index + '-source'} className="field mt-2" value={item.source} onChange={event => update(index, 'source', event.target.value)}>
          <option value="">A separate example</option>
          {Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          {item.source && !sourceLabels[item.source] && <option value={item.source}>{item.source}</option>}
        </select>
      </label>}
      {hasCommercialDetail(item) && <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={isOffPremiseExample(item)} onChange={event => {
          const checked = event.target.checked
          setAnswers(current => ({ ...current, commercialExamples: current.commercialExamples.map((saved, i) => i === index ? { ...saved, offPremise: checked, source: !checked && saved.source === 'off_premise' ? '' : saved.source } : saved) }))
        }} className="h-4 w-4 accent-teal-800" />
        This example is from my Off-Premise work
      </label>}
      {hasCommercialDetail(item) && <button type="button" aria-label={'Remove example ' + (index + 1)} className="min-h-11 text-sm text-slate-600 underline" onClick={() => remove(index)}>Remove example</button>}
    </fieldset>)}
    {removed && <div className="flex flex-wrap items-center gap-x-3 text-sm"><p role="status">Example removed.</p><button id={undoId} type="button" className="min-h-11 font-semibold text-teal-800 underline" onClick={undo}>Undo removal</button></div>}
  </div>
}

function RetainedDetails({ answers, move, sections }: { answers: Answers; move: (step: number) => void; sections: number[] }) {
  const { retained } = currentAnswerView(answers)
  const entries = retained.filter(item => sections.includes(item.section))
  if (!entries.length) return null
  return <details className="border-t border-slate-200 pt-3">
    <summary className="cursor-pointer py-2 text-sm text-slate-600">Earlier saved details</summary>
    <p className="mt-2 text-sm text-slate-600">These are kept for reference, not treated as current answers. They come from an earlier version of the form or a choice you changed.</p>
    <dl className="mt-3 space-y-4 text-sm">{entries.map(item => <div key={item.key}>
      <dt className="font-semibold">{item.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-slate-600">{item.value}</dd>
      <dd className="mt-1 text-xs text-slate-500">{item.reason === 'without_figures' ? 'You chose to describe this result without figures.' : item.reason === 'earlier_form' ? 'From an earlier version of the form.' : 'The related selection has changed.'}</dd>
      <button type="button" aria-label={item.reason === 'earlier_form' ? 'Review related questions: ' + item.label : 'Review ' + item.label.toLowerCase()} onClick={() => move(item.section)} className="mt-1 min-h-11 text-sm text-teal-800 underline">{item.reason === 'earlier_form' ? 'Review related questions' : 'Review ' + item.label.toLowerCase()}</button>
    </div>)}</dl>
  </details>
}

function PreferencesReview({ answers: savedAnswers, move }: { answers: Answers; move: (step: number) => void }) {
  const { current: answers } = currentAnswerView(savedAnswers)
  const balanceLabels: Record<string, string> = { A: 'Breadth or specialism', B: 'Variety or routine', C: 'Immediate problems or longer-term improvement', D: 'One team or several', E: 'Owning results or advising', F: 'Established processes or redesign' }
  const changeLabels = ['Similar management work with a new employer', 'Similar responsibility in a different sector', 'A different type of role using existing skills', 'A specialist area such as training, improvement or quality', 'A completely different career']
  const reactionLabels: Record<string, string> = { would_click: 'Interested', maybe_click: 'Maybe', would_skip: 'Not for me', need_detail: 'Need more detail', unclear_title: 'Title unfamiliar' }
  const changeText = (ids: string[]) => ids.map(id => changeLabels[Number(id) - 1] || id).join('; ')
  const groups = [
    { title: 'What you want less of', step: 7, rows: [['Less of', answers.rolesToReduce.join(', ')], ['Other detail', answers.rolesToReduceOther]] },
    { title: 'Leading and progressing', step: 8, rows: [['Managing people', answers.managementPreference], ['Progression without direct reports', answers.influenceProgression]] },
    { title: 'Council work', step: 10, rows: [['What appeals', answers.councilReasons.join(', ')], ['Other detail', answers.councilOther]] },
    { title: 'Work balance', step: 13, rows: Object.entries(answers.workStyle).map(([id, value]) => [balanceLabels[id] || id, value]) },
    { title: 'Changes you would consider', step: 9, rows: [['Yes', changeText(answers.comfortableChange)], ['Maybe', changeText(answers.possibleChange)], ['No', changeText(answers.tooFarChange)]] },
    { title: 'All role reactions', step: 14, rows: [
      ...answers.jobTitleReactions.filter(item => item.descriptionReaction || item.titleReaction || item.reason).map(item => [roleTests.find(([id]) => id === item.roleId)?.[1] || item.roleId, [item.descriptionReaction ? 'Before the title: ' + (reactionLabels[item.descriptionReaction] || item.descriptionReaction) : '', item.titleReaction ? 'After the title: ' + (reactionLabels[item.titleReaction] || item.titleReaction) : 'No separate reaction after the title', item.reason ? 'Your comment: ' + item.reason : ''].filter(Boolean).join('\n')]),
      ['What changed after seeing titles', answers.surprise],
    ] },
    { title: 'Earlier workplace notes', step: 11, rows: [['Workplace notes', answers.workplaceNotes]] },
  ]
  for (const group of groups) group.rows.push(...checkboxNoteQuestions.filter(item => item.section === group.step).map(item => [item.question, answers.checkboxNotes[item.key] || '']))
  return <Question title="Your preferences and reactions" help="You can check the full picture here, including anything you were unsure about or did not like.">
    {groups.filter(group => group.title !== 'Earlier workplace notes' || answers.workplaceNotes).map(group => <details key={group.title} className="border-b border-slate-200 py-3">
      <summary className="cursor-pointer py-1 text-sm font-semibold">{group.title}</summary>
      <dl className="mt-3 space-y-3 text-sm">{group.rows.filter(([, value]) => value).map(([label, value], index) => <div key={index}><dt className="font-semibold">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-slate-600">{value}</dd></div>)}</dl>
      {!group.rows.some(([, value]) => value) && <p className="mt-2 text-sm text-slate-600">No answer added.</p>}
      <button type="button" className="mt-3 min-h-11 text-sm font-semibold text-teal-800 underline" onClick={() => move(group.step)}>Edit {group.title.toLowerCase()}</button>
    </details>)}
    <RetainedDetails answers={savedAnswers} move={move} sections={[7, 10, 12]} />
  </Question>
}

function dateRange(start: string, end: string) {
  return start || end ? `Start: ${start || 'not specified'}; End: ${end || 'not specified'}` : ''
}

function ExperienceReview({ answers: savedAnswers, move }: { answers: Answers; move: (step: number, questionIndex?: number) => void }) {
  const { current: answers } = currentAnswerView(savedAnswers)
  const groups: { title: string; step: number; rows: [string, string | string[]][] }[] = [
    { title: 'Career timeline', step: 1, rows: [
      ...answers.careerTimeline.flatMap((role): [string, string][] => hasTimelineAddition(role) ? [[role.isFirstRole ? 'First role' : 'Role', [role.title, dateRange(role.startYear, role.endYear)].filter(Boolean).join(' · ')]] : []),
      ['Dates uncertain', answers.timelineUnsure ? 'Yes' : ''],
      ['Title clarification', [answers.titleChanged, answers.titleChanges].filter(Boolean).join(': ')],
      ['Overlapping responsibilities', answers.roleOverlap],
    ] },
    { title: 'Regional work and award', step: 18, rows: [
      ...answers.regionalResponsibilities.map((role): [string, string] => [role.label, [dateRange(role.startYear, role.endYear), role.notSure ? 'Dates uncertain' : ''].filter(Boolean).join(' · ')]),
      ['Award year', answers.awardYear], ['Award detail', answers.awardReason], ['Training participants', answers.regionalTrainingPeople], ['Training dates', answers.regionalTrainingDates], ['Results period', answers.regionalResultsPeriod], ['Additional regional work or training', answers.regionalTrainingDetail], ['Off-Premise change or result', answers.offPremiseNote], ['Learning Ambassador', answers.learningAmbassadorDetail], ['Area meetings', answers.areaMeetingsDetail]
    ] },
    { title: 'Scale and responsibility', step: 2, rows: [['Busy-shift team size', answers.busyShiftPeople], ['Reporting arrangement', answers.directReportsModel], ['Direct reports', answers.directReportsCount], ['Other reporting detail', answers.directReportsOther], ['Turnover', [answers.turnoverType, answers.turnoverValue].filter(Boolean).join(': ')], ['Restaurant', answers.highestGrossingRestaurant], ['Highest-grossing source', answers.highestGrossingComfort], ['GM cover decisions', answers.gmCover], ['GM cover detail', answers.gmCoverOther]] },
    { title: 'Working with others', step: 3, rows: [['Recruitment stages', answers.recruitmentScope], ['Other recruitment detail', answers.recruitmentOther], ['Recruitment numbers and details', answers.recruitmentAuthority], ['Management situations', answers.employeeRelations.map(value => checkboxChoiceLabels[value] || value)], ['Other situations', answers.employeeRelationsOther], ['Your role in these situations', answers.employeeRelationsAuthority], ...answers.developmentExamples.map((item): [string, string] => ['Colleague training or progression', exampleNote(item)])] },
    { title: 'Figures and results', step: 4, rows: [
      ['Correction to onboarding financial details', answers.commercialKnownCorrection], ['Measures used', answers.commercialMeasures], ['Responsibility for measures', answers.commercialResponsibility || ''], ['Other measure', answers.commercialOther],
      ...Object.entries(answers.commercialDetails).map(([measure, value]): [string, string] => [commercialQuestions.find(item => item.value === measure)?.question || measure, value]),
      ...Object.entries(answers.commercialGroupDetails).map(([id, value]): [string, string] => [commercialGroups.find(group => group.id === id)?.title || id, value]),
      ...answers.commercialExamples.map((item, index): [string, string] => [commercialTopicLabel(item.topic) || `Figure or example ${index + 1}`, [exampleNote(item), item.source ? 'Linked example: ' + ({ regional_compliance: 'regional compliance and training (onboarding)', people_development: 'developing people', off_premise: 'Off-Premise work' }[item.source] || item.source) : '', item.offPremise && item.source !== 'off_premise' ? 'Also used for Off-Premise work' : '', item.measures, item.figure, item.period, item.scope, item.certainty].filter(Boolean).join('\n')]),
      ['Earlier use-of-figures answer', answers.numberUse], ['Earlier example', answers.numberUseExample], ['Off-Premise situation', answers.offPremiseProblem], ['Off-Premise action', answers.offPremiseAction], ['Off-Premise result', answers.offPremiseResult]
    ] },
    { title: 'Software', step: 5, rows: [['Excel', answers.excelUse], ['Other Excel use', answers.excelOther], ['Looker', answers.lookerUse], ['Other Looker use', answers.lookerOther], ['Rotageek', answers.rotageekUse], ['Other Rotageek use', answers.rotageekOther], ['Earlier process or tool note', answers.workflowExample], ['Other systems', answers.otherSoftware]] },
    { title: 'Licences and driving', step: 6, rows: [['Additional licences or certificates', answers.licenceDetails], ['Driving', answers.drivingDetails]] },
  ]
  const editTasks: Record<number, [string, number][]> = {
    18: [['Regional work and award', 0]],
    2: [['Team size and General Manager cover', 0], ['Restaurant and sales', 1]],
    3: [['Recruitment and coaching', 0], ['Management situations', 1]],
    4: [['Figures and results', 0]],
    5: [['Software use', 0]],
  }
  for (const group of groups) group.rows.push(...checkboxNoteQuestions.filter(item => item.section === group.step).map((item): [string, string] => [item.question, answers.checkboxNotes[item.key] || '']))
  for (const group of groups) group.rows.push(...experiencePrompts.filter(prompt => experienceGroupSections[prompt.group] === group.step).map((prompt): [string, string] => [prompt.question, answers.experienceNotes[prompt.id] || '']))
  const populatedGroups = groups.map(group => ({ ...group, rows: group.rows.filter(([, value]) => Boolean(reviewText(value))) }))
  const answeredGroups = populatedGroups.filter(group => group.rows.length > 0)
  const otherGroups = populatedGroups.filter(group => group.rows.length === 0)
  return <Question title="Check your additional details" help="These are your follow-up answers, not your full work history. I’ll use them alongside your onboarding. Unanswered items are left out.">
    {answeredGroups.length === 0 && <p className="text-sm text-slate-600">Nothing extra to add here? You can continue to your preferences.</p>}
    {answeredGroups.map(group => <details key={group.title} className="border-b border-slate-200 py-3">
      <summary className="cursor-pointer py-1 text-sm font-semibold">{group.title}</summary>
      <dl className="mt-3 space-y-3 text-sm">{group.rows.map(([label, value], index) => <div key={index}><dt className="font-semibold">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-slate-600">{reviewText(value)}</dd></div>)}</dl>
      <div className="mt-3 flex flex-wrap gap-x-4">{(editTasks[group.step] || [[group.title, 0]]).map(([label, question]) => <button key={label} type="button" onClick={() => move(group.step, question)} className="min-h-11 text-sm font-semibold text-teal-800 underline">Edit {label.toLowerCase()}</button>)}</div>
    </details>)}
    {otherGroups.length > 0 && <AnswerDetails className="mt-4">
      <summary className="cursor-pointer py-2 text-sm text-teal-800">Revisit other topics (optional)</summary>
      <div className="mt-2 flex flex-col items-start">{otherGroups.flatMap(group => (editTasks[group.step] || [[group.title, 0]]).map(([label, question]) => <button key={`${group.step}-${question}`} type="button" onClick={() => move(group.step, question)} className="min-h-11 text-left text-sm text-teal-800 underline">{label}</button>))}</div>
    </AnswerDetails>}
    <RetainedDetails answers={savedAnswers} move={move} sections={[1, 2, 3, 4, 5, 6, 17, 18]} />
  </Question>
}
