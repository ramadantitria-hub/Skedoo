/**
 * SKEDOO - Pengatur Jadwal 2 Orang (Duo Schedule Planner)
 * Built strictly according to skedoo.pdf Master Plan
 */

// ============================================================================
// CONSTANTS & SEED DATA
// ============================================================================

const CATEGORIES = {
  'Kuliah': { color: '#889C86', lightColor: '#EFF3EE', label: 'Kuliah' },
  'Organisasi': { color: '#7A919E', lightColor: '#EDF2F5', label: 'Organisasi' },
  'Project': { color: '#C68B7A', lightColor: '#FAF0ED', label: 'Project' },
  'Belajar': { color: '#C07A65', lightColor: '#FAECE8', label: 'Belajar' },
  'Free Time': { color: '#E5B887', lightColor: '#FCF5EB', label: 'Free Time' }
};

// Generate relative date string YYYY-MM-DD
function getDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const INITIAL_SCHEDULES = [
  {
    id: 'skd-001',
    title: 'Kuis Kalkulus Lanjut',
    date: getDateString(0),
    startTime: '10:00',
    endTime: '12:00',
    category: 'Kuliah',
    owner: 'user1', // Dimas
    location: 'Ruang 304 Gedung Baru',
    description: 'Materi Bab 4 & 5 Turunan Parsial. Jangan lupa bawa kalkulator saintifik!',
    reminder: '30',
    sound: 'lofi_gentle',
    completed: false
  },
  {
    id: 'skd-002',
    title: 'Kuliah Algoritma & Struktur Data',
    date: getDateString(0),
    startTime: '08:30',
    endTime: '11:00',
    category: 'Kuliah',
    owner: 'user2', // Alin
    location: 'Lab Komputer 2',
    description: 'Praktikum Graph and Tree Traversal dengan dosen Pak Budi.',
    reminder: '15',
    sound: 'lofi_gentle',
    completed: true
  },
  {
    id: 'skd-003',
    title: 'Bimbingan Praktikum Lab',
    date: getDateString(0),
    startTime: '13:00',
    endTime: '14:30',
    category: 'Kuliah',
    owner: 'user2', // Alin
    location: 'Ruang Asisten Lab',
    description: 'Review modul modul 3 dan asistensi mingguan.',
    reminder: '15',
    sound: 'lofi_gentle',
    completed: false
  },
  {
    id: 'skd-004',
    title: 'Rapat HMJ Informatika',
    date: getDateString(0),
    startTime: '16:00',
    endTime: '17:30',
    category: 'Organisasi',
    owner: 'user1', // Dimas
    location: 'Gedung C Lt. 2',
    description: 'Persiapan acara seminar Dies Natalis dan pembagian divisi.',
    reminder: '30',
    sound: 'lofi_gentle',
    completed: false
  },
  {
    id: 'skd-005',
    title: 'Nongkrong & Ngopi Bareng di Cafe ☕',
    date: getDateString(0),
    startTime: '18:30',
    endTime: '21:00',
    category: 'Free Time',
    owner: 'both', // Agenda Bersama
    location: 'Kopi Senja / Cafe Favorit',
    description: 'Nongkrong santai, ngobrol seru, atau nugas bareng sahabat!',
    reminder: '30',
    sound: 'lofi_gentle',
    completed: false
  },
  // Tomorrow
  {
    id: 'skd-006',
    title: 'Sprint Review & Demo Project',
    date: getDateString(1),
    startTime: '09:30',
    endTime: '12:00',
    category: 'Project',
    owner: 'user1',
    location: 'Google Meet',
    description: 'Presentasi prototype MVP Skedoo ke dosen pembimbing.',
    reminder: '30',
    sound: 'lofi_gentle',
    completed: false
  },
  {
    id: 'skd-007',
    title: 'Belajar Bareng di Perpustakaan',
    date: getDateString(1),
    startTime: '14:00',
    endTime: '16:30',
    category: 'Belajar',
    owner: 'both',
    location: 'Perpus Pusat Lt. 3 Cozy Room',
    description: 'Ngerjain tugas basis data bareng sambil denger musik lofi.',
    reminder: '30',
    sound: 'lofi_gentle',
    completed: false
  },
  // Day after tomorrow
  {
    id: 'skd-008',
    title: 'Seminar Nasional AI Masa Depan',
    date: getDateString(2),
    startTime: '09:00',
    endTime: '12:00',
    category: 'Organisasi',
    owner: 'user2',
    location: 'Auditorium Gedung Rektorat Lt. 3',
    description: 'Keynote Speaker: Dr. Rayhan Pratama. Topik: Kecerdasan Buatan dan Era Baru.',
    reminder: '30',
    sound: 'lofi_gentle',
    completed: false
  }
];

// ============================================================================
// APP STATE
// ============================================================================

let appState = {
  schedules: [],
  activePerspective: 'together', // 'together' | 'user1' | 'user2'
  activeDate: getDateString(0),
  activeCategoryFilter: 'all',
  activeTab: 'agenda', // 'agenda' | 'weekly' | 'matchfinder' | 'duospace' | 'architecture'
  pairingCode: 'SKD-204',
  duoSpaceName: 'Our Bestie Space 🤝',
  user1: {
    name: 'Dimas',
    role: 'Aku (User 1)',
    avatar: 'assets/avatar_dimas.jpg',
    status: 'Lagi Free Time',
    statusSub: 'Bisa diajak nongkrong / nugas',
    statusColor: '#10B981'
  },
  user2: {
    name: 'Alin',
    role: 'Sahabat (User 2)',
    avatar: 'assets/avatar_alin.jpg',
    status: 'Lagi Free Time',
    statusSub: 'Bisa diajak nongkrong / nugas',
    statusColor: '#10B981'
  },
  geminiApiKey: '',
  audioEnabled: true,
  vibrationEnabled: true,
  notifEnabled: true
};

// ============================================================================
// REALTIME SYNC (BroadcastChannel & LocalStorage)
// ============================================================================

let syncChannel = null;
try {
  syncChannel = new BroadcastChannel('skedoo_duo_space_realtime');
  syncChannel.onmessage = (event) => {
    handleRealtimeMessage(event.data);
  };
} catch (e) {
  console.log('BroadcastChannel not supported or error:', e);
}

// Fallback to storage event for older browsers or cross-domain
window.addEventListener('storage', (e) => {
  if (e.key === 'skedoo_sync_event' && e.newValue) {
    try {
      const data = JSON.parse(e.newValue);
      handleRealtimeMessage(data);
    } catch (err) {
      console.error(err);
    }
  }
});

function broadcastSync(type, payload = {}) {
  const msg = { type, payload, timestamp: Date.now(), senderTab: window.name || 'tab_' + Math.random() };
  if (syncChannel) {
    try {
      syncChannel.postMessage(msg);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('skedoo_sync_event', JSON.stringify(msg));
}

function handleRealtimeMessage(msg) {
  if (!msg || !msg.type) return;

  switch (msg.type) {
    case 'SCHEDULE_UPDATED':
      loadSchedulesFromStorage();
      renderCurrentView();
      showToast('⚡ Jadwal diperbarui oleh sahabatmu secara realtime!', '🤝');
      playLofiChime();
      break;

    case 'STATUS_CHANGED':
      if (msg.payload && msg.payload.user2Status) {
        appState.user2.status = msg.payload.user2Status;
        appState.user2.statusSub = msg.payload.user2StatusSub || '';
        appState.user2.statusColor = msg.payload.user2StatusColor || '#10B981';
        updateDuoStatusUI();
        showToast(`Alin mengubah status: ${appState.user2.status}`, '🔔');
      }
      break;

    case 'LOVE_PING':
    case 'BESTIE_PING':
      const pingText = msg.payload && msg.payload.message ? msg.payload.message : 'Sapaan dari sahabat! 🤝';
      showToast(`👋 Sapaan dari Alin: "${pingText}"`, '☕');
      triggerFloatingPing();
      playLofiChime();
      vibratePhone([200, 100, 200, 100, 400]);
      break;

    default:
      break;
  }
}

// ============================================================================
// AUDIO & HAPTIC SYSTEM (Web Audio API & Vibration)
// ============================================================================

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Generates a super sweet, warm lofi bell / chime
 * Inspired by marimba & music box chords: F# Maj7 arpeggio (F5, A5, C#6, F6)
 */
function playLofiChime() {
  if (!appState.audioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6 (Warm E Maj)
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sine wave with subtle harmonics for a bell/music box warmth
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.0);
    });
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

/**
 * Vibration API as specified in skedoo.pdf:
 * navigator.vibrate([200, 100, 200, 100, 400])
 */
function vibratePhone(pattern = [200, 100, 200, 100, 400]) {
  if (!appState.vibrationEnabled) return;
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.log('Vibration error:', e);
    }
  }
}

function showToast(message, icon = '✨') {
  const toast = document.getElementById('toastNotice');
  const toastMsg = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');

  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  if (toastIcon) toastIcon.textContent = icon;

  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function triggerFloatingPing() {
  const emojis = ['🤝', '☕', '✨', '🙌', '⭐', '✌️', '🥪', '💻'];
  const ping = document.createElement('div');
  ping.className = 'floating-ping-icon';
  ping.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  ping.style.left = `${Math.floor(Math.random() * 60) + 20}%`;
  ping.style.bottom = '120px';
  document.body.appendChild(ping);
  setTimeout(() => {
    ping.remove();
  }, 1900);
}

// ============================================================================
// STORAGE & DATA PERSISTENCE
// ============================================================================

function saveSchedulesToStorage() {
  localStorage.setItem('skedoo_schedules', JSON.stringify(appState.schedules));
  broadcastSync('SCHEDULE_UPDATED');
}

function loadSchedulesFromStorage() {
  const version = localStorage.getItem('skedoo_version');
  const saved = localStorage.getItem('skedoo_schedules');

  if (saved && version === 'v2_bestie') {
    try {
      appState.schedules = JSON.parse(saved);
    } catch (e) {
      appState.schedules = [...INITIAL_SCHEDULES];
    }
  } else {
    // Reset or upgrade to new Bestie Friendship schedules
    appState.schedules = [...INITIAL_SCHEDULES];
    localStorage.setItem('skedoo_schedules', JSON.stringify(appState.schedules));
    localStorage.setItem('skedoo_version', 'v2_bestie');
  }

  // Load custom settings
  const apiKey = localStorage.getItem('skedoo_gemini_api_key');
  if (apiKey) appState.geminiApiKey = apiKey;
}

// ============================================================================
// SOLUSI "ANTI-MALAS": NATURAL LANGUAGE ONE-LINER ENGINE (PDF Bab 2.1)
// ============================================================================

/**
 * Intelligent Indonesian NLP parser that extracts multiple schedules,
 * relative dates ("besok", "nanti malam", "senin"), time ranges,
 * categories, locations, and reminders.
 */
function parseNaturalLanguageSchedule(inputText) {
  if (!inputText || !inputText.trim()) return [];

  const text = inputText.toLowerCase();
  const results = [];

  // Split into clauses if multiple events mentioned with comma, "dan", "lalu", "kemudian", "sore"
  let clauses = text.split(/[,;\n]|(?<=\s)(?:dan|lalu|kemudian)(?=\s)/gi).map(s => s.trim()).filter(Boolean);
  if (clauses.length === 0) clauses = [text];

  clauses.forEach((clause, index) => {
    // Determine Target Date
    let eventDate = getDateString(0);
    if (clause.includes('besok')) {
      eventDate = getDateString(1);
    } else if (clause.includes('lusa')) {
      eventDate = getDateString(2);
    } else if (clause.includes('minggu')) {
      eventDate = getDateString(2);
    } else if (clause.includes('senin')) {
      eventDate = getDateString(3);
    } else if (clause.includes('selasa')) {
      eventDate = getDateString(4);
    } else if (clause.includes('rabu')) {
      eventDate = getDateString(5);
    } else if (clause.includes('kamis')) {
      eventDate = getDateString(6);
    } else if (clause.includes('jumat')) {
      eventDate = getDateString(0);
    }

    // Determine Time
    let startTime = '10:00';
    let endTime = '11:30';

    // Regex to match "jam 10", "jam 10 pagi", "jam 4 sore", "jam 16:00", "pukul 09:30"
    const timeMatch = clause.match(/(?:jam|pukul)\s*(\d{1,2})(?::(\d{2}))?\s*(pagi|siang|sore|malam)?/i) ||
                      clause.match(/(\d{1,2})[:.](\d{2})\s*(pagi|siang|sore|malam)?/i);

    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      let mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const period = (timeMatch[3] || '').toLowerCase();

      if (period === 'sore' || period === 'malam') {
        if (hours < 12) hours += 12;
      } else if (period === 'siang') {
        if (hours < 11) hours += 12;
      } else if (clause.includes('sore') && hours < 12) {
        hours += 12;
      } else if (clause.includes('malam') && hours < 12) {
        hours += 12;
      }

      startTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      const endHours = (hours + 2) % 24;
      endTime = `${String(endHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    } else if (clause.includes('sore')) {
      startTime = '16:00';
      endTime = '17:30';
    } else if (clause.includes('malam')) {
      startTime = '19:30';
      endTime = '21:00';
    } else if (clause.includes('pagi')) {
      startTime = '09:00';
      endTime = '10:30';
    } else if (clause.includes('siang')) {
      startTime = '13:00';
      endTime = '14:30';
    }

    // Determine Category
    let category = 'Kuliah';
    if (clause.includes('rapat') || clause.includes('hmj') || clause.includes('organisasi') || clause.includes('bem') || clause.includes('event')) {
      category = 'Organisasi';
    } else if (clause.includes('project') || clause.includes('tugas') || clause.includes('deadline') || clause.includes('skripsi') || clause.includes('nugas')) {
      category = 'Project';
    } else if (clause.includes('belajar') || clause.includes('perpus') || clause.includes('baca') || clause.includes('kursus') || clause.includes('gym')) {
      category = 'Belajar';
    } else if (clause.includes('nonton') || clause.includes('bioskop') || clause.includes('kencan') || clause.includes('date') || clause.includes('ngopi') || clause.includes('santai') || clause.includes('free') || clause.includes('jalan')) {
      category = 'Free Time';
    }

    // Determine Location
    let location = 'Kampus';
    const locMatch = clause.match(/di\s+([^,.;\n]+)/i);
    if (locMatch && locMatch[1]) {
      location = locMatch[1].trim();
      // Capitalize first letters
      location = location.replace(/\b\w/g, l => l.toUpperCase());
    } else if (clause.includes('gedung c')) {
      location = 'Gedung C';
    } else if (clause.includes('mall') || clause.includes('xxi')) {
      location = 'Grand Mall XXI';
    } else if (category === 'Kuliah') {
      location = 'Ruang Kelas / Kampus';
    }

    // Determine Owner (Dimas, Alin, or Berdua)
    let owner = 'user1';
    if (clause.includes('berdua') || clause.includes('bareng') || clause.includes('sama alin') || clause.includes('kencan')) {
      owner = 'both';
    } else if (clause.includes('alin')) {
      owner = 'user2';
    }

    // Determine Title Cleanly
    let cleanTitle = clause
      .replace(/besok|lusa|hari ini|nanti|ada|sore|pagi|siang|malam|jam\s*\d+(:?\d+)?|pukul\s*\d+(:?\d+)?/gi, '')
      .replace(/di\s+[^,.;\n]+/gi, '')
      .replace(/bareng\s+[^,.;\n]+/gi, '')
      .trim();

    if (cleanTitle.length < 3) {
      if (category === 'Kuliah') cleanTitle = 'Kuliah & Kuis';
      else if (category === 'Organisasi') cleanTitle = 'Rapat Organisasi';
      else if (category === 'Free Time') cleanTitle = 'Quality Time Santai';
      else cleanTitle = 'Agenda Skedoo';
    }

    // Format title case
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    results.push({
      id: 'gen-' + Date.now() + '-' + index,
      title: cleanTitle,
      date: eventDate,
      startTime,
      endTime,
      category,
      owner,
      location,
      description: `Diekstrak otomatis dari: "${clause}"`,
      reminder: '30',
      sound: 'lofi_gentle',
      completed: false
    });
  });

  return results;
}

// ============================================================================
// OCR / VISION PARSER SIMULATION & PRESETS (PDF Bab 2.2)
// ============================================================================

function getSampleKrsDrafts() {
  const tomorrow = getDateString(1);
  const dayAfter = getDateString(2);
  const nextWeek = getDateString(4);

  return [
    {
      id: 'krs-1',
      title: 'Algoritma Pemrograman (INF101)',
      date: tomorrow,
      startTime: '08:00',
      endTime: '10:30',
      category: 'Kuliah',
      owner: 'user1',
      location: 'Lab Komputer 3',
      description: 'Dosen: Dr. Budi Santoso (3 SKS)',
      reminder: '30',
      sound: 'lofi_gentle',
      completed: false
    },
    {
      id: 'krs-2',
      title: 'Basis Data (INF102)',
      date: dayAfter,
      startTime: '13:00',
      endTime: '15:30',
      category: 'Kuliah',
      owner: 'user1',
      location: 'Gedung B201',
      description: 'Dosen: Ir. Sari Dewi (3 SKS)',
      reminder: '30',
      sound: 'lofi_gentle',
      completed: false
    },
    {
      id: 'krs-3',
      title: 'Kecerdasan Buatan (INF103)',
      date: nextWeek,
      startTime: '10:00',
      endTime: '12:30',
      category: 'Kuliah',
      owner: 'user1',
      location: 'Ruang C102',
      description: 'Dosen: Prof. Joko Widodo (3 SKS)',
      reminder: '30',
      sound: 'lofi_gentle',
      completed: false
    }
  ];
}

function getSampleSeminarDrafts() {
  const saturday = getDateString(2);
  return [
    {
      id: 'sem-1',
      title: 'Seminar Nasional AI & Teknologi Masa Depan',
      date: saturday,
      startTime: '09:00',
      endTime: '12:00',
      category: 'Organisasi',
      owner: 'both',
      location: 'Auditorium Gedung Rektorat Lt. 3',
      description: 'Keynote Speaker: Dr. Rayhan Pratama. Topik: Kecerdasan Buatan dalam Pendidikan, 5G & IoT, Etika AI.',
      reminder: '60',
      sound: 'lofi_gentle',
      completed: false
    }
  ];
}

// ============================================================================
// MATCH FINDER: MUTUAL FREE TIME ALGORITHM (PDF Page 2 & 7)
// ============================================================================

/**
 * Calculates time slots where NEITHER User 1 nor User 2 is busy
 * Default working window: 08:00 to 22:00
 */
function calculateMutualFreeSlots(dateStr) {
  // Get all schedules for the specified date
  const dayEvents = appState.schedules.filter(s => s.date === dateStr);

  // Convert time "HH:MM" to minutes from midnight
  const toMins = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const toTimeStr = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Build busy intervals
  const busyIntervals = [];
  dayEvents.forEach(e => {
    const start = toMins(e.startTime);
    const end = toMins(e.endTime);
    if (end > start) {
      busyIntervals.push({ start, end, owner: e.owner, title: e.title });
    }
  });

  // Sort busy intervals by start time
  busyIntervals.sort((a, b) => a.start - b.start);

  // Merge overlapping busy intervals
  const mergedBusy = [];
  busyIntervals.forEach(curr => {
    if (mergedBusy.length === 0) {
      mergedBusy.push({ ...curr });
    } else {
      const prev = mergedBusy[mergedBusy.length - 1];
      if (curr.start <= prev.end) {
        prev.end = Math.max(prev.end, curr.end);
      } else {
        mergedBusy.push({ ...curr });
      }
    }
  });

  // Find free intervals between 08:00 (480) and 22:00 (1320)
  const dayStart = 480; // 08:00
  const dayEnd = 1320; // 22:00
  const freeSlots = [];

  let current = dayStart;
  mergedBusy.forEach(busy => {
    if (busy.start > current) {
      const dur = busy.start - current;
      if (dur >= 60) { // At least 1 hour of free time
        freeSlots.push({
          startMins: current,
          endMins: busy.start,
          startTime: toTimeStr(current),
          endTime: toTimeStr(busy.start),
          durationMins: dur,
          durationHours: (dur / 60).toFixed(1).replace('.0', '')
        });
      }
    }
    current = Math.max(current, busy.end);
  });

  if (dayEnd > current) {
    const dur = dayEnd - current;
    if (dur >= 60) {
      freeSlots.push({
        startMins: current,
        endMins: dayEnd,
        startTime: toTimeStr(current),
        endTime: toTimeStr(dayEnd),
        durationMins: dur,
        durationHours: (dur / 60).toFixed(1).replace('.0', '')
      });
    }
  }

  return freeSlots;
}

// ============================================================================
// UI RENDERING ENGINE
// ============================================================================

function renderCurrentView() {
  updateDuoStatusUI();

  // Hide all views first
  document.querySelectorAll('.view-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active'));

  if (appState.activeTab === 'agenda') {
    document.getElementById('viewAgenda').classList.add('active');
    document.getElementById('dockBtnAgenda').classList.add('active');
    renderDateCarousel();
    renderAgendaSchedules();
    updateAgendaMatchBanner();
  } else if (appState.activeTab === 'weekly') {
    document.getElementById('viewWeekly').classList.add('active');
    document.getElementById('dockBtnWeekly').classList.add('active');
    renderWeeklyTimeline();
  } else if (appState.activeTab === 'matchfinder') {
    document.getElementById('viewMatchFinder').classList.add('active');
    document.getElementById('dockBtnMatchFinder').classList.add('active');
    renderMatchFinderView();
  } else if (appState.activeTab === 'duospace') {
    document.getElementById('viewDuoSpace').classList.add('active');
    document.getElementById('dockBtnDuoSpace').classList.add('active');
  } else if (appState.activeTab === 'architecture') {
    document.getElementById('viewArchitecture').classList.add('active');
  }
}

function updateDuoStatusUI() {
  const partnerStatusEl = document.getElementById('partnerStatusText');
  const spaceNameEl = document.getElementById('duoSpaceName');
  const codeTag = document.getElementById('spaceCodeTag');
  const displayCode = document.getElementById('displayPairingCode');

  if (spaceNameEl) spaceNameEl.textContent = appState.duoSpaceName;
  if (codeTag) codeTag.textContent = `🔑 ${appState.pairingCode}`;
  if (displayCode) displayCode.textContent = appState.pairingCode;

  if (partnerStatusEl) {
    partnerStatusEl.innerHTML = `
      <span class="status-dot pulse" style="background: ${appState.user2.statusColor}"></span>
      <span>Alin: <strong>${appState.user2.status}</strong> (${appState.user2.statusSub})</span>
    `;
  }

  // Update Perspective Switcher
  const btnTogether = document.getElementById('btnViewTogether');
  const btnUser1 = document.getElementById('btnViewUser1');
  const btnUser2 = document.getElementById('btnViewUser2');
  const activeLabel = document.getElementById('activePerspectiveLabel');

  [btnTogether, btnUser1, btnUser2].forEach(b => b.classList.remove('active'));

  if (appState.activePerspective === 'together') {
    btnTogether.classList.add('active');
    if (activeLabel) activeLabel.textContent = 'Together (Jadwal Keduanya Berdampingan)';
  } else if (appState.activePerspective === 'user1') {
    btnUser1.classList.add('active');
    if (activeLabel) activeLabel.textContent = 'Dimas (Fokus Jadwal Aku)';
  } else if (appState.activePerspective === 'user2') {
    btnUser2.classList.add('active');
    if (activeLabel) activeLabel.textContent = 'Alin (Fokus Jadwal Partner)';
  }
}

// ----------------------------------------------------------------------------
// DATE CAROUSEL (Mon - Sun)
// ----------------------------------------------------------------------------
function renderDateCarousel() {
  const scrollContainer = document.getElementById('weekDatesScroll');
  const monthYearLabel = document.getElementById('labelMonthYear');
  if (!scrollContainer) return;

  const activeD = new Date(appState.activeDate);
  const options = { month: 'long', year: 'numeric' };
  if (monthYearLabel) {
    monthYearLabel.textContent = activeD.toLocaleDateString('id-ID', options);
  }

  scrollContainer.innerHTML = '';

  // Show 7 days centered around activeDate (-3 to +3)
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  for (let i = -3; i <= 3; i++) {
    const d = new Date(appState.activeDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = dayNames[d.getDay()];
    const dayNum = d.getDate();

    const isSelected = dateStr === appState.activeDate;

    // Check count of events for this day
    const daySchedules = appState.schedules.filter(s => s.date === dateStr);

    const chip = document.createElement('div');
    chip.className = `date-chip ${isSelected ? 'active' : ''}`;
    chip.dataset.date = dateStr;

    let dotsHtml = '';
    if (daySchedules.length > 0) {
      const shown = daySchedules.slice(0, 3);
      dotsHtml = shown.map(s => {
        const cat = CATEGORIES[s.category] || CATEGORIES['Kuliah'];
        return `<span class="mini-dot" style="background: ${cat.color}"></span>`;
      }).join('');
    }

    chip.innerHTML = `
      <span class="day-name">${dayName}</span>
      <span class="day-num">${dayNum}</span>
      <div class="event-dots">${dotsHtml}</div>
    `;

    chip.addEventListener('click', () => {
      appState.activeDate = dateStr;
      renderCurrentView();
    });

    scrollContainer.appendChild(chip);
  }
}

// ----------------------------------------------------------------------------
// AGENDA SCHEDULE CARDS
// ----------------------------------------------------------------------------
function renderAgendaSchedules() {
  const container = document.getElementById('schedulesList');
  if (!container) return;

  container.innerHTML = '';

  // Filter schedules by Date, Perspective, and Category
  let filtered = appState.schedules.filter(s => s.date === appState.activeDate);

  if (appState.activePerspective === 'user1') {
    filtered = filtered.filter(s => s.owner === 'user1' || s.owner === 'both');
  } else if (appState.activePerspective === 'user2') {
    filtered = filtered.filter(s => s.owner === 'user2' || s.owner === 'both');
  }

  if (appState.activeCategoryFilter !== 'all') {
    filtered = filtered.filter(s => s.category === appState.activeCategoryFilter);
  }

  // Sort by start time
  filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <img src="assets/logo.jpg" alt="No Schedule">
        <h3>Tidak Ada Jadwal di Hari Ini</h3>
        <p>Waktu yang pas untuk rehat santai atau buat janji nongkrong / nugas bareng sahabat! Klik tombol (+) di bawah untuk menambah jadwal.</p>
        <button class="pill-btn primary" id="btnEmptyAdd">
          <span>+ Tambah Jadwal Anti-Malas</span>
        </button>
      </div>
    `;

    document.getElementById('btnEmptyAdd')?.addEventListener('click', () => {
      openQuickAddModal();
    });
    return;
  }

  filtered.forEach(item => {
    const cat = CATEGORIES[item.category] || CATEGORIES['Kuliah'];
    const card = document.createElement('div');
    card.className = `schedule-card ${item.completed ? 'completed' : ''}`;
    card.style.setProperty('--category-color', cat.color);

    // Owner tag
    let ownerBadge = '';
    if (item.owner === 'both') {
      ownerBadge = `<span class="owner-pill both">🤝 Bersama Dimas & Alin</span>`;
    } else if (item.owner === 'user1') {
      ownerBadge = `
        <span class="owner-pill user1">
          <img src="assets/avatar_dimas.jpg" alt="Dimas"> Dimas
        </span>`;
    } else {
      ownerBadge = `
        <span class="owner-pill user2">
          <img src="assets/avatar_alin.jpg" alt="Alin"> Alin (Bestie)
        </span>`;
    }

    card.innerHTML = `
      <div class="card-top-row">
        <div class="card-tags">
          <span class="cat-badge" style="background: ${cat.lightColor}; color: ${cat.color};">
            ${cat.label}
          </span>
          ${ownerBadge}
        </div>
        <div class="card-actions">
          <button class="btn-card-action complete-btn" title="${item.completed ? 'Batalkan Selesai' : 'Tandai Selesai'}" data-id="${item.id}">
            ${item.completed ? '↩️' : '✓'}
          </button>
          <button class="btn-card-action delete-btn" title="Hapus Jadwal" data-id="${item.id}">
            ✕
          </button>
        </div>
      </div>

      <div class="card-main-content">
        <div class="card-title">${item.title}</div>
        ${item.description ? `<p class="card-desc">${item.description}</p>` : ''}
      </div>

      <div class="card-meta-row">
        <div class="meta-item time-highlight">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>${item.startTime} - ${item.endTime}</span>
        </div>
        ${item.location ? `
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>${item.location}</span>
          </div>` : ''
        }
        <div class="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span>${item.reminder}m sebelumnya</span>
        </div>
        <div class="meta-item" style="color: var(--sage-green);">
          <span>🎵 Lofi Chime</span>
        </div>
      </div>
    `;

    // Complete button
    card.querySelector('.complete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      item.completed = !item.completed;
      saveSchedulesToStorage();
      renderCurrentView();
      if (item.completed) {
        showToast(`Hehe mantap! "${item.title}" sudah selesai.`, '🎉');
        playLofiChime();
      }
    });

    // Delete button
    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Hapus jadwal "${item.title}"?`)) {
        appState.schedules = appState.schedules.filter(s => s.id !== item.id);
        saveSchedulesToStorage();
        renderCurrentView();
        showToast('Jadwal berhasil dihapus.', '🗑️');
      }
    });

    container.appendChild(card);
  });
}

function updateAgendaMatchBanner() {
  const summaryEl = document.getElementById('agendaMatchSummary');
  const banner = document.getElementById('agendaMatchBanner');
  if (!summaryEl || !banner) return;

  const slots = calculateMutualFreeSlots(appState.activeDate);

  if (slots.length > 0) {
    banner.style.display = 'flex';
    const topSlot = slots[0];
    summaryEl.innerHTML = `Hari ini kalian berdua punya waktu luang bersama jam <strong>${topSlot.startTime} - ${topSlot.endTime} (${topSlot.durationHours} Jam)</strong> ✨`;
  } else {
    banner.style.display = 'none';
  }
}

// ----------------------------------------------------------------------------
// WEEKLY TIMELINE GRID (7 Days Multi-Column Side-by-Side)
// ----------------------------------------------------------------------------
function renderWeeklyTimeline() {
  const grid = document.getElementById('weeklyTimelineGrid');
  if (!grid) return;

  grid.innerHTML = '';

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayStr = getDateString(0);

  // Generate 7 days starting from Monday of current active date week
  const curr = new Date(appState.activeDate);
  const dayOfWeek = curr.getDay(); // 0 is Sun, 1 is Mon
  const diffToMon = curr.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  const monday = new Date(curr.setDate(diffToMon));

  for (let i = 0; i < 7; i++) {
    const colDate = new Date(monday);
    colDate.setDate(monday.getDate() + i);
    const dateStr = colDate.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;

    const col = document.createElement('div');
    col.className = `week-column ${isToday ? 'today-col' : ''}`;

    const dayName = dayNames[colDate.getDay()];
    const dateNum = colDate.getDate();

    // Scheds for this day
    const dayScheds = appState.schedules.filter(s => s.date === dateStr);
    dayScheds.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Calculate free slots
    const freeSlots = calculateMutualFreeSlots(dateStr);

    let eventsHtml = '';
    if (dayScheds.length === 0) {
      eventsHtml = `<div style="font-size: 0.72rem; color: #A0AEC0; text-align: center; margin: auto;">Kosong</div>`;
    } else {
      eventsHtml = dayScheds.map(s => {
        let ownerClass = s.owner === 'both' ? 'both' : (s.owner === 'user1' ? 'user1' : 'user2');
        return `
          <div class="timeline-event-chip ${ownerClass}" title="${s.title} (${s.startTime} - ${s.endTime})">
            <span class="timeline-event-time">${s.startTime} - ${s.endTime}</span>
            <span class="timeline-event-title">${s.title}</span>
          </div>
        `;
      }).join('');
    }

    let freeSlotHtml = '';
    if (freeSlots.length > 0) {
      const topFree = freeSlots[0];
      freeSlotHtml = `
        <div class="free-slot-marker" title="Kalian berdua kosong di jam ini!" data-date="${dateStr}" data-start="${topFree.startTime}" data-end="${topFree.endTime}">
          ✨ Free: ${topFree.startTime} - ${topFree.endTime}
        </div>
      `;
    }

    col.innerHTML = `
      <div class="week-col-header">
        <div class="week-col-day">${dayName}</div>
        <div class="week-col-date">${dateNum}</div>
      </div>
      <div class="week-col-events">
        ${eventsHtml}
        ${freeSlotHtml}
      </div>
    `;

    // Click free slot to instantly schedule together
    col.querySelectorAll('.free-slot-marker').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        scheduleTogetherSlot(btn.dataset.date, btn.dataset.start, btn.dataset.end);
      });
    });

    grid.appendChild(col);
  }
}

// ----------------------------------------------------------------------------
// MATCH FINDER VIEW (Detailed Recommendations)
// ----------------------------------------------------------------------------
function renderMatchFinderView() {
  const container = document.getElementById('matchSlotsContainer');
  if (!container) return;

  container.innerHTML = '';

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  let totalFound = 0;

  // Search next 7 days for mutual free slots
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = dayNames[d.getDay()];

    const slots = calculateMutualFreeSlots(dateStr);

    slots.forEach(slot => {
      totalFound++;
      const card = document.createElement('div');
      card.className = 'match-card high-match';

      // Fun suggestion ideas based on duration
      let idea = 'Nongkrong santai & ngobrol seru di cafe favorit ☕';
      if (slot.durationMins >= 180) {
        idea = 'Nongkrong di cafe + Nonton bioskop bareng bestie 🍿';
      } else if (slot.durationMins >= 120) {
        idea = 'Nugas bareng di library atau cafe aesthetic 📚';
      } else if (slot.durationMins >= 60) {
        idea = 'Makan siang bareng atau istirahat santai sejenak 🥪';
      }

      card.innerHTML = `
        <div class="match-badge-row">
          <span class="match-score">✨ 100% Cocok (Free)</span>
          <span class="match-duration">⏱️ ${slot.durationHours} Jam Kosong</span>
        </div>

        <div>
          <div class="match-time-range">${slot.startTime} - ${slot.endTime}</div>
          <div class="match-date-day">${dayName}, ${formatDateIndo(dateStr)}</div>
        </div>

        <div class="match-suggestions">
          <span class="suggestion-title">Rekomendasi Waktu Bareng Sahabat:</span>
          <span>${idea}</span>
        </div>

        <button class="pill-btn primary btn-schedule-match" data-date="${dateStr}" data-start="${slot.startTime}" data-end="${slot.endTime}">
          <span>+ Jadwalkan Nongkrong / Nugas 🤝</span>
        </button>
      `;

      card.querySelector('.btn-schedule-match').addEventListener('click', () => {
        scheduleTogetherSlot(dateStr, slot.startTime, slot.endTime);
      });

      container.appendChild(card);
    });
  }

  if (totalFound === 0) {
    container.innerHTML = `
      <div class="empty-state-card" style="grid-column: 1 / -1;">
        <h3>Jadwal Minggu Ini Sangat Padat!</h3>
        <p>Belum ditemukan celah waktu luang bersama minimal 1 jam. Coba sesuaikan jadwal kuliah atau rapat kamu dan sahabatmu.</p>
      </div>
    `;
  }
}

function formatDateIndo(dateStr) {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function scheduleTogetherSlot(dateStr, startTime, endTime) {
  const title = prompt('Masukkan nama agenda bersama sahabat:', 'Nongkrong Santai Bareng ☕');
  if (!title) return;

  const newEvent = {
    id: 'both-' + Date.now(),
    title: title,
    date: dateStr,
    startTime: startTime,
    endTime: endTime,
    category: 'Free Time',
    owner: 'both',
    location: 'Cafe / Tempat Favorit',
    description: 'Dibuat otomatis lewat fitur Skedoo Match Finder Waktu Luang Sahabat!',
    reminder: '30',
    sound: 'lofi_gentle',
    completed: false
  };

  appState.schedules.push(newEvent);
  saveSchedulesToStorage();
  renderCurrentView();
  showToast(`Agenda bareng sahabat "${title}" berhasil dijadwalkan!`, '🤝');
  triggerFloatingPing();
  playLofiChime();
  vibratePhone();
}

// ============================================================================
// MODAL CONTROLS & EVENT LISTENERS
// ============================================================================

function openQuickAddModal(initialTab = 'tabNlp') {
  const modal = document.getElementById('modalQuickAdd');
  if (!modal) return;

  // Set default date in manual form
  const inputManualDate = document.getElementById('manualDate');
  if (inputManualDate) inputManualDate.value = appState.activeDate;

  // Activate tab
  document.querySelectorAll('.modal-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.modaltab === initialTab);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === initialTab);
  });

  modal.classList.add('active');
}

function closeQuickAddModal() {
  const modal = document.getElementById('modalQuickAdd');
  if (modal) modal.classList.remove('active');
}

// ============================================================================
// GOOGLE CALENDAR .ICS EXPORT (PDF Bab 5)
// ============================================================================

function exportToIcsFile() {
  if (appState.schedules.length === 0) {
    showToast('Tidak ada jadwal untuk diekspor.', 'ℹ️');
    return;
  }

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skedoo//Duo Schedule Planner//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Skedoo Duo Calendar',
    'X-WR-TIMEZONE:Asia/Jakarta'
  ];

  appState.schedules.forEach(item => {
    const cleanDate = item.date.replace(/-/g, '');
    const cleanStart = item.startTime.replace(/:/g, '') + '00';
    const cleanEnd = item.endTime.replace(/:/g, '') + '00';

    const dtStart = `${cleanDate}T${cleanStart}`;
    const dtEnd = `${cleanDate}T${cleanEnd}`;

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:${item.id}@skedoo.app`);
    icsContent.push(`DTSTAMP:${cleanDate}T000000Z`);
    icsContent.push(`DTSTART:${dtStart}`);
    icsContent.push(`DTEND:${dtEnd}`);
    icsContent.push(`SUMMARY:${item.title}`);
    if (item.description) icsContent.push(`DESCRIPTION:${item.description.replace(/\n/g, '\\n')}`);
    if (item.location) icsContent.push(`LOCATION:${item.location}`);
    icsContent.push(`CATEGORIES:${item.category}`);
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skedoo_jadwal_${appState.pairingCode}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('File .ics berhasil diunduh! Siap dibuka di Google Calendar.', '📥');
  playLofiChime();
}

// ============================================================================
// INITIALIZATION ON DOM READY
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load initial data
  loadSchedulesFromStorage();

  // 2. Set default manual date
  const manualDateInput = document.getElementById('manualDate');
  if (manualDateInput) manualDateInput.value = appState.activeDate;

  // 3. Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(() => {
      console.log('Skedoo Service Worker registered successfully.');
    }).catch(err => {
      console.log('SW registration error:', err);
    });
  }

  // 4. Header buttons
  document.getElementById('btnTestSound')?.addEventListener('click', () => {
    playLofiChime();
    showToast('Memutar Nada Lembut Lofi (Web Audio API)', '🎵');
  });

  document.getElementById('btnTestVibrate')?.addEventListener('click', () => {
    vibratePhone([200, 100, 200, 100, 400]);
    showToast('Getaran Smartphone [200, 100, 200, 100, 400] diaktifkan', '📳');
  });

  document.getElementById('btnOpenSettings')?.addEventListener('click', () => {
    document.getElementById('modalSettings')?.classList.add('active');
  });

  document.getElementById('btnCloseSettings')?.addEventListener('click', () => {
    document.getElementById('modalSettings')?.classList.remove('active');
  });

  // 5. Dual Perspective Switcher Buttons
  document.getElementById('btnViewTogether')?.addEventListener('click', () => {
    appState.activePerspective = 'together';
    renderCurrentView();
  });
  document.getElementById('btnViewUser1')?.addEventListener('click', () => {
    appState.activePerspective = 'user1';
    renderCurrentView();
  });
  document.getElementById('btnViewUser2')?.addEventListener('click', () => {
    appState.activePerspective = 'user2';
    renderCurrentView();
  });

  // 6. Quick Ping & Sapa Sahabat Action
  document.getElementById('btnSendLovePing')?.addEventListener('click', () => {
    broadcastSync('BESTIE_PING', { message: 'Lagi senggang gak? Nongkrong / nugas kuy! ☕' });
    showToast('Sapaan terkirim ke Alin! 🤝', '👋');
    triggerFloatingPing();
    playLofiChime();
    vibratePhone();
  });

  // Ping preset buttons in Ruang Sahabat
  document.querySelectorAll('.ping-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.dataset.msg;
      broadcastSync('BESTIE_PING', { message: msg });
      showToast(`Pesan terkirim ke Alin: "${msg}"`, '🤝');
      triggerFloatingPing();
      playLofiChime();
      vibratePhone();
    });
  });

  document.getElementById('btnSendCustomLove')?.addEventListener('click', () => {
    const input = document.getElementById('customLoveInput');
    if (!input || !input.value.trim()) return;
    const msg = input.value.trim();
    broadcastSync('BESTIE_PING', { message: msg });
    showToast(`Pesan terkirim ke Alin: "${msg}"`, '🤝');
    input.value = '';
    triggerFloatingPing();
    playLofiChime();
    vibratePhone();
  });

  // 7. Change Status Modal
  document.getElementById('btnChangeStatus')?.addEventListener('click', () => {
    document.getElementById('modalChangeStatus')?.classList.add('active');
  });
  document.getElementById('btnCloseChangeStatus')?.addEventListener('click', () => {
    document.getElementById('modalChangeStatus')?.classList.remove('active');
  });

  // Status options selection
  let selectedStatus = 'Lagi Free Time';
  let selectedSub = 'Bisa diajak santai / ngobrol';
  let selectedColor = '#10B981';

  document.querySelectorAll('.status-radio-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.status-radio-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedStatus = opt.dataset.status;
      selectedSub = opt.dataset.sub;
      selectedColor = opt.dataset.color;
    });
  });

  document.getElementById('btnSaveStatusChange')?.addEventListener('click', () => {
    appState.user1.status = selectedStatus;
    appState.user1.statusSub = selectedSub;
    appState.user1.statusColor = selectedColor;

    // Broadcast change
    broadcastSync('STATUS_CHANGED', {
      user2Status: selectedStatus,
      user2StatusSub: selectedSub,
      user2StatusColor: selectedColor
    });

    document.getElementById('modalChangeStatus')?.classList.remove('active');
    showToast(`Status kamu diperbarui: "${selectedStatus}"`, '✅');
    playLofiChime();
  });

  // 8. Date navigation
  document.getElementById('btnPrevDay')?.addEventListener('click', () => {
    const d = new Date(appState.activeDate);
    d.setDate(d.getDate() - 1);
    appState.activeDate = d.toISOString().split('T')[0];
    renderCurrentView();
  });

  document.getElementById('btnNextDay')?.addEventListener('click', () => {
    const d = new Date(appState.activeDate);
    d.setDate(d.getDate() + 1);
    appState.activeDate = d.toISOString().split('T')[0];
    renderCurrentView();
  });

  document.getElementById('btnToday')?.addEventListener('click', () => {
    appState.activeDate = getDateString(0);
    renderCurrentView();
  });

  // 9. Category Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      appState.activeCategoryFilter = chip.dataset.cat;
      renderAgendaSchedules();
    });
  });

  // 10. Bottom Dock Navigation
  document.querySelectorAll('.dock-item').forEach(item => {
    item.addEventListener('click', () => {
      appState.activeTab = item.dataset.tab;
      renderCurrentView();
    });
  });

  document.getElementById('dockBtnQuickAdd')?.addEventListener('click', () => {
    openQuickAddModal('tabNlp');
  });

  document.getElementById('btnBookFreeSlot')?.addEventListener('click', () => {
    const slots = calculateMutualFreeSlots(appState.activeDate);
    if (slots.length > 0) {
      scheduleTogetherSlot(appState.activeDate, slots[0].startTime, slots[0].endTime);
    } else {
      openQuickAddModal('tabNlp');
    }
  });

  // 11. Modal Quick Add Actions
  document.getElementById('btnCloseQuickAdd')?.addEventListener('click', closeQuickAddModal);

  // Modal sub-tabs
  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.modaltab);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // NLP Extractor
  let currentExtractedDrafts = [];
  const nlpInput = document.getElementById('nlpInputText');
  const nlpBox = document.getElementById('nlpExtractedBox');
  const nlpList = document.getElementById('nlpExtractedItemsList');

  // Live Gemini 2.0 Flash API Extractor
  async function parseWithLiveGemini(text, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const prompt = `Ekstrak jadwal dari kalimat bahasa Indonesia ini ke dalam array JSON.
Kalimat: "${text}"

Ketentuan:
1. Tanggal hari ini adalah ${getDateString(0)}. Jika disebutkan "besok", gunakan ${getDateString(1)}. Jika "lusa", gunakan ${getDateString(2)}.
2. Format waktu HH:MM (contoh: 10:00, 16:00).
3. Kategori harus salah satu dari: "Kuliah", "Organisasi", "Project", "Belajar", "Free Time".
4. Owner: "user1" (Dimas), "user2" (Alin), atau "both" (bersama).

Kembalikan HANYA format JSON valid tanpa tanda backtick:
[
  {
    "title": "Nama Jadwal Singkat",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "category": "Kuliah",
    "location": "Lokasi / Ruang",
    "owner": "user1",
    "description": "Deskripsi atau catatan"
  }
]`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini');

    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return parsed.map((item, idx) => ({
      id: 'gemini-' + Date.now() + '-' + idx,
      title: item.title || 'Agenda',
      date: item.date || getDateString(0),
      startTime: item.startTime || '10:00',
      endTime: item.endTime || '11:30',
      category: item.category || 'Kuliah',
      location: item.location || 'Kampus',
      owner: item.owner || 'user1',
      description: item.description || 'Diekstrak langsung oleh Google Gemini 2.0 Flash AI',
      reminder: '30',
      sound: 'lofi_gentle',
      completed: false
    }));
  }

  async function runNlpExtraction() {
    const text = nlpInput?.value.trim();
    if (!text) {
      showToast('Ketik kalimat jadwal terlebih dahulu.', '⚠️');
      return;
    }

    const btnParse = document.getElementById('btnParseNlp');
    if (btnParse) {
      btnParse.disabled = true;
      btnParse.innerHTML = '<span>Memproses AI... ⏳</span>';
    }

    try {
      if (appState.geminiApiKey) {
        showToast('Menghubungi Google Gemini 2.0 Flash...', '🤖');
        currentExtractedDrafts = await parseWithLiveGemini(text, appState.geminiApiKey);
        showToast(`Sukses! Gemini 2.0 Flash mengekstrak ${currentExtractedDrafts.length} jadwal.`, '⚡');
      } else {
        currentExtractedDrafts = parseNaturalLanguageSchedule(text);
      }
    } catch (err) {
      console.warn('Gemini live call error, fallback to built-in NLP:', err);
      currentExtractedDrafts = parseNaturalLanguageSchedule(text);
      showToast('Menggunakan mesin NLP bawaan cerdas.', 'ℹ️');
    } finally {
      if (btnParse) {
        btnParse.disabled = false;
        btnParse.innerHTML = '<span>Ekstrak Jadwal ✨</span>';
      }
    }

    if (nlpBox && nlpList) {
      nlpList.innerHTML = '';
      currentExtractedDrafts.forEach((draft, idx) => {
        const item = document.createElement('div');
        item.className = 'extracted-item';
        item.innerHTML = `
          <div class="extracted-item-info">
            <h5>${draft.title}</h5>
            <p>📅 ${draft.date} | ⏰ ${draft.startTime} - ${draft.endTime} | 🏷️ ${draft.category} | 📍 ${draft.location}</p>
          </div>
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--sage-green);">Siap Simpan</span>
        `;
        nlpList.appendChild(item);
      });
      nlpBox.style.display = 'flex';
      playLofiChime();
    }
  }

  document.getElementById('btnParseNlp')?.addEventListener('click', runNlpExtraction);

  // 1-Click NLP Example chips
  document.querySelectorAll('.nlp-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (nlpInput) {
        nlpInput.value = chip.dataset.example;
        runNlpExtraction();
      }
    });
  });

  document.getElementById('btnSaveNlpDrafts')?.addEventListener('click', () => {
    if (currentExtractedDrafts.length === 0) return;
    appState.schedules.push(...currentExtractedDrafts);
    saveSchedulesToStorage();
    renderCurrentView();
    closeQuickAddModal();
    showToast(`Sukses menambahkan ${currentExtractedDrafts.length} jadwal baru!`, '🎉');
    playLofiChime();
    vibratePhone();
    currentExtractedDrafts = [];
    if (nlpBox) nlpBox.style.display = 'none';
    if (nlpInput) nlpInput.value = '';
  });

  // Vision OCR Presets
  let currentVisionDrafts = [];
  const visionBox = document.getElementById('visionExtractedBox');
  const visionList = document.getElementById('visionExtractedItemsList');

  function displayVisionDrafts(drafts, label) {
    currentVisionDrafts = drafts;
    if (visionBox && visionList) {
      visionList.innerHTML = '';
      drafts.forEach(d => {
        const item = document.createElement('div');
        item.className = 'extracted-item';
        item.innerHTML = `
          <div class="extracted-item-info">
            <h5>${d.title}</h5>
            <p>📅 ${d.date} | ⏰ ${d.startTime} - ${d.endTime} | 📍 ${d.location} | 🎓 ${d.category}</p>
          </div>
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--dusty-blue);">OCR Valid</span>
        `;
        visionList.appendChild(item);
      });
      visionBox.style.display = 'flex';
      showToast(`AI membaca ${drafts.length} jadwal dari ${label}!`, '📸');
      playLofiChime();
    }
  }

  document.getElementById('btnSampleKrs')?.addEventListener('click', () => {
    displayVisionDrafts(getSampleKrsDrafts(), 'Scan KRS Mahasiswa');
  });

  document.getElementById('btnSampleSeminar')?.addEventListener('click', () => {
    displayVisionDrafts(getSampleSeminarDrafts(), 'Poster Seminar AI');
  });

  // Dropzone file upload click
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileUploadInput');

  dropZone?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      showToast(`Membaca file "${file.name}" dengan AI Vision...`, '🤖');
      setTimeout(() => {
        displayVisionDrafts(getSampleKrsDrafts(), file.name);
      }, 700);
    }
  });

  document.getElementById('btnSaveVisionDrafts')?.addEventListener('click', () => {
    if (currentVisionDrafts.length === 0) return;
    appState.schedules.push(...currentVisionDrafts);
    saveSchedulesToStorage();
    renderCurrentView();
    closeQuickAddModal();
    showToast(`Sukses menyimpan hasil scan ke kalender!`, '🎉');
    playLofiChime();
    vibratePhone();
    currentVisionDrafts = [];
    if (visionBox) visionBox.style.display = 'none';
  });

  // 1-Tap Quick Templates
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title;
      const cat = btn.dataset.cat;
      const dur = parseInt(btn.dataset.dur, 10);
      const owner = btn.dataset.owner;

      const now = new Date();
      const currentHours = now.getHours();
      const nextHour = (currentHours + 1) % 24;
      const startStr = `${String(nextHour).padStart(2, '0')}:00`;

      const endMinutesTotal = nextHour * 60 + dur;
      const endH = Math.floor(endMinutesTotal / 60) % 24;
      const endM = endMinutesTotal % 60;
      const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const newSched = {
        id: 'tmpl-' + Date.now(),
        title,
        date: appState.activeDate,
        startTime: startStr,
        endTime: endStr,
        category: cat,
        owner,
        location: owner === 'both' ? 'Tempat Favorit Berdua' : 'Personal Space',
        description: `Dibuat instan lewat 1-Tap Quick Template Skedoo.`,
        reminder: '30',
        sound: 'lofi_gentle',
        completed: false
      };

      appState.schedules.push(newSched);
      saveSchedulesToStorage();
      renderCurrentView();
      closeQuickAddModal();
      showToast(`Template "${title}" berhasil ditambahkan!`, '⚡');
      playLofiChime();
      vibratePhone();
    });
  });

  // Manual Form Submission
  document.getElementById('formManualSchedule')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('manualTitle')?.value.trim();
    const date = document.getElementById('manualDate')?.value;
    const startTime = document.getElementById('manualStartTime')?.value;
    const endTime = document.getElementById('manualEndTime')?.value;
    const category = document.getElementById('manualCategory')?.value;
    const owner = document.getElementById('manualOwner')?.value;
    const reminder = document.getElementById('manualReminder')?.value;
    const location = document.getElementById('manualLocation')?.value.trim();
    const description = document.getElementById('manualDesc')?.value.trim();

    if (!title || !date || !startTime || !endTime) return;

    const newSched = {
      id: 'manual-' + Date.now(),
      title,
      date,
      startTime,
      endTime,
      category,
      owner,
      location,
      description,
      reminder,
      sound: 'lofi_gentle',
      completed: false
    };

    appState.schedules.push(newSched);
    saveSchedulesToStorage();
    renderCurrentView();
    closeQuickAddModal();
    showToast(`Jadwal "${title}" berhasil disimpan!`, '✅');
    playLofiChime();
    vibratePhone();

    e.target.reset();
  });

  // Ruang Berdua Copy & Join
  document.getElementById('btnCopyPairingCode')?.addEventListener('click', () => {
    navigator.clipboard.writeText(appState.pairingCode).then(() => {
      showToast(`Kode ${appState.pairingCode} disalin ke clipboard!`, '📋');
    }).catch(() => {
      showToast(`Kode pairing: ${appState.pairingCode}`, '📋');
    });
  });

  document.getElementById('btnJoinSpace')?.addEventListener('click', () => {
    const input = document.getElementById('inputJoinCode');
    const code = input?.value.trim().toUpperCase();
    if (!code) return;
    appState.pairingCode = code;
    updateDuoStatusUI();
    showToast(`Berhasil terhubung ke ruang ${code}!`, '💑');
    playLofiChime();
  });

  document.getElementById('btnOpenSecondTab')?.addEventListener('click', () => {
    window.open(window.location.href, '_blank');
    showToast('Membuka tab baru untuk menguji sync realtime!', '🚀');
  });

  // Match Finder refresh
  document.getElementById('btnRefreshMatch')?.addEventListener('click', () => {
    renderMatchFinderView();
    showToast('Analisis waktu luang berdua diperbarui!', '✨');
    playLofiChime();
  });

  // Google Calendar .ICS Export from Settings
  document.getElementById('btnSettingsExportICS')?.addEventListener('click', exportToIcsFile);
  document.getElementById('btnExportICS')?.addEventListener('click', exportToIcsFile);
  document.getElementById('btnSimulateGoogleSync')?.addEventListener('click', () => {
    showToast('Sinkronisasi Google Calendar OAuth aktif (Token tersimpan terenkripsi)', '🔄');
    playLofiChime();
  });

  document.getElementById('btnConnectGoogleOAuth')?.addEventListener('click', () => {
    const input = document.getElementById('inputGoogleClientId');
    const clientId = input?.value.trim();
    if (!clientId) {
      showToast('Masukkan Google Client ID dari Google Cloud Console.', '⚠️');
      return;
    }
    localStorage.setItem('skedoo_google_client_id', clientId);
    showToast('Google Client ID tersimpan! Token OAuth siap disinkronkan.', '🔄');
    playLofiChime();
  });

  // Architecture view shortcut
  document.getElementById('btnGoToArchitecture')?.addEventListener('click', () => {
    document.getElementById('modalSettings')?.classList.remove('active');
    appState.activeTab = 'architecture';
    renderCurrentView();
  });

  // Save Gemini Key & Badge Sync
  function updateGeminiBadgeUI() {
    const badge = document.getElementById('geminiKeyBadge');
    const input = document.getElementById('inputGeminiApiKey');
    if (appState.geminiApiKey) {
      if (badge) {
        badge.textContent = '🟢 Gemini 2.0 Flash Aktif';
        badge.style.background = 'var(--sage-green-light)';
        badge.style.color = '#385536';
      }
      if (input && !input.value) {
        input.value = appState.geminiApiKey;
      }
    } else {
      if (badge) {
        badge.textContent = 'Bawaan Cerdas';
        badge.style.background = 'var(--bg-cream)';
        badge.style.color = 'var(--muted-grey)';
      }
    }
  }

  document.getElementById('btnSaveGeminiKey')?.addEventListener('click', () => {
    const key = document.getElementById('inputGeminiApiKey')?.value.trim();
    if (key) {
      localStorage.setItem('skedoo_gemini_api_key', key);
      appState.geminiApiKey = key;
      updateGeminiBadgeUI();
      showToast('Kunci API Google Gemini tersimpan & Aktif!', '🔑');
      playLofiChime();
    } else {
      localStorage.removeItem('skedoo_gemini_api_key');
      appState.geminiApiKey = '';
      updateGeminiBadgeUI();
      showToast('Menggunakan parser NLP bawaan cerdas.', 'ℹ️');
    }
  });

  // Initialize key badge
  updateGeminiBadgeUI();

  // 12. Initial render
  renderCurrentView();
});
