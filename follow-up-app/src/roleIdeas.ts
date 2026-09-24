export type RoleReaction = { roleId: string; titleReaction: string; descriptionReaction: string; revealed: boolean; reason?: string }

export const roleIdeas: Record<string, { summary: string; activities: string[]; detail: string }> = {
  learning_development_officer: {
    summary: 'Help colleagues learn the skills they need at work.',
    activities: ['Find out where people need training.', 'Prepare or organise learning and run sessions.', 'Review progress and whether the training helped.'],
    detail: 'The balance varies: some jobs involve presenting to groups, while others focus on organising courses or creating materials. Planning, learner records and checking results can sit alongside the people-facing work.',
  },
  training_quality_manager: {
    summary: 'Bring training and quality improvement together.',
    activities: ['Review where performance falls short of a standard.', 'Agree coaching or training with the teams involved.', 'Check whether the changes improve results.'],
    detail: 'This combines supporting people with reviewing evidence and following up improvements. How much team management, training delivery or quality checking is involved depends on the employer.',
  },
  workforce_development_coordinator: {
    summary: 'Coordinate learning and development across a workforce.',
    activities: ['Help managers identify learning needs.', 'Organise learning activities and keep plans on track.', 'Track participation and progress.'],
    detail: 'The emphasis may be on coordination: keeping records, arranging activities and following up with managers and learners. It does not always mean personally delivering every training session.',
  },
  service_improvement_officer: {
    summary: 'Work with teams to improve how a service operates.',
    activities: ['Look at feedback, processes and performance information.', 'Work out where a problem is happening.', 'Try improvements and check what changed.'],
    detail: 'This can involve examining data, talking with staff, explaining recommendations and following up agreed changes. It is not only coming up with ideas: showing whether a change worked is part of the work.',
  },
  programme_implementation_officer: {
    summary: 'Help a planned project or change happen in practice.',
    activities: ['Coordinate tasks, people and deadlines.', 'Track progress and raise problems that need a decision.', 'Keep people informed as the change is introduced.'],
    detail: 'A substantial part can be planning, meetings, written updates and following up actions. The subject of the project varies, so we would check individual vacancies for the knowledge and experience they require.',
  },
  service_delivery_manager: {
    summary: 'Take responsibility for the day-to-day delivery of a service.',
    activities: ['Coordinate people and resources.', 'Monitor service standards and performance.', 'Deal with problems and agree improvements.'],
    detail: 'This may retain some of the operational pressure and escalation responsibility you know from management. The team size, line-management duties, customer contact and hours need checking in each vacancy.',
  },
  apprenticeship_skills_coach: {
    summary: 'Support apprentices as they develop skills and work towards a qualification.',
    activities: ['Hold coaching and progress conversations.', 'Help learners plan their work and gather evidence.', 'Liaise with employers and prepare learners for assessment.'],
    detail: 'Alongside coaching, there can be progress records and assessment-related work. We would check the subject expertise and any teaching or assessing qualifications each vacancy asks for.',
  },
  quality_performance_officer: {
    summary: 'Use standards and performance information to identify where work needs improving.',
    activities: ['Review measures, checks or audit findings.', 'Identify gaps and explain what the evidence shows.', 'Track improvement actions with the relevant teams.'],
    detail: 'This may involve more analysis, documentation and follow-up than direct training. The standards and technical knowledge differ between services and employers.',
  },
}

export function updateRoleReaction(items: RoleReaction[], roleId: string, patch: Partial<RoleReaction>) {
  const existing = items.find(item => item.roleId === roleId)
  const updated = { roleId, titleReaction: '', descriptionReaction: '', revealed: false, ...existing, ...patch }
  return existing ? items.map(item => item.roleId === roleId ? updated : item) : [...items, updated]
}

export function roleInterestGroup(item: RoleReaction) {
  const value = item.titleReaction || item.descriptionReaction
  if (value === 'would_click') return 'interested'
  if (value === 'maybe_click') return 'maybe'
  if (value === 'need_detail' || value === 'unclear_title') return 'clarify'
  if (value === 'would_skip') return 'not_for_now'
  return 'unanswered'
}
