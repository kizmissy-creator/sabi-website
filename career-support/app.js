(() => {
  'use strict';

  const FORM_VERSION = 'cs-form-dev-2026-08';
  const AGE_WORDING_VERSION = 'age-route-2026-08-04';
  const BACKEND_URL = 'REPLACE_WITH_APPS_SCRIPT_EXEC_URL';
  const DEVELOPMENT_MODE = true;

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
      draft: document.getElementById('draft-screen')
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
    draftForm: document.getElementById('draft-form'),
    preferredName: document.getElementById('fictional-name'),
    testNote: document.getElementById('fictional-note'),
    saveState: document.getElementById('save-state'),
    copyReturnLink: document.getElementById('copy-return-link'),
    status: document.getElementById('status-message'),
    error: document.getElementById('error-summary')
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
    const order = ['service', 'age', 'email', 'draft'];
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

    if (Object.prototype.hasOwnProperty.call(SERVICES, requested)) {
      selectService(requested);
    } else {
      showError('The link contained an unknown service code. Nothing has been selected or priced. Choose an approved service below.');
    }
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
      elements.ageInformation.innerHTML = `
        <h3>Direct access, without compulsory adult involvement</h3>
        <p>The fictional client continues through the same suitable service route. A supporter or separate payer can be involved only if the client chooses.</p>
      `;
    } else if (state.ageBand === '18-plus') {
      elements.ageInformation.innerHTML = `
        <h3>Standard route</h3>
        <p>The fictional client continues through the ordinary service flow.</p>
      `;
    } else {
      elements.ageInformation.innerHTML = `
        <h3>No detailed information will be collected</h3>
        <p>The route will stop before email verification, uploads, detailed questions or payment.</p>
      `;
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
      stored.verification = {
        verificationId,
        email: payload.email,
        code,
        expiresAt: Date.now() + 10 * 60 * 1000
      };
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
            currentSection: 'draft',
            formVersion: FORM_VERSION,
            updatedAt: new Date().toISOString()
          };
      stored.draft = existing;
      window.localStorage.setItem(storageKey, JSON.stringify(stored));
      return Promise.resolve({ ok: true, ...existing, simulated: true });
    }

    if (payload.action === 'saveDraft') {
      if (!stored.draft || stored.draft.draftId !== payload.draftId || stored.draft.returnToken !== payload.returnToken) {
        return Promise.reject(new Error('The fictional draft could not be authenticated.'));
      }
      stored.draft.answers = payload.answers || {};
      stored.draft.currentSection = payload.currentSection || 'draft';
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
      state.draftId = result.draftId;
      state.returnToken = result.returnToken;
      state.answers = result.answers || {};
      elements.preferredName.value = state.answers.preferredName || '';
      elements.testNote.value = state.answers.testNote || '';
      elements.draftReference.textContent = state.draftId;
      updateUrl({ draft: state.draftId, token: state.returnToken, service: state.serviceCode });
      showScreen('draft');
      setStatus(result.simulated
        ? 'Fictional draft opened in browser-only simulation. Cross-device return requires the development receiver.'
        : 'Fictional draft verified and opened.');
    } catch (error) {
      showError(error.message || 'The fictional code could not be verified.', elements.verificationCode);
    }
  }

  function queueAutosave() {
    window.clearTimeout(state.saveTimer);
    elements.saveState.textContent = 'Changes not yet saved.';
    state.saveTimer = window.setTimeout(saveDraft, 700);
  }

  async function saveDraft() {
    if (!state.draftId || !state.returnToken) return;
    state.answers = {
      preferredName: elements.preferredName.value.trim(),
      testNote: elements.testNote.value.trim()
    };
    elements.saveState.textContent = 'Saving fictional draft…';

    try {
      const result = await postBackend({
        action: 'saveDraft',
        draftId: state.draftId,
        returnToken: state.returnToken,
        serviceCode: state.serviceCode,
        ageBand: state.ageBand,
        currentSection: 'draft',
        answers: state.answers,
        formVersion: FORM_VERSION,
        testOnly: true
      });
      const savedAt = new Date(result.savedAt || Date.now());
      elements.saveState.textContent = `Fictional draft saved at ${savedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`;
    } catch (error) {
      elements.saveState.textContent = 'Save failed. The fictional changes remain on this screen.';
      showError(error.message || 'The fictional draft could not be saved.');
    }
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
      const result = await postBackend({
        action: 'loadDraft',
        draftId,
        returnToken,
        serviceCode,
        formVersion: FORM_VERSION,
        testOnly: true
      });
      state.serviceCode = serviceCode;
      state.ageBand = result.ageBand;
      state.email = result.email;
      state.draftId = result.draftId;
      state.returnToken = returnToken;
      state.answers = result.answers || {};
      elements.preferredName.value = state.answers.preferredName || '';
      elements.testNote.value = state.answers.testNote || '';
      elements.draftReference.textContent = state.draftId;
      renderServices();
      showScreen('draft', false);
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
      if (!state.serviceCode) {
        showError('Choose an approved service before continuing.');
        return;
      }
      showScreen('age');
    });

    document.querySelectorAll('input[name="age-band"]').forEach((radio) => {
      radio.addEventListener('change', handleAgeChange);
    });

    elements.continueToEmail.addEventListener('click', () => {
      if (!state.ageBand) {
        showError('Choose an age group before continuing.');
        return;
      }
      showScreen(state.ageBand === 'under-16' ? 'under16' : 'email');
    });

    document.querySelectorAll('[data-back]').forEach((button) => {
      button.addEventListener('click', () => showScreen(button.dataset.back));
    });

    elements.requestForm.addEventListener('submit', requestVerification);
    elements.codeForm.addEventListener('submit', verifyCode);
    elements.draftForm.addEventListener('input', queueAutosave);
    elements.copyReturnLink.addEventListener('click', copyReturnLink);
  }

  async function initialise() {
    renderServices();
    bindEvents();
    const restored = await loadReturnLink();
    if (!restored) {
      applyInitialServiceCode();
      showScreen('service', false);
    }

    if (!state.backendConnected) {
      setStatus('Backend not connected. This preview uses browser-only fictional simulation and cannot yet prove cross-device save-and-return.');
    }

    if (!DEVELOPMENT_MODE) {
      showError('This page is configured incorrectly. Development mode must remain enabled until production controls are complete.');
    }
  }

  initialise();
})();
