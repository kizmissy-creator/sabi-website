(() => {
  'use strict';

  const FORM_VERSION = 'cs-form-dev-2026-08';
  const AGE_WORDING_VERSION = 'age-route-2026-08-04';
  const BACKEND_URL = 'REPLACE_WITH_APPS_SCRIPT_EXEC_URL';
  const DEVELOPMENT_MODE = true;
  const FIELD_CONFIG = window.SABI_PHASE2_FIELD_CONFIG || {
    developmentOnly: true,
    contactMethods: [
      { value: 'email', label: 'Email' },
      { value: 'telephone', label: 'Telephone' },
      { value: 'sms', label: 'SMS where available' },
      { value: 'video', label: 'Video-meeting invitation' }
    ],
    lifeStageOptions: [
      { value: '', label: 'Select an option' },
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not-sure', label: 'Not sure' }
    ],
    employmentStatuses: [
      { value: 'employed', label: 'Employed' },
      { value: 'self-employed', label: 'Self-employed' },
      { value: 'studying', label: 'Studying or training' },
      { value: 'volunteering', label: 'Volunteering' },
      { value: 'caring', label: 'Caring responsibilities' },
      { value: 'looking-for-work', label: 'Looking for work' },
      { value: 'on-a-break', label: 'On a break from work' },
      { value: 'returning-to-work', label: 'Returning to work' },
      { value: 'no-paid-work', label: 'I have not had paid work yet' },
      { value: 'other', label: 'Other' }
    ]
  };

  const SERVICES = Object.freeze({
    professional_cv: {
      name: 'Professional CV',
      price: 50,
      summary: 'One professionally written CV for one agreed role, vacancy, industry or career direction.'
    },
    career_change: {
      name: 'Career Change',
      price: 95,
      summary: 'Career exploration, a practical Career Direction and Action Plan, and one CV aligned with the agreed primary direction.'
    },
    career_partner: {
      name: 'Career Partner',
      price: 135,
      summary: 'A core CV, one targeted CV version, one cover letter and one review of a substantially completed application.'
    },
    career_partner_plus: {
      name: 'Career Partner Plus',
      price: 195,
      summary: 'Career Partner materials plus interview preparation, a second application review and bounded follow-up support.'
    },
    starter_cv: {
      name: 'Starter CV',
      price: 30,
      summary: 'A professionally written first CV for a relatively straightforward, limited work history.'
    }
  });

  const state = {
    serviceCode: null,
    ageBand: null,
    email: null,
    verificationId: null,
    draftId: null,
    returnToken: null,
    currentScreen: 'service',
    answers: {},
    saveTimer: null,
    backendConnected: !BACKEND_URL.startsWith('REPLACE_')
  };

  const elements = {
    screens: {
      service: document.getElementById('service-screen'),
      age: document.getElementById('age-screen'),
      under16: document.getElementById('under-16-screen'),
      email: document.getElementById('email-screen'),
      about: document.getElementById('about-screen'),
      current: document.getElementById('current-screen')
    },
    serviceOptions: document.getElementById('service-options'),
    selectedService: document.getElementById('selected-service'),
    continueToAge: document.getElementById('continue-to-age'),
    ageInformation: document.getElementById('age-information'),
    continueToEmail: document.getElementById('continue-to-email'),
    requestForm: document.getElementById('verification-request-form'),
    codeForm: document.getElementById('verification-code-form'),
    testEmail: document.getElementById('test-email'),
    verificationCode: document.getElementById('verification-code'),
    developmentCode: document.getElementById('development-code'),
    draftReference: document.getElementById('draft-reference'),
    aboutForm: document.getElementById('about-form'),
    saveState: document.getElementById('save-state'),
    copyReturnLink: document.getElementById('copy-return-link'),
    continueToCurrent: document.getElementById('continue-to-current'),
    validateCurrent: document.getElementById('validate-current'),
    status: document.getElementById('status-message'),
    error: document.getElementById('error-summary'),
    nameFirst: document.getElementById('name-first'),
    nameLast: document.getElementById('name-last'),
    namePreferred: document.getElementById('name-preferred'),
    pronouns: document.getElementById('pronouns'),
    verifiedEmail: document.getElementById('verified-email'),
    contactAllowed: document.getElementById('contact-allowed'),
    contactMethodOptions: document.getElementById('contact-method-options'),
    phoneRow: document.getElementById('phone-row'),
    phone: document.getElementById('phone'),
    contactPrimary: document.getElementById('contact-primary'),
    locationBase: document.getElementById('location-base'),
    lifeStageImpact: document.getElementById('life-stage-impact'),
    lifeStageDetailRow: document.getElementById('life-stage-detail-row'),
    lifeStageDetail: document.getElementById('life-stage-detail'),
    employmentStatus: document.getElementById('employment-status'),
    employmentStatusOptions: document.getElementById('employment-status-options'),
    employmentOtherRow: document.getElementById('employment-other-row'),
    employmentOther: document.getElementById('employment-other'),
    currentRoleTitle: document.getElementById('current-role-title'),
    currentRoleOrg: document.getElementById('current-role-org'),
    currentRoleStart: document.getElementById('current-role-start'),
    currentRoleEnd: document.getElementById('current-role-end'),
    currentRoleCurrent: document.getElementById('current-role-current'),
    currentRoleLikes: document.getElementById('current-role-likes'),
    currentRoleChange: document.getElementById('current-role-change')
  };

  function createId(prefix) {
    const random = window.crypto && typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${random}`;
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(price);
  }

  function setStatus(message) {
    elements.status.textContent = message || '';
  }

  function setSaveState(message) {
    if (state.currentScreen === 'about') elements.saveState.textContent = message;
    else if (state.currentScreen === 'current') setStatus(message);
  }

  function showError(message, target) {
    elements.error.textContent = message;
    elements.error.hidden = false;
    elements.error.focus();
    if (target) target.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    elements.error.textContent = '';
    elements.error.hidden = true;
    document.querySelectorAll('[aria-invalid="true"]').forEach((item) => item.removeAttribute('aria-invalid'));
  }

  function setProgress(screen) {
    const order = ['service', 'age', 'email', 'about', 'current'];
    const effective = screen === 'under16' ? 'age' : screen;
    const currentIndex = order.indexOf(effective);

    document.querySelectorAll('[data-progress]').forEach((item) => {
      const itemIndex = order.indexOf(item.dataset.progress);
      if (itemIndex === currentIndex) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      item.dataset.complete = itemIndex < currentIndex ? 'true' : 'false';
    });
  }

  function showScreen(name, focus = true) {
    Object.entries(elements.screens).forEach(([key, screen]) => {
      screen.hidden = key !== name;
    });
    state.currentScreen = name;
    setProgress(name);
    clearError();
    setStatus('');

    if (focus) {
      const heading = elements.screens[name].querySelector('h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }

  function renderServices() {
    elements.serviceOptions.innerHTML = '';
    Object.entries(SERVICES).forEach(([code, service]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'service-option';
      button.dataset.serviceCode = code;
      button.setAttribute('aria-pressed', String(state.serviceCode === code));
      button.innerHTML = `
        <strong>${service.name}</strong>
        <span class="price">${formatPrice(service.price)}</span>
        <small>${service.summary}</small>
      `;
      button.addEventListener('click', () => selectService(code));
      elements.serviceOptions.appendChild(button);
    });
  }

  function renderPhase2Options() {
    elements.contactMethodOptions.innerHTML = '';
    FIELD_CONFIG.contactMethods.forEach((method) => {
      const label = document.createElement('label');
      label.className = 'checkbox-option';
      label.innerHTML = `<input type="checkbox" name="CONTACT_ALLOWED" value="${method.value}"><span>${method.label}</span>`;
      elements.contactMethodOptions.appendChild(label);
    });

    elements.lifeStageImpact.innerHTML = '';
    FIELD_CONFIG.lifeStageOptions.forEach((option) => {
      const node = document.createElement('option');
      node.value = option.value;
      node.textContent = option.label;
      elements.lifeStageImpact.appendChild(node);
    });

    elements.employmentStatusOptions.innerHTML = '';
    FIELD_CONFIG.employmentStatuses.forEach((status) => {
      const label = document.createElement('label');
      label.className = 'checkbox-option';
      label.innerHTML = `<input type="checkbox" name="EMPLOYMENT_STATUS" value="${status.value}"><span>${status.label}</span>`;
      elements.employmentStatusOptions.appendChild(label);
    });
  }

  function selectService(code) {
    clearError();
    if (!Object.prototype.hasOwnProperty.call(SERVICES, code)) {
      state.serviceCode = null;
      elements.continueToAge.disabled = true;
      elements.selectedService.hidden = true;
      showError('That service code is not recognised. Choose one of the approved services shown here.');
      return;
    }

    state.serviceCode = code;
    const service = SERVICES[code];
    elements.selectedService.innerHTML = `
      <h3>Selected: ${service.name}</h3>
      <p><strong>${formatPrice(service.price)}</strong></p>
      <p>${service.summary}</p>
    `;
    elements.selectedService.hidden = false;
    elements.continueToAge.disabled = false;
    document.querySelectorAll('.service-option').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.serviceCode === code));
    });
    updateUrl({ service: code });
  }

  function applyInitialServiceCode() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('service');
    if (!requested) return;
    if (Object.prototype.hasOwnProperty.call(SERVICES, requested)) selectService(requested);
    else showError('The link contained an unknown service code. Nothing has been selected or priced. Choose an approved service below.');
  }

  function updateUrl(values) {
    const url = new URL(window.location.href);
    Object.entries(values).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    window.history.replaceState({}, '', url);
  }

  function handleAgeChange(event) {
    if (event.target.name !== 'age-band') return;
    state.ageBand = event.target.value;
    elements.continueToEmail.disabled = false;
    elements.ageInformation.hidden = false;

    if (state.ageBand === '16-17') {
      elements.ageInformation.innerHTML = '<h3>Direct access, without compulsory adult involvement</h3><p>The fictional client continues through the same suitable service route. A supporter or separate payer can be involved only if the client chooses.</p>';
    } else if (state.ageBand === '18-plus') {
      elements.ageInformation.innerHTML = '<h3>Standard route</h3><p>The fictional client continues through the ordinary service flow.</p>';
    } else {
      elements.ageInformation.innerHTML = '<h3>No detailed information will be collected</h3><p>The route will stop before email verification, uploads, detailed questions or payment.</p>';
    }
  }

  function isFictionalEmail(email) {
    return /^[^\s@]+@example\.com$/i.test(email);
  }

  async function postBackend(payload) {
    if (!state.backendConnected) return simulateBackend(payload);
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    if (!response.ok) throw new Error('The development receiver did not respond successfully.');
    const result = await response.json();
    if (!result.ok) throw new Error(result.message || 'The development request could not be completed.');
    return result;
  }

  function simulateBackend(payload) {
    const storageKey = 'sabi-career-support-fictional-dev';
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || '{}');

    if (payload.action === 'requestVerification') {
      const verificationId = createId('verify');
      const code = String(Math.floor(100000 + Math.random() * 900000));
      stored.verification = { verificationId, email: payload.email, code, expiresAt: Date.now() + 10 * 60 * 1000 };
      window.localStorage.setItem(storageKey, JSON.stringify(stored));
      return Promise.resolve({ ok: true, verificationId, developmentCode: code, simulated: true });
    }

    if (payload.action === 'verifyCode') {
      const verification = stored.verification;
      if (!verification || verification.verificationId !== payload.verificationId) {
        return Promise.reject(new Error('The fictional verification request could not be found.'));
      }
      if (Date.now() > verification.expiresAt || verification.code !== payload.code) {
        return Promise.reject(new Error('The fictional verification code is incorrect or expired.'));
      }

      const existing = stored.draft && stored.draft.email === verification.email && stored.draft.serviceCode === payload.serviceCode
        ? stored.draft
        : {
            draftId: createId('draft'),
            returnToken: createId('return'),
            email: verification.email,
            serviceCode: payload.serviceCode,
            ageBand: payload.ageBand,
            answers: {},
            currentSection: 'about',
            formVersion: FORM_VERSION,
            updatedAt: new Date().toISOString()
          };
      existing.ageBand = payload.ageBand;
      stored.draft = existing;
      window.localStorage.setItem(storageKey, JSON.stringify(stored));
      return Promise.resolve({ ok: true, ...existing, simulated: true });
    }

    if (payload.action === 'saveDraft') {
      if (!stored.draft || stored.draft.draftId !== payload.draftId || stored.draft.returnToken !== payload.returnToken) {
        return Promise.reject(new Error('The fictional draft could not be authenticated.'));
      }
      stored.draft.answers = payload.answers || {};
      stored.draft.currentSection = payload.currentSection || 'about';
      stored.draft.updatedAt = new Date().toISOString();
      window.localStorage.setItem(storageKey, JSON.stringify(stored));
      return Promise.resolve({ ok: true, savedAt: stored.draft.updatedAt, simulated: true });
    }

    if (payload.action === 'loadDraft') {
      if (!stored.draft || stored.draft.draftId !== payload.draftId || stored.draft.returnToken !== payload.returnToken) {
        return Promise.reject(new Error('The fictional return link is invalid or expired.'));
      }
      return Promise.resolve({ ok: true, ...stored.draft, simulated: true });
    }

    return Promise.reject(new Error('Unknown development action.'));
  }

  async function requestVerification(event) {
    event.preventDefault();
    clearError();
    const email = elements.testEmail.value.trim().toLowerCase();
    if (!isFictionalEmail(email)) {
      showError('Use a fictional @example.com address only. Real email addresses are blocked in this development preview.', elements.testEmail);
      return;
    }

    try {
      setStatus('Creating a fictional verification request…');
      const result = await postBackend({
        action: 'requestVerification',
        email,
        serviceCode: state.serviceCode,
        ageBand: state.ageBand,
        formVersion: FORM_VERSION,
        ageWordingVersion: AGE_WORDING_VERSION,
        testOnly: true
      });
      state.email = email;
      state.verificationId = result.verificationId;
      elements.codeForm.hidden = false;
      if (result.developmentCode) {
        elements.developmentCode.textContent = `Fictional development code: ${result.developmentCode}`;
        elements.developmentCode.hidden = false;
      }
      elements.verificationCode.focus();
      setStatus(result.simulated
        ? 'Backend not connected. A browser-only simulation is active and will not work across devices.'
        : 'Fictional verification code created.');
    } catch (error) {
      showError(error.message || 'The fictional verification request could not be created.');
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    clearError();
    const code = elements.verificationCode.value.trim();
    if (!/^\d{6}$/.test(code)) {
      showError('Enter the six-digit fictional verification code.', elements.verificationCode);
      return;
    }

    try {
      setStatus('Verifying the fictional code…');
      const result = await postBackend({
        action: 'verifyCode',
        verificationId: state.verificationId,
        code,
        serviceCode: state.serviceCode,
        ageBand: state.ageBand,
        formVersion: FORM_VERSION,
        testOnly: true
      });
      openDraftResult(result);
      showScreen(result.currentSection === 'current' ? 'current' : 'about');
      setStatus(result.simulated
        ? 'Fictional draft opened in browser-only simulation. Cross-device return requires the development receiver.'
        : 'Fictional draft verified and opened.');
    } catch (error) {
      showError(error.message || 'The fictional code could not be verified.', elements.verificationCode);
    }
  }

  function selectedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
  }

  function updateContactControls() {
    const selected = selectedValues('CONTACT_ALLOWED');
    const needsPhone = selected.includes('telephone') || selected.includes('sms');
    elements.phoneRow.hidden = !needsPhone;
    elements.phone.required = needsPhone;
    if (!needsPhone) elements.phone.removeAttribute('aria-invalid');

    const previous = elements.contactPrimary.value;
    elements.contactPrimary.innerHTML = '<option value="">Select a first-choice contact method</option>';
    FIELD_CONFIG.contactMethods.filter((method) => selected.includes(method.value)).forEach((method) => {
      const option = document.createElement('option');
      option.value = method.value;
      option.textContent = method.label;
      elements.contactPrimary.appendChild(option);
    });
    elements.contactPrimary.disabled = selected.length === 0;
    if (selected.includes(previous)) elements.contactPrimary.value = previous;
  }

  function updateLifeStageControl() {
    const show = elements.lifeStageImpact.value === 'yes' || elements.lifeStageImpact.value === 'not-sure';
    elements.lifeStageDetailRow.hidden = !show;
  }

  function updateEmploymentControls() {
    const selected = selectedValues('EMPLOYMENT_STATUS');
    elements.employmentOtherRow.hidden = !selected.includes('other');
    elements.employmentOther.required = selected.includes('other');
    const stillCurrent = elements.currentRoleCurrent.checked;
    elements.currentRoleEnd.disabled = stillCurrent;
    if (stillCurrent) elements.currentRoleEnd.value = '';
  }

  function collectAboutAnswers() {
    return {
      NAME_FIRST: elements.nameFirst.value.trim(),
      NAME_LAST: elements.nameLast.value.trim(),
      NAME_PREFERRED: elements.namePreferred.value.trim(),
      PRONOUNS: elements.pronouns.value.trim(),
      PHONE: elements.phone.value.trim(),
      CONTACT_ALLOWED: selectedValues('CONTACT_ALLOWED'),
      CONTACT_PRIMARY: elements.contactPrimary.value,
      LOCATION_BASE: elements.locationBase.value.trim(),
      LIFE_STAGE_IMPACT: elements.lifeStageImpact.value,
      LIFE_STAGE_DETAIL: elements.lifeStageDetail.value.trim()
    };
  }

  function collectCurrentAnswers() {
    return {
      EMPLOYMENT_STATUS: selectedValues('EMPLOYMENT_STATUS'),
      EMPLOYMENT_STATUS_OTHER: elements.employmentOther.value.trim(),
      CURRENT_ROLE_TITLE: elements.currentRoleTitle.value.trim(),
      CURRENT_ROLE_ORG: elements.currentRoleOrg.value.trim(),
      CURRENT_ROLE_START: elements.currentRoleStart.value.trim(),
      CURRENT_ROLE_END: elements.currentRoleEnd.value.trim(),
      CURRENT_ROLE_CURRENT: elements.currentRoleCurrent.checked,
      CURRENT_ROLE_LIKES: elements.currentRoleLikes.value.trim(),
      CURRENT_ROLE_CHANGE: elements.currentRoleChange.value.trim()
    };
  }

  function collectAllAnswers() {
    return Object.assign({}, state.answers, collectAboutAnswers(), collectCurrentAnswers());
  }

  function populateAnswers(answers) {
    const data = answers || {};
    elements.nameFirst.value = data.NAME_FIRST || '';
    elements.nameLast.value = data.NAME_LAST || '';
    elements.namePreferred.value = data.NAME_PREFERRED || '';
    elements.pronouns.value = data.PRONOUNS || '';
    elements.phone.value = data.PHONE || '';
    elements.locationBase.value = data.LOCATION_BASE || '';
    elements.lifeStageImpact.value = data.LIFE_STAGE_IMPACT || '';
    elements.lifeStageDetail.value = data.LIFE_STAGE_DETAIL || '';
    elements.verifiedEmail.value = state.email || '';

    const contactSelected = Array.isArray(data.CONTACT_ALLOWED) ? data.CONTACT_ALLOWED : [];
    document.querySelectorAll('input[name="CONTACT_ALLOWED"]').forEach((input) => {
      input.checked = contactSelected.includes(input.value);
    });
    updateContactControls();
    if (contactSelected.includes(data.CONTACT_PRIMARY)) elements.contactPrimary.value = data.CONTACT_PRIMARY;
    updateLifeStageControl();

    const employmentSelected = Array.isArray(data.EMPLOYMENT_STATUS) ? data.EMPLOYMENT_STATUS : [];
    document.querySelectorAll('input[name="EMPLOYMENT_STATUS"]').forEach((input) => {
      input.checked = employmentSelected.includes(input.value);
    });
    elements.employmentOther.value = data.EMPLOYMENT_STATUS_OTHER || '';
    elements.currentRoleTitle.value = data.CURRENT_ROLE_TITLE || '';
    elements.currentRoleOrg.value = data.CURRENT_ROLE_ORG || '';
    elements.currentRoleStart.value = data.CURRENT_ROLE_START || '';
    elements.currentRoleEnd.value = data.CURRENT_ROLE_END || '';
    elements.currentRoleCurrent.checked = data.CURRENT_ROLE_CURRENT === true;
    elements.currentRoleLikes.value = data.CURRENT_ROLE_LIKES || '';
    elements.currentRoleChange.value = data.CURRENT_ROLE_CHANGE || '';
    updateEmploymentControls();
  }

  function validateAboutSection() {
    clearError();
    for (const [field, message] of [
      [elements.nameFirst, 'Enter a fictional first name for this test.'],
      [elements.nameLast, 'Enter a fictional last name for this test.'],
      [elements.locationBase, 'Enter a fictional town, city or postcode area for this test.']
    ]) {
      if (!field.value.trim()) {
        showError(message, field);
        field.focus();
        return false;
      }
    }

    const selected = selectedValues('CONTACT_ALLOWED');
    if (selected.length === 0) {
      showError('Choose at least one fictional contact method.', elements.contactAllowed);
      elements.contactAllowed.scrollIntoView({ block: 'center' });
      return false;
    }
    if (!elements.contactPrimary.value || !selected.includes(elements.contactPrimary.value)) {
      showError('Choose a first-choice contact method from the methods selected above.', elements.contactPrimary);
      elements.contactPrimary.focus();
      return false;
    }
    if ((selected.includes('telephone') || selected.includes('sms')) && !elements.phone.value.trim()) {
      showError('Enter a fictional telephone number because telephone or SMS is selected.', elements.phone);
      elements.phone.focus();
      return false;
    }
    return true;
  }

  function validateCurrentSection() {
    clearError();
    const statuses = selectedValues('EMPLOYMENT_STATUS');
    if (statuses.length === 0) {
      showError('Choose at least one fictional current-situation option.', elements.employmentStatus);
      elements.employmentStatus.scrollIntoView({ block: 'center' });
      return false;
    }
    if (statuses.includes('other') && !elements.employmentOther.value.trim()) {
      showError('Add a brief fictional description for Other.', elements.employmentOther);
      elements.employmentOther.focus();
      return false;
    }
    if (!statuses.includes('no-paid-work') && !elements.currentRoleTitle.value.trim()) {
      showError('Enter a fictional current or most recent role, or select “I have not had paid work yet”.', elements.currentRoleTitle);
      elements.currentRoleTitle.focus();
      return false;
    }
    return true;
  }

  async function continueToCurrent() {
    if (!validateAboutSection()) return;
    await saveDraft('about');
    if (!elements.error.hidden) return;
    showScreen('current');
  }

  async function validateAndSaveCurrent() {
    if (!validateCurrentSection()) return;
    await saveDraft('current');
    if (!elements.error.hidden) return;
    setStatus('Current situation is complete for this fictional test draft. Work history and private document upload are the next build stage.');
  }

  function queueAutosave() {
    window.clearTimeout(state.saveTimer);
    setSaveState('Changes not yet saved.');
    state.saveTimer = window.setTimeout(() => saveDraft(state.currentScreen), 700);
  }

  async function saveDraft(currentSection) {
    if (!state.draftId || !state.returnToken) return;
    state.answers = collectAllAnswers();
    setSaveState('Saving fictional draft…');

    try {
      const result = await postBackend({
        action: 'saveDraft',
        draftId: state.draftId,
        returnToken: state.returnToken,
        serviceCode: state.serviceCode,
        ageBand: state.ageBand,
        currentSection: currentSection === 'current' ? 'current' : 'about',
        answers: state.answers,
        formVersion: FORM_VERSION,
        testOnly: true
      });
      const savedAt = new Date(result.savedAt || Date.now());
      setSaveState(`Fictional draft saved at ${savedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`);
      clearError();
    } catch (error) {
      setSaveState('Save failed. The fictional changes remain on this screen.');
      showError(error.message || 'The fictional draft could not be saved.');
    }
  }

  function openDraftResult(result) {
    state.draftId = result.draftId;
    state.returnToken = result.returnToken || state.returnToken;
    state.email = result.email || state.email;
    state.ageBand = result.ageBand || state.ageBand;
    state.answers = result.answers || {};
    elements.draftReference.textContent = state.draftId;
    populateAnswers(state.answers);
    updateUrl({ draft: state.draftId, token: state.returnToken, service: state.serviceCode });
  }

  async function loadReturnLink() {
    const params = new URLSearchParams(window.location.search);
    const draftId = params.get('draft');
    const returnToken = params.get('token');
    const serviceCode = params.get('service');
    if (!draftId || !returnToken || !serviceCode) return false;

    if (!Object.prototype.hasOwnProperty.call(SERVICES, serviceCode)) {
      showError('The return link contains an unknown service code. No draft has been opened.');
      return false;
    }

    try {
      setStatus('Opening the fictional return link…');
      const result = await postBackend({ action: 'loadDraft', draftId, returnToken, serviceCode, formVersion: FORM_VERSION, testOnly: true });
      state.serviceCode = serviceCode;
      state.returnToken = returnToken;
      openDraftResult(result);
      renderServices();
      showScreen(result.currentSection === 'current' ? 'current' : 'about', false);
      setStatus(result.simulated
        ? 'Fictional draft restored from this browser only. The development receiver is not connected.'
        : 'Fictional draft restored through verified return.');
      return true;
    } catch (error) {
      showError(error.message || 'The fictional return link could not be opened.');
      return false;
    }
  }

  async function copyReturnLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('service', state.serviceCode);
    url.searchParams.set('draft', state.draftId);
    url.searchParams.set('token', state.returnToken);
    try {
      await navigator.clipboard.writeText(url.toString());
      setStatus('Fictional return link copied. Treat it as sensitive test information.');
    } catch {
      setStatus('Copy was not available. The fictional return link is shown in the address bar.');
    }
  }

  function bindEvents() {
    elements.continueToAge.addEventListener('click', () => {
      if (!state.serviceCode) return showError('Choose an approved service before continuing.');
      showScreen('age');
    });
    document.querySelectorAll('input[name="age-band"]').forEach((radio) => radio.addEventListener('change', handleAgeChange));
    elements.continueToEmail.addEventListener('click', () => {
      if (!state.ageBand) return showError('Choose an age group before continuing.');
      showScreen(state.ageBand === 'under-16' ? 'under16' : 'email');
    });
    document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => showScreen(button.dataset.back)));

    elements.requestForm.addEventListener('submit', requestVerification);
    elements.codeForm.addEventListener('submit', verifyCode);
    elements.aboutForm.addEventListener('input', queueAutosave);
    elements.aboutForm.addEventListener('change', queueAutosave);
    elements.contactMethodOptions.addEventListener('change', () => {
      updateContactControls();
      queueAutosave();
    });
    elements.lifeStageImpact.addEventListener('change', () => {
      updateLifeStageControl();
      queueAutosave();
    });
    elements.continueToCurrent.addEventListener('click', continueToCurrent);
    elements.copyReturnLink.addEventListener('click', copyReturnLink);

    elements.screens.current.addEventListener('input', queueAutosave);
    elements.screens.current.addEventListener('change', queueAutosave);
    elements.employmentStatusOptions.addEventListener('change', () => {
      updateEmploymentControls();
      queueAutosave();
    });
    elements.currentRoleCurrent.addEventListener('change', () => {
      updateEmploymentControls();
      queueAutosave();
    });
    elements.validateCurrent.addEventListener('click', validateAndSaveCurrent);
  }

  async function initialise() {
    if (!DEVELOPMENT_MODE || FIELD_CONFIG.developmentOnly !== true) {
      showError('This page is configured incorrectly. Development-only controls must remain enabled until production review is complete.');
      return;
    }
    renderServices();
    renderPhase2Options();
    bindEvents();
    const restored = await loadReturnLink();
    if (!restored) {
      applyInitialServiceCode();
      showScreen('service', false);
    }
    if (!state.backendConnected) {
      setStatus('Backend not connected. This preview uses browser-only fictional simulation and cannot yet prove cross-device save-and-return.');
    }
  }

  initialise();
})();
