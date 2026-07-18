(function () {
  'use strict';

  const VOCABULARY_KEY = 'via-vocabulary-v2';
  const LEGACY_VOCABULARY_KEY = 'via-vocabulary-v1';
  const TRANSLATION_CACHE_KEY = 'via-vocabulary-translation-cache-v1';
  const MAX_CONTEXTS = 5;
  const MAX_NEW_WORDS_PER_SESSION = 5;
  const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30, 60, 120];
  const VALID_STATUSES = new Set(['new', 'learning', 'review', 'mastered']);
  const glossaryCache = new Map();

  function normalizeVocabularyWord(word, languageId) {
    let value = typeof word === 'string' ? word.trim().normalize('NFKC') : '';
    value = value.replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, '');
    if (!value) return '';
    try {
      return value.toLocaleLowerCase(languageId || undefined);
    } catch (_) {
      return value.toLowerCase();
    }
  }

  function normalizeSentence(sentence, languageId) {
    const value = typeof sentence === 'string'
      ? sentence.normalize('NFKC').trim().replace(/\s+/g, ' ')
      : '';
    try {
      return value.toLocaleLowerCase(languageId || undefined);
    } catch (_) {
      return value.toLowerCase();
    }
  }

  function validIso(value, fallback) {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : fallback;
  }

  function nonNegativeInteger(value, fallback = 0) {
    return Number.isInteger(value) && value >= 0 ? value : fallback;
  }

  function createId(prefix) {
    if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function normalizeContext(raw, languageId, fallbackAddedAt) {
    if (!raw || typeof raw !== 'object') return null;
    const sentenceText = typeof raw.sentenceText === 'string' ? raw.sentenceText.trim() : '';
    if (!sentenceText) return null;
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : createId('context'),
      sentenceText,
      sentenceIndex: Number.isInteger(raw.sentenceIndex) && raw.sentenceIndex >= 0 ? raw.sentenceIndex : null,
      sentenceOccurrence: nonNegativeInteger(raw.sentenceOccurrence),
      wordOccurrenceInSentence: nonNegativeInteger(raw.wordOccurrenceInSentence),
      itemId: typeof (raw.itemId || raw.bookId) === 'string' ? (raw.itemId || raw.bookId) : '',
      sectionId: typeof (raw.sectionId || raw.chapterId) === 'string' ? (raw.sectionId || raw.chapterId) : '',
      subchapterId: typeof raw.subchapterId === 'string' && raw.subchapterId ? raw.subchapterId : null,
      levelId: typeof raw.levelId === 'string' ? raw.levelId : '',
      itemTitle: typeof raw.itemTitle === 'string' ? raw.itemTitle : '',
      sectionTitle: typeof raw.sectionTitle === 'string' ? raw.sectionTitle : '',
      subchapterTitle: typeof raw.subchapterTitle === 'string' ? raw.subchapterTitle : '',
      levelTitle: typeof raw.levelTitle === 'string' ? raw.levelTitle : '',
      languageTitle: typeof raw.languageTitle === 'string' ? raw.languageTitle : '',
      addedAt: validIso(raw.addedAt, fallbackAddedAt),
    };
  }

  function normalizeLearning(raw, addedAt) {
    const value = raw && typeof raw === 'object' ? raw : {};
    return {
      status: VALID_STATUSES.has(value.status) ? value.status : 'new',
      difficultyStage: Math.min(4, nonNegativeInteger(value.difficultyStage)),
      dueAt: validIso(value.dueAt, addedAt),
      intervalIndex: Math.min(REVIEW_INTERVALS_DAYS.length - 1, nonNegativeInteger(value.intervalIndex)),
      totalReviews: nonNegativeInteger(value.totalReviews),
      successfulReviews: nonNegativeInteger(value.successfulReviews),
      consecutiveSuccesses: nonNegativeInteger(value.consecutiveSuccesses),
      lapses: nonNegativeInteger(value.lapses),
      lastReviewedAt: value.lastReviewedAt === null ? null : validIso(value.lastReviewedAt, null),
      lastRating: ['again', 'hard', 'good', 'easy'].includes(value.lastRating) ? value.lastRating : null,
    };
  }

  function translationsFrom(raw, nativeLanguageId) {
    const translations = {};
    if (raw?.translations && typeof raw.translations === 'object' && !Array.isArray(raw.translations)) {
      Object.entries(raw.translations).forEach(([languageId, translation]) => {
        if (languageId && typeof translation === 'string' && translation) translations[languageId] = translation;
      });
    }
    if (typeof raw?.translation === 'string' && raw.translation && nativeLanguageId && !translations[nativeLanguageId]) {
      translations[nativeLanguageId] = raw.translation;
    }
    return translations;
  }

  function contextKey(context, languageId) {
    return [
      normalizeSentence(context.sentenceText, languageId),
      context.itemId,
      context.sectionId,
      context.subchapterId || '',
      context.levelId,
    ].join('::');
  }

  function defaultNativeLanguage() {
    try {
      const settings = JSON.parse(localStorage.getItem('reader-settings') || '{}') || {};
      return typeof settings.nativeLanguageId === 'string' && settings.nativeLanguageId
        ? settings.nativeLanguageId
        : 'en';
    } catch (_) {
      return 'en';
    }
  }

  function retainContexts(contexts, languageId) {
    const unique = [];
    const keys = new Set();
    contexts.forEach((context) => {
      const key = contextKey(context, languageId);
      if (!key || keys.has(key)) return;
      keys.add(key);
      unique.push(context);
    });
    if (unique.length <= MAX_CONTEXTS) return unique;

    const kept = [unique[0], unique[unique.length - 1]];
    const keptIds = new Set(kept.map((context) => context.id));
    const storyIds = new Set(kept.map((context) => context.itemId));
    const levelIds = new Set(kept.map((context) => context.levelId));
    [...unique].reverse().forEach((context) => {
      if (kept.length >= MAX_CONTEXTS || keptIds.has(context.id)) return;
      if (!storyIds.has(context.itemId) || !levelIds.has(context.levelId)) {
        kept.push(context);
        keptIds.add(context.id);
        storyIds.add(context.itemId);
        levelIds.add(context.levelId);
      }
    });
    [...unique].reverse().forEach((context) => {
      if (kept.length >= MAX_CONTEXTS || keptIds.has(context.id)) return;
      kept.push(context);
      keptIds.add(context.id);
    });
    return kept.sort((left, right) => unique.indexOf(left) - unique.indexOf(right));
  }

  function validateVocabularyEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const learningLanguageId = typeof (raw.learningLanguageId || raw.languageId || raw.langId) === 'string'
      ? (raw.learningLanguageId || raw.languageId || raw.langId)
      : '';
    const word = typeof raw.word === 'string' ? raw.word.trim() : '';
    const normalizedWord = normalizeVocabularyWord(raw.normalizedWord || word, learningLanguageId);
    if (!learningLanguageId || !word || !normalizedWord) return null;

    const epoch = new Date(0).toISOString();
    const addedAt = validIso(raw.addedAt, epoch);
    const legacyContext = raw.sentenceText ? raw : null;
    const rawContexts = Array.isArray(raw.contexts) ? raw.contexts : legacyContext ? [legacyContext] : [];
    const contexts = retainContexts(
      rawContexts.map((context) => normalizeContext(context, learningLanguageId, addedAt)).filter(Boolean),
      learningLanguageId,
    );
    const nativeLanguageId = typeof raw.nativeLanguageId === 'string' && raw.nativeLanguageId
      ? raw.nativeLanguageId
      : defaultNativeLanguage();

    return {
      id: `${learningLanguageId}::${normalizedWord}`,
      word,
      normalizedWord,
      learningLanguageId,
      translations: translationsFrom(raw, nativeLanguageId),
      contexts,
      learning: normalizeLearning(raw.learning, addedAt),
      addedAt,
      lastSeenAt: validIso(raw.lastSeenAt, addedAt),
      seenCount: Math.max(1, nonNegativeInteger(raw.seenCount, 1)),
    };
  }

  function mergeEntries(existing, incoming) {
    const contexts = retainContexts(
      [...existing.contexts, ...incoming.contexts],
      existing.learningLanguageId,
    );
    const existingReviews = existing.learning.totalReviews;
    const incomingReviews = incoming.learning.totalReviews;
    return {
      ...existing,
      word: existing.word || incoming.word,
      translations: { ...incoming.translations, ...existing.translations },
      contexts,
      learning: incomingReviews > existingReviews ? incoming.learning : existing.learning,
      addedAt: Date.parse(existing.addedAt) <= Date.parse(incoming.addedAt) ? existing.addedAt : incoming.addedAt,
      lastSeenAt: Date.parse(existing.lastSeenAt) >= Date.parse(incoming.lastSeenAt)
        ? existing.lastSeenAt
        : incoming.lastSeenAt,
      seenCount: existing.seenCount + incoming.seenCount,
    };
  }

  function normalizeEntries(entries) {
    const byId = new Map();
    (Array.isArray(entries) ? entries : []).forEach((raw) => {
      const entry = validateVocabularyEntry(raw);
      if (!entry) return;
      byId.set(entry.id, byId.has(entry.id) ? mergeEntries(byId.get(entry.id), entry) : entry);
    });
    return [...byId.values()];
  }

  function parseStoredArray(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function migrateVocabularyV1() {
    const legacy = parseStoredArray(LEGACY_VOCABULARY_KEY);
    const migrated = normalizeEntries(legacy || []);
    writeVocabulary(migrated);
    return migrated;
  }

  function readVocabulary() {
    const current = parseStoredArray(VOCABULARY_KEY);
    return current === null ? migrateVocabularyV1() : normalizeEntries(current);
  }

  function writeVocabulary(entries) {
    try {
      localStorage.setItem(VOCABULARY_KEY, JSON.stringify(normalizeEntries(entries)));
      updateDueBadges();
      return true;
    } catch (_) {
      return false;
    }
  }

  function addVocabularyEntry(raw) {
    const now = new Date().toISOString();
    const learningLanguageId = raw?.learningLanguageId || raw?.languageId || raw?.langId || '';
    const normalizedWord = normalizeVocabularyWord(raw?.normalizedWord || raw?.word, learningLanguageId);
    if (!learningLanguageId || !normalizedWord) return { status: 'invalid', entry: null };
    const id = `${learningLanguageId}::${normalizedWord}`;
    const entries = readVocabulary();
    const existing = entries.find((entry) => entry.id === id);
    const context = normalizeContext(raw.context || raw, learningLanguageId, now);

    if (existing) {
      existing.seenCount += 1;
      existing.lastSeenAt = now;
      const hadContext = context
        ? existing.contexts.some((candidate) => contextKey(candidate, learningLanguageId) === contextKey(context, learningLanguageId))
        : true;
      if (context && !hadContext) {
        existing.contexts = retainContexts([...existing.contexts, context], learningLanguageId);
      }
      if (!writeVocabulary(entries)) return { status: 'error', entry: null };
      return { status: hadContext ? 'duplicate' : 'context_added', entry: existing };
    }

    const entry = validateVocabularyEntry({
      id,
      word: raw.word,
      normalizedWord,
      learningLanguageId,
      translations: raw.translations || {},
      contexts: context ? [context] : [],
      learning: raw.learning,
      addedAt: now,
      lastSeenAt: now,
      seenCount: 1,
    });
    if (!entry || !writeVocabulary([...entries, entry])) return { status: 'error', entry: null };
    return { status: 'added', entry };
  }

  function removeVocabularyEntry(id) {
    const entries = readVocabulary();
    const next = entries.filter((entry) => entry.id !== id);
    return next.length !== entries.length && writeVocabulary(next);
  }

  function updateVocabularyEntry(nextEntry) {
    const normalized = validateVocabularyEntry(nextEntry);
    if (!normalized) return false;
    const entries = readVocabulary();
    const index = entries.findIndex((entry) => entry.id === normalized.id);
    if (index === -1) return false;
    entries[index] = normalized;
    return writeVocabulary(entries);
  }

  function setVocabularyTranslation(id, nativeLanguageId, translation) {
    if (!nativeLanguageId || typeof translation !== 'string' || !translation) return false;
    const entries = readVocabulary();
    const entry = entries.find((candidate) => candidate.id === id);
    if (!entry) return false;
    if (entry.translations[nativeLanguageId] === translation) return true;
    entry.translations[nativeLanguageId] = translation;
    return writeVocabulary(entries);
  }

  function readTranslationCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(TRANSLATION_CACHE_KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function cacheTranslation(key, translation) {
    try {
      localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify({
        ...readTranslationCache(),
        [key]: translation,
      }));
    } catch (_) {
      // Entry storage remains the primary cache.
    }
  }

  async function loadLocalGlossary(learningLanguageId, nativeLanguageId) {
    const pair = `${learningLanguageId}-${nativeLanguageId}`;
    if (glossaryCache.has(pair)) return glossaryCache.get(pair);
    const pending = fetch(`./content/vocabulary/${pair}.json`)
      .then((response) => (response.ok ? response.json() : {}))
      .then((glossary) => (glossary && typeof glossary === 'object' && !Array.isArray(glossary) ? glossary : {}))
      .catch(() => ({}));
    glossaryCache.set(pair, pending);
    return pending;
  }

  async function configuredProviderTranslation(options) {
    const provider = window.VIA_VOCABULARY_TRANSLATION_PROVIDER;
    if (typeof provider === 'function') {
      try {
        const result = await provider(options);
        return typeof result === 'string' ? result.trim() : '';
      } catch (_) {
        return '';
      }
    }
    const endpoint = window.VIA_VOCABULARY_TRANSLATION_ENDPOINT;
    if (typeof endpoint !== 'string' || !endpoint) return '';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!response.ok) return '';
      const result = await response.json();
      const translation = result?.translation || result?.translatedText;
      return typeof translation === 'string' ? translation.trim() : '';
    } catch (_) {
      return '';
    }
  }

  async function resolveVocabularyTranslation(options) {
    const entry = options?.entry || readVocabulary().find((candidate) => candidate.id === options?.entryId);
    const learningLanguageId = options?.learningLanguageId || entry?.learningLanguageId || '';
    const nativeLanguageId = options?.nativeLanguageId || '';
    const word = options?.word || entry?.word || '';
    const normalizedWord = normalizeVocabularyWord(word, learningLanguageId);
    if (!entry || !learningLanguageId || !nativeLanguageId || !normalizedWord) return '';
    if (entry.translations[nativeLanguageId]) return entry.translations[nativeLanguageId];

    const glossary = await loadLocalGlossary(learningLanguageId, nativeLanguageId);
    let translation = '';
    for (const [candidate, value] of Object.entries(glossary)) {
      if (normalizeVocabularyWord(candidate, learningLanguageId) === normalizedWord && typeof value === 'string') {
        translation = value;
        break;
      }
    }

    const cacheKey = `${learningLanguageId}::${nativeLanguageId}::${normalizedWord}`;
    if (!translation) {
      translation = await configuredProviderTranslation({
        word,
        learningLanguageId,
        nativeLanguageId,
        contextSentence: options?.contextSentence || entry.contexts[0]?.sentenceText || '',
      });
    }
    if (!translation) translation = readTranslationCache()[cacheKey] || '';
    if (!translation) return '';
    cacheTranslation(cacheKey, translation);
    setVocabularyTranslation(entry.id, nativeLanguageId, translation);
    return translation;
  }

  function getVocabularyDeck(languageId) {
    return readVocabulary().filter((entry) => entry.learningLanguageId === languageId);
  }

  function isVocabularyDue(entry, now = new Date()) {
    if (!entry || entry.learning.status === 'new') return false;
    return Date.parse(entry.learning.dueAt) <= now.getTime();
  }

  function getDueVocabulary(languageId, now = new Date()) {
    return readVocabulary().filter((entry) => (
      (!languageId || entry.learningLanguageId === languageId) && isVocabularyDue(entry, now)
    ));
  }

  function buildReviewQueue(languageId, now = new Date()) {
    const deck = getVocabularyDeck(languageId);
    const due = deck
      .filter((entry) => isVocabularyDue(entry, now))
      .sort((left, right) => Date.parse(left.learning.dueAt) - Date.parse(right.learning.dueAt));
    const fresh = deck
      .filter((entry) => entry.learning.status === 'new')
      .sort((left, right) => Date.parse(left.addedAt) - Date.parse(right.addedAt))
      .slice(0, MAX_NEW_WORDS_PER_SESSION);
    return [...due, ...fresh].map((entry) => entry.id);
  }

  function addDays(date, days) {
    return new Date(date.getTime() + days * 86400000);
  }

  function introduceVocabularyCard(entry, now = new Date()) {
    const next = validateVocabularyEntry(entry);
    if (!next) return null;
    next.learning.status = 'learning';
    next.learning.difficultyStage = Math.max(1, next.learning.difficultyStage);
    next.learning.dueAt = new Date(now.getTime() + 10 * 60000).toISOString();
    next.learning.intervalIndex = 0;
    return next;
  }

  function rateVocabularyCard(entry, rating, now = new Date()) {
    const next = validateVocabularyEntry(entry);
    if (!next || !['again', 'hard', 'good', 'easy'].includes(rating)) return null;
    const learning = next.learning;
    learning.totalReviews += 1;
    learning.lastReviewedAt = now.toISOString();
    learning.lastRating = rating;

    if (rating === 'again') {
      learning.consecutiveSuccesses = 0;
      learning.lapses += 1;
      learning.difficultyStage = Math.max(1, learning.difficultyStage - 1);
      learning.intervalIndex = Math.max(0, learning.intervalIndex - 1);
      learning.dueAt = new Date(now.getTime() + 10 * 60000).toISOString();
      learning.status = 'learning';
      return next;
    }

    if (rating === 'hard') {
      learning.consecutiveSuccesses = 0;
      const nextIndex = Math.min(REVIEW_INTERVALS_DAYS.length - 1, learning.intervalIndex + 1);
      const days = Math.max(1, REVIEW_INTERVALS_DAYS[nextIndex] / 2);
      learning.dueAt = addDays(now, days).toISOString();
      learning.status = learning.difficultyStage >= 2 ? 'review' : 'learning';
      return next;
    }

    learning.successfulReviews += 1;
    if (rating === 'easy') {
      learning.intervalIndex = Math.min(REVIEW_INTERVALS_DAYS.length - 1, learning.intervalIndex + 2);
      learning.difficultyStage = Math.min(4, learning.difficultyStage + 1);
      learning.consecutiveSuccesses = 0;
    } else {
      learning.intervalIndex = Math.min(REVIEW_INTERVALS_DAYS.length - 1, learning.intervalIndex + 1);
      learning.consecutiveSuccesses += 1;
      if (learning.consecutiveSuccesses >= 2) {
        learning.difficultyStage = Math.min(4, learning.difficultyStage + 1);
        learning.consecutiveSuccesses = 0;
      }
    }
    learning.dueAt = addDays(now, REVIEW_INTERVALS_DAYS[learning.intervalIndex]).toISOString();
    learning.status = learning.difficultyStage === 4 && learning.intervalIndex >= 6
      ? 'mastered'
      : learning.difficultyStage >= 2 ? 'review' : 'learning';
    return next;
  }

  function selectedLearningLanguage() {
    try {
      const settings = JSON.parse(localStorage.getItem('reader-settings') || '{}') || {};
      return typeof settings.learningLanguageId === 'string' ? settings.learningLanguageId : '';
    } catch (_) {
      return '';
    }
  }

  function updateDueBadges() {
    if (typeof document === 'undefined') return;
    const languageId = selectedLearningLanguage();
    const due = getDueVocabulary(languageId || null).length;
    document.querySelectorAll('.vocabulary-due-badge').forEach((badge) => {
      badge.textContent = due ? String(due) : '';
      badge.hidden = due === 0;
      badge.setAttribute('aria-label', due === 1 ? '1 vocabulary word due' : `${due} vocabulary words due`);
    });
  }

  window.ViaVocabulary = {
    LEGACY_VOCABULARY_KEY,
    MAX_CONTEXTS,
    MAX_NEW_WORDS_PER_SESSION,
    REVIEW_INTERVALS_DAYS,
    VOCABULARY_KEY,
    addVocabularyEntry,
    buildReviewQueue,
    getDueVocabulary,
    getVocabularyDeck,
    introduceVocabularyCard,
    isVocabularyDue,
    loadLocalGlossary,
    migrateVocabularyV1,
    normalizeSentence,
    normalizeVocabularyWord,
    rateVocabularyCard,
    readVocabulary,
    removeVocabularyEntry,
    resolveVocabularyTranslation,
    setVocabularyTranslation,
    updateDueBadges,
    updateVocabularyEntry,
    validateVocabularyEntry,
    writeVocabulary,
  };

  if (typeof window.addEventListener === 'function') {
    window.addEventListener('storage', (event) => {
      if ([VOCABULARY_KEY, LEGACY_VOCABULARY_KEY, 'reader-settings'].includes(event.key)) updateDueBadges();
    });
  }
  if (typeof queueMicrotask === 'function') queueMicrotask(updateDueBadges);
  else if (typeof setTimeout === 'function') setTimeout(updateDueBadges, 0);
}());
