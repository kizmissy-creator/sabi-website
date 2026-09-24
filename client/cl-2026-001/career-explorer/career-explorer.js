const STORAGE_KEY = 'sabi:cl-2026-001:career-explorer:v1';

const reactions = [
  { id: 'see-myself', emoji: '❤️', label: 'I could see myself doing this' },
  { id: 'know-more', emoji: '👀', label: 'I want to know more' },
  { id: 'intimidating', emoji: '😬', label: 'Interesting but intimidating' },
  { id: 'can-not-want', emoji: '😐', label: 'I could do it, but I don’t want to' },
  { id: 'no', emoji: '🚫', label: 'Definitely not' },
];

const groups = [
  {
    id: 'people',
    title: 'Developing people',
    intro: 'Roles where helping people, managers and organisations grow is central to the job.',
    cards: [
      {
        id: 'training-quality',
        title: 'Training, Quality & Performance',
        summary: 'Help people perform well, understand why standards slip, and use training plus performance information to improve results.',
        bullets: ['Spot performance gaps', 'Create or adapt training', 'Coach managers and teams', 'Check whether improvement actually happened'],
        existing: 'Regional manager training, KPI work, audits, service improvement, coaching, development plans, Excel reporting and standards work.',
        new: 'Formal learning evaluation, training-needs analysis and organisation-specific quality frameworks.',
        downside: 'Documentation, repeat training, resistance to change and responsibility for performance without always managing the people involved.'
      },
      {
        id: 'learning-development',
        title: 'Learning & Development / Workforce Development',
        summary: 'Make developing people the main job rather than something fitted around running the operation.',
        bullets: ['Identify learning needs', 'Design and deliver development', 'Coach employees and managers', 'Build capability across teams'],
        existing: 'Buddy Trainer experience, regional supervisor/assistant training, coaching, PDPs, apprentice support and management upskilling.',
        new: 'Formal L&D language, learning systems, structured programme design and evaluation methods.',
        downside: 'Some roles can become training administration, scheduling and chasing rather than creative development.'
      },
      {
        id: 'organisational-development',
        title: 'Organisational Development / Talent Development',
        summary: 'Improve how an organisation develops managers, builds capability, supports progression and creates a high-performing culture.',
        bullets: ['Develop managers', 'Improve progression routes', 'Work on culture and engagement', 'Build organisation-wide capability'],
        existing: 'Management development, promotions, coaching, cross-site learning, people-centred leadership and practical change work.',
        new: 'OD models, succession/talent planning, workforce strategy, culture diagnostics and often some HR/CIPD knowledge.',
        downside: 'Slower, more abstract change, organisational politics and lots of influence without direct control.'
      },
      {
        id: 'apprenticeship-coach',
        title: 'Apprenticeship Skills Coach / Vocational Learning',
        summary: 'Use your industry experience to coach learners through qualifications, workplace development and assessment.',
        bullets: ['One-to-one coaching', 'Review learner progress', 'Support assessment and EPA', 'Help people turn learning into workplace capability'],
        existing: 'Recent Level 4 apprenticeship, peer apprentice support, EPA support, coaching and extensive hospitality management experience.',
        new: 'Apprenticeship standards, safeguarding, Prevent, assessment practice and possibly an assessor qualification.',
        downside: 'Caseloads, progress records, chasing learners and employer release time can create a different kind of pressure.'
      },
      {
        id: 'early-careers',
        title: 'Early Careers / Apprenticeship & Talent Programmes',
        summary: 'Bring together recruitment, onboarding, development and education partnerships to help people enter and progress in work.',
        bullets: ['Recruit trainees or apprentices', 'Work with colleges/providers', 'Coordinate induction and development', 'Track progression and retention'],
        existing: 'Recruitment days, interviewing, hiring, onboarding, apprentice support, promotions and college careers engagement.',
        new: 'Programme reporting, early-careers recruitment cycles, apprenticeship funding and formal talent-programme structures.',
        downside: 'Busy recruitment periods, programme administration and lots of coordination between learners, managers and providers.'
      },
      {
        id: 'people-operations',
        title: 'People Operations / Employee Experience',
        summary: 'Support the employee journey across recruitment, onboarding, absence, wellbeing, development and people processes.',
        bullets: ['Support recruitment and onboarding', 'Help managers with people processes', 'Improve employee experience', 'Support development and retention'],
        existing: 'Shortlisting, interviewing, hiring, absence reviews, RTW, welfare, investigations, disciplinaries, grievances and development.',
        new: 'Employment law, HR systems, formal policy, data protection and potentially CIPD knowledge.',
        downside: 'Confidential casework, policies, documentation and emotionally difficult employee situations.'
      }
    ]
  },
  {
    id: 'improvement',
    title: 'Improving things',
    intro: 'Roles built around understanding why something is not working and making it better.',
    cards: [
      {
        id: 'service-improvement',
        title: 'Service / Business Improvement',
        summary: 'Figure out why a service is underperforming, design practical changes and check whether they worked.',
        bullets: ['Analyse performance', 'Find root causes', 'Design improvement plans', 'Measure results'],
        existing: 'Service-score recovery, stock-loss improvement, forecasting, KPI analysis, regional comparison and cross-site interventions.',
        new: 'Formal process mapping, improvement governance, project language and possibly Power BI or Lean methods.',
        downside: 'Meetings, bureaucracy, slower decisions and having influence without always being able to implement the fix yourself.'
      },
      {
        id: 'operational-excellence',
        title: 'Operational Excellence / Continuous Improvement',
        summary: 'Make operations more efficient, consistent, reliable and easier for people to deliver well.',
        bullets: ['Reduce waste and inefficiency', 'Improve processes', 'Standardise good practice', 'Use data to prove improvement'],
        existing: 'Forecasting within tolerance, labour control, stock-loss investigation, waste/cost KPIs, standards and manager capability.',
        new: 'Lean, Six Sigma, Kaizen, value-stream/process mapping and formal continuous-improvement methods.',
        downside: 'Can become very cost-focused or numbers-heavy in the wrong culture.'
      },
      {
        id: 'customer-insight',
        title: 'Customer Insight / Customer Experience Improvement',
        summary: 'Use customer feedback, ratings and performance patterns to understand what customers experience and what should change.',
        bullets: ['Analyse feedback', 'Look for patterns', 'Investigate customer pain points', 'Turn insight into recommendations'],
        existing: 'Customer KPIs, ratings, missing items, rider waits, Looker trends, regional comparison and service-improvement work.',
        new: 'Research methods, surveys, interviews, journey mapping and more formal insight analysis.',
        downside: 'Desk-heavy analysis, research cycles and frustration if recommendations are not implemented.'
      },
      {
        id: 'service-design',
        title: 'Service Design / User-Centred Improvement',
        summary: 'Understand an entire service from the user and employee perspective, then redesign how the pieces fit together.',
        bullets: ['Map user journeys', 'Find pain points', 'Run workshops', 'Prototype and test better services'],
        existing: 'Design/innovation degree, practical creativity, information redesign, operational problem solving and adapting systems around people.',
        new: 'User-centred design, service blueprints, research, prototyping, accessibility, Agile and often GDS methods.',
        downside: 'This is a real retraining route, with a higher entry barrier and more research/design methodology to learn.'
      }
    ]
  },
  {
    id: 'change',
    title: 'Making change happen',
    intro: 'Roles where the challenge is getting ideas, standards and improvements adopted across people and places.',
    cards: [
      {
        id: 'programme-implementation',
        title: 'Programme / Implementation / Change',
        summary: 'Turn a plan into reality across teams, sites and stakeholders, making sure people actually adopt the change.',
        bullets: ['Turn plans into actions', 'Coordinate teams', 'Solve implementation problems', 'Track progress and adoption'],
        existing: 'Regional H&S change, Off-Premise rollout, multi-site training, manager meetings and practical implementation.',
        new: 'Formal project plans, risks/issues, milestones, stakeholder mapping and change frameworks.',
        downside: 'Meetings, chasing actions, shifting deadlines and responsibility without authority over everyone involved.'
      },
      {
        id: 'employee-engagement',
        title: 'Employee Engagement / Internal & Change Communications',
        summary: 'Help employees understand change, find the information they need and feel connected to what the organisation is doing.',
        bullets: ['Simplify complex information', 'Gather employee feedback', 'Support change communication', 'Improve how managers communicate'],
        existing: 'Information booklets, briefings, regional meetings, training, safety updates and simplifying audit information.',
        new: 'Communication planning, employee surveys, internal channels, formal engagement measurement and senior comms.',
        downside: 'Writing, approvals, politics and sometimes communicating decisions you did not make.'
      },
      {
        id: 'multi-site-coach',
        title: 'Multi-site Performance / Operations Coach',
        summary: 'Support several managers or sites to perform better instead of personally running one location every day.',
        bullets: ['Visit different sites', 'Coach managers', 'Compare performance', 'Spread best practice'],
        existing: '11-site regional support, H&S lead work, Off-Premise KPI improvement and regional manager development.',
        new: 'More formal coaching, regional reporting and influencing managers without direct authority.',
        downside: 'Travel, managers ignoring advice and target-heavy field roles masquerading as coaching.'
      }
    ]
  },
  {
    id: 'operations',
    title: 'Running and supporting organisations',
    intro: 'Roles that keep more of your operational responsibility but change the setting, scale or type of ownership.',
    cards: [
      {
        id: 'service-delivery',
        title: 'Service Delivery / Operational Management',
        summary: 'Run a complex service outside hospitality, keeping responsibility, leadership, performance and problem-solving.',
        bullets: ['Own service performance', 'Plan people and resources', 'Develop managers', 'Improve delivery'],
        existing: '£74k–£105k weekly operation, teams up to 26, forecasting, budgets, recruitment, people management and GM cover.',
        new: 'Mostly sector-specific systems, regulation and service knowledge rather than management fundamentals.',
        downside: 'A poor role could recreate the same firefighting, staffing pressure and impossible KPIs with a different logo.'
      }
    ]
  }
];

const cards = groups.flatMap((group) => group.cards.map((card) => ({ ...card, groupId: group.id })));

const state = loadState();
let currentIndex = Number.isInteger(state.currentIndex) ? Math.min(state.currentIndex, cards.length - 1) : 0;
let detailsOpen = false;

const introScreen = document.getElementById('introScreen');
const explorerScreen = document.getElementById('explorerScreen');
const checkpointScreen = document.getElementById('checkpointScreen');
const summaryScreen = document.getElementById('summaryScreen');
const cardStage = document.getElementById('cardStage');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');

document.getElementById('startButton').addEventListener('click', () => {
  state.started = true;
  saveState();
  showExplorer();
});

document.getElementById('backButton').addEventListener('click', () => {
  if (currentIndex === 0) return showIntro();
  currentIndex -= 1;
  state.currentIndex = currentIndex;
  saveState();
  detailsOpen = false;
  renderCard();
});

document.getElementById('nextButton').addEventListener('click', () => {
  if (!state.reactions[cards[currentIndex].id]) {
    const zone = document.querySelector('.reaction-zone');
    zone?.classList.add('needs-answer');
    zone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  if (currentIndex === cards.length - 1) return showSummary();

  const leavingGroup = cards[currentIndex].groupId !== cards[currentIndex + 1].groupId;
  currentIndex += 1;
  state.currentIndex = currentIndex;
  saveState();
  detailsOpen = false;

  if (leavingGroup) showCheckpoint();
  else renderCard();
});

document.getElementById('reviewButton').addEventListener('click', () => {
  currentIndex = 0;
  state.currentIndex = 0;
  saveState();
  showExplorer();
});

document.getElementById('saveButton').addEventListener('click', () => {
  state.finalNote = document.getElementById('finalNote').value.trim();
  state.completedAt = new Date().toISOString();
  saveState();
  document.getElementById('saveMessage').textContent = 'Saved on this device. You can come back and change anything.';
});

document.querySelectorAll('[data-checkpoint]').forEach((button) => {
  button.addEventListener('click', () => {
    state.checkpoints[cards[currentIndex - 1]?.groupId || 'unknown'] = button.dataset.checkpoint;
    saveState();
    showExplorer();
  });
});

if (state.started) showExplorer();
else showIntro();

function showIntro() {
  introScreen.classList.remove('hidden');
  explorerScreen.classList.add('hidden');
  checkpointScreen.classList.add('hidden');
  summaryScreen.classList.add('hidden');
  updateProgress();
}

function showExplorer() {
  introScreen.classList.add('hidden');
  explorerScreen.classList.remove('hidden');
  checkpointScreen.classList.add('hidden');
  summaryScreen.classList.add('hidden');
  renderCard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showCheckpoint() {
  introScreen.classList.add('hidden');
  explorerScreen.classList.add('hidden');
  checkpointScreen.classList.remove('hidden');
  summaryScreen.classList.add('hidden');

  const completed = cards.slice(0, currentIndex);
  const positive = completed.filter(c => ['see-myself','know-more','intimidating'].includes(state.reactions[c.id]));
  const strongestGroup = findStrongestGroup(positive);
  const label = groups.find(g => g.id === strongestGroup)?.title.toLowerCase() || 'a few different directions';

  document.getElementById('checkpointText').textContent =
    positive.length
      ? `So far, you seem most curious about work connected with ${label}. Does that feel roughly right?`
      : 'So far, you seem quite selective. That is useful too. Does the process still feel like it is showing you meaningful differences between the jobs?';

  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showSummary() {
  introScreen.classList.add('hidden');
  explorerScreen.classList.add('hidden');
  checkpointScreen.classList.add('hidden');
  summaryScreen.classList.remove('hidden');
  renderSummary();
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCard() {
  const card = cards[currentIndex];
  const group = groups.find(g => g.id === card.groupId);
  document.getElementById('groupTitle').textContent = group.title;
  document.getElementById('groupIntro').textContent = group.intro;
  document.getElementById('groupEyebrow').textContent = `Career world · ${groups.indexOf(group) + 1} of ${groups.length}`;

  cardStage.innerHTML = `
    <article class="career-card">
      <div class="card-main">
        <div class="card-counter">Career ${currentIndex + 1} of ${cards.length}</div>
        <h2>${escapeHtml(card.title)}</h2>
        <p class="plain-summary">${escapeHtml(card.summary)}</p>
        <ul class="quick-list">${card.bullets.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        <button class="detail-toggle" type="button" aria-expanded="false">What would this actually look like?</button>
        <div class="detail-panel hidden">
          <div class="detail-grid">
            <div class="detail-box">
              <h3>What you already have</h3>
              <p>${escapeHtml(card.existing)}</p>
            </div>
            <div class="detail-box">
              <h3>What would be new</h3>
              <p>${escapeHtml(card.new)}</p>
            </div>
            <div class="detail-box">
              <h3>What might annoy you</h3>
              <p>${escapeHtml(card.downside)}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="reaction-zone">
        <h3>Gut reaction. Don’t worry about whether you’re qualified enough.</h3>
        <div class="reaction-grid">
          ${reactions.map(reaction => `
            <button
              type="button"
              class="reaction-button ${state.reactions[card.id] === reaction.id ? 'selected' : ''}"
              data-reaction="${reaction.id}"
              aria-pressed="${state.reactions[card.id] === reaction.id}"
            >
              <span class="reaction-emoji" aria-hidden="true">${reaction.emoji}</span>
              <span class="reaction-label">${escapeHtml(reaction.label)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </article>
  `;

  const detailToggle = cardStage.querySelector('.detail-toggle');
  const detailPanel = cardStage.querySelector('.detail-panel');
  detailToggle.addEventListener('click', () => {
    detailsOpen = !detailsOpen;
    detailPanel.classList.toggle('hidden', !detailsOpen);
    detailToggle.setAttribute('aria-expanded', String(detailsOpen));
    detailToggle.textContent = detailsOpen ? 'Hide the detail' : 'What would this actually look like?';
  });

  cardStage.querySelectorAll('[data-reaction]').forEach((button) => {
    button.addEventListener('click', () => {
      state.reactions[card.id] = button.dataset.reaction;
      saveState();
      renderCard();
    });
  });

  document.getElementById('backButton').textContent = currentIndex === 0 ? 'Back to intro' : 'Back';
  document.getElementById('nextButton').textContent = currentIndex === cards.length - 1 ? 'See my career map' : 'Next';
  updateProgress();
}

function renderSummary() {
  const buckets = [
    { id: 'strong', title: 'Most interesting', reactionIds: ['see-myself'] },
    { id: 'curious', title: 'Worth exploring', reactionIds: ['know-more', 'intimidating'] },
    { id: 'not-for-me', title: 'Probably not for me', reactionIds: ['can-not-want', 'no'] },
  ];

  document.getElementById('summaryBuckets').innerHTML = buckets.map(bucket => {
    const matches = cards.filter(card => bucket.reactionIds.includes(state.reactions[card.id]));
    return `
      <section class="summary-bucket">
        <h2>${bucket.title}</h2>
        ${matches.length
          ? `<ul>${matches.map(card => `<li>${escapeHtml(card.title)}</li>`).join('')}</ul>`
          : '<p>Nothing here yet.</p>'}
      </section>
    `;
  }).join('');

  const eligible = cards.filter(card => ['see-myself', 'know-more', 'intimidating'].includes(state.reactions[card.id]));
  document.getElementById('shortlistChoices').innerHTML = eligible.map(card => `
    <label class="shortlist-option">
      <input type="checkbox" value="${card.id}" ${state.shortlist.includes(card.id) ? 'checked' : ''}>
      <span>${escapeHtml(card.title)}</span>
    </label>
  `).join('') || '<p>No careers are in your explore pile yet. You can go back and change any reaction.</p>';

  document.getElementById('shortlistChoices').querySelectorAll('input').forEach((input) => {
    input.addEventListener('change', () => {
      const selected = [...document.querySelectorAll('#shortlistChoices input:checked')].map(el => el.value);
      if (selected.length > 3) {
        input.checked = false;
        return;
      }
      state.shortlist = selected;
      saveState();
    });
  });

  document.getElementById('finalNote').value = state.finalNote || '';
}

function updateProgress() {
  const answered = Object.keys(state.reactions).filter(id => cards.some(card => card.id === id)).length;
  progressText.textContent = `${answered} of ${cards.length} explored`;
  progressBar.style.width = `${(answered / cards.length) * 100}%`;
}

function findStrongestGroup(list) {
  const counts = {};
  list.forEach(card => counts[card.groupId] = (counts[card.groupId] || 0) + 1);
  return Object.entries(counts).sort((a,b) => b[1] - a[1])[0]?.[0] || null;
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      started: Boolean(parsed.started),
      currentIndex: parsed.currentIndex || 0,
      reactions: parsed.reactions || {},
      checkpoints: parsed.checkpoints || {},
      shortlist: Array.isArray(parsed.shortlist) ? parsed.shortlist : [],
      finalNote: parsed.finalNote || '',
      completedAt: parsed.completedAt || null,
    };
  } catch {
    return { started: false, currentIndex: 0, reactions: {}, checkpoints: {}, shortlist: [], finalNote: '', completedAt: null };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}