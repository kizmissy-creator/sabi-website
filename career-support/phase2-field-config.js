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
  ])
});
