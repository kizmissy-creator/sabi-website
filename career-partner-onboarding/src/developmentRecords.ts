export const controlWordingVersions = {
  specialConsent: 'special-category-consent-2026-08-01',
  termsAccepted: 'career-support-terms-development-2026-08-01',
  earlyStart: 'early-start-request-2026-08-01',
  declaration: 'client-declaration-2026-08-01',
} as const

export type ControlKey = keyof typeof controlWordingVersions

export type DevelopmentControlRecord = {
  selected: boolean
  wordingVersion: string
  recordedAt: string
  environment: 'development-local-only'
}

export function createDevelopmentControlRecord(key: ControlKey, selected: boolean): DevelopmentControlRecord {
  return {
    selected,
    wordingVersion: controlWordingVersions[key],
    recordedAt: new Date().toISOString(),
    environment: 'development-local-only',
  }
}
