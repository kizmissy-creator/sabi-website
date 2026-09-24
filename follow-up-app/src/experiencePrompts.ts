export const experienceGroupSections = { gmCover: 2, recruitmentScope: 3, employeeRelations: 3, excelUse: 5, lookerUse: 5, rotageekUse: 5 } as const
export type ExperienceGroup = keyof typeof experienceGroupSections
type ExperiencePrompt = { id: string; group: ExperienceGroup; value: string; question: string }
type SharedExperiencePrompt = Omit<ExperiencePrompt, 'value'> & { members: string[]; hint: string }

export const performanceSupportChoice = 'Performance or ability to do the role'
export const performanceSupportValues = [performanceSupportChoice, 'Underperformance', 'Capability']

// Keep original topic IDs and wording so earlier notes retain their meaning.
export const legacyExperiencePrompts: ExperiencePrompt[] = [
  { id: 'gm-staffing', group: 'gmCover', value: 'Staffing and deployment', question: 'Does a shift when you had to move people around come to mind?' },
  { id: 'gm-customers', group: 'gmCover', value: 'Customer escalations', question: 'Have you ever stepped in when a customer issue needed a manager?' },
  { id: 'gm-safety', group: 'gmCover', value: 'Health & Safety', question: 'Have you ever spotted a safety concern while covering the GM?' },
  { id: 'gm-stock', group: 'gmCover', value: 'Stock and ordering decisions', question: 'Have you ever had to make a stock or ordering decision in the GM’s absence?' },
  { id: 'gm-commercial', group: 'gmCover', value: 'Financial/commercial decisions', question: 'Does a spending decision you made while covering come to mind?' },
  { id: 'gm-performance', group: 'gmCover', value: 'Performance/KPIs', question: 'Have you ever noticed a result that needed attention while covering?' },
  { id: 'gm-people', group: 'gmCover', value: 'Employee/staff issues', question: 'Have you ever been the person staff turned to while the GM was away?' },
  { id: 'gm-opening', group: 'gmCover', value: 'Opening/closing', question: 'Does an opening or closing that needed an extra decision come to mind?' },
  { id: 'gm-reporting', group: 'gmCover', value: 'Reporting to senior/regional management', question: 'Have you ever raised an issue or recommendation with senior managers?' },
  { id: 'gm-decisions', group: 'gmCover', value: 'Operational decision-making', question: 'Does another decision you made while covering the restaurant come to mind?' },
  { id: 'hire-needs', group: 'recruitmentScope', value: 'Decide/identify that recruitment is needed', question: 'Have you ever spotted that the team needed another person or a different skill?' },
  { id: 'hire-advertising', group: 'recruitmentScope', value: 'Request/advertise vacancies', question: 'Have you ever helped get a vacancy approved or advertised?' },
  { id: 'hire-shortlist', group: 'recruitmentScope', value: 'Shortlist candidates', question: 'Does a time you helped choose who to interview come to mind?' },
  { id: 'hire-interviews', group: 'recruitmentScope', value: 'Interview candidates', question: 'Is there an interview you took part in that you remember?' },
  { id: 'hire-decisions', group: 'recruitmentScope', value: 'Make hiring decisions', question: 'Does a hiring decision you helped make come to mind?' },
  { id: 'hire-recommendations', group: 'recruitmentScope', value: 'Recommend hiring decisions', question: 'Have you ever recommended someone for a role?' },
  { id: 'hire-offers', group: 'recruitmentScope', value: 'Make/send offers', question: 'Have you ever helped a candidate through an offer or starting arrangements?' },
  { id: 'hire-probation', group: 'recruitmentScope', value: 'Probation', question: 'Have you ever supported someone through their first few months?' },
  { id: 'hire-retention', group: 'recruitmentScope', value: 'Retention activity', question: 'Have you ever helped address a reason someone might leave?' },
  { id: 'hire-leavers', group: 'recruitmentScope', value: 'Exit/leaver processes', question: 'Have you ever helped with a handover or learned something from a leaver’s feedback?' },
  { id: 'relations-attendance', group: 'employeeRelations', value: 'Attendance/absence', question: 'Have you ever supported someone with attendance or a return to work?' },
  { id: 'relations-performance', group: 'employeeRelations', value: 'Underperformance', question: 'Have you ever helped someone who was struggling with part of their work?' },
  { id: 'relations-capability', group: 'employeeRelations', value: 'Capability', question: 'Does a time you explored what support someone needed in their role come to mind?' },
  { id: 'relations-conversations', group: 'employeeRelations', value: 'Difficult conversations', question: 'Is there a difficult conversation you helped someone through that comes to mind?' },
  { id: 'relations-conflict', group: 'employeeRelations', value: 'Conflict between staff', question: 'Have you ever helped colleagues work through a disagreement?' },
  { id: 'relations-disciplinary', group: 'employeeRelations', value: 'Disciplinary matters', question: 'Have you ever supported or taken part in a disciplinary process?' },
  { id: 'relations-grievances', group: 'employeeRelations', value: 'Grievances', question: 'Have you ever helped handle a concern someone formally raised?' },
  { id: 'relations-investigations', group: 'employeeRelations', value: 'Investigations', question: 'Have you ever helped gather information to understand what happened?' },
  { id: 'relations-welfare', group: 'employeeRelations', value: 'Welfare/support conversations', question: 'Does a time someone came to you for support come to mind?' },
  { id: 'excel-data', group: 'excelUse', value: 'Entering/updating data', question: 'Is there an Excel sheet you keep up to date that others rely on?' },
  { id: 'excel-filtering', group: 'excelUse', value: 'Sorting/filtering', question: 'Have you ever used sorting or filtering to find something useful in Excel?' },
  { id: 'excel-formulas', group: 'excelUse', value: 'Formulas', question: 'Have you ever used an Excel formula to save time or check a figure?' },
  { id: 'excel-charts', group: 'excelUse', value: 'Charts', question: 'Have you ever made an Excel chart that helped explain something?' },
  { id: 'excel-pivots', group: 'excelUse', value: 'Pivot tables', question: 'Does anything you have explored with a pivot table come to mind?' },
  { id: 'excel-lookups', group: 'excelUse', value: 'Lookups', question: 'Have you ever used a lookup to bring information together in Excel?' },
  { id: 'excel-trackers', group: 'excelUse', value: 'Building trackers', question: 'Have you ever made a tracker that made something easier to keep on top of?' },
  { id: 'excel-trends', group: 'excelUse', value: 'Analysing trends/data', question: 'Have you ever spotted a pattern or problem in an Excel sheet?' },
  { id: 'excel-reports', group: 'excelUse', value: 'Reporting', question: 'Does an Excel report you put together for someone come to mind?' },
  { id: 'looker-dashboards', group: 'lookerUse', value: 'Viewing dashboards', question: 'Have you ever noticed something on a Looker dashboard that caught your attention?' },
  { id: 'looker-filtering', group: 'lookerUse', value: 'Filtering information', question: 'Have you ever narrowed down the information in Looker to look into something?' },
  { id: 'looker-periods', group: 'lookerUse', value: 'Comparing time periods', question: 'Have you ever compared two periods in Looker and noticed a change?' },
  { id: 'looker-teams', group: 'lookerUse', value: 'Comparing restaurants/teams', question: 'Have you ever noticed a useful difference between teams or restaurants in Looker?' },
  { id: 'looker-trends', group: 'lookerUse', value: 'Spotting trends/problems', question: 'Does a trend or problem you spotted in Looker come to mind?' },
  { id: 'looker-exports', group: 'lookerUse', value: 'Exporting information/reports', question: 'Have you ever shared information from Looker to help someone with a decision?' },
  { id: 'looker-reports', group: 'lookerUse', value: 'Creating reports', question: 'Is there a Looker report you created that you remember?' },
  { id: 'looker-building', group: 'lookerUse', value: 'Creating dashboards', question: 'Have you ever put together a Looker dashboard for a particular need?' },
  { id: 'rota-building', group: 'rotageekUse', value: 'Building rotas', question: 'Does a tricky rota you worked out in Rotageek come to mind?' },
  { id: 'rota-forecast', group: 'rotageekUse', value: 'Forecasting staffing requirements', question: 'Have you ever used Rotageek to plan for a busy or quieter period?' },
  { id: 'rota-labour', group: 'rotageekUse', value: 'Labour planning', question: 'Have you ever balanced staffing costs and cover using Rotageek?' },
  { id: 'rota-availability', group: 'rotageekUse', value: 'Availability', question: 'Have you ever worked around a team’s availability to get the right cover?' },
  { id: 'rota-leave', group: 'rotageekUse', value: 'Leave', question: 'Does a time you worked out leave and cover for the team come to mind?' },
  { id: 'rota-sales', group: 'rotageekUse', value: 'Adjusting staffing around expected sales', question: 'Have you ever changed the rota because expected sales had changed?' },
  { id: 'rota-reports', group: 'rotageekUse', value: 'Reporting', question: 'Have you ever used a Rotageek report to spot something worth looking into?' },
]

export const sharedExperiencePrompts: SharedExperiencePrompt[] = [
  { id: 'shared-gm-shift', group: 'gmCover', members: ['gm-staffing', 'gm-customers', 'gm-safety', 'gm-people', 'gm-opening', 'gm-decisions'], question: 'Does a shift you took charge of come to mind?', hint: 'Perhaps a staffing gap, customer issue or unexpected decision. Your part and what happened afterwards are useful; one situation can cover several choices.' },
  { id: 'shared-gm-commercial', group: 'gmCover', members: ['gm-stock', 'gm-commercial', 'gm-performance'], question: 'Does a stock, spending or performance decision come to mind?', hint: 'A few words about your decision are enough, including anything that needed approval. Skip this if your numbers example covers it.' },
  { id: 'shared-gm-reporting', group: 'gmCover', members: ['gm-reporting'], question: 'Does something you raised with senior managers come to mind?', hint: 'It could be an issue, update or suggestion. Your part and what happened next are useful, if you remember.' },
  { id: 'shared-hire-recruitment', group: 'recruitmentScope', members: ['hire-needs', 'hire-advertising', 'hire-shortlist', 'hire-interviews', 'hire-decisions', 'hire-recommendations', 'hire-offers'], question: 'Does someone you helped recruit come to mind?', hint: 'A few words about your part are useful, such as interviewing, recommending or making the final decision. No names needed.' },
  { id: 'shared-hire-leavers', group: 'recruitmentScope', members: ['hire-leavers'], question: 'Does a handover or leaving conversation come to mind?', hint: 'Perhaps you helped make the handover easier or learned something from their feedback. Leave out names and personal details.' },
  { id: 'shared-relations-support', group: 'employeeRelations', members: ['relations-attendance', 'relations-performance', 'relations-capability', 'relations-welfare'], question: 'Can you remember helping someone with attendance, performance or wellbeing?', hint: 'A few words about your part or what changed are enough. No names or personal details.' },
  { id: 'shared-relations-conversations', group: 'employeeRelations', members: ['relations-conversations', 'relations-conflict'], question: 'Does a difficult conversation or disagreement come to mind?', hint: 'Your part and what happened afterwards are useful. No names or repeat examples needed.' },
  { id: 'shared-relations-formal', group: 'employeeRelations', members: ['relations-disciplinary', 'relations-grievances', 'relations-investigations'], question: 'Does an investigation, grievance or disciplinary process come to mind?', hint: 'A few words about your part are enough: gathering information, supporting a meeting or making a decision. No names or case details needed.' },
  { id: 'shared-excel', group: 'excelUse', members: ['excel-data', 'excel-filtering', 'excel-formulas', 'excel-charts', 'excel-pivots', 'excel-lookups', 'excel-trackers', 'excel-trends', 'excel-reports'], question: 'Does a spreadsheet you worked on come to mind?', hint: 'A tracker, report or useful calculation might jog your memory. A few words about what you did with it and what it helped with are enough.' },
  { id: 'shared-looker', group: 'lookerUse', members: ['looker-dashboards', 'looker-filtering', 'looker-periods', 'looker-teams', 'looker-trends', 'looker-exports', 'looker-reports', 'looker-building'], question: 'Does something you worked on in Looker come to mind?', hint: 'Perhaps a dashboard, comparison or report. What you noticed or put together, and how it was used, could be useful. Skip it if an earlier example covers this.' },
  { id: 'shared-rotageek', group: 'rotageekUse', members: ['rota-building', 'rota-forecast', 'rota-labour', 'rota-availability', 'rota-leave', 'rota-sales', 'rota-reports'], question: 'Does a rota or staffing decision come to mind?', hint: 'Perhaps you balanced cover, availability and costs in Rotageek. One example can cover several tools or choices; no need to repeat your numbers answer.' },
]

export const coachingChoices = ['Probation', 'Training/development', 'Retention activity']
// Earlier answers stay editable, but these topics no longer ask for a new incident.
export const savedOnlyExperiencePromptIds = new Set([
  'shared-gm-shift', 'shared-gm-commercial', 'shared-gm-reporting',
  'shared-hire-recruitment', 'shared-hire-leavers',
  'shared-relations-support', 'shared-relations-conversations', 'shared-relations-formal',
  'shared-excel', 'shared-looker', 'shared-rotageek',
])
export const experiencePrompts = [...legacyExperiencePrompts, ...sharedExperiencePrompts]

export function experiencePromptApplies(prompt: ExperiencePrompt | SharedExperiencePrompt, answers: Record<string, unknown>) {
  const values = answers[prompt.group]
  const topics = 'members' in prompt ? legacyExperiencePrompts.filter(item => prompt.members.includes(item.id)).map(item => item.value) : [prompt.value]
  return Array.isArray(values) && topics.some(value => values.includes(value) || (
    prompt.group === 'employeeRelations' && performanceSupportValues.includes(value) && values.includes(performanceSupportChoice)
  ))
}
