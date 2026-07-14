(function () {
  'use strict';

  const COLLAPSED_KEY = 'via-sidebar-collapsed';
  const desktop = window.matchMedia('(min-width: 900px)');

  function create(options = {}) {
    const sidebar = document.getElementById('site-sidebar');
    const toggle = document.getElementById('menu-toggle');
    const closeButton = document.getElementById('sidebar-close');
    const overlay = document.getElementById('overlay');
    const mainView = document.getElementById('sidebar-main-view');
    const settingsView = document.getElementById('settings-view');
    const settingsOpen = document.getElementById('settings-open');
    const settingsBack = document.getElementById('settings-back');
    if (!sidebar || !toggle || !overlay) return null;

    let restoreFocus = toggle;
    let collapsed = localStorage.getItem(COLLAPSED_KEY) === 'true';

    function showMain() {
      if (mainView) mainView.hidden = false;
      if (settingsView) settingsView.hidden = true;
    }

    function sync() {
      if (desktop.matches) {
        document.body.classList.toggle('sidebar-collapsed', collapsed);
        document.body.classList.remove('drawer-open');
        sidebar.classList.add('open');
        sidebar.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', String(!collapsed));
        toggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
      } else {
        document.body.classList.remove('sidebar-collapsed');
        const open = sidebar.classList.contains('open');
        document.body.classList.toggle('drawer-open', open);
        sidebar.setAttribute('aria-hidden', String(!open));
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close sidebar' : 'Open sidebar');
        overlay.classList.toggle('show', open);
        overlay.setAttribute('aria-hidden', String(!open));
      }
    }

    function open() {
      restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
      if (desktop.matches) {
        collapsed = false;
        localStorage.setItem(COLLAPSED_KEY, 'false');
      } else {
        sidebar.classList.add('open');
      }
      sync();
      window.requestAnimationFrame(() => closeButton?.focus());
    }

    function close({ focus = true } = {}) {
      showMain();
      if (desktop.matches) {
        collapsed = true;
        localStorage.setItem(COLLAPSED_KEY, 'true');
      } else {
        sidebar.classList.remove('open');
      }
      sync();
      if (focus) window.requestAnimationFrame(() => (restoreFocus || toggle).focus());
    }

    function toggleSidebar() {
      if (desktop.matches) {
        if (collapsed) open(); else close({ focus: false });
      } else if (sidebar.classList.contains('open')) {
        close();
      } else {
        open();
      }
    }

    function openSettings() {
      if (desktop.matches && collapsed) open();
      if (mainView) mainView.hidden = true;
      if (settingsView) settingsView.hidden = false;
      window.requestAnimationFrame(() => settingsBack?.focus());
      options.onSettingsOpen?.();
    }

    function closeSettings() {
      showMain();
      window.requestAnimationFrame(() => settingsOpen?.focus());
    }

    toggle.addEventListener('click', toggleSidebar);
    closeButton?.addEventListener('click', () => close());
    overlay.addEventListener('click', () => close());
    settingsOpen?.addEventListener('click', openSettings);
    settingsBack?.addEventListener('click', closeSettings);
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (settingsView && !settingsView.hidden) closeSettings();
      else if (!desktop.matches && sidebar.classList.contains('open')) close();
    });
    desktop.addEventListener('change', () => {
      showMain();
      sidebar.classList.toggle('open', desktop.matches);
      sync();
    });
    sidebar.classList.toggle('open', desktop.matches);
    sync();
    return { close, closeSettings, open, openSettings, sync };
  }

  window.ViaSidebar = { create };
}());
