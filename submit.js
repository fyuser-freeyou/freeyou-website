/**
 * FreeYou — Form to Zoho CRM submit patch
 * Add ONE line before </body> in the live HTML:
 *   <script src="/submit.js"></script>
 *
 * Wires #leadForm and #applyForm to POST /api/submit-lead
 * which the Cloudflare Worker proxies to Zoho CRM.
 */
(function () {
  'use strict';

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
    if (btn) { btn._origText = btn.textContent; btn.disabled = true; btn.textContent = 'Submitting…'; }
    fetch('/api/submit-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function () {
      showSuccess(formEl, successEl, btn);
    }).catch(function (err) {
      console.warn('[FreeYou] submit failed:', err);
      showSuccess(formEl, successEl, btn);
    });
    if (window.posthog) {
      posthog.capture('lead_submitted', data);
      if (data.email || data['Email']) posthog.identify(data.email || data['Email'], { name: data['First Name'] });
    }
  }

  function wireForm(formId, getDataFn, successId) {
    var form = document.getElementById(formId);
    if (!form) return;
    var btn = form.querySelector('button[type="submit"]') || form.querySelector('[type="submit"]');
    var successEl = document.getElementById(successId) || null;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitToZoho(getDataFn(form), btn, form, successEl);
    });
    console.log('[FreeYou] ' + formId + ' wired to Zoho CRM');
  }

  function getField(form, ...ids) {
    for (var id of ids) {
      var el = document.getElementById(id) || form.querySelector('[name="' + id + '"]');
      if (el && el.value.trim()) return el.value.trim();
    }
    return '';
  }

  function getByType(form, type) {
    var el = form.querySelector('input[type="' + type + '"]');
    return el ? el.value.trim() : '';
  }

  function getSelect(form, ...ids) {
    for (var id of ids) {
      var el = document.getElementById(id) || form.querySelector('select[name="' + id + '"]');
      if (el && el.value) return el.value;
    }
    var sel = form.querySelector('select');
    return sel ? sel.value : '';
  }

  document.addEventListener('DOMContentLoaded', function () {

    wireForm('leadForm', function(form) {
      var inputs = form.querySelectorAll('input[type="text"]');
      var firstName = getField(form,'first-name','firstName','lead-firstname') || (inputs[0] ? inputs[0].value.trim() : '');
      var lastName  = getField(form,'last-name','lastName','lead-lastname')   || (inputs[1] ? inputs[1].value.trim() : '');
      var email     = getField(form,'email','lead-email') || getByType(form,'email');
      var phone     = getField(form,'phone','whatsapp','lead-phone') || getByType(form,'tel');
      var skill     = getSelect(form,'skill','lead-skill','i-am');
      var exp       = getSelect(form,'experience','lead-exp','years-exp');
      return {
        'First Name':  firstName,
        'Last Name':   lastName,
        'Email':       email,
        'Phone':       phone,
        'Description': (skill ? 'Skill: ' + skill : '') + (exp ? ' | Exp: ' + exp : ''),
        'Lead Source': 'Web Site'
      };
    }, 'leadSuccess');

    wireForm('applyForm', function(form) {
      var inputs = form.querySelectorAll('input[type="text"]');
      var firstName = getField(form,'apply-first','apply-firstname','a-first') || (inputs[0] ? inputs[0].value.trim() : '');
      var lastName  = getField(form,'apply-last','apply-lastname','a-last')    || (inputs[1] ? inputs[1].value.trim() : '');
      var email     = getField(form,'apply-email','a-email') || getByType(form,'email');
      var phone     = getField(form,'apply-phone','apply-whatsapp','a-phone') || getByType(form,'tel');
      var linkedin  = getField(form,'apply-linkedin','linkedin','a-linkedin') || getByType(form,'url');
      var skill     = getSelect(form,'apply-skill','a-skill');
      var city      = getSelect(form,'apply-city','a-city');
      var msgEl     = form.querySelector('textarea');
      var message   = msgEl ? msgEl.value.trim() : '';
      var desc      = [skill && 'Skill: '+skill, city && 'City: '+city, linkedin && 'LinkedIn: '+linkedin, message && 'Note: '+message].filter(Boolean).join(' | ');
      return {
        'First Name':     firstName,
        'Last Name':      lastName,
        'Email':          email,
        'Phone':          phone,
        'Address - City': city,
        'Website':        linkedin,
        'Description':    desc,
        'Lead Source':    'Web Site'
      };
    }, 'applySuccess');

  });
})();
