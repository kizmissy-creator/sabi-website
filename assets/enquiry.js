(function (root) {
  'use strict';
  const trustedOrigin = origin => /^https:\/\/(?:script\.google\.com|script\.googleusercontent\.com|[a-z0-9-]+-script\.googleusercontent\.com)$/.test(origin);

  function createController(options) {
    let state = 'idle', submissionId = options.uuid(), attemptId = '', timer;
    function change(next) { state = next; options.onState(next); }
    function start() {
      if (!options.enabled || state === 'sending' || state === 'accepted') return false;
      attemptId = options.uuid();
      change('sending');
      timer = options.setTimeout(() => change('unconfirmed'), options.timeoutMs || 30000);
      try { options.submit({ submissionId, attemptId }); }
      catch (_) { options.clearTimeout(timer); change('unconfirmed'); }
      return true;
    }
    function receive(event) {
      const data = event.data;
      // Apps Script may use a nested HtmlService frame. Match its HTTPS origin
      // and two unpredictable IDs rather than assuming a direct-frame sender.
      if (state !== 'sending' || !event.source || !trustedOrigin(event.origin) ||
          !data || data.type !== 'sabi-enquiry-result' || data.version !== 1 ||
          data.submissionId !== submissionId || data.attemptId !== attemptId ||
          !['accepted', 'rejected', 'unconfirmed'].includes(data.result)) return false;
      options.clearTimeout(timer);
      change(data.result);
      return true;
    }
    return { start, receive, getState: () => state };
  }
  if (typeof module === 'object' && module.exports) module.exports = { createController, trustedOrigin };
  if (!root.document) return;
  const form = root.document.getElementById('sabi-enquiry');
  if (!form) return;
  const fieldset = form.querySelector('fieldset');
  const button = form.querySelector('button[type="submit"]');
  const status = root.document.getElementById('enquiry-status');
  const enabled = form.dataset.enabled === 'true' && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(form.dataset.endpoint || '') && !!root.crypto?.randomUUID;
  const choices = {
    'career-professional-cv': ['career', 'Professional CV'],
    'career-career-change': ['career', 'Career Change'],
    'career-career-partner': ['career', 'Career Partner'],
    'career-career-partner-plus': ['career', 'Career Partner Plus'],
    'career-starter-cv': ['career', 'Starter CV'],
    'career-pay-it-forward': ['career', 'Pay It Forward CV Support'],
    'career-options-chat': ['career', 'Career options chat'],
    'admin-tool-fix': ['admin', 'Admin Tool Fix'],
    'workflow-reset': ['admin', 'Workflow Reset'],
    'admin-options-chat': ['admin', 'Admin options chat'],
    'writing-clarity-edit': ['writing', 'Clarity Edit'],
    'writing-case-studies': ['writing', 'Case Studies & Impact Stories'],
    'writing-reports': ['writing', 'Reports & Briefings'],
    'writing-articles': ['writing', 'Articles & Expert Content'],
    'writing-unsure': ['writing', 'Help choosing a writing service'],
    'unsure': ['unsure', 'Help choosing a route']
  };
  const choice = choices[new URLSearchParams(root.location.search).get('service')];
  const area = root.document.getElementById('service-area');
  const interest = root.document.getElementById('service-interest');
  const selected = root.document.getElementById('selected-service');
  if (choice) { area.value = choice[0]; interest.value = choice[1]; selected.textContent = 'Your starting point: ' + choice[1]; }
  area.addEventListener('change', () => { interest.value = ''; selected.textContent = ''; });
  if (!enabled) {
    form.addEventListener('submit', event => { event.preventDefault(); });
    return;
  }
  form.action = form.dataset.endpoint;
  root.document.getElementById('form-started-at').value = String(Date.now());
  root.document.getElementById('parent-origin').value = root.location.origin;
  button.disabled = false;
  button.textContent = 'Submit enquiry';
  const messages = {
    sending: 'Sending your enquiry. Please keep this page open.',
    accepted: 'Your enquiry has been received. SABI will review it and respond using your contact details.',
    rejected: 'Your enquiry was not accepted. Check your details, wait a moment and try again.',
    unconfirmed: 'We could not confirm whether your enquiry arrived. Your details are kept on this page. Retry sends the same enquiry reference to avoid a duplicate.'
  };
  const controller = createController({
    enabled,
    uuid: () => root.crypto.randomUUID(),
    setTimeout: root.setTimeout.bind(root), clearTimeout: root.clearTimeout.bind(root),
    onState: state => {
      status.textContent = messages[state];
      button.disabled = state === 'sending' || state === 'accepted';
      button.textContent = state === 'sending' ? 'Sending…' : state === 'accepted' ? 'Enquiry received' : 'Try again';
      fieldset.disabled = state !== 'rejected';
      form.setAttribute('aria-busy', String(state === 'sending'));
      if (state !== 'sending') status.focus();
    },
    submit: payload => {
      root.document.getElementById('submission-id').value = payload.submissionId;
      root.document.getElementById('attempt-id').value = payload.attemptId;
      // Disabled controls are excluded by native form submission. Capture them
      // before locking the answers while an uncertain request may still arrive.
      fieldset.disabled = false;
      root.HTMLFormElement.prototype.submit.call(form);
      fieldset.disabled = true;
    }
  });
  form.addEventListener('submit', event => { event.preventDefault(); controller.start(); });
  root.addEventListener('message', event => controller.receive(event));
})(typeof window === 'undefined' ? globalThis : window);
