// Configuration & Constants
const academicStartDate = new Date("2025-02-09T10:00:00");
const academicTargetDate = new Date("2026-12-02T14:00:00");
const PLStart = new Date("2026-10-14T00:00:00");
const excursionDate = new Date("2026-09-04T07:00:00");
const vacationEndDate = new Date("2026-09-19T23:59:59");

const backgroundGradients = {
  morning: 'linear-gradient(135deg, #ff8c00 0%, #ffd700 50%, #43e8d8 100%)',
  day: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #00f2fe 100%)',
  evening: 'linear-gradient(135deg, #ff4500 0%, #ff8c00 50%, #4b0082 100%)',
  night: 'linear-gradient(135deg, #000428 0%, #004e92 50%, #000428 100%)'
};

function isWeeklyHoliday(d) {
  return d.getDay() === 5 || d.getDay() === 6; // Friday/Saturday
}

function isExcursionVacation(d) {
  return d >= excursionDate && d <= vacationEndDate;
}

function getWorkingDaysRemaining(now) {
  if (now >= PLStart) return 0;

  let d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let count = 0;

  while (d < PLStart) {
    if (!isWeeklyHoliday(d) && !isExcursionVacation(d)) count++;
    d.setDate(d.getDate() + 1);
  }

  return count;
}

function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 10) return { id: 'morning', icon: '🌅' };
  if (hour >= 10 && hour < 17) return { id: 'day', icon: '🌞' };
  if (hour >= 17 && hour < 21) return { id: 'evening', icon: '🌇' };
  return { id: 'night', icon: '🌙' };
}

const body = document.getElementById('body');
const timeIcon = document.getElementById('time-icon');
const mainTitle = document.getElementById('main-title');
const valDays = document.getElementById('val-days');
const valHours = document.getElementById('val-hours');
const valMins = document.getElementById('val-mins');
const valSecs = document.getElementById('val-secs');
const progressBar = document.getElementById('progress-bar');
const progressEmoji = document.getElementById('progress-emoji');
const progressText = document.getElementById('progress-text');
const statTotal = document.getElementById('stat-total');
const statCompleted = document.getElementById('stat-completed');
const statWorking = document.getElementById('stat-working');
const appShell = document.getElementById('main-container');

let resizeFrame;

function fitDashboardToViewport() {
  cancelAnimationFrame(resizeFrame);

  resizeFrame = requestAnimationFrame(() => {
    appShell.style.setProperty('--dashboard-scale', '1');

    const bodyStyles = getComputedStyle(body);
    const horizontalPadding = parseFloat(bodyStyles.paddingLeft) + parseFloat(bodyStyles.paddingRight);
    const verticalPadding = parseFloat(bodyStyles.paddingTop) + parseFloat(bodyStyles.paddingBottom);
    const availableWidth = Math.max(1, window.innerWidth - horizontalPadding);
    const availableHeight = Math.max(1, window.innerHeight - verticalPadding);
    const fitScale = Math.min(
      1,
      availableWidth / appShell.offsetWidth,
      availableHeight / appShell.offsetHeight
    );
    const scale = fitScale < 1 ? fitScale * 0.96 : fitScale;

    appShell.style.setProperty('--dashboard-scale', Math.max(0.35, scale).toFixed(4));
  });
}

window.addEventListener('resize', fitDashboardToViewport, { passive: true });
window.visualViewport?.addEventListener('resize', fitDashboardToViewport, { passive: true });
fitDashboardToViewport();

const urlParams = new URLSearchParams(window.location.search);
const isWidgetMode = urlParams.get('widget') === 'true';

if (isWidgetMode) {
  body.classList.add('widget-mode');
}

let lastBg = '';

function update() {
  const now = new Date();
  const tod = getTimeOfDay(now.getHours());
  const nextBg = backgroundGradients[tod.id];

  if (!isWidgetMode && lastBg !== nextBg) {
    body.style.background = nextBg;
    lastBg = nextBg;
    timeIcon.textContent = tod.icon;
  }

  const totalDuration = academicTargetDate.getTime() - academicStartDate.getTime();
  const elapsed = now.getTime() - academicStartDate.getTime();
  const remaining = Math.max(0, academicTargetDate.getTime() - now.getTime());

  const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
  let completedDays = Math.floor(elapsed / (1000 * 60 * 60 * 24));
  completedDays = Math.max(0, Math.min(completedDays, totalDays));

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  const progress = Math.max(0, Math.min(1, elapsed / totalDuration));
  const percentage = (progress * 100).toFixed(2);
  const isComplete = remaining === 0;

  valDays.textContent = days.toString().padStart(2, '0');
  valHours.textContent = hours.toString().padStart(2, '0');
  valMins.textContent = minutes.toString().padStart(2, '0');
  valSecs.textContent = seconds.toString().padStart(2, '0');

  if (!isWidgetMode) {
    progressBar.style.width = `${percentage}%`;
    progressEmoji.style.left = `${percentage}%`;
    progressText.textContent = `${percentage}%`;

    statTotal.textContent = totalDays;
    statCompleted.textContent = completedDays;
    statWorking.textContent = getWorkingDaysRemaining(now);

    if (isComplete) {
      mainTitle.textContent = 'Academic Journey Completed!';
      progressText.classList.add('complete');
    } else {
      mainTitle.textContent = 'Academic Journey';
      progressText.classList.remove('complete');
    }
  }
}

let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (!isWidgetMode && !isStandalone) {
    installBtn.classList.remove('hidden');
  }
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    installBtn.classList.add('hidden');
  }

  deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
  installBtn.classList.add('hidden');
});

const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

if (isIOS && !isStandalone && !isWidgetMode) {
  installBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" x2="12" y1="15" y2="3"></line>
    </svg>
    <span>Install on iOS</span>
  `;
  installBtn.classList.remove('hidden');
  installBtn.addEventListener('click', () => {
    alert("To install on iOS:\n1. Tap the Share button in Safari.\n2. Tap 'Add to Home Screen'.");
  });
}

update();
setInterval(update, 1000);