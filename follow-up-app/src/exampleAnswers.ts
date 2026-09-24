type Example = {
  note?: string
  earlierNote?: string
  answerMode?: string
  situation?: string
  action?: string
  result?: string
  responsibility?: string
  outcome?: string
}

export const examplePrompts = {
  development: [['situation', 'What was happening'], ['action', 'What you did'], ['result', 'What changed']],
  financial: [['responsibility', 'Your decisions and approvals'], ['outcome', 'What changed']],
} as const

export type ExampleKind = keyof typeof examplePrompts

// Older fields were supplementary, not competing versions. Keep every account
// verbatim and flag combined accounts for review rather than choosing one as true.
export function singleExampleAnswer<T extends Example>(item: T, kind: ExampleKind): T {
  if (item.answerMode === 'current' || item.answerMode === 'review_pending') return item
  // Pass 9's marker plus an explicitly blank note records a deliberate clear.
  if (item.answerMode === 'single' && item.note === '') return { ...item, answerMode: 'current' }
  const prompted = examplePrompts[kind].filter(([key]) => item[key]?.trim()).map(([key, label]) => `${label}: ${item[key]}`).join('\n\n')
  const accounts = [...new Set([item.note || '', prompted, item.earlierNote || ''].filter(value => value.trim()))]
  const needsReview = accounts.length > 1 || (item.answerMode === 'single' && Boolean(prompted || item.earlierNote))
  return { ...item, note: accounts.join('\n\n'), earlierNote: item.earlierNote || item.note || '', answerMode: needsReview ? 'review_pending' : 'current' }
}
