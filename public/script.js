// Base URL for backend API. Adjust if your backend domain changes.
const API_BASE = 'https://ranch-manager-production-72fd.up.railway.app';

/**
 * Start voice recognition and put the result into the given input element.
 * Uses the Web Speech API available in modern browsers.
 * @param {string} elementId ID of the input or textarea to fill.
 */
function startVoice(elementId) {
  const inputEl = document.getElementById(elementId);
  if (!inputEl) return;
  // Support different browser prefixes
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Your browser does not support speech recognition.');
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputEl.value = transcript;
  };
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };
  recognition.start();
}

/**
 * Show a temporary message to the user.
 * @param {string} msg
 */
function showMessage(msg) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = msg;
  // Clear after 5 seconds
  setTimeout(() => {
    messageDiv.textContent = '';
  }, 5000);
}

// Handle Add Animal form submission
document.getElementById('animalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    tag: document.getElementById('animal-tag').value.trim(),
    sex: document.getElementById('animal-sex').value,
    dob: document.getElementById('animal-dob').value,
    birthWeight: document.getElementById('animal-birth-weight').value,
    motherId: document.getElementById('animal-mother-id').value,
    fatherId: document.getElementById('animal-father-id').value,
    bloodline: document.getElementById('animal-bloodline').value,
    pen: document.getElementById('animal-pen').value,
    notes: document.getElementById('animal-notes').value,
  };
  try {
    const res = await fetch(`${API_BASE}/animals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      showMessage('Animal added successfully.');
      e.target.reset();
    } else {
      const errorData = await res.json().catch(() => ({}));
      showMessage(errorData.error || 'Failed to add animal');
    }
  } catch (err) {
    console.error(err);
    showMessage('Network error while adding animal');
  }
});

// Handle Birth form submission
document.getElementById('birthForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    animalId: parseInt(document.getElementById('birth-animal-id').value, 10),
    birthDate: document.getElementById('birth-date').value,
    location: document.getElementById('birth-location').value,
    assisted: document.getElementById('birth-assisted').value === 'true',
    complications: document.getElementById('birth-complications').value,
    photos: null,
  };
  try {
    const res = await fetch(`${API_BASE}/births`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      showMessage('Birth recorded successfully.');
      e.target.reset();
    } else {
      const errorData = await res.json().catch(() => ({}));
      showMessage(errorData.error || 'Failed to record birth');
    }
  } catch (err) {
    console.error(err);
    showMessage('Network error while recording birth');
  }
});

// Handle Weight form submission
document.getElementById('weightForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    animalId: parseInt(document.getElementById('weight-animal-id').value, 10),
    weight: parseFloat(document.getElementById('weight-value').value),
    recordedAt: document.getElementById('weight-recorded-at').value || new Date().toISOString(),
    method: document.getElementById('weight-method').value,
    notes: document.getElementById('weight-notes').value,
  };
  try {
    const res = await fetch(`${API_BASE}/weights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      showMessage('Weight recorded successfully.');
      e.target.reset();
    } else {
      const errorData = await res.json().catch(() => ({}));
      showMessage(errorData.error || 'Failed to record weight');
    }
  } catch (err) {
    console.error(err);
    showMessage('Network error while recording weight');
  }
});
