// SABI Career Support development field configuration.
// Fictional testing only. No live data collection or payment.
window.SABI_PHASE2_FIELD_CONFIG = Object.freeze({
  version: 'core-intake-2026-08-11',
  developmentOnly: true,
  contactMethods: Object.freeze([
    Object.freeze({ value: 'email', label: 'Email' }),
    Object.freeze({ value: 'telephone', label: 'Telephone' }),
    Object.freeze({ value: 'sms', label: 'SMS where available' }),
    Object.freeze({ value: 'video', label: 'Video-meeting invitation' })
  ]),
  lifeStageOptions: Object.freeze([
    Object.freeze({ value: '', label: 'Select an option' }),
    Object.freeze({ value: 'yes', label: 'Yes' }),
    Object.freeze({ value: 'no', label: 'No' }),
    Object.freeze({ value: 'not-sure', label: 'Not sure' })
  ]),
  employmentStatuses: Object.freeze([
    Object.freeze({ value: 'employed', label: 'Employed' }),
    Object.freeze({ value: 'self-employed', label: 'Self-employed' }),
    Object.freeze({ value: 'studying', label: 'Studying or training' }),
    Object.freeze({ value: 'volunteering', label: 'Volunteering' }),
    Object.freeze({ value: 'caring', label: 'Caring responsibilities' }),
    Object.freeze({ value: 'looking-for-work', label: 'Looking for work' }),
    Object.freeze({ value: 'on-a-break', label: 'On a break from work' }),
    Object.freeze({ value: 'returning-to-work', label: 'Returning to work' }),
    Object.freeze({ value: 'no-paid-work', label: 'I have not had paid work yet' }),
    Object.freeze({ value: 'other', label: 'Other' })
  ])
});
