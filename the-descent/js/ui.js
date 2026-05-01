/**
 * THE DESCENT — UI Layer
 *
 * Handles all DOM rendering, input handling, and visual presentation.
 * No game logic lives here — all state changes go through the engine.
 */

class GameUI {
  constructor(engine) {
    this.engine = engine;
    this.outputEl = document.getElementById('output');
    this.choicesEl = document.getElementById('choices');
    this.inputEl = document.getElementById('text-input');
    this.inputForm = document.getElementById('input-form');
    this.inventoryEl = document.getElementById('inventory-panel');
    this.fragmentsEl = document.getElementById('fragments-panel');
    this.statusEl = document.getElementById('status-bar');
    this.restartBtn = document.getElementById('restart-btn');
    this.undoBtn = document.getElementById('undo-btn');
    this.newGameBtn = document.getElementById('newgame-btn');
    this.hintBtn = document.getElementById('hint-btn');
    this.audioBtn = document.getElementById('audio-btn');
    this.sidebarEl = document.getElementById('sidebar');
    this.sidebarToggleBtn = document.getElementById('sidebar-toggle');
    this.sidebarCloseBtn = document.getElementById('sidebar-close');
    this.sidebarOverlay = document.getElementById('sidebar-overlay');
    this.prophecyModal = document.getElementById('prophecy-modal');
    this.prophecyModalClose = document.getElementById('prophecy-modal-close');
    this.tutorialModal = document.getElementById('tutorial-modal');
    this.tutorialBeginBtn = document.getElementById('tutorial-begin');
    this.introModal = document.getElementById('intro-modal');
    this.introBeginBtn = document.getElementById('intro-begin');

    this.currentChoices = [];
    this.inputMode = 'both';

    // Audio bed (ambient layer per zone — opt-in, persists muted state)
    this.audioBed = (typeof window !== 'undefined' && window.AudioBed) ? new window.AudioBed() : null;
    this._audioInitialized = false;
    this._lastZone = null;
    this._restoreAudioPreference();

    this._bindEngine();
    this._bindDOM();
  }

  // ─────────────────────────────────────────────
  // AUDIO BED INTEGRATION
  // ─────────────────────────────────────────────

  _restoreAudioPreference() {
    try {
      const muted = localStorage.getItem('descent_audio_muted');
      // Default: muted = true. If never set, stay muted.
      if (this.audioBed) {
        this.audioBed.muted = muted === 'false' ? false : true;
      }
    } catch (e) {}
  }

  _persistAudioPreference() {
    try {
      if (this.audioBed) {
        localStorage.setItem('descent_audio_muted', this.audioBed.muted ? 'true' : 'false');
      }
    } catch (e) {}
  }

  _ensureAudioInit() {
    // AudioContext can only start after a user gesture. Lazy-init the bed
    // on first interaction; if the player has audio unmuted, kick off the
    // current zone immediately.
    if (this._audioInitialized || !this.audioBed) return;
    this._audioInitialized = true;
    const ok = this.audioBed.init();
    if (!ok) return;
    // Apply persisted mute state to the master gain
    this.audioBed.setMuted(this.audioBed.muted);
    // If we already have a zone, start it
    if (this._lastZone) this.audioBed.setZone(this._lastZone);
  }

  _updateAudioZone() {
    if (!this.audioBed) return;
    const room = this.engine.rooms[this.engine.currentRoom];
    const zone = room && room.zone ? room.zone : 'default';
    if (zone !== this._lastZone) {
      this._lastZone = zone;
      if (this._audioInitialized) this.audioBed.setZone(zone);
    }
    // Vreth'kai-with-Mind distortion follows the engine flag. When the
    // player transforms, the world's sound bends with them.
    const vk = !!this.engine.flags.vrethkai_with_mind;
    if (vk !== this._lastVrethkaiMode) {
      this._lastVrethkaiMode = vk;
      if (this._audioInitialized && this.audioBed.setVrethkaiMode) {
        this.audioBed.setVrethkaiMode(vk);
      }
    }
  }

  _refreshAudioBtn() {
    if (!this.audioBtn || !this.audioBed) return;
    const muted = !!this.audioBed.muted;
    this.audioBtn.textContent = muted ? '♪̸' : '♪';
    this.audioBtn.dataset.muted = String(muted);
    this.audioBtn.title = muted
      ? 'Ambient sound is off. Click to turn on.'
      : 'Ambient sound is on. Click to mute.';
  }

  // ─────────────────────────────────────────────
  // ENGINE CALLBACKS
  // ─────────────────────────────────────────────

  _bindEngine() {
    this.engine.onOutput = (text, type) => this._renderOutput(text, type);
    this.engine.onChoices = (choices) => this._renderChoices(choices);
    this.engine.onInputMode = (mode) => this._setInputMode(mode);
    this.engine.onInventoryChange = () => this._renderInventory();
    this.engine.onStateChange = () => {
      this._renderStatus();
      this._updateSilenceTracker();
      this._updateAudioZone();
      this._autoSave();
    };
    this.engine.onGameOver = (type, detail) => {
      this._persistCrossRunState();
      this._renderGameOver(type, detail);
    };
    this.engine.onTutorial = () => this.showTutorial();
    this.engine.onIntro = () => this.showIntro();

    // Restore cross-run state from localStorage on first bind.
    this._restoreCrossRunState();
  }

  // ─────────────────────────────────────────────
  // CROSS-RUN PERSISTENCE
  // ─────────────────────────────────────────────

  _persistCrossRunState() {
    try {
      const data = {
        vrethkaiCompleted: !!this.engine.vrethkaiCompleted,
        fullVrethkaiEscape: !!this.engine.fullVrethkaiEscape,
        sleepingGodNamed: !!this.engine.sleepingGodNamed,
        isChangedWorld: !!this.engine.isChangedWorld
      };
      localStorage.setItem('descent_persistent', JSON.stringify(data));
    } catch (e) {
      // localStorage may be unavailable (private mode, etc) — silent.
    }
  }

  _restoreCrossRunState() {
    try {
      const raw = localStorage.getItem('descent_persistent');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.vrethkaiCompleted) this.engine.vrethkaiCompleted = true;
      if (data.fullVrethkaiEscape) this.engine.fullVrethkaiEscape = true;
      if (data.sleepingGodNamed) this.engine.sleepingGodNamed = true;
      if (data.isChangedWorld) this.engine.isChangedWorld = true;
    } catch (e) {}
  }

  // ─────────────────────────────────────────────
  // SAVE / LOAD (mid-run, single slot, autosaved)
  // ─────────────────────────────────────────────

  _autoSave() {
    try {
      const state = this.engine.getState();
      localStorage.setItem('descent_save', JSON.stringify(state));
      this._flashSavePulse();
    } catch (e) {
      // Quota or private-mode failure — silent.
    }
  }

  _flashSavePulse() {
    const el = document.getElementById('save-pulse');
    if (!el) return;
    // Reflow to restart animation if it's already running
    el.classList.remove('firing');
    void el.offsetWidth;
    el.classList.add('firing');
    setTimeout(() => el.classList.remove('firing'), 1200);
  }

  hasSavedGame() {
    try {
      const raw = localStorage.getItem('descent_save');
      if (!raw) return false;
      const state = JSON.parse(raw);
      return !!(state && state.currentRoom);
    } catch (e) { return false; }
  }

  loadSavedGame() {
    try {
      const raw = localStorage.getItem('descent_save');
      if (!raw) return false;
      const state = JSON.parse(raw);
      this._clearOutput();
      return this.engine.loadState(state, false);
    } catch (e) { return false; }
  }

  clearSavedGame() {
    try { localStorage.removeItem('descent_save'); } catch (e) {}
  }

  // ─────────────────────────────────────────────
  // SILENCE TRACKER (Empty Room — Sleeping God path)
  // ─────────────────────────────────────────────

  _updateSilenceTracker() {
    const e = this.engine;
    const inEmpty = e.currentRoom === 'empty_room' && !e.flags.silence_held && !e.gameOver;
    if (inEmpty) {
      this._startSilenceTimer();
    } else {
      this._clearSilenceTimer();
    }
  }

  _startSilenceTimer() {
    this._clearSilenceTimer();
    this._silenceTimer = setTimeout(() => {
      // 60 seconds passed with no input or click — the room agrees.
      if (this.engine && !this.engine.gameOver) {
        this.engine.holdSilence();
      }
    }, 60000);
  }

  _clearSilenceTimer() {
    if (this._silenceTimer) {
      clearTimeout(this._silenceTimer);
      this._silenceTimer = null;
    }
  }

  _resetSilenceOnActivity() {
    // Any keystroke or click resets the silence countdown.
    if (this.engine.currentRoom === 'empty_room' && !this.engine.flags.silence_held) {
      this._startSilenceTimer();
    }
  }

  // ─────────────────────────────────────────────
  // DOM BINDINGS
  // ─────────────────────────────────────────────

  _bindDOM() {
    // Text input form
    this.inputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = this.inputEl.value.trim();
      if (!val) return;
      this._renderOutput(`> ${val}`, 'input');
      this.inputEl.value = '';
      this.engine.handleTextInput(val);
    });

    // Restart button (after death) — clears save and starts fresh
    this.restartBtn.addEventListener('click', () => {
      this.clearSavedGame();
      this._clearOutput();
      this.engine.start();
    });

    // Undo button — take back the last turn
    if (this.undoBtn) {
      this.undoBtn.addEventListener('click', () => {
        this.engine.undo();
      });
    }

    // Hint button — escalating help for the current room
    if (this.hintBtn) {
      this.hintBtn.addEventListener('click', () => {
        this.engine.requestHint();
      });
    }

    // Audio toggle — mute / unmute the ambient bed.
    // First interaction also initialises the AudioContext (browser policy).
    if (this.audioBtn) {
      this._refreshAudioBtn();
      this.audioBtn.addEventListener('click', () => {
        this._ensureAudioInit();
        if (!this.audioBed) return;
        const next = !this.audioBed.muted;
        this.audioBed.setMuted(next);
        this._persistAudioPreference();
        this._refreshAudioBtn();
        // First unmute also kicks off the current zone (init may have started silent)
        if (!next && this._lastZone) this.audioBed.setZone(this._lastZone);
      });
    }

    // Any first user interaction (click or keypress) lazy-inits the audio
    // context. We do this regardless of the mute state so the context is
    // ready when the player toggles audio on later.
    const lazyAudioInit = () => {
      this._ensureAudioInit();
      document.removeEventListener('click', lazyAudioInit);
      document.removeEventListener('keydown', lazyAudioInit);
    };
    document.addEventListener('click', lazyAudioInit, { once: true });
    document.addEventListener('keydown', lazyAudioInit, { once: true });

    // New Game button — confirm and start a fresh run
    if (this.newGameBtn) {
      this.newGameBtn.addEventListener('click', () => {
        if (this.engine.turnCount > 1 && !this.engine.gameOver) {
          if (!confirm('Start a new game? Your current run will be lost.')) return;
        }
        this.clearSavedGame();
        this._clearOutput();
        this.engine.start();
        if (this.restartBtn) this.restartBtn.style.display = 'none';
      });
    }

    // Keyboard shortcut: focus input on any keypress
    document.addEventListener('keydown', (e) => {
      if (e.target === this.inputEl) return;
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        this.inputEl.focus();
      }
    });

    // Reset silence timer on any activity in the Empty Room.
    document.addEventListener('keydown', () => this._resetSilenceOnActivity());
    document.addEventListener('click', () => this._resetSilenceOnActivity());

    // Sidebar drawer toggle (mobile only — on desktop, sidebar is always visible)
    if (this.sidebarToggleBtn) {
      this.sidebarToggleBtn.addEventListener('click', () => this._openSidebar());
    }
    if (this.sidebarCloseBtn) {
      this.sidebarCloseBtn.addEventListener('click', () => this._closeSidebar());
    }
    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener('click', () => this._closeSidebar());
    }
    // Close drawer with Escape (also closes the prophecy modal)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.prophecyModal && this.prophecyModal.classList.contains('open')) {
          this._closeProphecy();
        } else if (this.sidebarEl && this.sidebarEl.classList.contains('open')) {
          this._closeSidebar();
        }
      }
    });

    // Prophecy fragment viewer — click delegation on the fragments panel
    if (this.fragmentsEl) {
      this.fragmentsEl.addEventListener('click', (e) => {
        const slot = e.target.closest('.frag-slot.frag-found');
        if (!slot) return;
        const id = slot.dataset.fragId;
        if (id) this._openProphecy(id);
      });
    }
    if (this.prophecyModalClose) {
      this.prophecyModalClose.addEventListener('click', () => this._closeProphecy());
    }
    if (this.prophecyModal) {
      // Click on backdrop closes
      this.prophecyModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('prophecy-modal-backdrop')) {
          this._closeProphecy();
        }
      });
    }
  }

  // ─────────────────────────────────────────────
  // BOOT FLOW (tutorial → resume-or-start)
  // ─────────────────────────────────────────────

  /**
   * Top-level boot. Shows the tutorial modal on first run, then either resumes
   * the saved game or starts a new one. Called from index.html's init script
   * instead of engine.start() / loadSavedGame() directly.
   */
  boot() {
    const proceed = () => {
      if (this.hasSavedGame()) {
        this.loadSavedGame();
      } else {
        this.engine.start();
      }
    };
    if (this.shouldShowIntro()) {
      this.showIntro(proceed);
    } else {
      proceed();
    }
  }

  shouldShowIntro() {
    try {
      if (this.hasSavedGame()) return false;
      return localStorage.getItem('descent_intro_seen') !== 'true';
    } catch (e) { return true; }
  }

  showIntro(onClose) {
    if (!this.introModal) {
      if (onClose) onClose();
      return;
    }
    this.introModal.classList.add('open');
    this.introModal.setAttribute('aria-hidden', 'false');
    const dismiss = () => {
      this.introModal.classList.remove('open');
      this.introModal.setAttribute('aria-hidden', 'true');
      try { localStorage.setItem('descent_intro_seen', 'true'); } catch (e) {}
      // Also mark the brief tutorial seen so it doesn't pop up later as a duplicate.
      try { localStorage.setItem('descent_tutorial_seen', 'true'); } catch (e) {}
      document.removeEventListener('keydown', escHandler);
      if (this.introBeginBtn) this.introBeginBtn.removeEventListener('click', dismiss);
      if (onClose) onClose();
    };
    const escHandler = (e) => { if (e.key === 'Escape' || e.key === 'Enter') dismiss(); };
    if (this.introBeginBtn) this.introBeginBtn.addEventListener('click', dismiss);
    document.addEventListener('keydown', escHandler);
  }

  shouldShowTutorial() {
    try {
      if (this.hasSavedGame()) return false;
      return localStorage.getItem('descent_tutorial_seen') !== 'true';
    } catch (e) { return true; }
  }

  showTutorial(onClose) {
    if (!this.tutorialModal) {
      if (onClose) onClose();
      return;
    }
    this.tutorialModal.classList.add('open');
    this.tutorialModal.setAttribute('aria-hidden', 'false');
    const dismiss = () => {
      this.tutorialModal.classList.remove('open');
      this.tutorialModal.setAttribute('aria-hidden', 'true');
      try { localStorage.setItem('descent_tutorial_seen', 'true'); } catch (e) {}
      document.removeEventListener('keydown', escHandler);
      if (this.tutorialBeginBtn) this.tutorialBeginBtn.removeEventListener('click', dismiss);
      if (onClose) onClose();
    };
    const escHandler = (e) => { if (e.key === 'Escape' || e.key === 'Enter') dismiss(); };
    if (this.tutorialBeginBtn) this.tutorialBeginBtn.addEventListener('click', dismiss);
    document.addEventListener('keydown', escHandler);
  }

  _openProphecy(id) {
    const data = this.engine.prophecyIndex && this.engine.prophecyIndex[id];
    if (!data || !this.prophecyModal) return;
    this.prophecyModal.querySelector('.prophecy-modal-id').textContent = data.id;
    this.prophecyModal.querySelector('.prophecy-modal-title').textContent = data.title || '';
    this.prophecyModal.querySelector('.prophecy-modal-text').textContent = data.text || '';
    const foundin = this.prophecyModal.querySelector('.prophecy-modal-foundin');
    foundin.textContent = data.roomName ? `Found in: ${data.roomName}` : '';
    this.prophecyModal.classList.add('open');
    this.prophecyModal.setAttribute('aria-hidden', 'false');
  }

  _closeProphecy() {
    if (!this.prophecyModal) return;
    this.prophecyModal.classList.remove('open');
    this.prophecyModal.setAttribute('aria-hidden', 'true');
  }

  _openSidebar() {
    if (this.sidebarEl) this.sidebarEl.classList.add('open');
    if (this.sidebarOverlay) this.sidebarOverlay.classList.add('open');
  }

  _closeSidebar() {
    if (this.sidebarEl) this.sidebarEl.classList.remove('open');
    if (this.sidebarOverlay) this.sidebarOverlay.classList.remove('open');
  }

  // ─────────────────────────────────────────────
  // OUTPUT RENDERING
  // ─────────────────────────────────────────────

  _renderOutput(text, type) {
    const div = document.createElement('div');
    div.className = `output-block output-${type || 'narration'}`;

    // Process text: preserve line breaks, basic formatting
    const processed = this._processText(text);
    div.innerHTML = processed;

    this.outputEl.appendChild(div);
    this._scrollToBottom();
  }

  _processText(text) {
    // Escape HTML
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Auto-link URLs (http/https plus bare aurelonuniverse.com paths) — done
    // before <br> conversion so the regex sees clean URLs. Newlines and
    // spaces still bound the URL match.
    html = html.replace(
      /\b(https?:\/\/[^\s<>"]+|aurelonuniverse\.com\/?[^\s<>"]*)/g,
      (match) => {
        const href = match.startsWith('http') ? match : 'https://' + match;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${match}</a>`;
      }
    );

    // Preserve line breaks
    html = html.replace(/\n/g, '<br>');

    // Italic markers
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    return html;
  }

  _clearOutput() {
    this.outputEl.innerHTML = '';
  }

  _scrollToBottom() {
    // Smooth scroll to bottom
    requestAnimationFrame(() => {
      this.outputEl.scrollTop = this.outputEl.scrollHeight;
    });
  }

  // ─────────────────────────────────────────────
  // CHOICES RENDERING
  // ─────────────────────────────────────────────

  _renderChoices(choices) {
    this.currentChoices = choices;
    this.choicesEl.innerHTML = '';

    // Belt-and-suspenders: never render choices if the game is over.
    // The engine should bail before re-presenting choices on death,
    // but this guarantees the UI stays locked even if it doesn't.
    if (this.engine && this.engine.gameOver) {
      this.choicesEl.style.display = 'none';
      return;
    }

    if (this.inputMode === 'none' || this.inputMode === 'text') {
      this.choicesEl.style.display = 'none';
      return;
    }

    if (choices.length === 0) {
      this.choicesEl.style.display = 'none';
      return;
    }

    this.choicesEl.style.display = 'flex';

    for (const choice of choices) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice.label;
      if (choice.disabled) {
        btn.disabled = true;
        btn.className += ' choice-disabled';
      }
      btn.addEventListener('click', () => {
        if (choice.action) {
          this._renderOutput(`> ${choice.label}`, 'input');
          choice.action();
        }
      });
      this.choicesEl.appendChild(btn);
    }
  }

  // ─────────────────────────────────────────────
  // INPUT MODE
  // ─────────────────────────────────────────────

  _setInputMode(mode) {
    // Belt-and-suspenders: a dead game stays dead. Don't let a stray
    // inputMode event from the engine re-enable input after gameOver.
    if (this.engine && this.engine.gameOver && mode !== 'none') {
      mode = 'none';
    }
    this.inputMode = mode;
    const inputContainer = document.getElementById('input-container');

    if (mode === 'none') {
      inputContainer.style.display = 'none';
      this.choicesEl.style.display = 'none';
    } else if (mode === 'text') {
      inputContainer.style.display = 'flex';
      this.choicesEl.style.display = 'none';
    } else if (mode === 'choices') {
      inputContainer.style.display = 'none';
      this.choicesEl.style.display = 'flex';
    } else {
      // 'both'
      inputContainer.style.display = 'flex';
      this.choicesEl.style.display = 'flex';
    }
  }

  // ─────────────────────────────────────────────
  // SIDEBAR PANELS
  // ─────────────────────────────────────────────

  _renderInventory() {
    if (!this.inventoryEl) return;
    const items = this.engine.inventory;
    const max = this.engine.maxInventory;

    let html = `<div class="panel-header">Carrying (${items.length}/${max})</div>`;
    if (items.length === 0) {
      html += '<div class="panel-empty">Nothing</div>';
    } else {
      for (const item of items) {
        html += `<div class="inv-item" title="${item.description || ''}">${item.name}</div>`;
      }
    }
    this.inventoryEl.innerHTML = html;
  }

  _renderStatus() {
    if (!this.statusEl) return;
    const e = this.engine;
    const room = e.rooms[e.currentRoom];
    const infoEl = document.getElementById('status-info') || this.statusEl;

    let html = `<span class="status-room">${room ? room.name : '???'}</span>`;
    html += `<span class="status-sep">|</span>`;
    html += `<span class="status-turns">Turn ${e.turnCount}</span>`;
    html += `<span class="status-sep">|</span>`;
    html += `<span class="status-frags">Fragments: ${e.prophecyFragments.size}/${e.totalFragments}</span>`;

    if (e.relicShards.size > 0) {
      html += `<span class="status-sep">|</span>`;
      html += `<span class="status-shards">Shards: ${e.relicShards.size}/${e.totalShards}</span>`;
    }

    if (e.identity) {
      html += `<span class="status-sep">|</span>`;
      html += `<span class="status-identity">${e.identity.charAt(0).toUpperCase() + e.identity.slice(1)}</span>`;
    }

    // Timer warning
    for (const [roomId, timer] of Object.entries(e.activeTimers)) {
      if (roomId === e.currentRoom) {
        html += `<span class="status-sep">|</span>`;
        html += `<span class="status-timer">Danger: ${timer.turnsLeft} turns</span>`;
      }
    }

    infoEl.innerHTML = html;

    // Update Undo button state — disabled when there's nothing to take back.
    if (this.undoBtn) {
      const canUndo = e._undoStack && e._undoStack.length > 0;
      this.undoBtn.disabled = !canUndo;
    }

    // Update Hint button state — disabled when no hints remain for this room.
    if (this.hintBtn) {
      const room = e.rooms[e.currentRoom];
      const hints = room && room.hints;
      const shown = (e.hintsViewed && e.hintsViewed[e.currentRoom]) || 0;
      const canHint = !!(hints && hints.length > shown);
      this.hintBtn.disabled = !canHint;
    }

    // Also update fragments panel
    this._renderFragments();
  }

  _renderFragments() {
    if (!this.fragmentsEl) return;
    const frags = this.engine.prophecyFragments;
    const index = this.engine.prophecyIndex || {};

    let html = `<div class="panel-header">Prophecy (${frags.size}/20)</div>`;
    for (let i = 1; i <= 20; i++) {
      const id = `P${i}`;
      const found = frags.has(id);
      const meta = index[id];
      const title = found && meta ? this._escapeHtml(meta.title) : '';
      const tooltip = found && meta ? `${id} — ${title} (click to read)` : 'Not yet found';
      const dataAttr = found ? ` data-frag-id="${id}"` : '';
      html += `<div class="frag-slot ${found ? 'frag-found' : 'frag-empty'}" title="${tooltip}"${dataAttr}>${found ? id : '?'}</div>`;
    }
    this.fragmentsEl.innerHTML = html;
  }

  _escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─────────────────────────────────────────────
  // GAME OVER
  // ─────────────────────────────────────────────

  _renderGameOver(type, detail) {
    // Disable input
    this._setInputMode('none');

    // Show restart
    this.restartBtn.style.display = 'block';

    if (type === 'death') {
      this.restartBtn.textContent = 'The dark takes you. Begin again.';
    } else {
      this.restartBtn.textContent = 'Play again';
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameUI;
} else {
  window.GameUI = GameUI;
}
