const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const uploadInput = document.getElementById('upload');
const refHeightInput = document.getElementById('ref-height');
const calculateBtn = document.getElementById('calculateBtn');
const redrawPileBtn = document.getElementById('redrawPileBtn');
const messageDiv = document.getElementById('message');
const historyDiv = document.getElementById('history');

let image = null;
let rectangles = []; // [reference, pile]
let drawingStep = 0; // 0 = draw reference, 1 = draw pile or confirm pile detection
let isDrawing = false;
let startX, startY;
let pileDrawMode = false; // whether user is drawing pile manually (fallback or redraw)

const MAX_WIDTH = 600;
const MAX_HEIGHT = 400;

function setMessage(msg) {
  messageDiv.innerHTML = msg;
}

function redraw() {
  if (!image) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  if (rectangles[0]) {
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 3;
    let r = rectangles[0];
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }
  if (rectangles[1]) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    let r = rectangles[1];
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }
}

function drawImageOnCanvas(img) {
  const scale = Math.min(MAX_WIDTH / img.width, MAX_HEIGHT / img.height, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  canvas.style.display = 'block';
}

function enableDrawing(step) {
  drawingStep = step;
  pileDrawMode = (step === 1);
  canvas.style.cursor = 'crosshair';

  function mouseDown(e) {
    if (!image) return;
    if (drawingStep > 1) return;

    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = (e.clientX - rect.left) * (canvas.width / rect.width);
    startY = (e.clientY - rect.top) * (canvas.height / rect.height);
  }

  function mouseMove(e) {
    if (!isDrawing) return;
    redraw();

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    const w = mouseX - startX;
    const h = mouseY - startY;

    ctx.save();
    ctx.strokeStyle = drawingStep === 0 ? 'lime' : 'red';
    ctx.lineWidth = 3;
    ctx.strokeRect(startX, startY, w, h);
    ctx.restore();
  }

  function mouseUp(e) {
    if (!isDrawing) return;
    isDrawing = false;

    const rect = canvas.getBoundingClientRect();
    const endX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const endY = (e.clientY - rect.top) * (canvas.height / rect.height);
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const w = Math.abs(endX - startX);
    const h = Math.abs(endY - startY);

    rectangles[drawingStep] = { x, y, w, h };
    drawingStep++;

    redraw();

    if (drawingStep === 1) {
      setMessage('Reference object drawn. Now draw rectangle around the clothes pile.');
      enableDrawing(1);
      redrawPileBtn.style.display = 'none';
      calculateBtn.disabled = true;
    } else if (drawingStep === 2) {
      setMessage('Clothes pile drawn. Enter reference height (cm) and click Calculate.');
      calculateBtn.disabled = false;
      redrawPileBtn.style.display = 'none';
    }

    removeCanvasListeners();
  }

  canvas.addEventListener('mousedown', mouseDown);
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('mouseup', mouseUp);

  canvas._mouseDown = mouseDown;
  canvas._mouseMove = mouseMove;
  canvas._mouseUp = mouseUp;
}

function removeCanvasListeners() {
  canvas.removeEventListener('mousedown', canvas._mouseDown);
  canvas.removeEventListener('mousemove', canvas._mouseMove);
  canvas.removeEventListener('mouseup', canvas._mouseUp);
}

uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    image = new Image();
    image.onload = function() {
      drawImageOnCanvas(image);
      rectangles = [];
      calculateBtn.disabled = true;
      redrawPileBtn.style.display = 'none';
      setMessage('Draw rectangle around the reference object (known height).');
      redraw();
      enableDrawing(0);
    };
    image.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

// Jokes for calculation results
const lowJokes = [
  "Your clothes pile is still in the 'art installation' phase. No rush.",
  "This is just a decorative carpet now.",
  "Tiny pile detected — you could hide it under a cat.",
  "Your laundry is still in stealth mode."
];

const mediumJokes = [
  "Your laundry mountain is growing… soon it will demand citizenship.",
  "Careful, it’s developing its own weather system.",
  "The pile is now officially taller than your patience.",
  "Laundry pile status: 'Could star in a disaster movie'."
];

const highJokes = [
  "Warning: Pile approaching Everest. Sherpas not included.",
  "At this point, you need a climbing permit.",
  "Your laundry has reached 'danger to low-flying aircraft' level.",
  "The United Nations just classified it as a mountain range."
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

calculateBtn.addEventListener('click', () => {
  if (rectangles.length < 2 || !rectangles[0] || !rectangles[1]) {
    alert('Please draw/select both rectangles.');
    return;
  }
  const refHeightCm = parseFloat(refHeightInput.value);
  if (!refHeightCm || refHeightCm <= 0) {
    alert('Enter valid reference height.');
    return;
  }

  setMessage('Wait...I am thinking...');
  calculateBtn.disabled = true;

  setTimeout(() => {
    const refRect = rectangles[0];
    const pileRect = rectangles[1];
    const scale = refHeightCm / refRect.h;
    const pileHeightCm = (pileRect.h * scale).toFixed(2);

    let finalMsg = `Estimated pile height: ${pileHeightCm} cm.<br>`;
    if (pileHeightCm <= 20)
      finalMsg += pickRandom(lowJokes);
    else if (pileHeightCm > 20 && pileHeightCm <= 45)
      finalMsg += pickRandom(mediumJokes);
    else
      finalMsg += pickRandom(highJokes);

    setMessage(finalMsg);
    saveMeasurement(pileHeightCm);

    calculateBtn.disabled = false;
  }, 2000);
});

function saveMeasurement(height) {
  const history = JSON.parse(localStorage.getItem('pileHistory') || '[]');
  history.push({ height, time: new Date().toLocaleString() });
  if (history.length > 10) history.shift();
  localStorage.setItem('pileHistory', JSON.stringify(history));
  renderHistory();
}

let myChart = null;

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('pileHistory') || '[]');
  historyDiv.innerHTML = '<h3>Measurement History</h3>';
  if (history.length === 0) {
    historyDiv.innerHTML += '<p>No measurements yet.</p>';
    return;
  }

  let tableHtml = '<table><thead><tr><th>Time</th><th>Height (cm)</th></tr></thead><tbody>';
  history.forEach(item => {
    tableHtml += `<tr><td>${item.time}</td><td>${item.height}</td></tr>`;
  });
  tableHtml += '</tbody></table>';
  historyDiv.innerHTML += tableHtml;

  const times = history.map(i => i.time);
  const heights = history.map(i => parseFloat(i.height));

  const oldChart = document.getElementById('historyChart');
  if (oldChart) oldChart.remove();

  const chartCanvas = document.createElement('canvas');
  chartCanvas.id = 'historyChart';
  historyDiv.appendChild(chartCanvas);

  const ctxChart = chartCanvas.getContext('2d');
  myChart = new Chart(ctxChart, {
    type: 'line',
    data: {
      labels: times,
      datasets: [{
        label: 'Pile Height (cm)',
        data: heights,
        borderColor: 'blue',
        backgroundColor: 'rgba(0,0,255,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { display: true }
      }
    }
  });

  // Message container below chart
  let chartMessage = document.getElementById('chartMessage');
  if (!chartMessage) {
    chartMessage = document.createElement('div');
    chartMessage.id = 'chartMessage';
    historyDiv.appendChild(chartMessage);
  } else {
    chartMessage.innerHTML = '';
  }

  chartCanvas.onclick = function(evt) {
    const points = myChart.getElementsAtEventForMode(evt, 'nearest', { intersect: false }, false);
    if (!points || points.length === 0) {
      chartMessage.innerText = '';
      return;
    }

    const idx = points[0].index;
    if (idx === 0) {
      chartMessage.innerText = "First measurement — nothing to compare yet!";
      return;
    }

    const current = heights[idx];
    const previous = heights[idx - 1];
    const diff = previous - current;
    const SIGNIFICANT_CHANGE = 5;

    const noChangeJokes = [
      "No big change — your pile is chilling. 😴",
      "Laundry pile status: Zen master. 🧘‍♂️",
      "The pile’s as lazy as you today. 🛋️",
      "No change detected — laundry’s taking a nap. 😴"
    ];

    const improvementJokes = [
      "Improvement! Whoa — the laundry mountain shrank! Laundry fairy at work? 🧚‍♀️",
      "Look at you! Laundry hero in action. 🦸‍♂️",
      "Pile down! Your clothes are getting scared. 😱",
      "Laundry legend alert! The mountain is melting. 🏔️🔥"
    ];

    const increaseJokes = [
      "Uh oh — the pile’s growing... what are you doing, laundry slacker? 😅",
      "The laundry pile is staging a comeback. Brace yourself! 💥",
      "Are you building a textile fortress? Because that pile’s huge! 🏰",
      "Laundry avalanche incoming! Better get those clothes moving. ⛷️"
    ];

    let msg = '';
    if (Math.abs(diff) < SIGNIFICANT_CHANGE) {
      msg = noChangeJokes[Math.floor(Math.random() * noChangeJokes.length)];
    } else if (diff > 0) {
      msg = improvementJokes[Math.floor(Math.random() * improvementJokes.length)];
    } else {
      msg = increaseJokes[Math.floor(Math.random() * increaseJokes.length)];
    }

    chartMessage.innerText = msg;
  };
}

redrawPileBtn.addEventListener('click', () => {
  if (!image) return;
  rectangles[1] = null;
  calculateBtn.disabled = true;
  setMessage('Draw rectangle around the clothes pile.');
  enableDrawing(1);
  redrawPileBtn.style.display = 'none';
});

renderHistory();
