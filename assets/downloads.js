(function () {
  'use strict';

  const STORAGE_KEY = 'reader-downloaded-books';
  const active = new Map();

  function readStates() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch (_) {
      return {};
    }
  }

  function writeState(itemId, status) {
    const states = readStates();
    states[itemId] = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  }

  function state(itemId) {
    if (active.has(itemId)) return 'downloading';
    const saved = readStates()[itemId];
    return saved === 'downloading' ? 'error' : (saved || 'idle');
  }

  function itemUrls(item) {
    const urls = ['./content/catalog.json'];
    if (item.metadataPath) urls.push(item.metadataPath);
    if (item.coverPath) urls.push(item.coverPath);
    (item.sections || item.chapters || []).forEach((section) => {
      if (section.metadataPath) urls.push(section.metadataPath);
      (section.languages || []).forEach((language) => {
        (language.levels || []).forEach((level) => {
          if (level.textPath || level.path) urls.push(level.textPath || level.path);
          if (level.quizPath) urls.push(level.quizPath);
          if (level.audioPath) urls.push(level.audioPath);
        });
      });
    });
    return [...new Set(urls)];
  }

  async function workerController() {
    if (!('serviceWorker' in navigator)) throw new Error('Offline downloads are not supported in this browser.');
    const registration = await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
    if (registration.active) return registration.active;
    throw new Error('Offline service is starting. Reload once and try again.');
  }

  async function download(item, onProgress) {
    if (!item?.id) throw new Error('No item selected.');
    if (active.has(item.id)) return active.get(item.id);
    const promise = new Promise(async (resolve, reject) => {
      let timeout;
      const cleanup = () => {
        window.clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        active.delete(item.id);
      };
      const handleMessage = (event) => {
        const message = event.data;
        if (message?.type !== 'DOWNLOAD_PROGRESS' || message.itemId !== item.id) return;
        onProgress?.(message);
        if (message.status === 'complete') {
          writeState(item.id, 'complete');
          cleanup();
          resolve(message);
        } else if (message.status === 'error') {
          writeState(item.id, 'error');
          cleanup();
          reject(new Error(message.error || 'Download failed.'));
        }
      };
      try {
        const controller = await workerController();
        navigator.serviceWorker.addEventListener('message', handleMessage);
        timeout = window.setTimeout(() => {
          writeState(item.id, 'error');
          cleanup();
          reject(new Error('Download timed out.'));
        }, 5 * 60 * 1000);
        const urls = itemUrls(item);
        writeState(item.id, 'downloading');
        onProgress?.({ type: 'DOWNLOAD_PROGRESS', itemId: item.id, current: 0, total: urls.length, status: 'downloading' });
        controller.postMessage({ type: 'DOWNLOAD_ITEM', itemId: item.id, urls });
      } catch (error) {
        writeState(item.id, 'error');
        cleanup();
        reject(error);
      }
    });
    active.set(item.id, promise);
    return promise;
  }

  window.ViaDownloads = { download, itemUrls, state, storageKey: STORAGE_KEY };
}());
