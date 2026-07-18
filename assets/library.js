(function () {
  'use strict';

  const SETTINGS_KEY = 'reader-settings';
  const typeLabels = {
    biography: 'Biography',
    literature: 'Literature',
    'short-stories': 'Short Stories',
    travel: 'Travel',
  };
  const levelOrder = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native', 'Original'];
  const grid = document.getElementById('library-grid');
  const filters = document.getElementById('library-filters');
  const status = document.getElementById('library-status');
  const themeSelect = document.getElementById('theme-select') || document.getElementById('library-theme-select');
  const aboutLink = document.getElementById('about-link');
  const textSizeSelect = document.getElementById('text-size-select');
  const deviceModeSelect = document.getElementById('device-mode-select');
  const nativeLangSelect = document.getElementById('native-lang-select');
  const learningLangSelect = document.getElementById('learning-lang-select');
  const levelSelect = document.getElementById('level-select');
  const floatingToggleSetting = document.getElementById('floating-toggle-setting');
  const saveBookmarkBtn = document.getElementById('save-bookmark');
  const goBookmarkBtn = document.getElementById('go-bookmark');
  const bookmarkStatus = document.getElementById('bookmark-status');
  const streakDaysEl = document.getElementById('streak-days');
  const streakLongestEl = document.getElementById('streak-longest');
  const streakTimeEl = document.getElementById('streak-time');
  const currentReading = document.getElementById('current-reading-content');
  let catalog = { items: [] };
  let activeType = 'all';
  const DEFAULT_SETTINGS = {
    nativeLanguageId: 'en',
    learningLanguageId: null,
    theme: 'light',
    textSize: 'medium',
    floatingToggleEnabled: false,
    bookmark: null,
    lastPosition: null,
    streak: { streakDays: 0, longestStreak: 0, lastActiveDate: null, totalMs: 0, todayMs: 0 },
    deviceMode: 'mobile',
  };

  function settings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {}; } catch (_) { return {}; }
  }

  function saveSettings(patch) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings(), ...patch }));
  }

  function currentSettings() {
    return { ...DEFAULT_SETTINGS, ...settings(), streak: { ...DEFAULT_SETTINGS.streak, ...(settings().streak || {}) } };
  }

  function effectiveDark(theme) {
    return theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function applyTheme() {
    const theme = currentSettings().theme || 'light';
    document.body.classList.toggle('night', effectiveDark(theme));
    if (themeSelect) themeSelect.value = ['light', 'dark', 'system'].includes(theme) ? theme : 'light';
  }

  function formatDuration(ms = 0) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  }

  function populateSelect(select, entries, value) {
    if (!select) return;
    select.replaceChildren();
    entries.forEach(([entryValue, label]) => {
      const option = document.createElement('option');
      option.value = entryValue;
      option.textContent = label;
      select.appendChild(option);
    });
    if (value && entries.some(([entryValue]) => entryValue === value)) select.value = value;
    else if (entries.length) select.value = entries[0][0];
  }

  function collectLanguages() {
    const languages = new Map();
    catalog.items.forEach((item) => item.sections.forEach((section) => section.languages.forEach((language) => {
      languages.set(language.id, language.title);
    })));
    return [...languages.entries()].sort((left, right) => left[1].localeCompare(right[1]));
  }

  function collectLevels() {
    const levels = new Map();
    catalog.items.forEach((item) => item.sections.forEach((section) => section.languages.forEach((language) => language.levels.forEach((level) => {
      levels.set(level.id, level.title);
    }))));
    return [...levels.entries()].sort((left, right) => {
      const leftIndex = levelOrder.indexOf(left[1]);
      const rightIndex = levelOrder.indexOf(right[1]);
      return (leftIndex === -1 ? levelOrder.length : leftIndex) - (rightIndex === -1 ? levelOrder.length : rightIndex) || left[1].localeCompare(right[1]);
    });
  }

  function renderSettingsControls() {
    const value = currentSettings();
    if (themeSelect) themeSelect.value = ['light', 'dark', 'system'].includes(value.theme) ? value.theme : 'light';
    if (textSizeSelect) textSizeSelect.value = ['small', 'medium', 'large', 'xlarge'].includes(value.textSize) ? value.textSize : 'medium';
    if (deviceModeSelect) deviceModeSelect.value = ['mobile', 'desktop', 'ereader'].includes(value.deviceMode) ? value.deviceMode : 'mobile';
    populateSelect(nativeLangSelect, collectLanguages(), value.nativeLanguageId || 'en');
    populateSelect(learningLangSelect, collectLanguages(), value.learningLanguageId || '');
    populateSelect(levelSelect, collectLevels(), value.levelId || '');
    if (floatingToggleSetting) {
      floatingToggleSetting.textContent = value.floatingToggleEnabled ? 'Disable' : 'Enable';
      floatingToggleSetting.setAttribute('aria-pressed', String(Boolean(value.floatingToggleEnabled)));
      floatingToggleSetting.setAttribute('aria-label', value.floatingToggleEnabled ? 'Disable floating language toggle' : 'Enable floating language toggle');
    }
    if (bookmarkStatus) bookmarkStatus.textContent = value.bookmark ? 'Bookmark saved.' : 'No bookmark saved.';
    if (streakDaysEl && streakLongestEl && streakTimeEl) {
      const streak = value.streak || DEFAULT_SETTINGS.streak;
      const days = streak.streakDays || 0;
      streakDaysEl.textContent = days === 1 ? '1-day streak' : `${days}-day streak`;
      streakLongestEl.textContent = `Longest ${streak.longestStreak || 0}`;
      streakTimeEl.textContent = `${formatDuration(streak.todayMs)} today · ${formatDuration(streak.totalMs)} total`;
    }
  }

  function validPosition(item, raw) {
    const rawItemId = raw?.itemId || raw?.bookId;
    if (!raw || (rawItemId !== item.id && !item.legacyIds?.includes(rawItemId))) return null;
    const sectionId = raw.sectionId || raw.chapterId;
    const languageId = raw.languageId || raw.langId;
    const section = item.sections.find((candidate) => candidate.id === sectionId || candidate.legacyIds?.includes(sectionId));
    const language = section?.languages.find((candidate) => candidate.id === languageId);
    const level = language?.levels.find((candidate) => candidate.id === raw.levelId);
    return section && language && level ? { itemId: item.id, sectionId: section.id, languageId: language.id, levelId: level.id } : null;
  }

  function savedPosition(item) {
    const value = settings();
    return validPosition(item, value.positions?.[item.id]) || validPosition(item, value.lastPosition);
  }

  function readerUrl(item, position) {
    const query = new URLSearchParams({ item: item.id });
    if (position) {
      query.set('section', position.sectionId);
      query.set('language', position.languageId);
      query.set('level', position.levelId);
    }
    return `./index.html?${query}`;
  }

  function aggregate(item, key) {
    const values = new Set();
    item.sections.forEach((section) => section.languages.forEach((language) => {
      if (key === 'languages') values.add(language.title);
      else language.levels.forEach((level) => values.add(level.title));
    }));
    const result = [...values];
    if (key === 'levels') result.sort((left, right) => {
      const leftIndex = levelOrder.indexOf(left);
      const rightIndex = levelOrder.indexOf(right);
      return (leftIndex === -1 ? levelOrder.length : leftIndex) - (rightIndex === -1 ? levelOrder.length : rightIndex) || left.localeCompare(right);
    });
    return result;
  }

  function bookIcon() {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"></path></svg>';
  }

  function downloadIcon() {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg>';
  }

  function updateDownloadButton(button, item, message) {
    const state = window.ViaDownloads.state(item.id);
    button.disabled = state === 'downloading';
    if (message?.status === 'downloading') {
      button.innerHTML = `${downloadIcon()} Downloading ${message.current || 0}/${message.total || 0}`;
    } else if (state === 'complete') {
      button.innerHTML = `${downloadIcon()} Downloaded`;
    } else if (state === 'error') {
      button.innerHTML = `${downloadIcon()} Retry`;
    } else {
      button.innerHTML = `${downloadIcon()} Download`;
    }
  }

  function card(item) {
    const article = document.createElement('article');
    article.className = 'library-card';
    const position = savedPosition(item);
    const cover = item.coverPath
      ? `<img src="${item.coverPath}" alt="Cover of ${escapeText(item.title)}" loading="lazy" />`
      : bookIcon();
    const languages = aggregate(item, 'languages').join(', ');
    const levels = aggregate(item, 'levels').join(', ');
    article.innerHTML = `
      <div class="library-cover">${cover}</div>
      <div class="library-card-body">
        <p class="library-type">${escapeText(typeLabels[item.type] || item.type)}</p>
        <h2 class="library-title">${escapeText(item.title)}</h2>
        ${item.author ? `<p class="library-author">${escapeText(item.author)}</p>` : ''}
        <p class="library-meta"><strong>Languages:</strong> ${escapeText(languages)}<br /><strong>Levels:</strong> ${escapeText(levels)}</p>
        <div class="library-card-actions">
          <a class="library-primary" href="${readerUrl(item, position)}">${position ? 'Continue Reading' : 'Start Reading'}</a>
          <button type="button" class="download-button" aria-label="Download ${escapeText(item.title)} for offline reading"></button>
        </div>
      </div>`;
    const button = article.querySelector('.download-button');
    updateDownloadButton(button, item);
    button.addEventListener('click', async () => {
      updateDownloadButton(button, item, { status: 'downloading', current: 0, total: window.ViaDownloads.itemUrls(item).length });
      status.textContent = `Downloading ${item.title}…`;
      try {
        await window.ViaDownloads.download(item, (message) => {
          updateDownloadButton(button, item, message);
          if (message.status === 'downloading') status.textContent = `Downloading ${item.title}: ${message.current}/${message.total} files`;
        });
        status.textContent = `${item.title} is available offline.`;
      } catch (error) {
        updateDownloadButton(button, item);
        status.textContent = `${item.title}: ${error.message}`;
      }
    });
    return article;
  }

  function escapeText(value = '') {
    return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  function render() {
    grid.replaceChildren();
    catalog.items.filter((item) => activeType === 'all' || item.type === activeType).forEach((item) => grid.appendChild(card(item)));
    status.textContent = navigator.onLine ? `${grid.children.length} items` : `${grid.children.length} items · Offline`;
  }

  function renderFilters() {
    const types = [...new Set(catalog.items.map((item) => item.type))];
    [['all', 'All'], ...types.map((type) => [type, typeLabels[type] || type])].forEach(([type, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter-button';
      button.textContent = label;
      button.setAttribute('aria-pressed', String(type === activeType));
      button.addEventListener('click', () => {
        activeType = type;
        [...filters.children].forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
        render();
      });
      filters.appendChild(button);
    });
  }

  function renderCurrentReading() {
    const value = currentSettings();
    const raw = value.lastPosition;
    const item = catalog.items.find((candidate) => candidate.id === (raw?.itemId || raw?.bookId));
    const position = item && validPosition(item, raw);
    if (!item || !position) return;
    const sectionIndex = item.sections.findIndex((section) => section.id === position.sectionId);
    const section = item.sections[sectionIndex];
    const navigationUrl = (direction) => `./index.html?item=${encodeURIComponent(item.id)}&navigate=${direction}`;
    currentReading.innerHTML = `
      <p class="current-item-title">${escapeText(item.title)}</p>
      <p class="current-section-title">${escapeText(section.title)}</p>
      <button class="current-return" type="button">Return to reading</button>
      <div class="current-nav">
        <button type="button" data-url="${navigationUrl('previous')}" ${sectionIndex === 0 ? 'disabled' : ''} aria-label="Previous section">Previous</button>
        <button type="button" data-url="${navigationUrl('next')}" ${sectionIndex >= item.sections.length - 1 ? 'disabled' : ''} aria-label="Next section">Next</button>
      </div>`;
    currentReading.querySelector('.current-return').addEventListener('click', () => { location.href = readerUrl(item, position); });
    currentReading.querySelectorAll('[data-url]').forEach((button) => button.addEventListener('click', () => { if (button.dataset.url) location.href = button.dataset.url; }));
  }

  async function load() {
    try {
      const response = await fetch('./content/catalog.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      catalog = await response.json();
      renderFilters();
      render();
      renderSettingsControls();
      renderCurrentReading();
    } catch (error) {
      status.textContent = `The Library could not be loaded: ${error.message}`;
    }
  }

  window.ViaSidebar.create();
  applyTheme();
  aboutLink?.addEventListener('click', () => { location.href = './index.html?view=about'; });
  themeSelect?.addEventListener('change', () => { saveSettings({ theme: themeSelect.value }); applyTheme(); });
  textSizeSelect?.addEventListener('change', () => { saveSettings({ textSize: textSizeSelect.value }); });
  deviceModeSelect?.addEventListener('change', () => { saveSettings({ deviceMode: deviceModeSelect.value }); });
  nativeLangSelect?.addEventListener('change', () => { saveSettings({ nativeLanguageId: nativeLangSelect.value }); });
  learningLangSelect?.addEventListener('change', () => {
    saveSettings({ learningLanguageId: learningLangSelect.value || null });
    window.ViaVocabulary?.updateDueBadges();
  });
  levelSelect?.addEventListener('change', () => { saveSettings({ levelId: levelSelect.value || null }); });
  floatingToggleSetting?.addEventListener('click', () => {
    const value = currentSettings();
    saveSettings({ floatingToggleEnabled: !value.floatingToggleEnabled });
    renderSettingsControls();
  });
  saveBookmarkBtn?.addEventListener('click', () => {
    const value = currentSettings();
    if (!value.lastPosition) {
      if (bookmarkStatus) bookmarkStatus.textContent = 'Open a story first to save a bookmark.';
      return;
    }
    saveSettings({ bookmark: value.lastPosition });
    renderSettingsControls();
  });
  goBookmarkBtn?.addEventListener('click', () => {
    const value = currentSettings();
    const target = value.bookmark || value.lastPosition;
    if (!target) {
      if (bookmarkStatus) bookmarkStatus.textContent = 'No bookmark saved.';
      return;
    }
    const item = catalog.items.find((candidate) => candidate.id === (target.itemId || target.bookId));
    if (item) location.href = readerUrl(item, target);
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  document.getElementById('footer-updated').textContent = `Last updated ${new Date(document.lastModified).toLocaleString()}`;
  const updateOnlineStatus = () => { document.getElementById('footer-cache').textContent = navigator.onLine ? 'Online · App shell cached when installed' : 'Offline · Using cached content'; };
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  load();
}());
