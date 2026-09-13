export const sectionOrder = [0, 1, 18, 2, 3, 4, 5, 6, 19, 12, 11, 10, 7, 8, 13, 14, 9, 17, 16]

// Counts describe navigation pages, not individual fields or exploration choices.
export const sectionPageCounts: Record<number, number> = {
  0: 1, 1: 1, 18: 1, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1,
  19: 1, 12: 2, 11: 1, 10: 1, 7: 1, 8: 1,
  13: 1, 14: 1, 9: 1, 17: 1, 16: 1,
}

export type FollowUpPosition = { step: number; questionIndex: number }

export function experienceProgress(position: FollowUpPosition) {
  const pages = sectionOrder.slice(1, sectionOrder.indexOf(19) + 1)
    .flatMap(step => Array.from({ length: sectionPageCounts[step] }, (_, questionIndex) => ({ step, questionIndex })))
  const current = normalisePosition(position.step, position.questionIndex)
  const index = pages.findIndex(page => page.step === current.step && page.questionIndex === current.questionIndex)
  return index < 0 ? null : { page: index + 1, total: pages.length }
}

export function normalisePosition(step: unknown, questionIndex: unknown): FollowUpPosition {
  // Saved positions and bookmarks for the removed documents page go to review.
  if (step === 15) return { step: 19, questionIndex: 0 }
  const safeStep = typeof step === 'number' && sectionOrder.includes(step) ? step : 0
  const index = typeof questionIndex === 'number' && Number.isInteger(questionIndex) ? questionIndex : 0
  // GM cover now sits with team responsibility, not on a separate page.
  if (safeStep === 2 && index === 2) return { step: safeStep, questionIndex: 0 }
  // The earlier coaching page now lives with recruitment, not management cases.
  if (safeStep === 3 && index === 2) return { step: safeStep, questionIndex: 0 }
  return { step: safeStep, questionIndex: Math.max(0, Math.min(index, sectionPageCounts[safeStep] - 1)) }
}

export function readPositionHash(hash: string): FollowUpPosition | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  if (!params.has('section')) return null
  const step = Number(params.get('section'))
  if (step !== 15 && !sectionOrder.includes(step)) return null
  return normalisePosition(step, Number(params.get('question') || 0))
}

export function positionHash(position: FollowUpPosition) {
  return `#section=${position.step}&question=${position.questionIndex}`
}

export function adjacentPosition(position: FollowUpPosition, direction: -1 | 1): FollowUpPosition {
  const { step, questionIndex } = position
  const nextQuestion = questionIndex + direction
  if (nextQuestion >= 0 && nextQuestion < sectionPageCounts[step]) return { step, questionIndex: nextQuestion }
  const index = sectionOrder.indexOf(step) + direction
  if (index < 0 || index >= sectionOrder.length) return position
  const nextStep = sectionOrder[index]
  return { step: nextStep, questionIndex: direction === -1 ? sectionPageCounts[nextStep] - 1 : 0 }
}
