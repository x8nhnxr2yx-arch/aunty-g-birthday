const titleChars = [...document.querySelectorAll('.jump-title span')];

titleChars.forEach((char, i) => {
  char.style.animationDelay = `${i * 50}ms`;
});

const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiPieces = [];
let confettiAnim = null;
const confettiColors = ['#d4af37', '#f3e6b2', '#7c0f22', '#ffffff', '#2a324c'];

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function makeConfettiPiece(x, y, spreadBoost = 1) {
  const angle = Math.random() * Math.PI * 2;
  const speed = (Math.random() * 7.5 + 5) * spreadBoost;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 3.7,
    gravity: 0.13 + Math.random() * 0.08,
    drag: 0.988,
    size: Math.random() * 8 + 4,
    color: confettiColors[(Math.random() * confettiColors.length) | 0],
    life: 118 + Math.random() * 86,
    rotation: Math.random() * Math.PI,
    rotateSpeed: (Math.random() - 0.5) * 0.22,
  };
}

function burstConfetti(amount, x, y, spreadBoost = 1) {
  for (let i = 0; i < amount; i += 1) {
    confettiPieces.push(makeConfettiPiece(x, y, spreadBoost));
  }
}

function drawConfettiPiece(piece) {
  confettiCtx.save();
  confettiCtx.translate(piece.x, piece.y);
  confettiCtx.rotate(piece.rotation);
  confettiCtx.fillStyle = piece.color;
  confettiCtx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.62);
  confettiCtx.restore();
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiPieces = confettiPieces.filter((piece) => piece.life > 0 && piece.y < confettiCanvas.height + 90);

  for (const piece of confettiPieces) {
    piece.vx *= piece.drag;
    piece.vy += piece.gravity;
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.rotation += piece.rotateSpeed;
    piece.life -= 1;
    drawConfettiPiece(piece);
  }

  if (confettiPieces.length > 0) {
    confettiAnim = requestAnimationFrame(animateConfetti);
  } else {
    confettiAnim = null;
  }
}

function launchConfettiShow() {
  const centerX = confettiCanvas.width / 2;
  const centerY = Math.min(confettiCanvas.height * 0.34, 260);
  burstConfetti(320, centerX, centerY, 1.5);
  burstConfetti(150, confettiCanvas.width * 0.16, confettiCanvas.height * 0.25, 1.12);
  burstConfetti(150, confettiCanvas.width * 0.84, confettiCanvas.height * 0.25, 1.12);

  let rounds = 0;
  const rain = setInterval(() => {
    rounds += 1;
    burstConfetti(62, Math.random() * confettiCanvas.width, -14, 0.88);
    if (rounds >= 11) clearInterval(rain);
  }, 220);

  if (!confettiAnim) animateConfetti();
}

function normalizeCandidates(csv, fallbackSrc = '') {
  const all = [];
  const add = (value) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!all.includes(trimmed)) all.push(trimmed);
  };

  if (csv) {
    csv.split(',').forEach(add);
  }
  add(fallbackSrc);
  return all;
}

function loadImageFromCandidates(candidates) {
  return new Promise((resolve, reject) => {
    let index = 0;

    const tryNext = () => {
      if (index >= candidates.length) {
        reject(new Error('No candidate image could be loaded.'));
        return;
      }

      const src = candidates[index];
      index += 1;

      const img = new Image();
      img.onload = () => resolve({ img, src });
      img.onerror = tryNext;
      img.src = src;
    };

    tryNext();
  });
}

async function resolveDomImage(imgEl) {
  const candidates = normalizeCandidates(imgEl.dataset.srcList, imgEl.getAttribute('src'));

  try {
    const result = await loadImageFromCandidates(candidates);
    imgEl.src = result.src;
    return true;
  } catch {
    const frame = imgEl.closest('figure') || imgEl;
    frame.classList.add('is-hidden');
    return false;
  }
}

async function resolveAllGalleryImages() {
  const imageEls = [...document.querySelectorAll('img[data-src-list]')];
  await Promise.all(imageEls.map((img) => resolveDomImage(img)));

  const optionalGalleryIds = ['benny-extra-grid', 'family-grid'];
  for (const id of optionalGalleryIds) {
    const grid = document.getElementById(id);
    if (!grid) continue;
    const visible = [...grid.querySelectorAll('figure')].some((figure) => !figure.classList.contains('is-hidden'));
    if (!visible) {
      const section = grid.closest('section');
      if (section) section.classList.add('is-hidden');
    }
  }
}

function createPosterCard() {
  const card = document.createElement('article');
  card.className = 'poster-card';
  const draw = document.createElement('canvas');
  draw.width = 900;
  draw.height = 1125;
  card.append(draw);
  return { card, draw };
}

function drawFallbackSeal(ctx2d, x, y, radius) {
  ctx2d.fillStyle = '#d4af37';
  ctx2d.beginPath();
  ctx2d.arc(x, y, radius, 0, Math.PI * 2);
  ctx2d.fill();

  ctx2d.fillStyle = '#2c1d08';
  ctx2d.beginPath();
  ctx2d.arc(x, y, radius * 0.82, 0, Math.PI * 2);
  ctx2d.fill();

  ctx2d.fillStyle = '#f3e6b2';
  ctx2d.font = `${Math.floor(radius * 0.62)}px Cinzel`;
  ctx2d.textAlign = 'center';
  ctx2d.textBaseline = 'middle';
  ctx2d.fillText('B', x, y);
}

function drawBennySeal(ctx2d, bennyImage, x, y, radius) {
  if (!bennyImage) {
    drawFallbackSeal(ctx2d, x, y, radius);
    return;
  }

  ctx2d.save();
  ctx2d.beginPath();
  ctx2d.arc(x, y, radius, 0, Math.PI * 2);
  ctx2d.closePath();
  ctx2d.clip();
  ctx2d.drawImage(bennyImage, x - radius, y - radius, radius * 2, radius * 2);
  ctx2d.restore();

  ctx2d.lineWidth = radius * 0.08;
  ctx2d.strokeStyle = '#d4af37';
  ctx2d.beginPath();
  ctx2d.arc(x, y, radius + radius * 0.04, 0, Math.PI * 2);
  ctx2d.stroke();
}

function applyDuotone(imageData) {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = Math.min(255, avg * 0.65 + 80);
    data[i + 1] = Math.min(255, avg * 0.58 + 52);
    data[i + 2] = Math.min(255, avg * 0.74 + 44);
  }
}

function drawCourtPoster(ctx2d, sourceImage, bennyImage) {
  const w = ctx2d.canvas.width;
  const h = ctx2d.canvas.height;
  ctx2d.clearRect(0, 0, w, h);

  ctx2d.drawImage(sourceImage, 0, 0, w, h);
  const imageData = ctx2d.getImageData(0, 0, w, h);
  applyDuotone(imageData);
  ctx2d.putImageData(imageData, 0, 0);

  ctx2d.fillStyle = 'rgba(10, 11, 20, 0.34)';
  ctx2d.fillRect(0, 0, w, h);

  const gradient = ctx2d.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.48)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  ctx2d.fillStyle = gradient;
  ctx2d.fillRect(0, 0, w, h);

  drawBennySeal(ctx2d, bennyImage, w / 2, h * 0.24, w * 0.12);

  ctx2d.strokeStyle = 'rgba(212, 175, 55, 0.85)';
  ctx2d.lineWidth = 10;
  ctx2d.strokeRect(14, 14, w - 28, h - 28);
}

function drawWorldAssembly(ctx2d, bennyImage, accent) {
  const w = ctx2d.canvas.width;
  const h = ctx2d.canvas.height;
  ctx2d.clearRect(0, 0, w, h);

  const bg = ctx2d.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#101a2f');
  bg.addColorStop(1, '#04070f');
  ctx2d.fillStyle = bg;
  ctx2d.fillRect(0, 0, w, h);

  ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx2d.lineWidth = 2;
  for (let i = 1; i <= 5; i += 1) {
    ctx2d.beginPath();
    ctx2d.ellipse(w / 2, h * 0.45, w * (0.11 + i * 0.08), h * 0.08, 0, 0, Math.PI * 2);
    ctx2d.stroke();
  }

  drawBennySeal(ctx2d, bennyImage, w / 2, h * 0.24, w * 0.13);

  ctx2d.fillStyle = accent;
  for (let i = 0; i < 18; i += 1) {
    const x = (w / 18) * i + 18;
    const tall = 170 + (i % 3) * 16;
    ctx2d.fillRect(x, h - tall, 22, tall);
    ctx2d.beginPath();
    ctx2d.arc(x + 11, h - tall - 18, 16, 0, Math.PI * 2);
    ctx2d.fill();

    ctx2d.beginPath();
    ctx2d.moveTo(x + 11, h - tall + 26);
    ctx2d.lineTo(x - 14, h - tall + 62);
    ctx2d.lineTo(x + 36, h - tall + 62);
    ctx2d.closePath();
    ctx2d.fill();
  }

  ctx2d.strokeStyle = 'rgba(212, 175, 55, 0.85)';
  ctx2d.lineWidth = 10;
  ctx2d.strokeRect(14, 14, w - 28, h - 28);
}

async function tryLoadOptionalImage(candidates) {
  try {
    const result = await loadImageFromCandidates(candidates);
    return result.img;
  } catch {
    return null;
  }
}

async function loadRequiredImage(candidates) {
  const result = await loadImageFromCandidates(candidates);
  return result.img;
}

async function buildPosters() {
  const courtGrid = document.getElementById('court-grid');
  const worldGrid = document.getElementById('world-grid');
  if (!courtGrid || !worldGrid) return;

  const bennyImage = await tryLoadOptionalImage(['images/benny.jpg', 'images/benny.png', 'images/IMG_8289.jpg']);

  const courtSourceSets = [
    ['images/family-pool.jpg', 'images/family-pool.png', 'images/IMG_8291.jpg'],
    ['images/family-waterfront.jpg', 'images/family-waterfront.png', 'images/IMG_8290.jpg'],
    ['images/auntyg-and-family.jpg', 'images/auntyg-and-family.png', 'images/IMG_8288.jpg'],
  ];

  const courtImages = [];
  for (const sourceSet of courtSourceSets) {
    try {
      const img = await loadRequiredImage(sourceSet);
      courtImages.push(img);
    } catch {
      // Keep rendering with whichever images are available.
    }
  }

  for (const srcImage of courtImages) {
    const { card, draw } = createPosterCard();
    const ctx2d = draw.getContext('2d', { willReadFrequently: true });
    drawCourtPoster(ctx2d, srcImage, bennyImage);
    courtGrid.appendChild(card);
  }

  const assemblyAccents = [
    'rgba(212, 175, 55, 0.78)',
    'rgba(154, 32, 58, 0.78)',
    'rgba(212, 175, 55, 0.78)',
    'rgba(154, 32, 58, 0.78)',
  ];

  for (const accent of assemblyAccents) {
    const { card, draw } = createPosterCard();
    const ctx2d = draw.getContext('2d');
    drawWorldAssembly(ctx2d, bennyImage, accent);
    worldGrid.appendChild(card);
  }

  if (courtImages.length === 0) {
    const courtSection = courtGrid.closest('section');
    if (courtSection) courtSection.classList.add('is-hidden');
  }
}

resizeConfetti();
window.addEventListener('resize', resizeConfetti);
window.addEventListener(
  'load',
  async () => {
    launchConfettiShow();
    await resolveAllGalleryImages();
    await buildPosters();
  },
  { once: true }
);
