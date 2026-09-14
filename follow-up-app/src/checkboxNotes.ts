export const checkboxNoteQuestions = [
  { key: 'rolesToReduce', section: 7, question: 'Is there a particular part you want less of?', hint: 'For example, something you would still enjoy occasionally but not as the main part of your job.' },
  { key: 'councilReasons', section: 10, question: 'What matters most about those choices?', hint: 'Only add anything the choices do not capture. Your hours, salary and location preferences are already covered elsewhere.' },
  { key: 'existingEvidence', section: 15, question: 'What else do you have?', hint: 'A few words are enough, such as an email thanking you or a project you worked on.' },
] as const

export const nonExperienceChoices = ['None of these are really part of my role', 'None of these particularly bother me', 'I don’t think I have any of these', 'I’m not sure', 'I hardly use Excel', 'I’m not involved in choosing new staff']

// Labels can improve without changing the values in existing drafts.
export const checkboxChoiceLabels: Record<string, string> = {
  'Apprenticeship or assessment work': 'Work from your apprenticeship or final assessment',
  'Training materials or information booklets you created': 'Training materials or booklets you made',
  'Feedback or appraisals, including the college careers event': 'Written feedback or appraisals',
  'Other useful work evidence': 'Something else',
  'Decide/identify that recruitment is needed': 'Identify hiring needs',
  'Request/advertise vacancies': 'Request or advertise roles',
  'Make/send offers': 'Make or send offers',
  'Training/development': 'Training and development',
  'Retention activity': 'Supporting staff retention',
  'Exit/leaver processes': 'Leaver processes',
  'Attendance/absence': 'Attendance or absence',
  'Underperformance': 'Performance below expectations',
  'Capability': 'Capability (ability to do the role)',
  'None of these are really part of my role': 'None of these situations',
  'Welfare/support conversations': 'Welfare and support',
  'Financial/commercial decisions': 'Commercial decisions',
  'Performance/KPIs': 'Performance targets',
  'Employee/staff issues': 'Staff issues',
  'Opening/closing': 'Opening or closing',
  'Reporting to senior/regional management': 'Report to senior managers',
  'Operational decision-making': 'Other operational decisions',
  'Staff disciplinary/conflict situations': 'Staff conflict or discipline',
  'Being the person every problem escalates to': 'Handling escalated problems',
  'Financial/cost responsibility': 'Responsibility for costs',
  'Hospitality/food-specific work': 'Hospitality or food work',
  'Entering/updating data': 'Enter or update data',
  'Sorting/filtering': 'Sort or filter',
  'Analysing trends/data': 'Analyse data and trends',
  'Comparing restaurants/teams': 'Compare teams or restaurants',
  'Spotting trends/problems': 'Spot trends or problems',
  'Exporting information/reports': 'Export data or reports',
  'Security/stability': 'Security and stability',
  'Pension/benefits': 'Pension and benefits',
  'Flexible/hybrid working': 'Flexible or hybrid work',
  'Public service / doing something useful': 'Public service and useful work',
  'I’m not really sure, it just appeals to me': 'Not sure yet; it appeals to me',
  'Assistant Manager of the Year information/certificate': 'Award information or certificate',
  'Apprenticeship or EPA work': 'Apprenticeship or assessment work',
  'Old/current Nando’s job descriptions': 'Nando’s job descriptions',
  'Appraisals or performance feedback': 'Appraisals or work feedback',
  'Training/H&S/other certificates': 'Training and other certificates',
}

export function checkboxNoteApplies(key: string, answers: Record<string, unknown>) {
  const choices = answers[key]
  if (!Array.isArray(choices)) return false
  if (key === 'existingEvidence') return choices.includes('Other useful work evidence')
  if (key === 'councilReasons' && choices.every(value => value === 'I’m not really sure, it just appeals to me' || value === 'Something else')) return false
  return choices.some(value => !nonExperienceChoices.includes(value) && value !== 'Something else')
}
