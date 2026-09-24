export const workStylePairs = [
  ['A', 'Responsibility across several areas', 'Building specialist knowledge in one area'],
  ['B', 'Varied tasks from day to day', 'A regular set of tasks'],
  ['C', 'Responding to problems as they arise', 'Working on planned improvements over time'],
  ['D', 'Working closely with one team', 'Supporting several teams'],
  ['E', 'Taking responsibility for delivery', 'Providing advice that others put into practice'],
  ['F', 'Working with established processes', 'Developing or improving processes'],
] as const

export const workStylePrompts: Record<string, string> = {
  A: 'What kind of responsibility would you prefer?',
  B: 'What would you prefer in your day-to-day work?',
  C: 'Which would you prefer to spend more of your time doing?',
  D: 'How would you prefer to work with teams?',
  E: 'Which part of the work would you prefer to focus on?',
  F: 'Which would you prefer to spend more of your time doing?',
}
export const workStyleAlternatives = ['A mixture of both', 'Not sure yet'] as const

export function isCurrentWorkStyleAnswer(id: string, value: string) {
  const pair = workStylePairs.find(([key]) => key === id)
  return Boolean(pair && [pair[1], pair[2], ...workStyleAlternatives].some(option => option === value))
}

export const coreRoleIndexes = [0, 3, 4, 5]
export const extraRoleIndexes = [1, 2, 6, 7]
export const roleOrder = [...coreRoleIndexes, ...extraRoleIndexes]
export type ExplorationUi = { workStyleIndex: number; roleIndex: number; showMoreRoles: boolean }
export const initialExplorationUi: ExplorationUi = { workStyleIndex: 0, roleIndex: 0, showMoreRoles: true }

type RecordedReactions = { roleId: string; descriptionReaction?: string; titleReaction?: string }[]
const safeIndex = (value: unknown, fallback: number, length: number) =>
  Math.max(0, Math.min(typeof value === 'number' && Number.isInteger(value) ? value : fallback, length - 1))

export function restoreExplorationUi(value: unknown, workStyle: Record<string, string>, reactions: RecordedReactions, roleIds: string[]): ExplorationUi {
  const saved = value && typeof value === 'object' ? value as Partial<ExplorationUi> : {}
  const answered = (index: number) => reactions.some(item => item.roleId === roleIds[index] && (item.descriptionReaction || item.titleReaction))
  return {
    workStyleIndex: safeIndex(saved.workStyleIndex, workStylePairs.findIndex(([id]) => !workStyle[id]), workStylePairs.length),
    roleIndex: safeIndex(saved.roleIndex, roleOrder.findIndex(index => !answered(index)), roleOrder.length),
    showMoreRoles: true,
  }
}
