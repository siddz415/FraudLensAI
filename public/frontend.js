const form = document.getElementById('investigate-form');
const submitButton = document.getElementById('submit-btn');
const statusEl = document.getElementById('status');
const resultSection = document.getElementById('result');

const resultEntity = document.getElementById('result-entity');
const resultRiskScore = document.getElementById('result-risk-score');
const resultRiskLevel = document.getElementById('result-risk-level');
const resultSummary = document.getElementById('result-summary');
const resultEvidence = document.getElementById('result-evidence');
const resultConnections = document.getElementById('result-connections');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function renderList(listElement, items, formatter) {
  listElement.innerHTML = '';

  if (!items || items.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'None found.';
    listElement.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = formatter(item);
    listElement.appendChild(li);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const type = formData.get('type');
  const value = formData.get('value');

  setStatus('Running investigation...');
  submitButton.disabled = true;
  resultSection.classList.add('hidden');

  try {
    const response = await fetch('/investigate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, value }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || payload.details || 'Request failed.');
    }

    resultEntity.textContent = payload.entity || '';
    resultRiskScore.textContent = payload.riskScore ?? '';
    resultRiskLevel.textContent = payload.riskLevel || '';
    resultSummary.textContent = payload.summary || 'No summary generated.';

    renderList(resultEvidence, payload.evidence, (item) => item);
    renderList(
      resultConnections,
      payload.graphConnections,
      (item) => `${item.type || 'entity'}: ${item.value || 'unknown'}`
    );

    resultSection.classList.remove('hidden');
    setStatus('Investigation completed successfully.');
  } catch (error) {
    setStatus(`Investigation failed: ${error.message}`, true);
  } finally {
    submitButton.disabled = false;
  }
});
