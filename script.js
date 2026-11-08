const canvas = document.getElementById("fireworks");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let dpr = 1;

let rockets = [];
let particles = [];
let stars = [];

let audioContext = null;
let noiseBuffer = null;
let masterVolume = 0.7;
let isMuted = false;
let activeSounds = [];
// 音量コントロール
const volumeSlider = document.getElementById("volumeSlider");
const volumeValue = document.getElementById("volumeValue");
const muteButton = document.getElementById("muteButton");

volumeSlider.addEventListener("input", () => {
  masterVolume = Number(volumeSlider.value) / 100;
  volumeValue.textContent = volumeSlider.value + "%";
  activeSounds.forEach(item => {
    item.volume = isMuted ? 0 : masterVolume;
  });
});
  

muteButton.addEventListener("click", () => {
  isMuted = !isMuted;
  muteButton.textContent = isMuted ? "🔇" : "🔊";

  activeSounds.forEach(item => {
  item.volume = isMuted ? 0 : masterVolume;
});
  });
const colors = [
  "#ff4545",
  "#ffcf45",
  "#45c9ff",
  "#ff70d9",
  "#9c7bff",
  "#65ffad",
  "#ffffff"
];

// 画面サイズ調整
function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createStars();
}

window.addEventListener("resize", resizeCanvas);

// 星を作る
function createStars() {
  stars = [];

  for (let i = 0; i < 65; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.5,
      phase: Math.random() * Math.PI * 2
    });
  }
}

// 星を描く
function drawStars(time) {
  stars.forEach(star => {
    const glow = 0.4 +
      Math.sin(time * 0.0015 + star.phase) * 0.3;

    ctx.globalAlpha = glow;
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(
      star.x,
      star.y,
      star.size,
      0,
      Math.PI * 2
    );

    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

// 音声の準備
function setupAudio() {
  if (audioContext) {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    return;
  }

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return;

  audioContext = new AudioContextClass();

  const bufferSize = audioContext.sampleRate * 1;

  noiseBuffer = audioContext.createBuffer(
    1,
    bufferSize,
    audioContext.sampleRate
  );

  const data = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  audioContext.resume();
}

// 打ち上げ音
// 打ち上げ音：2秒間の滑らかな風切り音
function playLaunchSound() {
  if (!audioContext || !noiseBuffer) return;

  const now = audioContext.currentTime;

  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();

  source.buffer = noiseBuffer;
  source.loop = true;

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(350, now);
  filter.frequency.exponentialRampToValueAtTime(
    1400,
    now + 1.2
  );
  filter.frequency.exponentialRampToValueAtTime(
    700,
    now + 2
  );

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(
    0.13,
    now + 0.3
  );
  gain.gain.setValueAtTime(0.13, now + 1.5);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 2
  );

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  source.start(now);
  source.stop(now + 2);
}

// 爆発音：重厚な花火のドーン！
function playExplosionSound() {
  if (!audioContext || !noiseBuffer) return;

  const now = audioContext.currentTime;

  // 空気が震えるような低音
  const boom = audioContext.createOscillator();
  const boomGain = audioContext.createGain();

  boom.type = "sine";

  boom.frequency.setValueAtTime(85, now);
  boom.frequency.exponentialRampToValueAtTime(
    35,
    now + 0.9
  );

  boomGain.gain.setValueAtTime(0.001, now);
  boomGain.gain.linearRampToValueAtTime(
    0.32,
    now + 0.08
  );
  boomGain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 1.1
  );

  boom.connect(boomGain);
  boomGain.connect(audioContext.destination);

  boom.start(now);
  boom.stop(now + 1.1);

  // 花火が空気を震わせる音
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();

  source.buffer = noiseBuffer;

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(700, now);
  filter.frequency.exponentialRampToValueAtTime(
    180,
    now + 0.8
  );

  noiseGain.gain.setValueAtTime(0.001, now);
  noiseGain.gain.linearRampToValueAtTime(
    0.16,
    now + 0.06
  );
  noiseGain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 0.85
  );

  source.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audioContext.destination);

  source.start(now);
  source.stop(now + 0.9);
}
// 花火の形を決める
function createShape(type) {
  const points = [];

  if (type === 3) {
    // ハート
    for (let i = 0; i < 65; i++) {
      const t = Math.PI * 2 * i / 65;

      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(
        13 * Math.cos(t)
        - 5 * Math.cos(2 * t)
        - 2 * Math.cos(3 * t)
        - Math.cos(4 * t)
      );

      points.push({ x, y });
    }
  } else if (type === 4) {
    // 星
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 === 0 ? 16 : 7;

      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }
  } else if (type === 5) {
    // にこにこ
    for (let i = 0; i < 42; i++) {
      const t = Math.PI * 2 * i / 42;

      points.push({
        x: Math.cos(t) * 15,
        y: Math.sin(t) * 15
      });
    }

    // 目
    points.push({ x: -6, y: -4 });
    points.push({ x: 6, y: -4 });

    // 口
    for (let i = 0; i < 12; i++) {
      const t = Math.PI * i / 11;

      points.push({
        x: Math.cos(t) * 7,
        y: 4 + Math.sin(t) * 5
      });
    }
  }

  return points;
}

// 花火を打ち上げる
function launchFirework(x, y) {
  const startX = width * (
    0.15 + Math.random() * 0.7
  );

  const startY = height + 10;

  const type = Math.floor(Math.random() * 6);

  const color = colors[
    Math.floor(Math.random() * colors.length)
  ];

  const size = 0.75 + Math.random() * 0.65;

  rockets.push({
    x: startX,
    y: startY,
    startX,
    startY,
    targetX: x,
    targetY: y,
    progress: 0,
    startTime: performance.now(),
    duration: 1400,
    color,
    type,
    size
  });

  const sound = new Audio("hanabi-sound.wav");
sound.volume = isMuted ? 0 : masterVolume;

activeSounds.push(sound);

sound.addEventListener("ended", () => {
  activeSounds = activeSounds.filter(item => item !== sound);
});

sound.play().catch(() => {});
}
// 爆発させる
function explode(rocket) {
  

  const shape = createShape(rocket.type);

  const count = shape.length > 0 ? shape.length : 85;

  for (let i = 0; i < count; i++) {
    let angle;
    let speed;

    if (shape.length > 0) {
      angle = Math.atan2(
        shape[i].y,
        shape[i].x
      );

      speed = Math.sqrt(
        shape[i].x ** 2 + shape[i].y ** 2
      ) / 16;
    } else {
      angle = Math.PI * 2 * Math.random();
      speed = 0.4 + Math.random() * 1.3;
    }

    particles.push({
      x: rocket.x,
      y: rocket.y,
      vx: Math.cos(angle) * speed * rocket.size * 3.5,
      vy: Math.sin(angle) * speed * rocket.size * 3.5,
      life: 1,
      decay: 0.009 + Math.random() * 0.009,
      color: rocket.type === 2
        ? colors[Math.floor(Math.random() * colors.length)]
        : rocket.color,
      size: 2 + Math.random() * 2
    });
  }

  // 周囲に小さなキラキラを追加
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;

    particles.push({
      x: rocket.x,
      y: rocket.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.02,
      color: "#ffffff",
      size: 1.5 + Math.random() * 2
    });
  }
}

// 花火を描く
function drawRocket(rocket) {
  ctx.save();

  ctx.shadowBlur = 18;
  ctx.shadowColor = rocket.color;
  ctx.fillStyle = rocket.color;

  ctx.beginPath();
  ctx.arc(rocket.x, rocket.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 火花を描く
function drawParticles() {
  particles.forEach(p => {
    ctx.save();

    ctx.globalAlpha = Math.max(0, p.life);
    ctx.shadowBlur = 12;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    p.x += p.vx;
    p.y += p.vy;

    p.vy += 0.035;

    p.vx *= 0.985;
    p.vy *= 0.985;

    p.life -= p.decay;
  });

  particles = particles.filter(p => p.life > 0);
}

// メインアニメーション
function animate(time) {
  ctx.clearRect(0, 0, width, height);

  drawStars(time);

  rockets.forEach(rocket => {
      rocket.progress = Math.min(
      (time - rocket.startTime) / rocket.duration,
      1
    );

    const t = Math.min(rocket.progress, 1);

    rocket.x =
      rocket.startX +
      (rocket.targetX - rocket.startX) * t;

    rocket.y =
      rocket.startY +
      (rocket.targetY - rocket.startY) * t;

    drawRocket(rocket);
  });

  const finished = rockets.filter(
    rocket => rocket.progress >= 1
  );

  finished.forEach(explode);

  rockets = rockets.filter(
    rocket => rocket.progress < 1
  );

  drawParticles();

  requestAnimationFrame(animate);
}

// タップした場所に花火を打ち上げる
canvas.addEventListener("pointerdown", event => {
  event.preventDefault();

  setupAudio();

  const rect = canvas.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  launchFirework(
    x,
    Math.max(100, Math.min(y, height - 100))
  );
});

// 初期化
resizeCanvas();
requestAnimationFrame(animate);
