(() => {
  const form = document.getElementById('onboarding-form');
  const steps = [...document.querySelectorAll('.form-step')];
  const stepItems = [...document.querySelectorAll('#step-list li')];
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const saveState = document.getElementById('save-state');
  const errorSummary = document.getElementById('error-summary');
  const storageKey = 'sabi-onboarding-cl-2026-001-v1';
  const config = window.SABI_ONBOARDING_CONFIG || {};
  let current = 0;
  let saveTimer;

  const makeId = () => window.crypto?.randomUUID?.() || `CL-2026-001-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  document.getElementById('submission-id').value = makeId();

  function serialise() {
    const data = {};
    for (const el of form.elements) {
      if (!el.name || el.type === 'file' || el.name === 'company') continue;
      if (el.type === 'checkbox') {
        if (!data[el.name]) data[el.name] = [];
        if (el.checked) data[el.name].push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else data[el.name] = el.value;
    }
    return { data, current, savedAt: new Date().toISOString() };
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(serialise()));
    saveState.textContent = `Saved on this device at ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  }

  function scheduleSave() {
    saveState.textContent = 'Saving…'; clearTimeout(saveTimer); saveTimer = setTimeout(save, 350);
  }

  function restore() {
    try {
      const draft = JSON.parse(localStorage.getItem(storageKey)); if (!draft?.data) return;
      for (const [name, value] of Object.entries(draft.data)) {
        const fields = [...form.elements].filter(el => el.name === name);
        fields.forEach(el => {
          if (el.type === 'checkbox') el.checked = Array.isArray(value) && value.includes(el.value);
          else if (el.type === 'radio') el.checked = value === el.value;
          else el.value = value;
        });
      }
      current = Math.min(Number(draft.current) || 0, steps.length - 1);
      saveState.textContent = `Draft restored from ${new Date(draft.savedAt).toLocaleString()}`;
    } catch { localStorage.removeItem(storageKey); }
  }

  function updateConditional() {
    const eligible = form.elements.ageEligible.value;
    document.getElementById('under-16').classList.toggle('hidden', eligible !== 'no');
    const gate = form.elements.accessibilityGate.value;
    const details = document.getElementById('accessibility-details');
    details.classList.toggle('hidden', gate !== 'yes');
    const consent = form.elements.specialCategoryConsent;
    form.elements.accessibilityNeeds.disabled = gate !== 'yes' || !consent.checked;
    const deadline = form.elements.deadline.value;
    let urgent = false;
    if (deadline) {
      const date = new Date(`${deadline}T12:00:00`); const cursor = new Date(); let days = 0;
      while (cursor < date && days <= 10) { cursor.setDate(cursor.getDate() + 1); if (![0,6].includes(cursor.getDay())) days++; }
      urgent = date >= new Date() && days <= 10;
    }
    document.getElementById('urgent-warning').classList.toggle('hidden', !urgent);
  }

  function showStep(index) {
    current = index; steps.forEach((step, i) => step.classList.toggle('active', i === current));
    stepItems.forEach((item, i) => { item.classList.toggle('active', i === current); item.classList.toggle('done', i < current); });
    progressBar.style.width = `${((current + 1) / steps.length) * 100}%`;
    progressText.textContent = `Step ${current + 1} of ${steps.length}`;
    previous.hidden = current === 0; next.hidden = current === steps.length - 1;
    if (current === steps.length - 1) buildReview();
    errorSummary.classList.add('hidden'); updateConditional(); scheduleSave();
    document.querySelector('.form-shell').scrollIntoView({behavior:'smooth', block:'start'});
  }

  function validateStep() {
    const fields = [...steps[current].querySelectorAll('[required]')].filter(el => !el.disabled);
    const invalid = fields.filter(el => !el.checkValidity());
    const ageNo = current === 0 && form.elements.ageEligible.value === 'no';
    if (ageNo) { errorSummary.innerHTML = '<strong>This route is available from age 16.</strong><br>Please use the signposting above.'; errorSummary.classList.remove('hidden'); errorSummary.focus(); return false; }
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    if (!invalid.length) return true;
    invalid.forEach(el => el.classList.add('invalid'));
    errorSummary.innerHTML = `<strong>Please check this step.</strong><br>${invalid.length === 1 ? 'One required answer is missing or incomplete.' : `${invalid.length} required answers are missing or incomplete.`}`;
    errorSummary.classList.remove('hidden'); errorSummary.focus(); return false;
  }

  function buildReview() {
    const f = form.elements;
    const text = value => value && String(value).trim() ? String(value).trim() : 'Not provided yet';
    const values = [
      ['Client', `${text(f.firstName.value)} ${text(f.lastName.value)}`], ['Email', text(f.email.value)],
      ['Package', 'Bespoke Career Partner · £135'], ['Broad direction', text(f.broadDirection.value)],
      ['Targeted documents', text(f.targetedDocuments.value)], ['Preferred contact', text(f.preferredContact.value)],
      ['Consultation', text(f.consultationRoute.value)], ['Deadline', text(f.deadline.value)],
      ['Files selected', [...form.querySelectorAll('input[type=file]')].filter(x => x.files.length).map(x => x.files[0].name).join(', ') || 'None']
    ];
    document.getElementById('review-summary').innerHTML = `<dl>${values.map(([k,v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}</dl>`;
  }

  const escapeHtml = value => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const readFile = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });

  async function payload() {
    const draft = serialise(); const files = [];
    for (const input of form.querySelectorAll('input[type=file]')) {
      const file = input.files[0]; if (!file) continue;
      const ext = file.name.split('.').pop().toLowerCase();
      if (file.size > config.maxFileBytes || !config.acceptedExtensions.includes(ext)) throw new Error(`${file.name} is not an accepted file or is larger than 8 MB.`);
      files.push({ field: input.name, name: file.name, type: file.type || 'application/octet-stream', size: file.size, base64: await readFile(file) });
    }
    return {...draft.data, files, submittedAt: new Date().toISOString(), userAgent: navigator.userAgent};
  }

  form.addEventListener('input', () => { updateConditional(); scheduleSave(); });
  form.addEventListener('change', () => { updateConditional(); scheduleSave(); });
  next.addEventListener('click', () => { if (validateStep()) showStep(current + 1); });
  previous.addEventListener('click', () => showStep(current - 1));
  document.getElementById('download-draft').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(serialise(), null, 2)], {type:'application/json'}); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'SABI-CL-2026-001-onboarding-backup.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  document.getElementById('clear-draft').addEventListener('click', () => { if (confirm('Clear all answers saved on this device? This cannot be undone.')) { localStorage.removeItem(storageKey); form.reset(); document.getElementById('submission-id').value = makeId(); showStep(0); } });

  form.addEventListener('submit', async event => {
    event.preventDefault(); if (!validateStep()) return;
    const button = form.querySelector('[type=submit]'); const message = document.getElementById('submit-message');
    if (!config.endpoint) { message.textContent = 'The secure submission connection is not live yet. Your answers remain saved on this device; please do not send real documents until Sam confirms the page is ready.'; message.classList.remove('hidden'); message.focus(); return; }
    button.disabled = true; button.textContent = 'Sending securely…';
    try {
      const body = await payload();
      await fetch(config.endpoint, {method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(body)});
      localStorage.removeItem(storageKey);
      location.assign(`${config.confirmationUrl}?submission=${encodeURIComponent(body.submissionId)}`);
    } catch (error) {
      message.textContent = error.message || 'The form could not be sent. Your answers are still saved on this device. Please try again.'; message.classList.remove('hidden'); message.focus();
      button.disabled = false; button.textContent = 'Send my onboarding';
    }
  });

  restore(); updateConditional(); showStep(current);
})();
