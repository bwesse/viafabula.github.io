(function () {
  'use strict';

  const landing = document.getElementById('vocabulary-landing');
  const reviewSection = document.getElementById('vocabulary-review');
  const list = document.getElementById('vocabulary-list');
  const count = document.getElementById('vocabulary-count');
  const dueCount = document.getElementById('vocabulary-due-count');
  const newCount = document.getElementById('vocabulary-new-count');
  const empty = document.getElementById('vocabulary-empty');
  const status = document.getElementById('vocabulary-status');
  const languages = document.getElementById('vocabulary-languages');
  const deckTitle = document.getElementById('vocabulary-deck-title');
  const startReviewButton = document.getElementById('start-review');
  const exitReviewButton = document.getElementById('exit-review');
  const reviewDeckTitle = document.getElementById('review-deck-title');
  const reviewProgress = document.getElementById('review-progress');
  const reviewCard = document.getElementById('review-card');
  const attemptedTranslations = new Set();
  const settings = readSettings();
  const nativeLanguageId = settings.nativeLanguageId || 'en';
  let selectedLanguageId = '';
  let expandedEntryId = null;
  let translationRenderToken = 0;
  let review = null;

  function readSettings() {
    try {
      return JSON.parse(localStorage.getItem('reader-settings') || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  function applyTheme() {
    const theme = settings.theme || 'light';
    const dark = theme === 'dark'
      || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.classList.toggle('night', dark);
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function contextUrl(entry, context) {
    if (!context?.itemId || !context.sectionId || !entry.learningLanguageId || !context.levelId) return '';
    const query = new URLSearchParams({
      item: context.itemId,
      section: context.sectionId,
      language: entry.learningLanguageId,
      level: context.levelId,
      vocab: entry.id,
      context: context.id,
    });
    if (context.subchapterId) query.set('subchapter', context.subchapterId);
    return `./index.html?${query}`;
  }

  function languageTitle(entry) {
    return entry.contexts.find((context) => context.languageTitle)?.languageTitle
      || ({ en: 'English', de: 'German', es: 'Spanish', fr: 'French' })[entry.learningLanguageId]
      || entry.learningLanguageId;
  }

  function deckLanguages(entries) {
    const result = new Map();
    entries.forEach((entry) => {
      if (!result.has(entry.learningLanguageId)) result.set(entry.learningLanguageId, languageTitle(entry));
    });
    return [...result.entries()].sort((left, right) => left[1].localeCompare(right[1]));
  }

  function announce(message) {
    status.textContent = message || '';
  }

  function currentTranslation(entry) {
    return entry.translations[nativeLanguageId] || '';
  }

  function entryStatus(entry, now = new Date()) {
    if (entry.learning.status === 'new') return 'New';
    if (window.ViaVocabulary.isVocabularyDue(entry, now)) return 'Due';
    if (entry.learning.status === 'mastered') return 'Mastered';
    return 'Learning';
  }

  function sortedDeck(entries) {
    const now = new Date();
    return [...entries].sort((left, right) => {
      const rank = (entry) => {
        if (window.ViaVocabulary.isVocabularyDue(entry, now)) return 0;
        if (entry.learning.status === 'new') return 1;
        return 2;
      };
      const rankDifference = rank(left) - rank(right);
      if (rankDifference) return rankDifference;
      if (rank(left) === 0) return Date.parse(left.learning.dueAt) - Date.parse(right.learning.dueAt);
      return Date.parse(right.addedAt) - Date.parse(left.addedAt);
    });
  }

  function metadata(context, entry) {
    return [
      context.itemTitle,
      context.subchapterTitle || context.sectionTitle,
      context.languageTitle || languageTitle(entry),
      context.levelTitle || context.levelId,
    ].filter(Boolean).join(' · ');
  }

  function contextDetails(entry, context, index) {
    const wrapper = element('div', 'vocabulary-context-detail');
    if (index > 0) wrapper.append(element('h4', 'vocabulary-context-title', `Additional context ${index}`));
    const sentence = element('blockquote', 'vocabulary-sentence', `“${context.sentenceText}”`);
    const details = element('p', 'vocabulary-meta', metadata(context, entry) || 'Story details unavailable');
    wrapper.append(sentence, details);
    const url = contextUrl(entry, context);
    if (url) {
      const link = element('a', 'vocabulary-context', index === 0 ? 'Go to context' : 'Open this context');
      link.href = url;
      link.setAttribute('aria-label', `Go to story context for ${entry.word}`);
      wrapper.append(link);
    }
    return wrapper;
  }

  function collapseExpandedRow() {
    if (!expandedEntryId) return;
    const previous = [...list.querySelectorAll('.vocabulary-list-item')]
      .find((candidate) => candidate.dataset.entryId === expandedEntryId);
    previous?.querySelector('.vocabulary-row')?.setAttribute('aria-expanded', 'false');
    const details = previous?.querySelector('.vocabulary-details');
    if (details) details.hidden = true;
    expandedEntryId = null;
  }

  function toggleRow(article, entryId) {
    const button = article.querySelector('.vocabulary-row');
    const details = article.querySelector('.vocabulary-details');
    const opening = expandedEntryId !== entryId;
    collapseExpandedRow();
    if (opening) {
      expandedEntryId = entryId;
      button.setAttribute('aria-expanded', 'true');
      details.hidden = false;
    }
  }

  async function retryTranslation(entry) {
    attemptedTranslations.delete(`${entry.id}::${nativeLanguageId}`);
    announce(`Looking up a translation for “${entry.word}”…`);
    const translation = await window.ViaVocabulary.resolveVocabularyTranslation({
      entry,
      nativeLanguageId,
      contextSentence: entry.contexts[0]?.sentenceText || '',
    });
    announce(translation ? `Translation for “${entry.word}” resolved` : 'Translation unavailable');
    renderLanding();
  }

  function vocabularyRow(entry) {
    const article = element('article', 'vocabulary-list-item');
    article.dataset.entryId = entry.id;
    const row = element('button', 'vocabulary-row');
    row.type = 'button';
    row.setAttribute('aria-expanded', 'false');

    const word = element('strong', 'vocabulary-row-word', entry.word);
    const translation = element('span', 'vocabulary-row-translation', currentTranslation(entry) || 'Translation unavailable');
    translation.setAttribute('lang', nativeLanguageId);
    const state = element('span', `vocabulary-state vocabulary-state-${entryStatus(entry).toLowerCase()}`, entryStatus(entry));
    row.append(word, translation, state);

    const details = element('div', 'vocabulary-details');
    details.id = `vocabulary-details-${encodeURIComponent(entry.id).replace(/%/g, '')}`;
    row.setAttribute('aria-controls', details.id);
    details.hidden = true;
    details.append(
      element('h3', 'vocabulary-detail-word', entry.word),
      element('p', 'vocabulary-detail-translation', currentTranslation(entry) || 'Translation unavailable'),
    );
    if (!currentTranslation(entry)) {
      const retry = element('button', 'vocabulary-secondary vocabulary-retry', 'Retry translation');
      retry.type = 'button';
      retry.setAttribute('aria-label', `Retry translation for ${entry.word}`);
      retry.addEventListener('click', () => retryTranslation(entry));
      details.append(retry);
    }
    if (entry.contexts.length) {
      entry.contexts.forEach((context, index) => details.append(contextDetails(entry, context, index)));
    } else {
      details.append(element('p', 'vocabulary-meta', 'Saved context unavailable.'));
    }
    const remove = element('button', 'vocabulary-remove', 'Remove');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove ${entry.word} from vocabulary`);
    remove.addEventListener('click', () => {
      if (window.ViaVocabulary.removeVocabularyEntry(entry.id)) {
        announce(`“${entry.word}” removed`);
        if (expandedEntryId === entry.id) expandedEntryId = null;
        renderLanding();
      } else {
        announce('Vocabulary item could not be removed');
      }
    });
    details.append(remove);
    row.addEventListener('click', () => toggleRow(article, entry.id));
    article.append(row, details);
    return article;
  }

  function renderLanguageTabs(entries) {
    languages.replaceChildren();
    const decks = deckLanguages(entries);
    decks.forEach(([languageId, title]) => {
      const button = element('button', 'vocabulary-language', title);
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(languageId === selectedLanguageId));
      button.addEventListener('click', () => {
        selectedLanguageId = languageId;
        expandedEntryId = null;
        renderLanding();
      });
      languages.append(button);
    });
    languages.hidden = decks.length < 2;
  }

  function ensureSelectedLanguage(entries) {
    const decks = deckLanguages(entries);
    if (decks.some(([languageId]) => languageId === selectedLanguageId)) return;
    const preferred = settings.learningLanguageId;
    selectedLanguageId = decks.some(([languageId]) => languageId === preferred)
      ? preferred
      : decks[0]?.[0] || '';
  }

  async function resolveMissingTranslations(entries) {
    const token = ++translationRenderToken;
    let resolved = false;
    await Promise.allSettled(entries.map(async (entry) => {
      const attemptKey = `${entry.id}::${nativeLanguageId}`;
      if (currentTranslation(entry) || attemptedTranslations.has(attemptKey)) return;
      attemptedTranslations.add(attemptKey);
      const translation = await window.ViaVocabulary.resolveVocabularyTranslation({
        entry,
        nativeLanguageId,
        contextSentence: entry.contexts[0]?.sentenceText || '',
      });
      if (translation) resolved = true;
    }));
    if (resolved && token === translationRenderToken && !review) renderLanding();
  }

  function renderLanding() {
    const entries = window.ViaVocabulary.readVocabulary();
    ensureSelectedLanguage(entries);
    renderLanguageTabs(entries);
    const deck = sortedDeck(entries.filter((entry) => entry.learningLanguageId === selectedLanguageId));
    const due = deck.filter((entry) => window.ViaVocabulary.isVocabularyDue(entry)).length;
    const fresh = deck.filter((entry) => entry.learning.status === 'new').length;
    const title = deck[0] ? languageTitle(deck[0]) : 'Vocabulary';
    deckTitle.textContent = title;
    count.textContent = `${deck.length} saved ${deck.length === 1 ? 'word' : 'words'}`;
    dueCount.textContent = `${due} due today`;
    newCount.textContent = `${fresh} new`;
    const queueSize = due + Math.min(fresh, window.ViaVocabulary.MAX_NEW_WORDS_PER_SESSION);
    startReviewButton.disabled = queueSize === 0;
    startReviewButton.textContent = due ? `Review ${due} due ${due === 1 ? 'word' : 'words'}` : 'Start review';
    startReviewButton.setAttribute(
      'aria-label',
      queueSize ? `Start ${title} vocabulary review with ${queueSize} words` : `No ${title} vocabulary ready for review`,
    );
    empty.hidden = deck.length > 0;
    list.replaceChildren(...deck.map(vocabularyRow));
    if (expandedEntryId) {
      const expanded = [...list.querySelectorAll('.vocabulary-list-item')]
        .find((candidate) => candidate.dataset.entryId === expandedEntryId);
      expanded?.querySelector('.vocabulary-row')?.setAttribute('aria-expanded', 'true');
      const details = expanded?.querySelector('.vocabulary-details');
      if (details) details.hidden = false;
      if (!expanded) expandedEntryId = null;
    }
    window.ViaVocabulary.updateDueBadges();
    resolveMissingTranslations(deck);
  }

  function wordRange(sentence, entry, context) {
    const target = entry.normalizedWord;
    const matches = [];
    if (globalThis.Intl?.Segmenter) {
      try {
        [...new Intl.Segmenter(entry.learningLanguageId, { granularity: 'word' }).segment(sentence)].forEach((part) => {
          if (part.isWordLike && window.ViaVocabulary.normalizeVocabularyWord(part.segment, entry.learningLanguageId) === target) {
            matches.push({ index: part.index, length: part.segment.length });
          }
        });
      } catch (_) {
        // Use the literal fallback below.
      }
    }
    if (!matches.length) {
      let cursor = 0;
      while (cursor < sentence.length) {
        const index = sentence.toLocaleLowerCase().indexOf(entry.word.toLocaleLowerCase(), cursor);
        if (index === -1) break;
        matches.push({ index, length: entry.word.length });
        cursor = index + entry.word.length;
      }
    }
    return matches[context.wordOccurrenceInSentence || 0] || matches[0] || null;
  }

  function appendContextSentence(container, entry, context, cloze = false) {
    const sentence = context?.sentenceText || '';
    const range = wordRange(sentence, entry, context || {});
    const paragraph = element('p', 'review-sentence');
    if (!range) {
      paragraph.textContent = sentence;
    } else {
      paragraph.append(document.createTextNode(sentence.slice(0, range.index)));
      const target = element(cloze ? 'span' : 'mark', cloze ? 'review-cloze' : 'review-word-highlight', cloze ? '________' : sentence.slice(range.index, range.index + range.length));
      paragraph.append(target, document.createTextNode(sentence.slice(range.index + range.length)));
    }
    container.append(paragraph);
  }

  function reviewContext(entry) {
    if (entry.learning.difficultyStage === 4 && entry.contexts.length > 1) {
      return entry.contexts[1 + (entry.learning.totalReviews % (entry.contexts.length - 1))];
    }
    return entry.contexts[0] || null;
  }

  function openStoryLink(entry, context) {
    const url = contextUrl(entry, context);
    if (!url) return null;
    const link = element('a', 'vocabulary-context', 'Open story');
    link.href = url;
    link.setAttribute('aria-label', `Open story context for ${entry.word}`);
    return link;
  }

  function finishReviewCard(entry, rating) {
    const next = window.ViaVocabulary.rateVocabularyCard(entry, rating, new Date());
    if (!next || !window.ViaVocabulary.updateVocabularyEntry(next)) {
      reviewCard.append(element('p', 'review-feedback', 'Review result could not be saved.'));
      return;
    }
    review.reviewed += 1;
    if (rating === 'good' || rating === 'easy') review.remembered += 1;
    else review.needsPractice += 1;
    review.index += 1;
    renderReviewStep();
  }

  function ratingControls(entry, easyAllowed = true) {
    const group = element('div', 'review-ratings');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', `Rate recall for ${entry.word}`);
    ['again', 'hard', 'good', 'easy'].forEach((rating) => {
      const button = element('button', `review-rating review-rating-${rating}`, rating[0].toUpperCase() + rating.slice(1));
      button.type = 'button';
      button.setAttribute('aria-label', `${rating[0].toUpperCase() + rating.slice(1)}: rate recall of ${entry.word}`);
      if (rating === 'easy' && !easyAllowed) button.disabled = true;
      button.addEventListener('click', () => finishReviewCard(entry, rating));
      group.append(button);
    });
    return group;
  }

  function revealMeaning(entry, answerArea, revealButton, easyAllowed) {
    revealButton.hidden = true;
    const translation = currentTranslation(entry) || 'Translation unavailable';
    answerArea.replaceChildren(
      element('p', 'review-answer-label', 'Answer'),
      element('p', 'review-answer', translation),
      ratingControls(entry, easyAllowed),
    );
    window.requestAnimationFrame(() => answerArea.querySelector('.review-rating')?.focus());
  }

  function renderLearnCard(entry, context) {
    reviewCard.append(element('p', 'review-stage', 'Learn'));
    appendContextSentence(reviewCard, entry, context);
    reviewCard.append(
      element('p', 'review-prompt-word', entry.word),
      element('p', 'review-answer', currentTranslation(entry) || 'Translation unavailable'),
    );
    const actions = element('div', 'review-actions');
    const continueButton = element('button', 'vocabulary-primary', 'Continue');
    continueButton.type = 'button';
    continueButton.addEventListener('click', () => {
      const next = window.ViaVocabulary.introduceVocabularyCard(entry, new Date());
      if (!next || !window.ViaVocabulary.updateVocabularyEntry(next)) return;
      review.reviewed += 1;
      review.needsPractice += 1;
      review.index += 1;
      renderReviewStep();
    });
    actions.append(continueButton);
    const story = openStoryLink(entry, context);
    if (story) actions.append(story);
    reviewCard.append(actions);
  }

  function renderMeaningCard(entry, context, reduced) {
    reviewCard.append(element('p', 'review-stage', reduced ? 'Reduced context' : 'Meaning recall'));
    let hintUsed = false;
    let hintButton = null;
    if (reduced) {
      reviewCard.append(element('p', 'review-prompt-word', entry.word), element('p', 'review-question', 'What does this mean?'));
      const hint = element('button', 'vocabulary-secondary', 'Show sentence hint');
      hintButton = hint;
      hint.type = 'button';
      const hintArea = element('div', 'review-hint');
      hintArea.hidden = true;
      hint.addEventListener('click', () => {
        hintUsed = true;
        hint.hidden = true;
        hintArea.hidden = false;
        appendContextSentence(hintArea, entry, context);
      });
      reviewCard.append(hint, hintArea);
    } else {
      appendContextSentence(reviewCard, entry, context);
      reviewCard.append(element('p', 'review-question', `What does “${entry.word}” mean here?`));
    }
    const reveal = element('button', 'vocabulary-primary', 'Reveal answer');
    reveal.type = 'button';
    reveal.setAttribute('aria-label', `Reveal translation for ${entry.word}`);
    const answerArea = element('div', 'review-answer-area');
    answerArea.setAttribute('aria-live', 'polite');
    reveal.addEventListener('click', () => {
      if (hintButton) hintButton.hidden = true;
      revealMeaning(entry, answerArea, reveal, !hintUsed);
    });
    reviewCard.append(reveal, answerArea);
    const story = openStoryLink(entry, context);
    if (story) reviewCard.append(story);
  }

  function accentless(value) {
    return value.normalize('NFD').replace(/\p{M}/gu, '');
  }

  function renderClozeCard(entry, context) {
    reviewCard.append(element('p', 'review-stage', entry.learning.difficultyStage === 4 ? 'Varied context' : 'Produce the word'));
    appendContextSentence(reviewCard, entry, context, true);
    reviewCard.append(element('p', 'review-answer', currentTranslation(entry) || 'Translation unavailable'));
    const label = element('label', 'review-input-label', 'Type the missing word');
    const input = element('input', 'review-input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.autocapitalize = 'off';
    input.id = 'review-answer-input';
    label.htmlFor = input.id;
    const check = element('button', 'vocabulary-primary', 'Check answer');
    check.type = 'button';
    const result = element('div', 'review-answer-area');
    result.setAttribute('aria-live', 'polite');
    function checkAnswer() {
      const expected = window.ViaVocabulary.normalizeVocabularyWord(entry.word, entry.learningLanguageId);
      const answer = window.ViaVocabulary.normalizeVocabularyWord(input.value, entry.learningLanguageId);
      const exact = answer === expected;
      const nearly = !exact && accentless(answer) === accentless(expected);
      input.disabled = true;
      check.hidden = true;
      result.append(
        element('p', 'review-feedback', exact ? 'Correct.' : nearly ? 'Nearly correct — check the accent.' : `Correct answer: ${entry.word}`),
        element('p', 'review-answer', entry.word),
        ratingControls(entry, exact),
      );
      window.requestAnimationFrame(() => result.querySelector('.review-rating')?.focus());
    }
    check.addEventListener('click', checkAnswer);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        checkAnswer();
      }
    });
    reviewCard.append(label, input, check, result);
    const story = openStoryLink(entry, context);
    if (story) reviewCard.append(story);
    window.requestAnimationFrame(() => input.focus());
  }

  function renderReviewComplete() {
    reviewProgress.textContent = '';
    reviewCard.replaceChildren(
      element('h2', 'review-complete-title', 'Review complete'),
      element('p', 'review-complete-stat', `${review.reviewed} words reviewed`),
      element('p', 'review-complete-stat', `${review.remembered} remembered`),
      element('p', 'review-complete-stat', `${review.needsPractice} need more practice`),
    );
    const back = element('button', 'vocabulary-primary', 'Back to vocabulary');
    back.type = 'button';
    back.addEventListener('click', exitReview);
    reviewCard.append(back);
    window.ViaVocabulary.updateDueBadges();
    window.requestAnimationFrame(() => back.focus());
  }

  function renderReviewStep() {
    if (!review || review.index >= review.queue.length) {
      renderReviewComplete();
      return;
    }
    const entry = window.ViaVocabulary.readVocabulary().find((candidate) => candidate.id === review.queue[review.index]);
    if (!entry) {
      review.index += 1;
      renderReviewStep();
      return;
    }
    const context = reviewContext(entry);
    reviewDeckTitle.textContent = languageTitle(entry);
    reviewProgress.textContent = `Review ${review.index + 1} of ${review.queue.length}`;
    reviewCard.replaceChildren();
    const stage = entry.learning.status === 'new' ? 0 : Math.max(1, entry.learning.difficultyStage);
    if (stage === 0) renderLearnCard(entry, context);
    else if (stage === 1) renderMeaningCard(entry, context, false);
    else if (stage === 2) renderMeaningCard(entry, context, true);
    else if (stage === 3) renderClozeCard(entry, context);
    else if (entry.learning.totalReviews % 2 === 0) renderMeaningCard(entry, context, false);
    else renderClozeCard(entry, context);
    if (stage !== 3 && !(stage === 4 && entry.learning.totalReviews % 2 !== 0)) {
      window.requestAnimationFrame(() => reviewCard.querySelector('button')?.focus());
    }
  }

  function startReview() {
    const queue = window.ViaVocabulary.buildReviewQueue(selectedLanguageId, new Date());
    if (!queue.length) return;
    review = { queue, index: 0, reviewed: 0, remembered: 0, needsPractice: 0 };
    landing.hidden = true;
    reviewSection.hidden = false;
    renderReviewStep();
  }

  function exitReview() {
    review = null;
    reviewSection.hidden = true;
    landing.hidden = false;
    renderLanding();
    window.requestAnimationFrame(() => startReviewButton.focus());
  }

  applyTheme();
  window.ViaSidebar.create();
  startReviewButton.addEventListener('click', startReview);
  exitReviewButton.addEventListener('click', exitReview);
  renderLanding();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  }
}());
