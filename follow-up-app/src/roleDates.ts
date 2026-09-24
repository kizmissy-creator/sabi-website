export type RoleDates = { startYear: string; endYear: string; previousEndYear?: string }

export function isCurrentRole(endYear: string) {
  return /^(present|current|ongoing|now)$/i.test(endYear.trim())
}

export function setCurrentRole<T extends RoleDates>(role: T, checked: boolean): T {
  if (checked === isCurrentRole(role.endYear)) return role
  return checked
    ? { ...role, endYear: 'Present', previousEndYear: role.endYear }
    : { ...role, endYear: role.previousEndYear || '', previousEndYear: '' }
}
