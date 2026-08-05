export type ServiceId = 'professional-cv' | 'career-change' | 'career-partner' | 'career-partner-plus' | 'starter-cv'

export type Service = {
  id: ServiceId
  name: string
  price: number
  summary: string
  includes: string[]
}

export const services: Service[] = [
  {
    id: 'professional-cv',
    name: 'Professional CV',
    price: 50,
    summary: 'One strong CV for an agreed role, vacancy, industry or career direction.',
    includes: ['Personalised intake', 'One professionally written CV', 'Word and PDF copies', 'Standard revision allowance'],
  },
  {
    id: 'career-change',
    name: 'Career Change',
    price: 95,
    summary: 'Career exploration, a practical direction and action plan, and one aligned CV.',
    includes: ['Career exploration', 'Career Direction and Action Plan', 'One aligned CV', 'Standard revision allowance'],
  },
  {
    id: 'career-partner',
    name: 'Career Partner',
    price: 135,
    summary: 'Coordinated CV and application materials for someone with a broad direction.',
    includes: ['One core CV', 'One targeted CV version', 'One tailored cover letter', 'One application review'],
  },
  {
    id: 'career-partner-plus',
    name: 'Career Partner Plus',
    price: 195,
    summary: 'Career Partner materials with interview preparation and bounded follow-up support.',
    includes: ['Everything in Career Partner', 'Interview preparation', 'Two application reviews total', '14 days of bounded follow-up'],
  },
  {
    id: 'starter-cv',
    name: 'Starter CV',
    price: 30,
    summary: 'A first professional CV for a limited and relatively straightforward history.',
    includes: ['Evidence-led starter intake', 'One professionally written first CV', 'One agreed direction', 'Standard revision allowance'],
  },
]

export const sections = [
  ['start', 'Start and privacy'],
  ['about', 'About you'],
  ['situation', 'Current situation'],
  ['history', 'Work history'],
  ['preferences', 'Your next role'],
  ['evidence', 'Skills and evidence'],
  ['applications', 'Applications and documents'],
  ['service', 'Your selected service'],
  ['access', 'Communication and accessibility'],
  ['checkout', 'Add-ons and arrangements'],
  ['review', 'Review and controls'],
] as const

export const addOns = [
  { id: 'linkedin', name: 'LinkedIn Profile Support', price: 35 },
  { id: 'extraCv', name: 'Additional CV Version', price: 35 },
  { id: 'coverLetter', name: 'Additional Cover Letter', price: 25 },
  { id: 'applicationReview', name: 'Additional Application Review', price: 30 },
  { id: 'interview', name: 'Interview Preparation', price: 45 },
] as const

export const employmentOptions = ['Employed full time', 'Employed part time', 'Self-employed', 'Studying or training', 'Volunteering', 'Caring', 'Looking for work', 'On sick leave or a break', 'Returning to work', 'Something else']
export const priorityOptions = ['Type of work', 'Purpose', 'Pay', 'Hours', 'Flexibility', 'Location', 'Stability', 'Progression', 'Environment', 'Accessibility', 'Something else']
export const arrangementOptions = ['Remote', 'Hybrid', 'Workplace-based', 'Flexible location', 'Not sure']
export const hoursOptions = ['Full time', 'Part time', 'Compressed hours', 'Shifts', 'Nights', 'Term time', 'Flexible', 'Other']
export const travelOptions = ['Walk', 'Cycle', 'Public transport', 'Drive', 'Passenger', 'Taxi', 'Remote only', 'Other']
export const skillOptions = ['Organising', 'Communicating', 'Writing', 'Researching', 'Problem solving', 'Supporting people', 'Working with numbers', 'Using technology', 'Creating things', 'Planning', 'Leading', 'Learning quickly']
export const difficultyOptions = ['Finding suitable roles', 'Knowing what fits', 'Explaining my experience', 'CV writing', 'Applications', 'Interviews', 'Confidence', 'Energy or overwhelm', 'Accessibility', 'Something else']
export const contactOptions = ['Email', 'Telephone', 'SMS where available', 'Video-meeting invitation']
export const addOnIds = addOns.map((item) => item.id)
