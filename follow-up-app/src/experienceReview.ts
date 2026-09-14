import type { TimelineRole } from './timelineRoles'

export function reviewText(value: string | string[]) {
  return Array.isArray(value) ? value.filter(item => item.trim()).join(', ') : value.trim()
}

export function hasTimelineAddition(role: TimelineRole) {
  if (role.isSeeded === true && role.title === 'Deputy/Assistant Manager' && !role.startYear.trim() && role.endYear === 'Present') return false
  if (role.startYear.trim() || role.endYear.trim()) return true
  if (!role.title.trim()) return false
  return role.isFirstRole === true || role.isSeeded !== true
}
