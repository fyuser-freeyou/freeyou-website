/**
 * FreeYou — Form → Zoho CRM submit patch
 * Add ONE line before </body> in the live HTML:
 *   <script src="/submit.js"></script>
 *
 * This wires #leadForm and #applyForm to POST /api/submit-lead
 * which the Cloudflare Worker proxies to Zoho CRM.
 */

(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────────────
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function showSuccess(formEl, successEl, btnEl) {
    if (formEl) formEl.style.display = 'none';
    if (successEl) successEl.style.display = 'block';
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = btnEl._origText || 'Done'; }
  }

  function submitToZoho(data, btn, formEl, successEl) {
    if (btn) {
      btn._origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Submitting…';
    }

    fetch('/api/submit-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function () {
      showSuccess(formEl, successEl, btn);
    })
    .catch(function (err) {
      console.warn('[FreeYou] submit-lead failed:', err);
      // Still show success — don't block user on network failure
      showSuccess(formEl, successEl, btn);
    });

    // Track in PostHog if available
    if (window.posthog) {
      posthog.capture('lead_submitted', data);
      if (data.email) posthog.identify(data.email, { name: data['First Name'], phone: data['Phone'] });
    }
  }

  // ── leadForm (hero "Express Your Interest") ───────────────────────
  // Fields: first-name, last-name, email, phone, skill, experience
  // Tries multiple ID patterns to be robust against design variations
  function wireLeadForm() {
    var form = document.getElementById('leadForm');
    if (!form) return;

    var btn     = form.querySelector('button[type="submit"]') || form.querySelector('.submit-btn');
    var success = document.getElementById('leadSuccess') || document.getElementById('lead-success');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Try multiple field ID patterns
      var firstName = val('first-name') || val('firstName') || val('lead-first-name') || val('lFirstName') || '';
      var lastName  = val('last-name')  || val('lastName')  || val('lead-last-name')  || val('lLastName')  || '';
      var email     = val('email')       || val('lead-email')     || val('lEmail')     || '';
      var phone     = val('phone')       || val('lead-phone')     || val('lPhone')     || '';
      var skill     = val('skill')       || val('lead-skill')     || val('lSkill')     || '';
      var exp       = val('experience')  || val('lead-exp')       || val('lExp')       || '';

      // Fallback: scan all inputs by position if IDs didn't match
      if (!email) {
        var inputs = form.querySelectorAll('input[type="email"]');
        if (inputs[0]) email = inputs[0].value.trim();
      }
      if (!phone) {
        var telInputs = form.querySelectorAll('input[type="tel"]');
        if (telInputs[0]) phone = telInputs[0].value.trim();
      }

      var data = {
        'First Name':  firstName,
        'Last Name':   lastName,
        'Email':       email,
        'Phone':       phone,
        'Description': 'Skill: ' + skill + (exp ? ' | Experience: ' + exp : ''),
        'Lead Source': 'Web Site',
        '_source_form': 'leadForm'
      };

      submitToZoho(data, btn, form, success);
    });

    console.log('[FreeYou] leadForm wired to Zoho CRM');
  }

  // ── applyForm (bottom "Apply for early membership") ───────────────
  // Fields: first-name, last-name, email, whatsapp/phone, linkedin, skill, city, message
  function wireApplyForm() {
    var form = document.getElementById('applyForm');
    if (!form) return;

    var btn     = form.querySelector('button[type="submit"]') || form.querySelector('.submit-btn');
    var success = document.getElementById('applySuccess') || document.getElementById('apply-success');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstName = val('apply-first-name') || val('aFirstName') || val('a-first-name') || '';
      var lastName  = val('apply-last-name')  || val('aLastName')  || val('a-last-name')  || '';
      var email     = val('apply-email') || val('aEmail') || '';
      var phone     = val('apply-phone') || val('apply-whatsapp') || val('aPhone') || '';
      var linkedin  = val('apply-linkedin') || val('aLinkedin') || '';
      var skill     = val('apply-skill') || val('aSkill') || '';
      var city      = val('apply-city')  || val('aCity')  || '';
      var message   = val('apply-message') || val('aMessage') || '';

      // Fallback: scan inputs by type
      if (!email) {
        var emailEl = form.querySelector('input[type="email"]');
        if (emailEl) email = emailEl.value.trim();
      }
      if (!phone) {
        var telEl = form.querySelector('input[type="tel"]');
        if (telEl) phone = telEl.value.trim();
      }

      var desc = [];
      if (skill)    desc.push('Skill: ' + skill);
      if (city)     desc.push('City: ' + city);
      if (linkedin) desc.push('LinkedIn: ' + linkedin);
      if (message)  desc.push('Message: ' + message);

      var data = {
        'First Name':     firstName,
        'Last Name':      lastName,
        'Email':          email,
        'Phone':          phone,
        'Address - City': city,
        'Website':        linkedin,
        'Description':    desc.join(' | '),
        'Lead Source':    'Web Site',
        '_source_form':   'applyForm'
      };

      submitToZoho(data, btn, form, success);
    });

    console.log('[FreeYou] applyForm wired to Zoho CRM');
  }

  // ── Init on DOM ready ─────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      wireLeadForm();
      wireApplyForm();
    });
  } else {
    wireLeadForm();
    wireApplyForm();
  }

})();
