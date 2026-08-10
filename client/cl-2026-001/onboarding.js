(() => {
  const form = document.getElementById('onboarding-form');
  const steps = [...document.querySelectorAll('.form-step')];
  const stepItems = [...document.querySelectorAll('#step-list li')];
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const stepMenuToggle = document.getElementById('step-menu-toggle');
  const stepList = document.getElementById('step-list');
  const saveState = document.getElementById('save-state');
  const errorSummary = document.getElementById('error-summary');
  const storageKey = 'sabi-onboarding-cl-2026-001-v23';
  const config = window.SABI_ONBOARDING_CONFIG || {};
  const repeaterNames = ['employmentHistory', 'employmentGaps', 'qualifications', 'exampleOpportunities'];
  const defaultResultDetails = { label: 'Result or status', prompt: 'Choose result or status', options: ['Distinction', 'Merit', 'Pass', 'Completed', 'In progress', 'No grade or result applies', 'Not sure', 'Other'] };
  const qualificationResultDetails = {
    'GCSE or equivalent': { label: 'Grade or result', prompt: 'Choose grade or result', options: ['9', '8', '7', '6', '5', '4', '3', '2', '1', 'A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U', 'Pass', 'In progress', 'Not sure'] },
    'A level or equivalent': { label: 'Grade or result', prompt: 'Choose grade or result', options: ['A*', 'A', 'B', 'C', 'D', 'E', 'U', 'Pass', 'In progress', 'Not sure'] },
    'BTEC': { label: 'Grade or result', prompt: 'Choose grade or result', options: ['Distinction*', 'Distinction', 'Merit', 'Pass', 'In progress', 'Not sure'] },
    'T Level': { label: 'Grade or result', prompt: 'Choose grade or result', options: ['Distinction*', 'Distinction', 'Merit', 'Pass', 'In progress', 'Not sure'] },
    'NVQ or SVQ': { label: 'Outcome or status', prompt: 'Choose outcome or status', options: ['Competent', 'Pass', 'Completed', 'In progress', 'No grade or result applies', 'Not sure'] },
    'Apprenticeship': { label: 'Outcome or status', prompt: 'Choose outcome or status', options: ['Distinction', 'Merit', 'Pass', 'Completed', 'In progress', 'No grade or result applies', 'Not sure'] },
    'HNC or HND': { label: 'Grade or result', prompt: 'Choose grade or result', options: ['Distinction', 'Merit', 'Pass', 'In progress', 'Not sure'] },
    'Undergraduate degree': { label: 'Grade or result', prompt: 'Choose grade or result', options: ['First', 'Upper second (2:1)', 'Lower second (2:2)', 'Third', 'Pass', 'In progress', 'Not sure'] },
    'Postgraduate degree': { label: 'Grade or result', prompt: 'Choose grade or result', options: ['Distinction', 'Merit', 'Pass', 'In progress', 'Not sure'] },
    'Professional qualification': { label: 'Outcome or status', prompt: 'Choose outcome or status', options: ['Passed', 'Completed', 'In progress', 'Not yet taken', 'No grade or result applies', 'Not sure'] },
    'Licence or certificate': { label: 'Status', prompt: 'Choose status', options: ['Valid or current', 'Passed', 'Completed', 'In progress', 'Expired', 'No grade or result applies', 'Not sure'] },
    'Short course or training': { label: 'Status', prompt: 'Choose status', options: ['Completed', 'In progress', 'Attended', 'Passed', 'No grade or result applies', 'Not sure'] },
    'Not listed': defaultResultDetails
  };
  const renewableQualificationTypes = new Set(['Professional qualification', 'Licence or certificate', 'Short course or training']);
  let current = 0;
  let saveTimer;
  const voiceQuestionNames = ['hobbies', 'interests', 'caringStrengths', 'skillsExamples', 'proudOf'];
  const voiceRecordings = new Map();
  const voiceDatabaseName = 'sabi-onboarding-voice-cl-2026-001';
  const voiceStoreName = 'recordings';
  const maxVoiceSeconds = 180;
  let activeVoiceRecording = null;

  function openVoiceDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('Browser storage is not available.'));
      const request = indexedDB.open(voiceDatabaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(voiceStoreName, {keyPath: 'field'});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function useVoiceStore(mode, action) {
    const database = await openVoiceDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(voiceStoreName, mode);
        const request = action(transaction.objectStore(voiceStoreName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      database.close();
    }
  }

  const saveVoiceToBrowser = recording => useVoiceStore('readwrite', store => store.put(recording));
  const removeVoiceFromBrowser = field => useVoiceStore('readwrite', store => store.delete(field));
  const clearSavedVoice = () => useVoiceStore('readwrite', store => store.clear()).catch(() => {});

  function voiceFileExtension(type) {
    if (type.includes('ogg')) return 'ogg';
    if (type.includes('mp4')) return 'm4a';
    return 'webm';
  }

  function voiceTime(seconds) {
    const remaining = Math.max(0, maxVoiceSeconds - seconds);
    return `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
  }

  function renderVoiceRecording(field) {
    const controls = document.querySelector(`[data-voice-controls="${field}"]`);
    if (!controls) return;
    const recording = voiceRecordings.get(field);
    const audio = controls.querySelector('audio');
    const start = controls.querySelector('[data-voice-start]');
    const remove = controls.querySelector('[data-voice-delete]');
    const saveChoice = controls.querySelector('[data-voice-save]');
    if (audio.dataset.objectUrl) URL.revokeObjectURL(audio.dataset.objectUrl);
    audio.hidden = !recording;
    remove.hidden = !recording;
    saveChoice.closest('label').hidden = !recording;
    start.textContent = recording ? 'Record again' : 'Record an answer';
    if (recording) {
      const objectUrl = URL.createObjectURL(recording.blob);
      audio.src = objectUrl;
      audio.dataset.objectUrl = objectUrl;
      saveChoice.checked = Boolean(recording.saved);
    } else {
      audio.removeAttribute('src');
      delete audio.dataset.objectUrl;
      saveChoice.checked = false;
    }
  }

  function stopActiveVoiceRecording() {
    if (activeVoiceRecording?.recorder?.state === 'recording') activeVoiceRecording.recorder.stop();
  }

  function discardActiveVoiceRecording() {
    if (!activeVoiceRecording) return;
    activeVoiceRecording.discard = true;
    stopActiveVoiceRecording();
  }

  async function beginVoiceRecording(field) {
    const controls = document.querySelector(`[data-voice-controls="${field}"]`);
    const status = controls.querySelector('[data-voice-status]');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      status.textContent = 'Voice recording is not supported in this browser. You can still type your answer.';
      return;
    }
    if (activeVoiceRecording) {
      status.textContent = 'Please stop the other recording before starting this one.';
      return;
    }
    try {
      status.textContent = 'Waiting for microphone permission...';
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      const preferredTypes = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
      const mimeType = preferredTypes.find(type => MediaRecorder.isTypeSupported?.(type));
      const options = {audioBitsPerSecond: 64000};
      if (mimeType) options.mimeType = mimeType;
      let recorder;
      try { recorder = new MediaRecorder(stream, options); }
      catch { recorder = new MediaRecorder(stream); }
      const chunks = [];
      const startedAt = Date.now();
      const start = controls.querySelector('[data-voice-start]');
      const stop = controls.querySelector('[data-voice-stop]');
      const timer = controls.querySelector('[data-voice-timer]');
      start.hidden = true;
      stop.hidden = false;
      timer.textContent = voiceTime(0);
      status.textContent = 'Recording. You can stop whenever you have finished.';
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        const active = activeVoiceRecording;
        clearInterval(active?.interval);
        stream.getTracks().forEach(track => track.stop());
        const type = recorder.mimeType || chunks[0]?.type || 'audio/webm';
        const blob = new Blob(chunks, {type});
        activeVoiceRecording = null;
        start.hidden = false;
        stop.hidden = true;
        timer.textContent = voiceTime(0);
        if (active?.discard) {
          status.textContent = 'Recording discarded.';
          return;
        }
        if (!blob.size) {
          status.textContent = 'No audio was recorded. Please try again or type your answer.';
          return;
        }
        const previous = voiceRecordings.get(field);
        if (previous?.saved) await removeVoiceFromBrowser(field).catch(() => {});
        voiceRecordings.set(field, {
          field,
          blob,
          type,
          saved: false,
          name: `voice-${field}-${Date.now()}.${voiceFileExtension(type)}`
        });
        renderVoiceRecording(field);
        status.textContent = 'Recording ready. Listen back, record again or delete it.';
      };
      recorder.start(1000);
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        timer.textContent = voiceTime(elapsed);
        if (elapsed >= maxVoiceSeconds) stopActiveVoiceRecording();
      }, 250);
      activeVoiceRecording = {field, recorder, interval};
    } catch (error) {
      status.textContent = error?.name === 'NotAllowedError'
        ? 'Microphone access was not allowed. You can change the browser permission or type your answer.'
        : 'The microphone could not start. Please try again or type your answer.';
    }
  }

  function createVoiceControls() {
    voiceQuestionNames.forEach(field => {
      const textarea = form.elements[field];
      const card = textarea?.closest('.question-group');
      if (!card || card.querySelector('[data-voice-controls]')) return;
      const controls = document.createElement('details');
      controls.className = 'voice-answer';
      controls.dataset.voiceControls = field;
      controls.innerHTML = `<summary><span>Prefer to answer by voice?</span><small>Up to 3 minutes</small></summary><div class="voice-answer-body"><p class="voice-intro">Record an answer and listen back before sending.</p><div class="voice-actions"><button type="button" class="voice-button" data-voice-start>Record an answer</button><button type="button" class="voice-button voice-stop" data-voice-stop hidden>Stop recording</button><span class="voice-timer" data-voice-timer>3:00</span></div><p class="voice-status" data-voice-status aria-live="polite">Nothing is recorded yet.</p><audio controls preload="metadata" hidden></audio><div class="voice-recorded-actions"><button type="button" class="voice-delete" data-voice-delete hidden>Delete recording</button><label class="voice-save-choice" hidden><input type="checkbox" data-voice-save> Save this recording on this device so I can return to it later</label></div><p class="voice-privacy">If you do not choose to save it, the recording stays only in this open page. It uploads to SABI only when you send the completed form.</p></div>`;
      card.insertBefore(controls, card.querySelector('.prompt-help'));
      controls.querySelector('[data-voice-start]').addEventListener('click', () => beginVoiceRecording(field));
      controls.querySelector('[data-voice-stop]').addEventListener('click', stopActiveVoiceRecording);
      controls.querySelector('[data-voice-delete]').addEventListener('click', async () => {
        const recording = voiceRecordings.get(field);
        if (recording?.saved) await removeVoiceFromBrowser(field).catch(() => {});
        voiceRecordings.delete(field);
        renderVoiceRecording(field);
        controls.querySelector('[data-voice-status]').textContent = 'Recording deleted.';
      });
      controls.querySelector('[data-voice-save]').addEventListener('change', async event => {
        const recording = voiceRecordings.get(field);
        if (!recording) return;
        try {
          if (event.target.checked) {
            recording.saved = true;
            await saveVoiceToBrowser(recording);
            controls.querySelector('[data-voice-status]').textContent = 'Recording saved on this device.';
          } else {
            recording.saved = false;
            await removeVoiceFromBrowser(field);
            controls.querySelector('[data-voice-status]').textContent = 'Recording removed from browser storage. It remains in this open page.';
          }
        } catch {
          recording.saved = false;
          event.target.checked = false;
          controls.querySelector('[data-voice-status]').textContent = 'This browser could not save the recording. It remains in this open page.';
        }
      });
    });
  }

  async function restoreVoiceRecordings() {
    try {
      const saved = await useVoiceStore('readonly', store => store.getAll());
      saved.forEach(recording => {
        recording.saved = true;
        voiceRecordings.set(recording.field, recording);
        renderVoiceRecording(recording.field);
        const status = document.querySelector(`[data-voice-controls="${recording.field}"] [data-voice-status]`);
        if (status) status.textContent = 'Saved recording restored from this device.';
      });
    } catch {}
  }

  stepMenuToggle?.addEventListener('click', () => {
    const isOpen = stepMenuToggle.getAttribute('aria-expanded') === 'true';
    stepMenuToggle.setAttribute('aria-expanded', String(!isOpen));
    stepMenuToggle.firstChild.textContent = isOpen ? 'Show all steps ' : 'Hide all steps ';
    stepList?.classList.toggle('open', !isOpen);
  });

  const makeId = () => window.crypto?.randomUUID?.() || `CL-2026-001-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  document.getElementById('submission-id').value = makeId();

  function renumberEntries(name) {
    const cards = [...document.querySelector(`[data-repeater="${name}"]`).children];
    cards.forEach((card, index) => {
      const number = card.querySelector('[data-entry-number]');
      if (number) number.textContent = String(index + 1);
      const remove = card.querySelector('[data-remove-entry]');
      if (remove) remove.hidden = cards.length === 1;
    });
  }

  function addEntry(name, values = {}) {
    const container = document.querySelector(`[data-repeater="${name}"]`);
    const template = document.getElementById(`${name}-template`);
    if (!container || !template) return;
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelectorAll('[data-month-select]').forEach(select => {
      select.innerHTML = '<option value="">Month</option>' + ['January','February','March','April','May','June','July','August','September','October','November','December'].map(month => `<option>${month}</option>`).join('');
    });
    card.querySelectorAll('[data-year-select]').forEach(select => {
      const thisYear = new Date().getFullYear();
      select.innerHTML = '<option value="">Year</option>' + Array.from({length: 70}, (_, index) => thisYear - index).map(year => `<option>${year}</option>`).join('');
    });
    card.querySelectorAll('[data-completion-year-select]').forEach(select => {
      const thisYear = new Date().getFullYear();
      select.innerHTML = '<option value="">Choose year</option>' + Array.from({length: 81}, (_, index) => thisYear + 10 - index).map(year => `<option>${year}</option>`).join('');
    });
    card.querySelectorAll('[data-repeat-field]').forEach(field => {
      const value = values[field.dataset.repeatField];
      if (field.type === 'checkbox') field.checked = value === true || value === 'yes';
      else field.value = value || '';
    });
    if (name === 'qualifications') syncQualificationCard(card, values.grade || '');
    container.appendChild(card);
    renumberEntries(name);
    syncCurrentRoleCards();
    syncCurrentGapCards();
  }

  function collectRepeater(name) {
    if (name === 'employmentHistory' && document.getElementById('no-experience')?.checked) return [];
    return [...document.querySelector(`[data-repeater="${name}"]`).children].map(card => {
      const entry = {};
      card.querySelectorAll('[data-repeat-field]').forEach(field => {
        if (field.disabled) return;
        entry[field.dataset.repeatField] = field.type === 'checkbox' ? field.checked : field.value.trim();
      });
      return entry;
    }).filter(entry => Object.values(entry).some(value => value === true || (typeof value === 'string' && value.trim())));
  }

  function summariseEntry(entry, labels) {
    return labels.map(([key, label]) => entry[key] ? `${label}: ${entry[key]}` : '').filter(Boolean).join('; ');
  }

  function addCompatibilityFields(data) {
    const jobs = data.employmentHistory || [];
    const formatMonth = value => {
      if (!/^\d{4}-\d{2}$/.test(value || '')) return value || '';
      const [year, month] = value.split('-').map(Number);
      return new Intl.DateTimeFormat('en-GB', {month:'long', year:'numeric'}).format(new Date(year, month - 1, 1));
    };
    const datedJobs = jobs.map(entry => ({...entry, startDate: formatMonth(entry.startDate || [entry.startMonth, entry.startYear].filter(Boolean).join(' ')), endDate: entry.current ? 'Current' : formatMonth(entry.endDate || [entry.endMonth, entry.endYear].filter(Boolean).join(' '))}));
    data.currentRole = datedJobs[0] ? summariseEntry(datedJobs[0], [['experienceType','Type'],['jobTitle','Role'],['organisation','Organisation'],['startDate','Start'],['endDate','End']]) : '';
    data.workHistory = datedJobs.map(entry => summariseEntry(entry, [['experienceType','Type'],['jobTitle','Role'],['organisation','Organisation'],['startDate','Start'],['endDate','End'],['responsibilities','Responsibilities'],['evidence','What went well'],['reasonForLeaving','Reason for leaving or finishing']])).join('\n\n');
    data.employmentGapsSummary = (data.employmentGaps || []).map(entry => summariseEntry({...entry, startDate: formatMonth(entry.startDate), endDate: entry.current ? 'Ongoing' : formatMonth(entry.endDate)}, [['startDate','Start'],['endDate','End'],['reason','Reason']])).join('\n');
    data.qualificationsSummary = (data.qualifications || []).map(entry => summariseEntry({...entry, expiry: formatMonth(entry.expiry)}, [['qualificationType','Type'],['subject','Subject or course'],['grade','Grade, result or status'],['completionYear','Completion year'],['provider','Provider'],['expiry','Expiry']])).join('\n');
    data.skills = cleanSummary_([Array.isArray(data.strengthAttributes) ? data.strengthAttributes.join(', ') : '', data.selfStrengths, data.skillsExamples, data.interests, data.hobbies, data.caringStrengths]);
    data.achievementsSummary = data.proudOf || '';
    data.exampleJobs = (data.exampleOpportunities || []).map(entry => summariseEntry(entry, [['role','Role'],['organisation','Organisation'],['url','Link']])).join('\n');
    data.successOutcome = cleanSummary_([Array.isArray(data.successOutcomes) ? data.successOutcomes.filter(value => value !== 'other').join(', ') : '', data.successOutcomeOther]);
    return data;
  }

  function syncCurrentRoleCards() {
    document.querySelectorAll('[data-repeater="employmentHistory"] .repeat-card').forEach(card => {
      const currentField = card.querySelector('[data-repeat-field="current"]');
      const endFields = card.querySelectorAll('[data-repeat-field="endDate"], [data-repeat-field="endMonth"], [data-repeat-field="endYear"]');
      const endGroup = card.querySelector('[data-end-date-group]');
      if (!currentField || !endFields.length) return;
      if (endGroup) endGroup.hidden = currentField.checked;
      endFields.forEach(field => {
        field.disabled = currentField.checked;
        if (currentField.checked) field.value = '';
      });
    });
  }

  function syncCurrentGapCards() {
    document.querySelectorAll('[data-repeater="employmentGaps"] .repeat-card').forEach(card => {
      const currentField = card.querySelector('[data-repeat-field="current"]');
      const endField = card.querySelector('[data-repeat-field="endDate"]');
      const endGroup = card.querySelector('[data-gap-end-date]');
      if (!currentField || !endField) return;
      if (endGroup) endGroup.hidden = currentField.checked;
      endField.disabled = currentField.checked;
      if (currentField.checked) endField.value = '';
    });
  }

  function syncExperienceChoice() {
    const noExperience = document.getElementById('no-experience')?.checked;
    const area = document.getElementById('experience-entry-area');
    if (area) area.hidden = noExperience;
  }

  function syncQualificationCard(card, selectedGrade = '') {
    const typeField = card.querySelector('[data-repeat-field="qualificationType"]');
    const gradeField = card.querySelector('[data-grade-select]');
    const gradeLabel = card.querySelector('[data-grade-label]');
    const expiryGroup = card.querySelector('[data-expiry-field]');
    const expiryField = card.querySelector('[data-repeat-field="expiry"]');
    if (!typeField || !gradeField) return;
    const currentGrade = selectedGrade || gradeField.value;
    const details = qualificationResultDetails[typeField.value] || defaultResultDetails;
    const results = typeField.value ? details.options : [];
    if (gradeLabel) gradeLabel.textContent = typeField.value ? details.label : 'Grade, result or status';
    gradeField.disabled = !typeField.value;
    gradeField.innerHTML = `<option value="">${typeField.value ? details.prompt : 'Choose qualification type first'}</option>` + results.map(result => `<option>${result}</option>`).join('');
    gradeField.value = results.includes(currentGrade) ? currentGrade : '';
    const showExpiry = renewableQualificationTypes.has(typeField.value);
    expiryGroup?.classList.toggle('hidden', !showExpiry);
    if (expiryField) {
      expiryField.disabled = !showExpiry;
      if (!showExpiry) expiryField.value = '';
    }
  }

  function syncQualificationCards() {
    document.querySelectorAll('[data-repeater="qualifications"] .repeat-card').forEach(card => syncQualificationCard(card));
  }

  function cleanSummary_(values) {
    return values.filter(value => value && String(value).trim()).join('\n');
  }

  function setConditional(id, visible) {
    const element = document.getElementById(id);
    if (!element) return;
    element.classList.toggle('hidden', !visible);
    element.querySelectorAll('input, select, textarea').forEach(field => { field.disabled = !visible; });
  }

  function serialise() {
    const data = {};
    for (const el of form.elements) {
      if (!el.name || el.disabled || el.type === 'file' || el.name === 'company') continue;
      if (el.type === 'checkbox') {
        if (!data[el.name]) data[el.name] = [];
        if (el.checked) data[el.name].push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else data[el.name] = el.value;
    }
    repeaterNames.forEach(name => { data[name] = collectRepeater(name); });
    addCompatibilityFields(data);
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
      repeaterNames.forEach(name => {
        const container = document.querySelector(`[data-repeater="${name}"]`);
        container.replaceChildren();
        const entries = Array.isArray(draft.data[name]) && draft.data[name].length ? draft.data[name] : [{}];
        entries.forEach(entry => addEntry(name, entry));
      });
      for (const [name, value] of Object.entries(draft.data)) {
        const fields = [...form.elements].filter(el => el.name === name);
        fields.forEach(el => {
          if (el.type === 'checkbox') el.checked = Array.isArray(value) && value.includes(el.value);
          else if (el.type === 'radio') el.checked = value === el.value;
          else el.value = value;
        });
      }
      current = 0;
      saveState.textContent = `Draft restored from ${new Date(draft.savedAt).toLocaleString()}`;
    } catch { localStorage.removeItem(storageKey); }
  }

  function updateConditional() {
    const deadlineGate = form.elements.deadlineGate.value;
    setConditional('deadline-details', deadlineGate === 'yes');
    const deadline = deadlineGate === 'yes' ? form.elements.deadline.value : '';
    let urgent = false;
    if (deadline) {
      const date = new Date(`${deadline}T12:00:00`); const cursor = new Date(); let days = 0;
      while (cursor < date && days <= 10) { cursor.setDate(cursor.getDate() + 1); if (![0,6].includes(cursor.getDay())) days++; }
      urgent = date >= new Date() && days <= 10;
    }
    document.getElementById('urgent-warning').classList.toggle('hidden', !urgent);
    const situations = [...form.querySelectorAll('input[name="currentSituation"]:checked')].map(field => field.value);
    const gapSituationSelected = situations.some(value => ['not-working', 'returning'].includes(value));
    const hasEmploymentGap = document.getElementById('has-employment-gap')?.checked;
    const hourPatterns = [...form.querySelectorAll('input[name="hours"]:checked')].map(field => field.value);
    const difficultParts = [...form.querySelectorAll('input[name="difficultParts"]:checked')].map(field => field.value);
    const successOutcomes = [...form.querySelectorAll('input[name="successOutcomes"]:checked')].map(field => field.value);
    const showAccessibility = situations.includes('accessibility');
    const accessibilityPanel = document.getElementById('accessibility-details');
    const consent = form.elements.specialCategoryConsent;
    accessibilityPanel?.classList.toggle('hidden', !showAccessibility);
    if (consent) consent.disabled = !showAccessibility;
    accessibilityPanel?.querySelectorAll('[data-accessibility-detail]').forEach(field => {
      field.disabled = !showAccessibility || !consent?.checked;
    });
    const activeStepCount = steps.filter(step => !step.matches('[data-conditional-step].hidden')).length;
    progressBar.style.width = `${((current + 1) / activeStepCount) * 100}%`;
    progressText.textContent = `Step ${current + 1} of ${activeStepCount}`;
    setConditional('employment-gap-gate', !gapSituationSelected);
    setConditional('employment-gap-area', gapSituationSelected || hasEmploymentGap);
    setConditional('caring-strengths', situations.includes('caring'));
    setConditional('hours-other-detail', hourPatterns.includes('other'));
    setConditional('difficult-parts-other', difficultParts.includes('other'));
    setConditional('success-outcome-other', successOutcomes.includes('other'));
    syncCurrentRoleCards();
    syncCurrentGapCards();
    syncQualificationCards();
    syncExperienceChoice();
  }

  function showStep(index) {
    const activeSteps = steps.filter(step => !step.matches('[data-conditional-step].hidden'));
    const activeItems = stepItems.filter(item => !item.matches('[data-conditional-step].hidden'));
    current = Math.max(0, Math.min(index, activeSteps.length - 1));
    steps.forEach(step => step.classList.remove('active'));
    activeSteps[current].classList.add('active');
    stepItems.forEach(item => item.classList.remove('active', 'done'));
    activeItems.forEach((item, i) => { item.classList.toggle('active', i === current); item.classList.toggle('done', i < current); });
    const eyebrow = activeSteps[current].querySelector(':scope > .eyebrow');
    if (eyebrow) eyebrow.textContent = `STEP ${current + 1}`;
    progressBar.style.width = `${((current + 1) / activeSteps.length) * 100}%`;
    progressText.textContent = `Step ${current + 1} of ${activeSteps.length}`;
    previous.hidden = current === 0; next.hidden = current === activeSteps.length - 1;
    if (current === activeSteps.length - 1) buildReview();
    errorSummary.classList.add('hidden'); updateConditional(); scheduleSave();
    document.querySelector('.form-shell').scrollIntoView({behavior:'smooth', block:'start'});
  }

  stepItems.forEach((item, index) => {
    item.querySelector('button')?.addEventListener('click', () => {
      const activeSteps = steps.filter(step => !step.matches('[data-conditional-step].hidden'));
      const target = steps[index];
      const targetIndex = activeSteps.indexOf(target);
      if (targetIndex < 0) return;
      showStep(targetIndex);
      stepMenuToggle?.setAttribute('aria-expanded', 'false');
      stepMenuToggle && (stepMenuToggle.firstChild.textContent = 'Show all steps ');
      stepList?.classList.remove('open');
    });
  });

  function validateStep() {
    const activeSteps = steps.filter(step => !step.matches('[data-conditional-step].hidden'));
    const fields = [...activeSteps[current].querySelectorAll('[required]')].filter(el => !el.disabled);
    const invalid = fields.filter(el => !el.checkValidity());
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    if (!invalid.length) return true;
    invalid.forEach(el => el.classList.add('invalid'));
    errorSummary.innerHTML = `<strong>Please check this step.</strong><br>${invalid.length === 1 ? 'One required answer is missing or incomplete.' : `${invalid.length} required answers are missing or incomplete.`}`;
    errorSummary.classList.remove('hidden'); errorSummary.focus(); return false;
  }

  function buildReview() {
    const f = form.elements;
    const text = value => value && String(value).trim() ? String(value).trim() : 'Not provided yet';
    const data = serialise().data;
    const roles = data.employmentHistory.length ? data.employmentHistory.map(entry => [entry.jobTitle, entry.organisation].filter(Boolean).join(' at ') || entry.experienceType || 'Experience added').join('; ') : (document.getElementById('no-experience')?.checked ? 'No experience to add' : 'Not provided yet');
    const values = [
      ['Client', `${text(f.firstName.value)} ${text(f.lastName.value)}`], ['Email', text(f.email.value)],
      ['Package', 'Bespoke Career Partner · £135'], ['Broad direction', text(f.broadDirection.value)],
      ['Roles and experience', roles], ['Employment gaps', data.employmentGaps.length ? `${data.employmentGaps.length} added` : 'None added'], ['Qualifications added', String(data.qualifications.length)],
      ['Things you do well', data.skills || data.achievementsSummary ? 'Added' : 'Not provided yet'], ['Preferred contact', text(f.preferredContact.value)],
      ['Deadline', f.deadlineGate.value === 'yes' ? text(f.deadline.value) : (f.deadlineGate.value === 'no' ? 'No deadline' : (f.deadlineGate.value === 'not-sure' ? 'Not sure yet' : 'Not provided yet'))],
      ['Files selected', [...form.querySelectorAll('input[type=file]')].filter(x => x.files.length).map(x => x.files[0].name).join(', ') || 'None'],
      ['Voice answers', voiceRecordings.size ? `${voiceRecordings.size} recorded` : 'None']
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
    for (const recording of voiceRecordings.values()) {
      const ext = recording.name.split('.').pop().toLowerCase();
      if (recording.blob.size > config.maxFileBytes || !config.acceptedExtensions.includes(ext)) throw new Error('A voice answer is larger than 8 MB or is not in an accepted audio format. Delete it and record it again.');
      files.push({
        field: `voice_${recording.field}`,
        name: recording.name,
        type: recording.type || 'application/octet-stream',
        size: recording.blob.size,
        base64: await readFile(recording.blob)
      });
    }
    return {...draft.data, files, submittedAt: new Date().toISOString(), userAgent: navigator.userAgent};
  }

  form.addEventListener('input', event => {
    if (event.target.name === 'hours' && event.target.checked) {
      const noPreference = form.querySelector('input[name="hours"][value="no-preference"]');
      if (event.target.value === 'no-preference') form.querySelectorAll('input[name="hours"]:checked').forEach(field => { if (field !== event.target) field.checked = false; });
      else if (noPreference) noPreference.checked = false;
    }
    if (event.target.name === 'workplace' && event.target.checked) {
      const noPreference = form.querySelector('input[name="workplace"][value="no-preference"]');
      if (event.target.value === 'no-preference') form.querySelectorAll('input[name="workplace"]:checked').forEach(field => { if (field !== event.target) field.checked = false; });
      else if (noPreference) noPreference.checked = false;
    }
    if (event.target.name === 'difficultParts' && event.target.checked) {
      const notSure = form.querySelector('input[name="difficultParts"][value="not-sure"]');
      if (event.target.value === 'not-sure') form.querySelectorAll('input[name="difficultParts"]:checked').forEach(field => { if (field !== event.target) field.checked = false; });
      else if (notSure) notSure.checked = false;
    }
    updateConditional(); scheduleSave();
  });
  form.addEventListener('change', () => { updateConditional(); scheduleSave(); });
  document.querySelectorAll('[data-add-entry]').forEach(button => button.addEventListener('click', () => {
    addEntry(button.dataset.addEntry);
    scheduleSave();
  }));
  form.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-entry]');
    if (!button) return;
    const container = button.closest('[data-repeater]');
    button.closest('.repeat-card').remove();
    if (!container.children.length) addEntry(container.dataset.repeater);
    renumberEntries(container.dataset.repeater);
    scheduleSave();
  });
  next.addEventListener('click', () => { if (validateStep()) showStep(current + 1); });
  previous.addEventListener('click', () => showStep(current - 1));
  document.getElementById('download-draft').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(serialise(), null, 2)], {type:'application/json'}); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'SABI-CL-2026-001-onboarding-backup.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  document.getElementById('clear-draft').addEventListener('click', async () => { if (confirm('Clear all answers and recordings saved on this device? This cannot be undone.')) { discardActiveVoiceRecording(); localStorage.removeItem(storageKey); await clearSavedVoice(); voiceRecordings.clear(); voiceQuestionNames.forEach(renderVoiceRecording); form.reset(); repeaterNames.forEach(name => { document.querySelector(`[data-repeater="${name}"]`).replaceChildren(); addEntry(name); }); document.getElementById('submission-id').value = makeId(); showStep(0); } });

  form.addEventListener('submit', async event => {
    event.preventDefault(); if (!validateStep()) return;
    const button = form.querySelector('[type=submit]'); const message = document.getElementById('submit-message');
    if (!config.endpoint) { message.textContent = 'The secure submission connection is not live yet. Your answers remain saved on this device; please do not send real documents until SABI confirms the page is ready.'; message.classList.remove('hidden'); message.focus(); return; }
    button.disabled = true; button.textContent = 'Sending securely…';
    try {
      const body = await payload();
      const response = await fetch(config.endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok || result.submissionId !== body.submissionId) throw new Error(result.error || 'The form could not be confirmed as received. Your answers are still saved on this device. Please try again.');
      localStorage.removeItem(storageKey);
      await clearSavedVoice();
      location.assign(`${config.confirmationUrl}?submission=${encodeURIComponent(body.submissionId)}`);
    } catch (error) {
      message.textContent = error.message || 'The form could not be sent. Your answers are still saved on this device. Please try again.'; message.classList.remove('hidden'); message.focus();
      button.disabled = false; button.textContent = 'Send my onboarding';
    }
  });

  repeaterNames.forEach(name => addEntry(name));
  createVoiceControls();
  restoreVoiceRecordings();
  restore(); updateConditional(); showStep(current);
})();
