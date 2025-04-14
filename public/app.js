document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const toast = document.getElementById('toast');
  const loader = submitBtn.querySelector('.btn-loader');
  const btnText = submitBtn.querySelector('.btn-text');

  if (!form || !submitBtn || !toast || !loader || !btnText) {
    console.error('Un des éléments du DOM est manquant.');
    return;
  }

  
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
  
    clearErrors();
  
    if (!validateForm()) {
      showToast('Veuillez corriger les erreurs.', true);
      return;
    }
  
    loader.style.display = 'inline-block';
    btnText.style.display = 'none';
    submitBtn.disabled = true;
    
    // ✅ Ici, on récupère les données du formulaire dans un objet data
    const data = {
      name: form.querySelector('input[name="name"]').value.trim(),
      email: form.querySelector('input[name="email"]').value.trim(),
      message: form.querySelector('textarea[name="message"]').value.trim(),
    };
  
    try {
      // ✅ 1. Enregistrer dans le backend local
      await fetch('/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
  
      // ✅ 2. Envoyer à Formspree directement depuis le frontend
      const formData = new FormData(form); // ici Formspree accepte FormData
      await fetch('https://formspree.io/f/mldjzqoz', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });
  
      showToast('Message envoyé avec succès ! 🎉');
      form.reset();
    } catch (error) {
      console.error('Erreur réseau:', error);
      showToast('Erreur réseau 😢', true);
    } finally {
      loader.style.display = 'none';
      btnText.style.display = 'inline';
      submitBtn.disabled = false;
    }
  });
  
  // Fonctions auxiliaires (toast, validation, etc.)
  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.background = isError ? '#dc3545' : '#28a745';
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  function validateForm() {
    let isValid = true;
    let firstErrorField = null;

    const name = form.querySelector('input[name="name"]');
    const email = form.querySelector('input[name="email"]');
    const message = form.querySelector('textarea[name="message"]');

    clearErrors();

    if (!name.value.trim()) {
      showError(name, 'Veuillez entrer votre nom.');
      if (!firstErrorField) firstErrorField = name;
      isValid = false;
    }

    if (!email.value.trim() || !validateEmail(email.value.trim())) {
      showError(email, 'Veuillez entrer un email valide.');
      if (!firstErrorField) firstErrorField = email;
      isValid = false;
    }

    if (!message.value.trim()) {
      showError(message, 'Veuillez entrer votre message.');
      if (!firstErrorField) firstErrorField = message;
      isValid = false;
    }

    if (!isValid && firstErrorField) {
      firstErrorField.focus();
    }

    return isValid;
  }

  function clearErrors() {
    form.querySelectorAll('.error-text').forEach(el => el.remove());
    form.querySelectorAll('input, textarea').forEach(input => {
      input.style.borderColor = '#ddd';
      input.classList.remove('shake');
    });
  }

  function showError(input, message) {
    const error = document.createElement('small');
    error.className = 'error-text';
    error.style.color = 'red';
    error.style.fontSize = '12px';
    error.textContent = message;
    input.parentNode.appendChild(error);
    input.style.borderColor = 'red';
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 500);
  }

  function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email.toLowerCase());
  }
});
