import { isCurrentRole, type RoleDates } from './roleDates'

export type TimelineRole = RoleDates & { title: string; isFirstRole?: boolean; isSeeded?: boolean }

export function updateTimelineRole(role: TimelineRole, key: keyof RoleDates | 'title', value: string): TimelineRole {
  return { ...role, [key]: value, isSeeded: false }
}

export function setFirstRole(roles: TimelineRole[], index: number, checked: boolean) {
  return roles.map((role, i) => i === index
    ? { ...role, isFirstRole: checked }
    : checked ? { ...role, isFirstRole: false } : role)
}

export function timelineEditLabel(role: TimelineRole) {
  if (!role.title.trim()) return 'Add title'
  return 'Edit role or dates'
}

export function timelineDateSummary(role: TimelineRole) {
  if (isCurrentRole(role.endYear)) return role.startYear ? `${role.startYear} to present` : 'Current role · Start year optional'
  return role.startYear || role.endYear ? `Start: ${role.startYear || 'not specified'}; End: ${role.endYear || 'not specified'}` : 'Dates optional'
}

export function restoreTimelineRole(roles: TimelineRole[], role: TimelineRole, index: number) {
  const restored = { ...role, isFirstRole: role.isFirstRole === true && !roles.some(item => item.isFirstRole) }
  return [...roles.slice(0, index), restored, ...roles.slice(index)]
}
