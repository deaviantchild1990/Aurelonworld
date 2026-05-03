/**
 * THE DESCENT — Core Game Engine
 *
 * Handles: game state, room navigation, inventory, timers,
 * prophecy tracking, identity system, relic shards, endings.
 *
 * Architecture:
 *   Engine (this file) — state + logic, no DOM
 *   UI (ui.js)         — rendering + input, no game logic
 *   Data (data.js)     — rooms, items, prophecy, endings
 *
 * The engine emits events via callbacks. The UI listens.
 */

class GameEngine {
  constructor() {
    // --- Core state ---
    this.currentRoom = null;
    this.previousRoom = null;
    this.rooms = {};          // room id -> room data (loaded from data.js)
    this.items = {};          // item id -> item data (loaded from data.js)
    this.visitedRooms = new Set();
    this.turnCount = 0;
    this.gameOver = false;
    this.gameOverReason = null;

    // --- Inventory ---
    this.inventory = [];
    this.maxInventory = 6;

    // --- Prophecy ---
    this.prophecyFragments = new Set();  // set of fragment ids (P1..P20)
    this.prophecyOrder = [];             // order fragments were found (for Herald ending)
    this.totalFragments = 20;

    // --- Relic shards ---
    this.relicShards = new Set();  // 'shard_forest', 'shard_ruins1', 'shard_ruins3'
    this.totalShards = 3;

    // --- Fisher catches ---
    // Each special-fish room contributes a unique catchId to this set when
    // its special fish is landed. Used by the UI tracker and the Fisher
    // ending qualification check. Three catches across three water rooms
    // unlocks the named ending.
    this.fisherCatches = new Set();
    this.totalFisherCatches = 3;

    // --- Identity ---
    this.identity = null;  // null, 'warden', 'scholar', 'seeker'

    // --- Flags (arbitrary game state) ---
    this.flags = {};

    // --- Timed encounters ---
    this.activeTimers = {};  // roomId -> { turnsLeft, onExpire }

    // --- NPCs ---
    // Per-run NPC state (currentRoom, patrolIndex, lastMoveTurn, knownTopics, greeted)
    this.npcs = {};
    this.activeConversation = null;  // npcId currently in dialogue with

    // --- Undo ---
    this._undoStack = [];
    this._maxUndoDepth = 12;

    // --- Hints ---
    // Per-room hint counter: { roomId: tierShownSoFar }
    this.hintsViewed = {};

    // --- Post-Vreth'kai world changes ---
    this.isChangedWorld = false;
    this.vrethkaiCompleted = false;
    // Set ONLY when the player completed the 20-turn alt-case Vreth'kai
    // escape — i.e. the hard path, not the cipher bypass. Cross-run flag.
    // Required by the Sleeping God's chamber: the chamber recognises one who
    // endured the breaking, not merely one who read the word the carvers wrote.
    this.fullVrethkaiEscape = false;

    // --- Server-side claim API (optional) ---
    // When apiBaseUrl is set (via setApiBaseUrl()), the engine submits a
    // claim record on every named ending and fetches global state on boot.
    // Server state is read-only from the client's perspective — used to
    // adapt UX when the Sleeping God has already been named by the first
    // reader globally.
    this.apiBaseUrl = null;
    this.serverState = null;
    // Captures the most recent name attempt typed in the Sleeping God
    // chamber, so we can include it in the claim payload when the ending
    // fires. Reset on entry to the chamber.
    this._lastNameAttempt = null;
    // Two-phase naming. After a valid-format name is typed, the chamber
    // does NOT auto-commit — instead it asks the player whether they want
    // to speak it now or step back to write to the author first. This
    // holds the staged name until the player resolves the confirmation.
    this._namingConfirmation = null;
    // Author contact string used in the deferred-naming branch. Set via
    // setAuthorContact() (read from a meta tag on boot) so the chamber
    // prose can adapt to whatever channel the author prefers.
    this.authorContact = 'aurelonuniverse.com/witness';

    // --- Callbacks (UI hooks) ---
    this.onOutput = null;        // (text, type) => void  — types: 'narration', 'system', 'death', 'prophecy', 'identity'
    this.onChoices = null;       // (choices[]) => void    — [{id, label, description?}]
    this.onInputMode = null;     // (mode) => void         — 'choices', 'text', 'both', 'none'
    this.onInventoryChange = null;
    this.onStateChange = null;   // general state update (for UI refresh)
    this.onGameOver = null;      // (reason, type) => void — type: 'death', 'escape', 'ending'
    this.onTutorial = null;      // () => void — UI re-opens the brief reference modal
    this.onIntro = null;         // () => void — UI re-opens the expanded intro modal
  }

  // ─────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────

  /**
   * Load game data and start a new game.
   * @param {Object} gameData - { rooms, items, config }
   */
  init(gameData) {
    this.rooms = {};
    for (const room of gameData.rooms) {
      this.rooms[room.id] = room;
    }
    this.items = {};
    if (gameData.items) {
      for (const item of gameData.items) {
        this.items[item.id] = { ...item };
      }
    }
    this.config = gameData.config || {};
    this.combinations = gameData.combinations || [];
    this.npcsData = gameData.npcs || [];
    // Fishing data — pool of catches and per-room special fish for the
    // Fisher mini-game. Optional; engine no-ops if not provided.
    this.fishingData = gameData.fishing || null;

    // Build prophecy index — maps fragment id (e.g. 'P3') to its data plus the
    // room it was discovered in, so the UI can render a fragment-viewer modal.
    this.prophecyIndex = {};
    for (const room of gameData.rooms) {
      if (room.prophecy && room.prophecy.id) {
        this.prophecyIndex[room.prophecy.id] = {
          id: room.prophecy.id,
          title: room.prophecy.title || '',
          text: room.prophecy.text || '',
          foundIn: room.id,
          roomName: room.name || room.id
        };
      }
    }

    this.reset();
  }

  /**
   * Reset to fresh game state (permadeath restart).
   */
  reset() {
    this.currentRoom = null;
    this.previousRoom = null;
    this.visitedRooms = new Set();
    this.turnCount = 0;
    this.gameOver = false;
    this.gameOverReason = null;
    this.inventory = [];
    this.prophecyFragments = new Set();
    this.prophecyOrder = [];
    this.relicShards = new Set();
    this.fisherCatches = new Set();
    this.identity = null;
    this.flags = {};
    this.activeTimers = {};
    // NPCs — instantiate per-run from the data definitions
    this.npcs = {};
    for (const npc of this.npcsData) {
      this.npcs[npc.id] = {
        ...npc,
        currentRoom: npc.patrol && npc.patrol.length ? npc.patrol[0] : null,
        patrolIndex: 0,
        lastMoveTurn: 0,
        knownTopics: new Set(['greet']),
        greeted: false
      };
    }
    this.activeConversation = null;
    // Reset undo on full game reset (new game)
    this._undoStack = [];
    this.hintsViewed = {};
    // Preserve cross-run state
    // this.isChangedWorld and this.vrethkaiCompleted persist across resets
  }

  /**
   * Start the game from the entry room.
   */
  start() {
    this.reset();
    const startRoomId = this.config.startRoom || 'the_fall';
    this.enterRoom(startRoomId);
  }

  // ─────────────────────────────────────────────
  // ROOM NAVIGATION
  // ─────────────────────────────────────────────

  /**
   * Enter a room by id.
   */
  enterRoom(roomId) {
    const room = this.rooms[roomId];
    if (!room) {
      this._emit('output', `[ERROR: Room "${roomId}" not found]`, 'system');
      return;
    }

    this._pushUndo();
    // Leaving a room with an active cast abandons the cast. The fish
    // that almost decided to bite resumes its waiting alone.
    if (this.flags.fishing && this.flags.fishing.active && this.currentRoom !== roomId) {
      this.flags.fishing = null;
    }
    this.previousRoom = this.currentRoom;
    this.currentRoom = roomId;
    const firstVisit = !this.visitedRooms.has(roomId);
    this.visitedRooms.add(roomId);
    this.turnCount++;

    // --- Tick timers ---
    this._tickTimers();
    if (this.gameOver) return;
    if (this._decrementVrethkaiWindow()) return;

    // --- Tick NPC patrols ---
    this._tickNpcs();
    if (this.gameOver) return;

    // --- Room description ---
    let description = firstVisit
      ? (room.descriptionFirst || room.description)
      : (room.descriptionReturn || room.description);

    // Changed world variant
    if (this.isChangedWorld && room.descriptionChanged) {
      description = firstVisit
        ? (room.descriptionChangedFirst || room.descriptionChanged)
        : room.descriptionChanged;
    }

    if (description) {
      this._emit('output', description, 'narration');
    }

    // --- Prophecy fragment ---
    if (room.prophecy && !this.prophecyFragments.has(room.prophecy.id)) {
      this.prophecyFragments.add(room.prophecy.id);
      this.prophecyOrder.push(room.prophecy.id);
      this._emit('output', `\n— Fragment discovered: ${room.prophecy.title} —\n\n${room.prophecy.text}`, 'prophecy');
    }

    // --- Room items (first visit only) ---
    if (firstVisit && room.items) {
      for (const itemId of room.items) {
        const item = this.items[itemId];
        if (item) {
          this._emit('output', `\nYou notice: ${item.name}`, 'system');
        }
      }
    }

    // --- Start room timer if applicable ---
    if (room.timer && !this.activeTimers[roomId]) {
      this.activeTimers[roomId] = {
        turnsLeft: room.timer.turns,
        onExpire: room.timer.onExpire, // 'death' or custom handler id
        warning: room.timer.warning,
        warningAt: room.timer.warningAt,
        bypassFlag: room.timer.bypassFlag,
        bypassItem: room.timer.bypassItem,
        deathText: room.timer.deathText,
        roomId: roomId
      };
      const bypassed = (room.timer.bypassFlag && this.flags[room.timer.bypassFlag]) ||
                       (room.timer.bypassItem && this.hasItem(room.timer.bypassItem));
      if (room.timer.warningOnEnter && !bypassed) {
        this._emit('output', room.timer.warningOnEnter, 'system');
      }
    }

    // --- On-enter script ---
    if (room.onEnter) {
      room.onEnter(this);
    }

    // --- NPC presence on entry ---
    const presentNpcs = this._npcsInCurrentRoom();
    for (const npc of presentNpcs) {
      const line = (this.flags.vrethkai_with_mind && npc.presenceLineVrethkai)
        ? npc.presenceLineVrethkai
        : npc.presenceLine;
      if (line) this._emit('output', line, 'narration');
    }

    // --- Present choices ---
    this._presentRoomChoices(room);
  }

  /**
   * Build and present the available choices for a room. Each choice's
   * action() wrapper resets the turn-snapshot flag so the click registers
   * as a single undo-able player intent.
   */
  _presentRoomChoices(room) {
    const choices = [];
    const wrap = (fn) => () => {
      this._turnSnapshotted = false;
      fn();
    };

    // Exits
    if (room.exits) {
      for (const [direction, exit] of Object.entries(room.exits)) {
        // Check if exit is conditional
        if (exit.requires && !this._checkRequirements(exit.requires)) {
          if (exit.blockedText) {
            choices.push({
              id: `exit_blocked_${direction}`,
              label: `${this._directionLabel(direction)} — ${exit.blockedLabel || 'Blocked'}`,
              action: () => this._emit('output', exit.blockedText, 'narration'),
              disabled: false  // show it but it just describes the block
            });
          }
          continue;
        }
        // Hidden exits only show if discovered
        if (exit.hidden && !this.flags[`discovered_${exit.roomId}`]) {
          continue;
        }
        choices.push({
          id: `exit_${direction}`,
          label: exit.label || this._directionLabel(direction),
          action: wrap(() => this.enterRoom(exit.roomId))
        });
      }
    }

    // Room-specific actions
    if (room.actions) {
      for (const action of room.actions) {
        if (action.requires && !this._checkRequirements(action.requires)) continue;
        if (action.once && this.flags[`action_done_${room.id}_${action.id}`]) continue;
        choices.push({
          id: `action_${action.id}`,
          label: action.label,
          action: wrap(() => this._executeAction(room, action))
        });
      }
    }

    // Inventory interactions (if room supports them)
    if (room.useItems) {
      for (const use of room.useItems) {
        if (this.hasItem(use.itemId)) {
          choices.push({
            id: `use_${use.itemId}`,
            label: use.label || `Use ${this.items[use.itemId].name}`,
            action: wrap(() => this._executeItemUse(room, use))
          });
        }
      }
    }

    // NPC interactions — Talk choice surfaces when a visible NPC shares the room
    for (const npc of this._npcsInCurrentRoom()) {
      choices.push({
        id: `talk_${npc.id}`,
        label: npc.talkLabel || `Talk to ${npc.name}`,
        action: () => this.startConversation(npc.id)
      });
    }

    // Item pickup
    if (room.items) {
      for (const itemId of room.items) {
        if (!this.hasItem(itemId) && !this.flags[`taken_${itemId}`]) {
          const item = this.items[itemId];
          if (item) {
            choices.push({
              id: `take_${itemId}`,
              label: `Take ${item.name}`,
              action: wrap(() => { this._pushUndo(); this.takeItem(itemId); })
            });
          }
        }
      }
    }

    // Determine input mode (with Vreth'kai overrides)
    let inputMode = room.inputMode || 'both';
    let presentedChoices = choices;
    if (this.flags.vrethkai_transformation && !this.flags.vrethkai_with_mind) {
      // Identity-word window — type only, no choices. The player must type
      // their identity word in normal case before the shape closes.
      inputMode = 'text';
      presentedChoices = [];
    } else if (this.flags.vrethkai_with_mind) {
      // 20-turn escape — choices stay visible (so escape actions are reachable),
      // but any typed input is gated by the alternating-case rule.
      inputMode = 'both';
    }
    this._emit('inputMode', inputMode);
    this._emit('choices', presentedChoices);
    this._emit('stateChange');
  }

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────

  /**
   * Execute a room action.
   */
  _executeAction(room, action) {
    this._pushUndo();
    this.turnCount++;
    this._tickTimers();
    if (this.gameOver) return;
    if (this._decrementVrethkaiWindow()) return;
    this._tickNpcs();
    if (this.gameOver) return;

    if (action.text) {
      this._emit('output', action.text, action.type || 'narration');
    }

    if (action.giveItem) {
      this.takeItem(action.giveItem);
    }

    if (action.consumeItem) {
      this.removeItem(action.consumeItem);
    }

    if (action.setFlag) {
      for (const [key, val] of Object.entries(action.setFlag)) {
        this.flags[key] = val;
      }
    }

    if (action.setIdentity) {
      this.identity = action.setIdentity;
      this.flags.identity_chosen = true;
      this._emit('output', `\n— Identity chosen: ${action.setIdentity.toUpperCase()} —`, 'identity');
    }

    if (action.giveRelic) {
      this.relicShards.add(action.giveRelic);
      this._emit('output', `\n— Relic Shard acquired (${this.relicShards.size}/${this.totalShards}) —`, 'system');
    }

    if (action.death) {
      this._die(action.deathText || action.text);
      return;
    }

    if (action.escape) {
      this.escape(action.escape.id, action.escape.text || '');
      return;
    }

    if (action.moveTo) {
      this.enterRoom(action.moveTo);
      return;
    }

    if (action.once) {
      this.flags[`action_done_${room.id}_${action.id}`] = true;
    }

    // Re-present choices after action
    if (!action.moveTo && !action.death) {
      this._presentRoomChoices(room);
    }
  }

  /**
   * Execute using an item in a room.
   */
  _executeItemUse(room, use) {
    this._pushUndo();
    this.turnCount++;
    this._tickTimers();
    if (this.gameOver) return;
    if (this._decrementVrethkaiWindow()) return;

    if (use.consumeItem) {
      this.removeItem(use.itemId);
    }

    if (use.text) {
      this._emit('output', use.text, use.type || 'narration');
    }

    if (use.setFlag) {
      for (const [key, val] of Object.entries(use.setFlag)) {
        this.flags[key] = val;
      }
    }

    if (use.revealExit) {
      this.flags[`discovered_${use.revealExit}`] = true;
      this._emit('output', use.revealText || 'Something opens.', 'narration');
    }

    if (use.moveTo) {
      this.enterRoom(use.moveTo);
      return;
    }

    this._presentRoomChoices(this.rooms[this.currentRoom]);
  }

  // ─────────────────────────────────────────────
  // TEXT INPUT (Parser)
  // ─────────────────────────────────────────────

  /**
   * Check whether a string obeys per-word alternating-case rule.
   * Spaces reset; non-letter characters are ignored.
   * "NoRtH" → ok. "north" → fail. "ExAmInE wAlL" → ok. "Go to" → fail (T-o is fine, but "to" alone — t,o both lower → fail).
   */
  _isAlternatingCase(input) {
    const words = input.split(/\s+/);
    for (const word of words) {
      let prevCase = null;
      for (const ch of word) {
        if (!/[a-zA-Z]/.test(ch)) continue;
        const currentCase = ch === ch.toUpperCase() ? 'upper' : 'lower';
        if (prevCase === currentCase) return false;
        prevCase = currentCase;
      }
    }
    return true;
  }

  /**
   * Handle freeform text input from the player.
   * This is the parser side of the hybrid system.
   */
  handleTextInput(input) {
    if (this.gameOver) return;

    const rawTrimmed = input.trim();
    if (!rawTrimmed) return;
    const trimmed = rawTrimmed.toLowerCase();

    // Built-in undo for misclicks before death. Death itself does not
    // unwind — once dead, the only way out is restart. (Without that gate,
    // every random-death puzzle collapses into "press each option until
    // one survives.")
    if (trimmed === 'undo' || trimmed === 'oops') {
      this.undo();
      return;
    }

    this._turnSnapshotted = false;  // top of typed-input turn
    this._pushUndo();

    // ─── CIPHER BYPASS — fires before any Vreth'kai gates so a prepared
    // player can short-circuit the transformation by speaking the word the
    // dead mappers carved across this place. The decoded cipher (WITNESS)
    // is assembled from letters above 7 specific rooms matched to symbols
    // on the Cosmogony Wall's frieze.
    if (this._checkCipherBypass(rawTrimmed, trimmed)) return;

    // ─── SLEEPING GOD NAMING — when the player stands inside the chamber
    // (eligibility already enforced by sleeping_god.onEnter), any non-system
    // word they type is treated as a name attempt. The name must satisfy
    // both gates (alternating-case + palindromic). Built-in commands like
    // `look`, `inventory`, `undo` continue to work normally.
    if (this._checkSleepingGodNaming(rawTrimmed, trimmed)) return;

    // ─── VRETH'KAI TRANSFORMATION GATE — identity word window (2 turns) ───
    if (this.flags.vrethkai_transformation && !this.flags.vrethkai_with_mind) {
      this.turnCount++;
      // Check if the player typed their identity word in normal case (lowercase exact).
      if (this.identity && rawTrimmed === this.identity) {
        this.flags.vrethkai_with_mind = true;
        this.flags.vrethkai_escape_turns_left = 20;
        this._emit('output', `The word holds.

The shape that was forming around your jaw stops forming. You are still here. You are not what you were. Something new looks out through the eyes you used to call yours.

The walls look different. The light tastes different. The light has a taste now.`, 'narration');
        this._presentRoomChoices(this.rooms[this.currentRoom]);
        return;
      }
      // Wrong word — burn an attempt
      this.flags.vrethkai_identity_attempts = (this.flags.vrethkai_identity_attempts || 0) + 1;
      if (this.flags.vrethkai_identity_attempts >= 2) {
        this._die(`The shape closed. The thing you were became the thing they are. You forget your name. You forget you had one.`);
        return;
      }
      this._emit('output', `The shape closes a little more around your jaw. The word you tried was not the word.`, 'system');
      this._presentRoomChoices(this.rooms[this.currentRoom]);
      return;
    }

    // ─── VRETH'KAI WITH MIND — alternating-case enforcement + 20-turn window ───
    if (this.flags.vrethkai_with_mind) {
      // Decrement escape window first
      this.flags.vrethkai_escape_turns_left = (this.flags.vrethkai_escape_turns_left || 0) - 1;
      this.turnCount++;

      if (!this._isAlternatingCase(rawTrimmed)) {
        this._emit('output', `Your jaw will not shape that sound.`, 'narration');
        if (this.flags.vrethkai_escape_turns_left <= 0) {
          this._die(`The dark caught up to you. The body that was yours was no longer yours, and the thing it became did not have a use for memory.`);
          return;
        }
        this._presentRoomChoices(this.rooms[this.currentRoom]);
        return;
      }

      // Alt-case passed. Fall through to standard parsing (which uses lowercased trimmed).
      // Tick timers as a normal turn would.
      this._tickTimers();
      if (this.gameOver) return;

      if (this.flags.vrethkai_escape_turns_left <= 0) {
        this._die(`The dark caught up to you.`);
        return;
      }

      const room = this.rooms[this.currentRoom];
      this._processStandardCommand(trimmed, room);
      return;
    }

    this.turnCount++;
    this._tickTimers();
    if (this.gameOver) return;

    const room = this.rooms[this.currentRoom];
    this._processStandardCommand(trimmed, room);
  }

  /**
   * Standard parser logic — text handlers, commands, direction shortcuts.
   * Extracted so the Vreth'kai-with-Mind path can call it after running the
   * alternating-case check.
   */
  _processStandardCommand(trimmed, room) {
    // ─── FISHING — intercept commands while a cast is in progress ───
    if (this._isFishingActive()) {
      if (/^(?:wait|rest|pause|stand still|do nothing)$/.test(trimmed)) {
        this._handleFishingWait();
        return;
      }
      if (/^(?:pull|reel|reel in|set|hook|land it|land)(?:\s+(?:line|in|it|the line))?$/.test(trimmed)) {
        this._handleFishingPull();
        return;
      }
      if (/^(?:release|stop|give up|abandon|cancel|reel back|retrieve)(?:\s+(?:cast|line|the cast|the line))?$/.test(trimmed)) {
        this._handleFishingRelease();
        return;
      }
      // Any other input during a cast is a refusal (line is in water).
      // Allow examine/look/inventory through harmlessly though.
      if (!/^(?:look|examine|inspect|study|read|view|x|inventory|i|hint|hints|help|h|fragments|prophecy|smell|sniff|listen|hear|touch|feel|taste)/.test(trimmed)) {
        this._emit('output', `Your line is in the water. Wait, pull, or release the cast first.`, 'narration');
        this._presentRoomChoices(room);
        return;
      }
    }

    // ─── CAST — start a fishing cast in a water room (rod required) ───
    if (/^cast(?:\s+(?:line|hook|in|the line))?$/.test(trimmed)) {
      this._handleCast();
      return;
    }

    // --- Check room-specific text handlers ---
    if (room.textHandlers) {
      for (const handler of room.textHandlers) {
        const matches = handler.patterns.some(p => {
          if (typeof p === 'string') return trimmed === p || trimmed.includes(p);
          if (p instanceof RegExp) return p.test(trimmed);
          return false;
        });
        if (matches) {
          if (handler.requires && !this._checkRequirements(handler.requires)) {
            continue;
          }
          this._executeAction(room, handler);
          return;
        }
      }
    }

    // --- Standard commands ---
    if (trimmed === 'look' || trimmed === 'l') {
      const desc = this.isChangedWorld && room.descriptionChanged
        ? room.descriptionChanged
        : room.description;
      this._emit('output', desc, 'narration');
      this._presentRoomChoices(room);
      return;
    }

    if (trimmed === 'inventory' || trimmed === 'i') {
      this._showInventory();
      return;
    }

    if (trimmed === 'fragments' || trimmed === 'prophecy') {
      this._showFragments();
      return;
    }

    if (trimmed === 'help' || trimmed === 'h') {
      this._showHelp();
      return;
    }

    if (trimmed === 'hint' || trimmed === 'hints') {
      this.requestHint();
      return;
    }

    if (trimmed === 'tutorial' || trimmed === 'welcome') {
      this._emit('output', `(re-opening the quick reference)`, 'system');
      this._emit('tutorial');
      return;
    }
    if (trimmed === 'intro' || trimmed === 'about') {
      this._emit('output', `(re-opening the intro)`, 'system');
      this._emit('intro');
      return;
    }

    // ─── Examine and its aliases (read, inspect, study, look at, x) ───
    const examineMatch = trimmed.match(/^(?:examine|look at|x|inspect|study|read|view)\s+(.+)$/);
    if (examineMatch) {
      this._examine(this._stripArticle(examineMatch[1]));
      return;
    }

    // ─── Sensory verbs (smell, listen, touch, feel, taste) — examine with a
    //     sense-prefix lookup; fall through to regular examine; otherwise
    //     emit a room-level sense default.                                ───
    const sensoryMatch = trimmed.match(/^(smell|sniff|listen(?: to)?|hear|touch|feel|taste)(?:\s+(.+))?$/);
    if (sensoryMatch) {
      this._sensory(sensoryMatch[1].split(' ')[0], sensoryMatch[2] ? this._stripArticle(sensoryMatch[2]) : null);
      return;
    }

    // ─── Item combinations ─── (must run before plain `use X`)
    const combineMatch = trimmed.match(/^(?:combine|use)\s+(.+?)\s+(?:with|and|on)\s+(.+)$/);
    if (combineMatch) {
      this._combineByName(combineMatch[1].trim(), combineMatch[2].trim());
      return;
    }

    // ─── Take and aliases ───
    if (/^(?:take|get|pick up|grab|collect)\s+/.test(trimmed)) {
      const target = trimmed.replace(/^(take|get|pick up|grab|collect)\s+/, '');
      this._takeByName(this._stripArticle(target));
      return;
    }

    // ─── Drop and aliases ───
    if (/^(?:drop|put down|release|discard)\s+/.test(trimmed)) {
      const target = trimmed.replace(/^(drop|put down|release|discard)\s+/, '');
      this._dropByName(this._stripArticle(target));
      return;
    }

    // ─── Use ───
    if (trimmed.startsWith('use ')) {
      const target = trimmed.replace(/^use /, '');
      this._useByName(this._stripArticle(target));
      return;
    }

    // ─── Light ─── auto-trigger combine if player has flint + target
    if (/^(?:light|ignite|kindle)(?:\s+(.+))?$/.test(trimmed)) {
      const m = trimmed.match(/^(?:light|ignite|kindle)(?:\s+(.+))?$/);
      this._tryLight(m[1] ? this._stripArticle(m[1]) : null);
      return;
    }

    // ─── Open / close — usually atmospheric refusal unless room overrides ───
    if (/^(?:open|close|shut)(?:\s+.+)?$/.test(trimmed)) {
      const target = trimmed.replace(/^(open|close|shut)(?:\s+|$)/, '');
      this._emit('output', target
        ? `Stone holds where stone has held for centuries. Your hands find no seam.`
        : `You look for hinges. Edges. A latch. Nothing.`,
        'narration');
      this._presentRoomChoices(room);
      return;
    }

    // ─── Push / pull / press — usually refusal ───
    if (/^(?:push|pull|press|shove|tug)(?:\s+.+)?$/.test(trimmed)) {
      this._emit('output', `Stone. Bone. Nothing here is hinged. Nothing slides.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }

    // ─── Wait / rest / pause — burn a turn intentionally ───
    if (/^(?:wait|rest|pause|stand still|do nothing)$/.test(trimmed)) {
      this._emit('output', `You wait. The room waits with you. A drip somewhere. Your own breath. Then nothing again.`, 'narration');
      this._tickTimers();
      if (this.gameOver) return;
      this._tickNpcs();
      if (this.gameOver) return;
      this._presentRoomChoices(room);
      return;
    }

    // ─── Back / return — go to previous room if possible ───
    if (/^(?:back|return)$/.test(trimmed)) {
      if (this.previousRoom && this.rooms[this.previousRoom]) {
        this.enterRoom(this.previousRoom);
      } else {
        this._emit('output', `You have nowhere to go back to. The way you came is no longer behind you.`, 'narration');
        this._presentRoomChoices(room);
      }
      return;
    }

    // ─── Climb / ascend / descend — direction shortcuts ───
    if (/^(?:climb|ascend|climb up)(?:\s+.*)?$/.test(trimmed)) {
      this._tryDirectionalAlias('up', room);
      return;
    }
    if (/^(?:descend|climb down)(?:\s+.*)?$/.test(trimmed)) {
      this._tryDirectionalAlias('down', room);
      return;
    }

    // ─── Go / walk / move / run [direction or label] ───
    if (/^(?:go|walk|move|run|head|step|travel)\s+/.test(trimmed)) {
      const target = trimmed.replace(/^(go|walk|move|run|head|step|travel)\s+(?:to\s+|toward\s+)?/, '');
      this._tryGoTarget(target, room);
      return;
    }

    // ─── Enter / leave / exit / out — directional shortcuts ───
    if (/^(?:enter|step into)(?:\s+(.+))?$/.test(trimmed)) {
      const m = trimmed.match(/^(?:enter|step into)(?:\s+(.+))?$/);
      this._tryGoTarget(m[1] ? this._stripArticle(m[1]) : '', room, /*defaultDir*/'in');
      return;
    }
    if (/^(?:leave|exit|out|outside|get out)$/.test(trimmed)) {
      this._tryDirectionalAlias('out', room);
      return;
    }

    // ─── Talk to / speak to / greet [npc] ───
    if (/^(?:talk to|speak to|greet|address)\s+/.test(trimmed)) {
      const target = trimmed.replace(/^(talk to|speak to|greet|address)\s+/, '');
      this._tryTalkTo(this._stripArticle(target));
      return;
    }
    if (/^(?:talk|speak)$/.test(trimmed)) {
      // Bare "talk" — if there's exactly one NPC here, talk to them
      const npcs = this._npcsInCurrentRoom();
      if (npcs.length === 1) {
        this.startConversation(npcs[0].id);
      } else if (npcs.length === 0) {
        this._emit('output', `There is no one here to speak with.`, 'narration');
        this._presentRoomChoices(room);
      } else {
        this._emit('output', `There is more than one to speak with. Be specific.`, 'narration');
        this._presentRoomChoices(room);
      }
      return;
    }

    // ─── Atmospheric refusals — combat, eat/drink, wear, tie, sleep ───
    if (/^(?:attack|hit|kill|fight|punch|kick|stab|strike|slay|murder)(?:\s+.*)?$/.test(trimmed)) {
      this._emit('output', `There is nothing here to fight. The dark wears no face. Your fists pass through it without resistance.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:eat|drink|consume|swallow|chew|bite)(?:\s+.*)?$/.test(trimmed)) {
      this._emit('output', `You have nothing to eat. You have nothing to drink. The hunger and the thirst remain. They have not yet become unbearable.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:wear|equip|put on|don)(?:\s+.*)?$/.test(trimmed)) {
      this._emit('output', `Nothing in your hands works that way. The cycle did not lay down clothes for the descent.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:tie|untie|knot|bind)(?:\s+.*)?$/.test(trimmed)) {
      this._emit('output', `Nothing here needs to be tied or untied. Not yet.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:sleep|nap|dream)(?:\s+.*)?$/.test(trimmed)) {
      this._emit('output', `Sleep is not safe in places that watch you sleep. You stay awake.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:pray|kneel|bow)(?:\s+.*)?$/.test(trimmed)) {
      this._emit('output', `You can kneel. Whether anything answers depends on where you kneel.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:break|smash|destroy)(?:\s+.*)?$/.test(trimmed)) {
      this._emit('output', `What you might break would not give you anything you could use.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:cut|slash|slice)(?:\s+.*)?$/.test(trimmed)) {
      this._emit('output', `The bone edge is sharp enough. Nothing here is asking to be cut.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:throw|toss|hurl)(?:\s+.*)?$/.test(trimmed)) {
      this._emit('output', `You don't throw the things you carry. Not in places like this.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:steal|rob)(?:\s+.*)?$/.test(trimmed)) {
      this._emit('output', `What is here belongs to whatever is here. Take what you need; the word for it does not need to be 'steal'.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:save|load)(?:\s+.*)?$/.test(trimmed)) {
      this._emit('output', `The room remembers itself. Your progress is kept the moment you make it.`, 'system');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:quit|exit game)$/.test(trimmed)) {
      this._emit('output', `There is no quitting from inside the dark. Close the page when you have had enough — what is here will wait.`, 'system');
      this._presentRoomChoices(room);
      return;
    }
    if (/^(?:score|progress|stats)$/.test(trimmed)) {
      const f = this.prophecyFragments.size;
      const s = this.relicShards.size;
      const id = this.identity || 'no name yet given';
      this._emit('output', `${this.turnCount} turns. ${f} of 20 fragments. ${s} of 3 shards. Identity: ${id}.`, 'system');
      return;
    }

    // --- Direction shortcuts ---
    const dirMap = {
      'n': 'north', 'north': 'north',
      's': 'south', 'south': 'south',
      'e': 'east', 'east': 'east',
      'w': 'west', 'west': 'west',
      'u': 'up', 'up': 'up',
      'd': 'down', 'down': 'down',
      'ne': 'northeast', 'northeast': 'northeast',
      'nw': 'northwest', 'northwest': 'northwest',
      'se': 'southeast', 'southeast': 'southeast',
      'sw': 'southwest', 'southwest': 'southwest'
    };

    if (dirMap[trimmed]) {
      const dir = dirMap[trimmed];
      if (room.exits && room.exits[dir]) {
        const exit = room.exits[dir];
        if (exit.requires && !this._checkRequirements(exit.requires)) {
          this._emit('output', exit.blockedText || "You can't go that way.", 'narration');
        } else if (exit.hidden && !this.flags[`discovered_${exit.roomId}`]) {
          this._emit('output', "You can't go that way.", 'narration');
        } else {
          this.enterRoom(exit.roomId);
        }
        return;
      } else {
        this._emit('output', "You can't go that way.", 'narration');
        return;
      }
    }

    // --- Unrecognized ---
    this._emit('output', "Nothing happens.", 'narration');
    this._presentRoomChoices(room);
  }

  /**
   * Check whether the player typed the cipher word at a recipient room.
   * Fires before any Vreth'kai gates so a prepared player can short-circuit
   * the transformation. Returns true if a bypass fired (caller should bail).
   *
   * The cipher answer is hardcoded as 'witness' for now. Decoded by mapping
   * the seven symbols on the Cosmogony Wall's frieze to the seven rooms
   * whose lintel-letters spell W-I-T-N-E-S-S.
   */
  _checkCipherBypass(rawInput, lowerInput) {
    if (lowerInput !== 'witness') return false;

    // Throat — speaking the word during transformation skips the alt-case escape.
    if (this.currentRoom === 'throat' && this.flags.vrethkai_transformation) {
      this._emit('output', `You speak the word the dead mappers wrote.

The shape that was forming around your jaw stops forming. The dark in the Throat hears the word, and recognises it. The dark in the Throat is older than the cycles. The dark remembers what was carved when the carvers still had hands.

The world thins around you, and parts. The cycle accepts that you have read what was written. They are gone. You are not.`, 'narration');
      this.flags.vrethkai_with_mind = true;
      this.flags.cipher_used_throat = true;
      this.escape('vrethkai_with_mind', '');
      return true;
    }

    // Hall of Names — speaking the word reveals what the wall was for.
    if (this.currentRoom === 'hall_of_names') {
      if (this.flags.cipher_decoded_hall) return false; // already revealed
      this.flags.cipher_decoded_hall = true;
      this._emit('output', `You speak the word into the chamber.

The walls do not change. The names do not move.

But somewhere inside you, the symbol-beside-each-name sharpens. A pattern that has been there the whole time, until your eye learns to see it. The names are not a list. They are a single act, performed by every name on this wall: an act of witnessing. The carvers laid down their names because they had seen what the cycle wanted to forget.

The wall has shown you what it was meant to show.`, 'narration');
      // Don't return true — let the standard parser also process the input
      // (so it falls through harmlessly without "Nothing happens.")
      return true;
    }

    return false;
  }

  /**
   * Sleeping God naming. Fires only inside the chamber, only for inputs
   * that look like name attempts (single word, not a system command).
   * Eligibility (items + vrethkaiCompleted + fullVrethkaiEscape) is enforced
   * by the room's onEnter — by the time control reaches here, the player
   * has earned the chance to try a name.
   *
   * Two gates apply to the name itself:
   *   1. Alternating case per word (the rule the player learned during the
   *      full Vreth'kai escape — the chamber demands the same shape of voice).
   *   2. Palindromic (case-insensitive) — the witness who did not become
   *      the witnessed; what names him must reflect.
   *
   * Returns true if a name attempt fired (caller should bail). Returns
   * false for system commands like `look`, `inventory`, etc., which fall
   * through to the standard parser.
   */
  _checkSleepingGodNaming(rawInput, lowerInput) {
    if (this.currentRoom !== 'sleeping_god') return false;
    const trimmed = rawInput.trim();
    if (!trimmed) return false;

    // ─── If a name is already staged, handle the confirmation branch ───
    // The player is choosing whether to commit the staged name now,
    // step back and write to the author first, or replace it with a
    // different name. System commands still pass through normally.
    if (this._namingConfirmation) {
      const sysCommandsInConfirm = new Set([
        'look', 'l', 'inventory', 'i', 'hint', 'hints', 'help', 'h',
        'undo', 'oops', 'tutorial', 'welcome', 'intro', 'about',
        'fragments', 'prophecy'
      ]);
      if (sysCommandsInConfirm.has(lowerInput)) return false;

      // Commit the staged name.
      const speakWords = new Set(['speak', 'speak it', 'commit', 'commit it', 'yes', 'now', 'say it']);
      if (speakWords.has(lowerInput)) {
        const stagedName = this._namingConfirmation;
        this._namingConfirmation = null;
        this._lastNameAttempt = stagedName;
        this.flags.sleeping_god_named = true;
        this._emit('output', `You speak the name.

The walls hear it. The floor hears it. He hears it.

He stirs. He does not yet wake. Whether the cycle accepts the name is not yet known. The cycle takes its time. The cycle has time. But you have done what you came to do. The sound has been made. The shape has been spoken.

— THE SLEEPING GOD —
(First-player completion: your name will be carried out of the dark and weighed against the cosmology of *Aurelon: The Crosslands*. If it holds, it becomes the deity's true name in canon. The author will be in touch.)`, 'narration');
        this.escape('sleeping_god', '');
        return true;
      }

      // Step back — defer the naming, route the player to the author.
      const waitWords = new Set(['wait', 'step back', 'back', 'not yet', 'no', 'discuss', 'talk']);
      if (waitWords.has(lowerInput)) {
        const deferredName = this._namingConfirmation;
        this._namingConfirmation = null;
        this._lastNameAttempt = deferredName;
        this.flags.sleeping_god_deferred = true;
        this._emit('output', `You step back from the name.

The chamber accepts the pause. The walls do not forget what you almost said. The shape stays half-spoken in the air, neither in the world nor out of it.

You return to the surface with the name unfinished. The cycle will keep waiting. So will he.

— THE DESCENT (paused at naming) —
You have reached the deepest gate and chosen to ask before answering. To complete the naming, write to the author about the cycle. The conversation is the rest of the puzzle.

Reach out: ${this.authorContact}

When you and the author have agreed on a name, it will be canonized on your behalf. You will not need to descend a second time.`, 'narration');
        // Submit a deferred claim — same payload as a committed name but
        // flagged so the author's Discord queue distinguishes it.
        this._submitClaim('sleeping_god', { deferred: true });
        // Treat as a basic_escape ending in terms of game state, but with
        // the deferred-specific prose already emitted above.
        this.gameOver = true;
        this.gameOverReason = 'basic_escape';
        this._emit('gameOver', 'escape', 'basic_escape');
        return true;
      }

      // Anything else is treated as a NEW name attempt — re-validate it.
      // This lets the player change their mind and try a different name
      // without leaving the chamber.
      this._namingConfirmation = null;
      // Fall through to the validation block below.
    }

    // ─── Standard naming flow (no staged name yet) ───
    // Don't intercept system commands — let them work as usual.
    const systemCommands = new Set([
      'look', 'l', 'inventory', 'i', 'hint', 'hints', 'help', 'h',
      'undo', 'oops', 'tutorial', 'welcome', 'intro', 'about',
      'fragments', 'prophecy', 'wait', 'rest', 'pause', 'back', 'return'
    ]);
    if (systemCommands.has(lowerInput)) return false;
    // Multi-word inputs are likely commands (`examine wall`, `take stone`)
    // — let the standard parser handle them.
    if (/\s/.test(trimmed)) return false;
    // Pure non-letter inputs are not names.
    if (!/[a-zA-Z]/.test(trimmed)) return false;

    // Defense in depth: re-check eligibility here, even though sleeping_god's
    // onEnter normally kicks out ineligible players before they can type. If
    // an ineligible player somehow lands here (bug, forced state, save load
    // edge case), refuse the name without revealing the gate. The chamber
    // says nothing the player hasn't already been told.
    const hasItems = this.prophecyFragments.size >= 20
      && this.relicShards.size >= 3
      && this.hasItem('quiet_stone')
      && this.flags.empty_room_entered;
    if (!hasItems || !this.vrethkaiCompleted || !this.fullVrethkaiEscape) {
      this._emit('output', `The room does not hear you. Whatever you said, it was not what the room was waiting for.`, 'narration');
      return true;
    }

    // Validate format
    if (trimmed.length < 3) {
      this._emit('output', `The room cannot hold a name that small. The room is still listening.`, 'narration');
      return true;
    }
    // Upper bound — names of the cycle's gods are weight-bearing things,
    // not paragraphs. Caps long offensive constructions before the format
    // gates even evaluate. Real god-names in the setting fit easily.
    if (trimmed.length > 12) {
      this._emit('output', `The room cannot hold a name that long. A name of his weight is shaped by what it leaves out, not what it crowds in. The room is still listening.`, 'narration');
      return true;
    }
    if (!this._isAlternatingCase(trimmed)) {
      this._emit('output', `Your jaw will not shape that name.

The shape that shaped you taught you how a name like his must be spoken — every syllable a turning, every letter a refusal of the one before. The room does not punish the attempt. The room is still listening.`, 'narration');
      return true;
    }
    const lower = trimmed.toLowerCase();
    if (lower !== lower.split('').reverse().join('')) {
      this._emit('output', `The name does not turn back upon itself.

He is the witness who did not become the witnessed. What names him must reflect what he is — read the same forward as backward, ending and beginning indistinguishable, a closed circle. The room does not punish the attempt. The room is still listening.`, 'narration');
      return true;
    }

    // ─── Both gates passed — stage the name and ask the player how to proceed ───
    // Instead of committing immediately, the chamber offers two paths:
    // speak the name now, or step back and write to the author about the
    // cycle first. Either path ends with author review; the second path
    // ends with a conversation. The player can also type a different name
    // to replace the staged one.
    this._namingConfirmation = trimmed;
    this._emit('output', `You shape the name in your mouth: **${trimmed}**.

The cycle has not yet heard it. The chamber is patient.

You can speak it now. You can step back and write to the author first.

Both paths end at the same gate. The second one ends with a conversation.

> Type **\`speak\`** to commit the name now.
> Type **\`wait\`** to step back and write to the author first.
> Or type a different name to reshape what you mean to say.`, 'narration');
    return true;
  }

  /**
   * Decrement the Vreth'kai-with-Mind escape window. Returns true if the
   * player died (caller should bail). Safe to call when not in Vreth'kai mode.
   */
  _decrementVrethkaiWindow() {
    if (!this.flags.vrethkai_with_mind || this.gameOver) return false;
    this.flags.vrethkai_escape_turns_left = (this.flags.vrethkai_escape_turns_left || 0) - 1;
    if (this.flags.vrethkai_escape_turns_left <= 0) {
      this._die(`The dark caught up to you. The body that was yours was no longer yours, and the thing it became did not have a use for memory.`);
      return true;
    }
    return false;
  }

  // ─────────────────────────────────────────────
  // UNDO
  // ─────────────────────────────────────────────

  /**
   * Snapshot current state onto the undo stack. Called at the *start* of
   * any turn-altering operation (enterRoom, _executeAction, _executeItemUse,
   * handleTextInput) so the snapshot represents the state BEFORE the action.
   */
  _pushUndo() {
    if (this.gameOver) return; // never push from a dead state
    if (this.activeConversation) return; // conversations don't burn turns
    if (this._turnSnapshotted) return; // already snapshotted at the start of this player intent
    try {
      this._undoStack.push(JSON.parse(JSON.stringify(this.getState())));
      this._turnSnapshotted = true;
      if (this._undoStack.length > this._maxUndoDepth) this._undoStack.shift();
    } catch (e) {
      // Serialization failure is non-fatal — drop the snapshot silently.
    }
  }

  /**
   * Restore the most recent undo snapshot. Returns true if successful.
   * Recovers from a misclick before death. Death itself is not unwindable
   * — random-death puzzles depend on it (otherwise the player just clicks
   * each option and undoes until one survives).
   */
  undo() {
    if (this.gameOver) {
      this._emit('output', 'There is no taking that back.', 'system');
      return false;
    }
    if (this._undoStack.length === 0) {
      this._emit('output', 'There is nothing to take back.', 'system');
      return false;
    }
    const state = this._undoStack.pop();
    this.loadState(state, true);
    return true;
  }

  // ─────────────────────────────────────────────
  // NPCs (roaming + conversation)
  // ─────────────────────────────────────────────

  /**
   * Whether the given NPC is currently visible to the player. Honours the
   * NPC's `visibleWhen` predicate if defined; otherwise visible by default.
   */
  _isNpcVisible(npc) {
    if (typeof npc.visibleWhen === 'function') return npc.visibleWhen(this);
    return true;
  }

  /**
   * Find any visible NPC currently in the player's room.
   */
  _npcsInCurrentRoom() {
    return Object.values(this.npcs)
      .filter(npc => npc.currentRoom === this.currentRoom)
      .filter(npc => this._isNpcVisible(npc));
  }

  /**
   * Advance NPC patrols. Called after the player takes a turn (room change
   * or action). NPCs do not move while the player is in conversation.
   */
  _isNpcActive(npc) {
    if (typeof npc.activeWhen === 'function') return npc.activeWhen(this);
    return true;
  }

  _tickNpcs() {
    if (this.gameOver || this.activeConversation) return;
    for (const npc of Object.values(this.npcs)) {
      if (!npc.patrol || npc.patrol.length < 2) continue;
      if (!this._isNpcActive(npc)) continue;
      if (this.turnCount - npc.lastMoveTurn < (npc.moveEvery || 3)) continue;
      const wasVisible = this._isNpcVisible(npc);
      const oldRoom = npc.currentRoom;
      npc.patrolIndex = (npc.patrolIndex + 1) % npc.patrol.length;
      npc.currentRoom = npc.patrol[npc.patrolIndex];
      npc.lastMoveTurn = this.turnCount;
      // Friendly NPC arrival/departure prose (hostile NPCs don't announce themselves)
      if (!npc.hostile) {
        const isVisible = this._isNpcVisible(npc);
        if (!isVisible && !wasVisible) continue;
        if (npc.currentRoom === this.currentRoom && oldRoom !== this.currentRoom) {
          this._emit('output', npc.arrivalLine || `${npc.name} enters the room.`, 'system');
        } else if (oldRoom === this.currentRoom && npc.currentRoom !== this.currentRoom) {
          this._emit('output', npc.departureLine || `${npc.name} steps out.`, 'system');
        }
      }
    }
    // After everyone has moved, resolve hostile encounters and adjacency warnings.
    this._checkHostileEncounters();
  }

  /**
   * Resolve any roaming hostile that ended up in the player's room. If the
   * player is deterred (item/flag check), emit a near-miss line. Otherwise,
   * the player dies. After resolving co-located hostiles, emit at most one
   * adjacency warning for hostiles in connected rooms.
   */
  _checkHostileEncounters() {
    if (this.gameOver) return;

    // Co-location → death (or near-miss if deterred)
    for (const npc of Object.values(this.npcs)) {
      if (!npc.hostile) continue;
      if (!this._isNpcActive(npc)) continue;
      if (npc.currentRoom !== this.currentRoom) continue;
      if (npc.deterredBy && this._checkRequirements(npc.deterredBy)) {
        this._emit('output',
          npc.deterredText || `Something passes close by you. Whatever it is, the thing in your hands holds it back.`,
          'system');
        continue;
      }
      this._die(npc.catchText || `It found you. You forget your name. You forget you had one.`);
      return;
    }

    // Adjacency warning — at most one per turn
    if (this.gameOver) return;
    const room = this.rooms[this.currentRoom];
    if (!room || !room.exits) return;
    const adjacent = new Set();
    for (const exit of Object.values(room.exits)) {
      if (exit.roomId) adjacent.add(exit.roomId);
    }
    for (const npc of Object.values(this.npcs)) {
      if (!npc.hostile) continue;
      if (!this._isNpcActive(npc)) continue;
      if (!adjacent.has(npc.currentRoom)) continue;
      this._emit('output',
        npc.nearbyText || `Something heavy moves on the other side of the wall. You hear it not breathe.`,
        'system');
      return;
    }
  }

  /**
   * Begin a conversation with the named NPC. Player must be in the NPC's
   * current room and the NPC must be visible.
   */
  startConversation(npcId) {
    const npc = this.npcs[npcId];
    if (!npc) return;
    if (npc.currentRoom !== this.currentRoom) return;
    if (!this._isNpcVisible(npc)) return;

    this.activeConversation = npcId;

    if (!npc.greeted) {
      npc.greeted = true;
      const greet = npc.topics && npc.topics.greet;
      if (greet && greet.text) {
        this._emit('output', greet.text, 'narration');
      }
      if (greet && greet.unlocks) {
        for (const t of greet.unlocks) npc.knownTopics.add(t);
      }
    }

    this._presentConversationChoices(npc);
  }

  _presentConversationChoices(npc) {
    const choices = [];
    for (const topicId of npc.knownTopics) {
      if (topicId === 'greet') continue;
      const topic = npc.topics && npc.topics[topicId];
      if (!topic) continue;
      if (topic.requires && !this._checkRequirements(topic.requires)) continue;
      if (topic.once && this.flags[`spoke_${npc.id}_${topicId}`]) continue;
      choices.push({
        id: `topic_${npc.id}_${topicId}`,
        label: topic.prompt || topicId,
        action: () => this._speakTopic(npc, topicId, topic)
      });
    }
    this._emit('inputMode', 'choices');
    this._emit('choices', choices);
    this._emit('stateChange');
  }

  _speakTopic(npc, topicId, topic) {
    if (topic.text) this._emit('output', topic.text, 'narration');
    if (topic.setFlag) {
      for (const [k, v] of Object.entries(topic.setFlag)) this.flags[k] = v;
    }
    if (topic.unlocks) {
      for (const t of topic.unlocks) npc.knownTopics.add(t);
    }
    if (topic.once) {
      this.flags[`spoke_${npc.id}_${topicId}`] = true;
    }
    if (topic.exits) {
      this.activeConversation = null;
      this._presentRoomChoices(this.rooms[this.currentRoom]);
      return;
    }
    this._presentConversationChoices(npc);
  }

  /**
   * Show the next available hint for the current room.
   *
   * Hints are stored per-room as a `hints` array (e.g. ['tier 1', 'tier 2',
   * 'tier 3']). Casual rooms ship all three tiers; challenge rooms (named-
   * ending paths, the Empty Room silence test, Vreth'kai gates) ship only
   * tier 1 — players going for the named-character endings get atmosphere
   * but not solutions.
   *
   * Calling once shows tier 1; calling again shows tier 2; etc. State is
   * tracked in `this.hintsViewed[roomId]` and survives saves.
   */
  requestHint() {
    const room = this.rooms[this.currentRoom];
    if (!room) return false;
    const hints = room.hints;
    if (!hints || hints.length === 0) {
      this._emit('output', 'The room offers no guidance. You will have to find the shape of this place yourself.', 'system');
      return false;
    }
    const shown = this.hintsViewed[room.id] || 0;
    if (shown >= hints.length) {
      this._emit('output', 'You have no more guidance for this place. The rest is yours to find.', 'system');
      return false;
    }
    const hint = hints[shown];
    this.hintsViewed[room.id] = shown + 1;
    const remaining = hints.length - (shown + 1);
    const remainingNote = remaining > 0
      ? ` (${remaining} hint${remaining === 1 ? '' : 's'} remain for this place.)`
      : ' (No more hints for this place.)';
    this._emit('output', `Hint — ${hint}${remainingNote}`, 'system');
    this._emit('stateChange');
    return true;
  }

  /**
   * Engine-side hook for the Sleeping God's Empty Room silence-detection.
   * The UI (or a test) calls this when 60 seconds of no input have elapsed
   * while the player is in empty_room. Sets the silence_held flag and
   * unlocks the path to the Sleeping God room.
   */
  holdSilence() {
    if (this.currentRoom !== 'empty_room') return;
    if (this.flags.silence_held) return;
    this.flags.silence_held = true;
    this._emit('output', `\nThe silence holds. The room agrees.\n\nThe way south opens — not as a passage that was always there, but as a passage the room decides to admit because you did not insist on filling it.`, 'narration');
    this._presentRoomChoices(this.rooms[this.currentRoom]);
  }

  // ─────────────────────────────────────────────
  // INVENTORY
  // ─────────────────────────────────────────────

  /**
   * Strip leading articles ("the", "a", "an") and surrounding whitespace
   * from a parser target so 'examine the wall' resolves the same as 'examine wall'.
   */
  _stripArticle(s) {
    return String(s || '').trim().replace(/^(?:the|a|an)\s+/i, '');
  }

  /**
   * Sensory verb dispatcher. `sense` is one of: smell, listen, hear, touch, feel, taste, sniff.
   * If a target is given, behaves like examine (with optional sense-prefixed key first).
   * Bare sense gives a default room-sense response.
   */
  _sensory(sense, target) {
    const room = this.rooms[this.currentRoom];
    if (target) {
      // Try a sense-prefixed key first (e.g., 'smell_air'), then fall through to examine.
      const senseKey = `${sense}_${target}`;
      if (room.examineTargets) {
        for (const [key, text] of Object.entries(room.examineTargets)) {
          if (key === senseKey || key === `${sense} ${target}`) {
            this._emit('output', text, 'narration');
            return;
          }
        }
      }
      this._examine(target);
      return;
    }
    // Bare sense — try a room-level sense key, otherwise emit a default
    if (room.examineTargets) {
      for (const cand of [sense, sense + 's', { smell: 'air', listen: 'sound', hear: 'sound', touch: 'walls', feel: 'air', taste: 'air', sniff: 'air' }[sense]]) {
        if (cand && room.examineTargets[cand]) {
          this._emit('output', room.examineTargets[cand], 'narration');
          return;
        }
      }
    }
    const defaults = {
      smell: 'You take a long breath in. Wet stone. Cold mineral. Something sweet beneath. The sweetness is iron.',
      sniff: 'You take a long breath in. Wet stone. Cold mineral. Something sweet beneath. The sweetness is iron.',
      listen: 'You stand still and listen. Nothing in particular calls back.',
      hear: 'You stand still and listen. Nothing in particular calls back.',
      touch: 'You reach out. Cold stone, gritted with old dust. Your palm comes back gritted with the same.',
      feel: 'You reach out. Cold stone, gritted with old dust. Your palm comes back gritted with the same.',
      taste: 'You touch your tongue to your teeth. Copper. Iron. The faint chalk of the air.'
    };
    this._emit('output', defaults[sense] || defaults.smell, 'narration');
  }

  /**
   * `light X` — auto-trigger combine if the player has flint and X.
   * Falls back to a refusal otherwise.
   */
  _tryLight(target) {
    if (!target) {
      this._emit('output', `Light what? You'll need to be specific.`, 'narration');
      return;
    }
    if (!this.hasItem('flint')) {
      this._emit('output', `You have nothing to light it with.`, 'narration');
      return;
    }
    const item = this.inventory.find(i =>
      i.name.toLowerCase().includes(target) || i.id.toLowerCase().includes(target)
    );
    if (!item) {
      this._emit('output', `You don't have that.`, 'narration');
      return;
    }
    if (item.id === 'flint') {
      this._emit('output', `The flint sparks against your palm. There is nothing here to catch the spark.`, 'narration');
      return;
    }
    // Try combine flint + item
    this._combineByName('flint', item.name.toLowerCase());
  }

  /**
   * Treat 'climb', 'descend', 'leave', 'exit', 'out' as direction shortcuts
   * with reasonable fallbacks.
   */
  _tryDirectionalAlias(dir, room) {
    if (dir === 'out') {
      // Try the "way back" — previous room — first; else common up exits
      if (this.previousRoom && this.rooms[this.previousRoom]) {
        this.enterRoom(this.previousRoom);
        return;
      }
      const fallbacks = ['up', 'out', 'north', 'west'];
      for (const d of fallbacks) {
        if (room.exits && room.exits[d]) {
          this.enterRoom(room.exits[d].roomId);
          return;
        }
      }
      this._emit('output', `There is no obvious way out from here.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    if (room.exits && room.exits[dir]) {
      this.enterRoom(room.exits[dir].roomId);
      return;
    }
    this._emit('output', dir === 'up' ? `Nothing to climb here.` : `Nothing to descend here.`, 'narration');
    this._presentRoomChoices(room);
  }

  /**
   * `go X` — try X as a direction, then as an exit label substring.
   */
  _tryGoTarget(target, room, defaultDir) {
    target = String(target || '').trim().toLowerCase();
    const dirMap = {
      n: 'north', north: 'north',
      s: 'south', south: 'south',
      e: 'east', east: 'east',
      w: 'west', west: 'west',
      u: 'up', up: 'up',
      d: 'down', down: 'down',
      ne: 'northeast', northeast: 'northeast',
      nw: 'northwest', northwest: 'northwest',
      se: 'southeast', southeast: 'southeast',
      sw: 'southwest', southwest: 'southwest',
      in: 'down', inside: 'down',
      out: 'up'
    };
    if (!target && defaultDir) target = defaultDir;
    if (dirMap[target]) {
      const dir = dirMap[target];
      if (room.exits && room.exits[dir]) {
        this.enterRoom(room.exits[dir].roomId);
        return;
      }
      this._emit('output', `You can't go that way.`, 'narration');
      this._presentRoomChoices(room);
      return;
    }
    // Try matching as an exit label (e.g., "go north passage")
    if (room.exits) {
      for (const [dir, exit] of Object.entries(room.exits)) {
        const label = (exit.label || dir).toLowerCase();
        if (label.includes(target) || target.includes(dir)) {
          this.enterRoom(exit.roomId);
          return;
        }
      }
    }
    this._emit('output', `You can't go there from here.`, 'narration');
    this._presentRoomChoices(room);
  }

  /**
   * `talk to X` — start conversation with the named NPC if visible in the room.
   */
  _tryTalkTo(target) {
    target = String(target || '').trim().toLowerCase();
    const npcs = this._npcsInCurrentRoom();
    const match = npcs.find(n =>
      n.name.toLowerCase().includes(target) || n.id.toLowerCase().includes(target)
    );
    if (match) {
      this.startConversation(match.id);
      return;
    }
    if (npcs.length === 0) {
      this._emit('output', `There is no one here to speak with.`, 'narration');
    } else {
      this._emit('output', `You don't see them here.`, 'narration');
    }
    this._presentRoomChoices(this.rooms[this.currentRoom]);
  }

  hasItem(itemId) {
    return this.inventory.some(i => i.id === itemId);
  }

  takeItem(itemId) {
    const item = this.items[itemId];
    if (!item) return false;
    if (this.hasItem(itemId)) return false;

    if (this.inventory.length >= this.maxInventory) {
      this._emit('output', `Your hands are full. You can only carry ${this.maxInventory} things. Drop something first.`, 'system');
      return false;
    }

    this.inventory.push({ ...item });
    this.flags[`taken_${itemId}`] = true;
    this._emit('output', `Taken: ${item.name}`, 'system');
    this._emit('inventoryChange');
    // Refresh choices so the Take button disappears and any newly-unlocked actions appear.
    if (this.currentRoom && this.rooms[this.currentRoom]) {
      this._presentRoomChoices(this.rooms[this.currentRoom]);
    }
    return true;
  }

  removeItem(itemId) {
    const idx = this.inventory.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      this.inventory.splice(idx, 1);
      this._emit('inventoryChange');
      return true;
    }
    return false;
  }

  _showInventory() {
    if (this.inventory.length === 0) {
      this._emit('output', 'You carry nothing.', 'system');
    } else {
      const lines = this.inventory.map(i => `  ${i.name}`).join('\n');
      this._emit('output', `You carry (${this.inventory.length}/${this.maxInventory}):\n${lines}`, 'system');
    }
  }

  _showFragments() {
    if (this.prophecyFragments.size === 0) {
      this._emit('output', 'You have found no prophecy fragments.', 'system');
    } else {
      this._emit('output', `Prophecy fragments: ${this.prophecyFragments.size}/${this.totalFragments}`, 'system');
    }
  }

  _showHelp() {
    this._emit('output', [
      'Commands: look, inventory, fragments, hint, undo, score, tutorial, help',
      'Movement: north/south/east/west/up/down (or n/s/e/w/u/d), enter, leave, climb, descend, back, wait',
      'Items: take [item], drop [item], use [item], examine [thing], read/smell/listen/touch [thing]',
      'Combine: combine [item] with [item]; light [item]',
      'NPCs: talk to [name]',
      'Hints escalate from vague to specific — the hardest endings give only the lightest hint.',
      'Type tutorial to re-open the welcome screen. Or click the choices above.'
    ].join('\n'), 'system');
  }

  _examine(target) {
    // Check inventory
    const invItem = this.inventory.find(i =>
      i.name.toLowerCase().includes(target) || i.id.toLowerCase().includes(target)
    );
    if (invItem) {
      this._emit('output', invItem.description || `It's ${invItem.name}.`, 'narration');
      return;
    }
    const room = this.rooms[this.currentRoom];
    // Check Vreth'kai-only examine targets first (visible only to a minded Vreth'kai)
    if (this.flags.vrethkai_with_mind && room.vrethkaiTargets) {
      for (const [key, text] of Object.entries(room.vrethkaiTargets)) {
        if (key.includes(target) || target.includes(key)) {
          this._emit('output', text, 'narration');
          return;
        }
      }
    }
    // Check changed-world examine targets next (visible only to players who
    // have completed Vreth'kai-with-Mind in any prior run — persists via
    // engine.isChangedWorld). These carry hints toward the Sleeping God path
    // that an untouched player has no way to perceive.
    if (this.isChangedWorld && room.changedWorldTargets) {
      for (const [key, text] of Object.entries(room.changedWorldTargets)) {
        if (key.includes(target) || target.includes(key)) {
          this._emit('output', text, 'narration');
          return;
        }
      }
    }
    // Check room items
    if (room.items) {
      for (const itemId of room.items) {
        const item = this.items[itemId];
        if (item && (item.name.toLowerCase().includes(target) || item.id.includes(target))) {
          this._emit('output', item.description || `It's ${item.name}.`, 'narration');
          return;
        }
      }
    }
    // Check room examine targets
    if (room.examineTargets) {
      for (const [key, text] of Object.entries(room.examineTargets)) {
        if (key.includes(target) || target.includes(key)) {
          this._emit('output', text, 'narration');
          return;
        }
      }
    }
    this._emit('output', "You don't see that here.", 'narration');
  }

  _takeByName(target) {
    const room = this.rooms[this.currentRoom];
    if (room.items) {
      for (const itemId of room.items) {
        const item = this.items[itemId];
        if (item && !this.flags[`taken_${itemId}`] &&
            (item.name.toLowerCase().includes(target) || itemId.includes(target))) {
          this.takeItem(itemId);
          this._presentRoomChoices(room);
          return;
        }
      }
    }
    this._emit('output', "You don't see that here.", 'narration');
  }

  _dropByName(target) {
    const item = this.inventory.find(i =>
      i.name.toLowerCase().includes(target) || i.id.includes(target)
    );
    if (item) {
      this.removeItem(item.id);
      // Add item to current room
      const room = this.rooms[this.currentRoom];
      if (!room.items) room.items = [];
      room.items.push(item.id);
      this.flags[`taken_${item.id}`] = false;  // Allow re-pickup
      this._emit('output', `Dropped: ${item.name}`, 'system');
      this._presentRoomChoices(room);
    } else {
      this._emit('output', "You don't have that.", 'narration');
    }
  }

  /**
   * Combine two inventory items by name. Resolves names → ids, then looks up
   * the recipe in `GAME_DATA.combinations`. If a recipe matches, consume the
   * inputs and grant the result. If both items exist in inventory but no
   * recipe matches, emit a generic failure line.
   */
  _combineByName(nameA, nameB) {
    const a = this.inventory.find(i => i.name.toLowerCase().includes(nameA) || i.id.includes(nameA));
    const b = this.inventory.find(i => i.name.toLowerCase().includes(nameB) || i.id.includes(nameB));
    if (!a || !b) {
      this._emit('output', "You don't have both of those.", 'narration');
      return;
    }
    if (a.id === b.id) {
      this._emit('output', "Combining a thing with itself does not produce a thing.", 'narration');
      return;
    }
    const recipes = this.combinations || [];
    const match = recipes.find(r =>
      (r.inputs.includes(a.id) && r.inputs.includes(b.id))
    );
    if (!match) {
      this._emit('output', "Nothing comes of it. The two refuse to be one.", 'narration');
      return;
    }
    // Consume inputs
    for (const id of match.inputs) this.removeItem(id);
    // Grant result
    if (match.result) {
      const item = this.items[match.result];
      if (item && this.inventory.length < this.maxInventory) {
        this.inventory.push({ ...item });
        this.flags[`taken_${match.result}`] = true;
        this._emit('inventoryChange');
      }
    }
    if (match.text) {
      this._emit('output', match.text, 'narration');
    }
    if (match.setFlag) {
      for (const [k, v] of Object.entries(match.setFlag)) this.flags[k] = v;
    }
    if (this.currentRoom && this.rooms[this.currentRoom]) {
      this._presentRoomChoices(this.rooms[this.currentRoom]);
    }
  }

  _useByName(target) {
    const room = this.rooms[this.currentRoom];
    const item = this.inventory.find(i =>
      i.name.toLowerCase().includes(target) || i.id.includes(target)
    );
    if (!item) {
      this._emit('output', "You don't have that.", 'narration');
      return;
    }
    // Check if room has a use for this item
    if (room.useItems) {
      const use = room.useItems.find(u => u.itemId === item.id);
      if (use) {
        this._executeItemUse(room, use);
        return;
      }
    }
    this._emit('output', `You can't use ${item.name} here.`, 'narration');
  }

  // ─────────────────────────────────────────────
  // SERVER API (claim & state)
  // ─────────────────────────────────────────────

  /**
   * Configure the claim/state API endpoint. When set, the engine will:
   *   - Fetch /api/state once on boot to populate this.serverState
   *   - POST /api/claim on every named ending
   * If never called (or called with a falsy URL), the engine works exactly
   * as before — no network requests, no rank info in the funnel.
   */
  setApiBaseUrl(url) {
    this.apiBaseUrl = url ? String(url).replace(/\/$/, '') : null;
  }

  /**
   * Configure the author contact string used in the deferred-naming
   * branch ("step back and write to the author"). Pass a mailto:, a
   * Discord invite URL, or a witness-page URL — whatever channel you
   * want first-readers routed through.
   */
  setAuthorContact(contact) {
    if (contact && typeof contact === 'string') {
      this.authorContact = contact.trim();
    }
  }

  /**
   * Fetch global state from the API. Updates this.serverState on success.
   * Failure is silent — the game must work standalone if the API is down.
   * Returns the state object (or null on failure).
   */
  async fetchServerState() {
    if (!this.apiBaseUrl) return null;
    try {
      const r = await fetch(`${this.apiBaseUrl}/api/state`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!r.ok) return null;
      const data = await r.json();
      this.serverState = data;
      this._emit('stateChange');
      return data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Submit an ending claim to the server. Returns the rank info on success,
   * null on failure. Fire-and-forget from the caller's perspective — the
   * game continues regardless. The result, when it arrives, is emitted as
   * a follow-up `claimRank` event so the UI can render it after the funnel.
   */
  async _submitClaim(endingId, opts = {}) {
    if (!this.apiBaseUrl) return null;
    const namedEndings = ['warden', 'cultist', 'vrethkai_with_mind', 'sleeping_god'];
    if (!namedEndings.includes(endingId) && endingId !== 'basic_escape') {
      // Don't submit unrecognised endings.
      return null;
    }
    const payload = {
      ending: endingId,
      name: endingId === 'sleeping_god' ? this._lastNameAttempt : null,
      identity: this.identity,
      fragments: this.prophecyFragments.size,
      shards: this.relicShards.size,
      turn: this.turnCount,
      vrethkaiCompleted: !!this.vrethkaiCompleted,
      fullVrethkaiEscape: !!this.fullVrethkaiEscape,
      // When true, the player chose to step back and discuss the name
      // with the author before committing. The Worker queues this
      // distinctly so the Discord notification reads "DEFERRED" rather
      // than "PENDING REVIEW".
      deferred: !!opts.deferred,
      clientTime: Date.now()
    };
    try {
      const r = await fetch(`${this.apiBaseUrl}/api/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) return null;
      const result = await r.json();
      // Emit a deferred output so the UI can render the rank line after
      // the static funnel block. Skipped for deferred Sleeping God claims
      // (the player chose to discuss before committing — no rank message
      // makes sense yet) and for basic_escape (no named-ending reward).
      //
      // Includes the unique claim ID — the player needs this when claiming
      // their preread/naming reward on the witness form. Also routes them
      // toward the author for a conversation about character/lore — the
      // first-claim reader has earned that conversation, and the others
      // may want it too.
      if (result?.ok && namedEndings.includes(endingId) && !payload.deferred) {
        const claimIdLine = result.claimId
          ? `\n\nYour claim ID: \`${result.claimId}\`\n_(Include this on the witness form so the author can verify your run.)_`
          : '';
        const contactLine = this.authorContact
          ? (result.isFirst
              ? `\n\nSpeak with the author before deciding on the name, if you wish: ${this.authorContact}`
              : `\n\nQuestions, or want to discuss what you saw? ${this.authorContact}`)
          : '';
        const inPrereadCircle = result.rank <= 10;
        const line = result.isFirst
          ? `\n— You are the first reader to reach this ending. —

The cycle has carved your name into the right of naming. You may give a character in the books a name of your choosing, and that name will hold.

The first ten readers of each ending preread the unpublished cycle in a private circle the author keeps for those who descended far enough to be owed the rest of the story. Submit your claim at https://aurelonuniverse.com/witness.${claimIdLine}${contactLine}`
          : inPrereadCircle
          ? `\n— You are claim #${result.rank} of those who reached this ending. —

The first ten readers of each ending preread the unpublished cycle in a private circle the author keeps. You are well within that count. Submit your claim at https://aurelonuniverse.com/witness.${claimIdLine}${contactLine}`
          : `\n— You are claim #${result.rank} of those who reached this ending. —

The first ten preread spots are taken, but the descent itself is its own reward — and the cycle remembers everyone who reached this far. Submit your claim at https://aurelonuniverse.com/witness if you'd like the author to know who you are.${claimIdLine}${contactLine}`;
        this._emit('output', line, 'system');
      }
      return result;
    } catch (e) {
      return null;
    }
  }

  // ─────────────────────────────────────────────
  // FISHING (mini-game; produces Fisher ending if all 3 special fish caught)
  // ─────────────────────────────────────────────

  _isFishingActive() {
    return !!(this.flags.fishing && this.flags.fishing.active);
  }

  _canFishHere() {
    return !!(this.fishingData && this.fishingData.rooms && this.fishingData.rooms[this.currentRoom]);
  }

  _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // No-immediate-repeat picker for state-transition prose. Each state's
  // last-shown index is tracked separately so consecutive waits in the
  // same state never see the same line twice in a row. Resets per game.
  _pickStateProse(stateName) {
    const arr = (this.fishingData && this.fishingData.states && this.fishingData.states[stateName]) || [];
    if (arr.length === 0) return '';
    if (arr.length === 1) return arr[0];
    if (!this._lastProseIdx) this._lastProseIdx = {};
    let idx;
    let attempts = 0;
    do {
      idx = Math.floor(Math.random() * arr.length);
      attempts++;
    } while (idx === this._lastProseIdx[stateName] && attempts < 8);
    this._lastProseIdx[stateName] = idx;
    return arr[idx];
  }

  _handleCast() {
    if (!this.fishingData) {
      this._emit('output', `You cast nothing into nothing. There is no rod in your hand.`, 'narration');
      this._presentRoomChoices(this.rooms[this.currentRoom]);
      return;
    }
    if (!this.hasItem('fishing_rod')) {
      this._emit('output', `You have no rod. The water is waiting for one.`, 'narration');
      this._presentRoomChoices(this.rooms[this.currentRoom]);
      return;
    }
    if (!this._canFishHere()) {
      this._emit('output', `There is no water here that will hold a hook.`, 'narration');
      this._presentRoomChoices(this.rooms[this.currentRoom]);
      return;
    }
    if (this._isFishingActive()) {
      this._emit('output', `Your line is already in the water. Wait, pull, or release the cast.`, 'narration');
      this._presentRoomChoices(this.rooms[this.currentRoom]);
      return;
    }
    // Initialize fragility on first cast ever
    if (typeof this.flags.rod_fragility !== 'number') {
      this.flags.rod_fragility = this.fishingData.initialFragility || 15;
    }
    if (this.flags.rod_fragility <= 0) {
      this._emit('output', `The rod is gone. The water is the water.`, 'narration');
      this._presentRoomChoices(this.rooms[this.currentRoom]);
      return;
    }
    const roomCfg = this.fishingData.rooms[this.currentRoom];
    this.flags.fishing = {
      active: true,
      room: this.currentRoom,
      state: 'drifting'
    };
    this._pushUndo();
    this.turnCount++;
    const prose = roomCfg.ambient + '\n\n' + this._pickStateProse('drifting');
    this._emit('output', prose, 'narration');
    this._tickTimers();
    if (this.gameOver) return;
    this._tickNpcs();
    if (this.gameOver) return;
    this._presentRoomChoices(this.rooms[this.currentRoom]);
  }

  _handleFishingWait() {
    const f = this.flags.fishing;
    // During the fight phase the player must commit — pull or release.
    // Waiting is not an option once the fish is on the line and fighting.
    if (f.state === 'fighting') {
      this._emit('output', `The fish is on the line and fighting. Pull, or release. The fish will not wait.`, 'narration');
      this._presentRoomChoices(this.rooms[this.currentRoom]);
      return;
    }
    this._pushUndo();
    this.turnCount++;
    let prose = '';
    if (f.state === 'drifting') {
      if (Math.random() < 0.5) {
        f.state = 'brushed';
        prose = this._pickStateProse('brushed');
      } else {
        prose = this._pickStateProse('drifting');
      }
    } else if (f.state === 'brushed') {
      if (Math.random() < 0.7) {
        f.state = 'tugged';
        prose = this._pickStateProse('tugged');
      } else {
        f.state = 'drifting';
        prose = this._pickStateProse('drifting');
      }
    } else if (f.state === 'tugged') {
      const r = Math.random();
      if (r < 0.6) {
        f.state = 'set';
        prose = this._pickStateProse('set');
      } else if (r < 0.9) {
        prose = this._pickRandom(this.fishingData.escaped);
        this.flags.fishing = null;
      } else {
        prose = `The line jerks once and goes slack. The hook has come back without what was on it.`;
        this.flags.rod_fragility = Math.max(0, (this.flags.rod_fragility || 0) - 1);
        this.flags.fishing = null;
      }
    } else if (f.state === 'set') {
      // Bite escapes if you don't pull immediately
      prose = this._pickRandom(this.fishingData.escaped);
      this.flags.fishing = null;
    }
    this._emit('output', prose, 'narration');
    this._maybeBreakRod();
    this._tickTimers();
    if (this.gameOver) return;
    this._tickNpcs();
    if (this.gameOver) return;
    this._presentRoomChoices(this.rooms[this.currentRoom]);
  }

  _handleFishingPull() {
    this._pushUndo();
    this.turnCount++;
    const f = this.flags.fishing;
    if (f.state === 'drifting' || f.state === 'brushed') {
      // Empty pull — too soon. Fragility hit.
      this._emit('output', this._pickRandom(this.fishingData.emptyPulls), 'narration');
      this.flags.rod_fragility = Math.max(0, (this.flags.rod_fragility || 0) - 2);
      this.flags.fishing = null;
      this._maybeBreakRod();
    } else if (f.state === 'tugged' || f.state === 'set') {
      // Catch attempt — chance of immediate slip, otherwise enter fight phase.
      // Tugged is a riskier pull (line not fully set yet); set is safer.
      const slipChance = f.state === 'tugged' ? 0.4 : 0.1;
      if (Math.random() < slipChance) {
        this._emit('output', this._pickRandom(this.fishingData.slipped), 'narration');
        this.flags.fishing = null;
      } else {
        // Special-fish trigger check FIRST. Special fish skip the fight
        // phase entirely — they are the moment, the prose carries itself.
        const roomCfg = this.fishingData.rooms[f.room];
        const catchKey = `fish_caught_${f.room}`;
        const caughtSoFar = this.flags[catchKey] || 0;
        const needed = roomCfg.normalCatchesNeeded || 0;
        const oneShotSpecial = roomCfg.oneShot && roomCfg.special && !this.fisherCatches.has(roomCfg.special.catchId);
        const normalRoomSpecial = !roomCfg.oneShot && caughtSoFar >= needed && roomCfg.special && !this.fisherCatches.has(roomCfg.special.catchId);
        if (oneShotSpecial || normalRoomSpecial) {
          this._emit('output', roomCfg.special.text, 'narration');
          this.fisherCatches.add(roomCfg.special.catchId);
          this._emit('output', `\n— Catch: ${roomCfg.special.name} (${this.fisherCatches.size}/${this.totalFisherCatches}) —`, 'system');
          this.flags.fishing = null;
          this._checkFisherProgress();
        } else if (roomCfg.oneShot && roomCfg.special && this.fisherCatches.has(roomCfg.special.catchId)) {
          // OneShot room already given its catch; no normal pool here.
          this._emit('output', `Nothing more here. The water has given what it had.`, 'narration');
          this.flags.fishing = null;
        } else {
          // Normal fish — enter fight phase. Pick a fight prompt; the
          // player must read the cue and respond pull or release.
          const prompt = this._pickRandom(this.fishingData.fightPrompts);
          this.flags.fishing = {
            active: true,
            room: f.room,
            state: 'fighting',
            expectedResponse: prompt.expected
          };
          this._emit('output', prompt.text + `\n\n(Pull or release.)`, 'narration');
        }
      }
    } else if (f.state === 'fighting') {
      // Player typed `pull` during fight — resolve as pull response
      this._resolveFightResponse('pull');
      return;
    }
    this._tickTimers();
    if (this.gameOver) return;
    this._tickNpcs();
    if (this.gameOver) return;
    this._presentRoomChoices(this.rooms[this.currentRoom]);
  }

  _resolveFightResponse(playerAction) {
    const f = this.flags.fishing;
    if (!f || f.state !== 'fighting') return;
    if (playerAction === f.expectedResponse) {
      // Right answer — catch a normal fish from the pool
      const fish = this._pickRandom(this.fishingData.pool);
      this._emit('output', fish, 'narration');
      const catchKey = `fish_caught_${f.room}`;
      this.flags[catchKey] = (this.flags[catchKey] || 0) + 1;
      this.flags.rod_fragility = Math.max(0, (this.flags.rod_fragility || 0) - 1);
      this.flags.fishing = null;
      this._maybeBreakRod();
    } else {
      // Wrong answer — fish escapes, no fragility cost, no catch credited
      this._emit('output', this._pickRandom(this.fishingData.fightFail), 'narration');
      this.flags.fishing = null;
    }
  }

  _handleFishingRelease() {
    const f = this.flags.fishing;
    if (f && f.state === 'fighting') {
      // During the fight phase, `release` is a real response (let line out)
      this._pushUndo();
      this.turnCount++;
      this._resolveFightResponse('release');
      this._tickTimers();
      if (this.gameOver) return;
      this._tickNpcs();
      if (this.gameOver) return;
      this._presentRoomChoices(this.rooms[this.currentRoom]);
      return;
    }
    // Otherwise: abandon the cast (no penalty)
    this._emit('output', `You retrieve the line. The water has not committed to anything. Neither have you.`, 'narration');
    this.flags.fishing = null;
    this._presentRoomChoices(this.rooms[this.currentRoom]);
  }

  // Legacy helper retained for completeness; not currently called by the
  // pull/fight flow. Kept in case future rooms want a single-shot API.
  _catchFish(roomId) {
    const roomCfg = this.fishingData.rooms[roomId];
    if (!roomCfg) {
      this._emit('output', `Something. Nothing. The line returns wet.`, 'narration');
      this.flags.fishing = null;
      return;
    }
    const catchKey = `fish_caught_${roomId}`;
    const caughtSoFar = this.flags[catchKey] || 0;
    const needed = roomCfg.normalCatchesNeeded || 0;

    if (roomCfg.oneShot) {
      if (roomCfg.special && this.fisherCatches.has(roomCfg.special.catchId)) {
        this._emit('output', `Nothing more here. The water has given what it had.`, 'narration');
        this.flags.fishing = null;
        return;
      }
      this._emit('output', roomCfg.special.text, 'narration');
      this.fisherCatches.add(roomCfg.special.catchId);
      this.flags.fishing = null;
      this._checkFisherProgress();
      return;
    }

    if (caughtSoFar >= needed && roomCfg.special && !this.fisherCatches.has(roomCfg.special.catchId)) {
      this._emit('output', roomCfg.special.text, 'narration');
      this.fisherCatches.add(roomCfg.special.catchId);
      this.flags.fishing = null;
      this._checkFisherProgress();
      return;
    }

    const fish = this._pickRandom(this.fishingData.pool);
    this._emit('output', fish, 'narration');
    this.flags[catchKey] = caughtSoFar + 1;
    this.flags.rod_fragility = Math.max(0, (this.flags.rod_fragility || 0) - 1);
    this.flags.fishing = null;
  }

  _maybeBreakRod() {
    if ((this.flags.rod_fragility || 0) <= 0 && this.hasItem('fishing_rod')) {
      this._emit('output', this.fishingData.breakText, 'narration');
      this.removeItem('fishing_rod');
      this.flags.fishing = null;
    }
  }

  _checkFisherProgress() {
    if (this.fisherCatches.size === this.totalFisherCatches && !this.flags.fisher_complete_acknowledged) {
      this.flags.fisher_complete_acknowledged = true;
      this._emit('output', `\nThree pulls. The water has been generous to you. Whoever keeps that count has noted it.\n\nThe scale is in your pocket. The stone is in your pocket. The sentence is in your throat. You are carrying what you came for, even if you did not know you came for it.\n\n(Reach the surface to leave with what you have.)`, 'system');
    }
  }

  // ─────────────────────────────────────────────
  // TIMERS
  // ─────────────────────────────────────────────

  _tickTimers() {
    for (const [roomId, timer] of Object.entries(this.activeTimers)) {
      if (this.currentRoom === roomId || timer.global) {
        // Bypass — a flag or item the player can carry to pacify the room.
        if (timer.bypassFlag && this.flags[timer.bypassFlag]) continue;
        if (timer.bypassItem && this.hasItem(timer.bypassItem)) continue;
        timer.turnsLeft--;

        // Warning
        if (timer.turnsLeft <= (timer.warningAt || 2) && timer.turnsLeft > 0 && timer.warning) {
          this._emit('output', timer.warning, 'system');
        }

        // Expired
        if (timer.turnsLeft <= 0) {
          delete this.activeTimers[roomId];
          if (timer.onExpire === 'death') {
            this._die(timer.deathText || 'You lingered too long. The dark found you.');
          } else if (typeof timer.onExpire === 'function') {
            timer.onExpire(this);
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // DEATH & ENDINGS
  // ─────────────────────────────────────────────

  _die(text) {
    this.gameOver = true;
    this.gameOverReason = 'death';
    this._emit('output', text, 'death');
    this._emit('gameOver', 'death', text);
  }

  escape(endingId, text) {
    this.gameOver = true;
    this.gameOverReason = endingId || 'escape';
    // Cross-run state — persists across reset() so subsequent playthroughs
    // can react to "what you became." UI layer must persist to localStorage.
    if (endingId === 'vrethkai_with_mind') {
      this.vrethkaiCompleted = true;
      this.isChangedWorld = true;
      // The Sleeping God's chamber distinguishes the hard escape (20-turn
      // alt-case survival) from the cipher bypass. Only the alt-case path
      // sets this flag — the cipher player escaped without enduring the
      // breaking, and the chamber will refuse to be named by them.
      if (!this.flags.cipher_used_throat) {
        this.fullVrethkaiEscape = true;
      }
    }
    if (endingId === 'sleeping_god') {
      this.sleepingGodNamed = true;
    }
    if (text) {
      this._emit('output', text, 'narration');
    } else if (text === undefined) {
      this._emit('output', 'You emerge into the light. The air tastes different now.', 'narration');
    }
    this._emitFunnel(endingId);
    this._emit('gameOver', 'escape', endingId);
    // Submit claim to the server (no-op if no API URL configured). Async,
    // does not block the game-over event. The rank message it emits will
    // appear after the funnel text.
    if (this.apiBaseUrl) {
      this._submitClaim(endingId);
    }
  }

  /**
   * Emit the post-ending funnel block — pitches the novels and the
   * newsletter, and (for named endings) explains the first-ten reader
   * reward and the right to name a character. Different prose for named
   * vs. basic escape paths.
   */
  _emitFunnel(endingId) {
    const named = endingId === 'warden' || endingId === 'cultist' ||
                  endingId === 'vrethkai_with_mind' || endingId === 'sleeping_god' ||
                  endingId === 'fisher';
    let funnel;
    if (named) {
      funnel = `

— What you have done is not common —

If you are among the first ten readers to reach this ending, you will read the book before anyone else. The first to arrive names the character — written into Aurelon canon permanently, in *The Breaking* novels and the *Aurelon: The Crosslands* campaign setting.

Claim your place at https://aurelonuniverse.com/witness.

Or join the newsletter to know when the cycle is told in full: https://aurelonuniverse.com.`;
    } else {
      funnel = `

— Back to the world —

*The Breaking* — the first cycle of novels in the Aurelon universe — is coming. The cycle this prophecy belongs to is the world the books are set in. Be there when they are published.

Newsletter: https://aurelonuniverse.com.

(For those who reach the harder endings: the first ten readers of each ending pre-read the book. The first to arrive names a character in it.)`;
    }
    this._emit('output', funnel, 'system');
  }

  /**
   * Check all ending conditions. Called by rooms/actions when escape triggers.
   * Returns the highest-tier ending the player qualifies for, or 'basic_escape'.
   *
   * Endings (per docs/escapes_and_endings.html):
   *   1. SLEEPING GOD (ULTIMATE)  — 20 fragments + 3 shards + Sleeping Chamber path
   *   2. WARDEN OF THE GATE       — Warden identity + 12 frags + 3 seal components + Vreth'kai survived
   *   3. VOICE IN THE DARK        — Seeker identity + 15 frags (P5/P11/P14) + corrupted-reliquary survival + listen-in-Crucible + fire name spoken
   *   4. THE TURNING (Vreth'kai)  — handled separately in transformation rooms
   *
   * Cultist and Sleeping God endings should be handled in their own ending rooms,
   * not via the generic exit_surface flow. This function only handles endings that
   * fire at the surface exit.
   */
  checkEndings() {
    // Warden: identity + 12 frags + seal components + survived Vreth'kai
    if (this.identity === 'warden' &&
        this.prophecyFragments.size >= 12 &&
        this.flags.seal_stone && this.flags.seal_song && this.flags.seal_blood &&
        this.flags.vrethkai_witnessed) {
      return 'warden';
    }

    // Fisher: caught all three special fish across the three water rooms.
    // A lighter named ending than the four hardcore ones — earned through
    // patience and exploration of the fishing mini-game rather than narrative
    // commitment. Takes precedence over basic_escape, but Warden still wins
    // if the player completed both arcs.
    if (this.fisherCatches.size === this.totalFisherCatches) {
      return 'fisher';
    }

    return 'basic_escape';
  }

  // ─────────────────────────────────────────────
  // REQUIREMENTS CHECKER
  // ─────────────────────────────────────────────

  /**
   * Check if a set of requirements are met.
   * @param {Object} reqs - { hasItem, hasFlag, hasIdentity, minFragments, hasRelic, not }
   */
  _checkRequirements(reqs) {
    if (reqs.hasItem && !this.hasItem(reqs.hasItem)) return false;
    if (reqs.hasAnyItem && !reqs.hasAnyItem.some(id => this.hasItem(id))) return false;
    if (reqs.hasFlag && !this.flags[reqs.hasFlag]) return false;
    if (reqs.hasAllFlags && !reqs.hasAllFlags.every(f => this.flags[f])) return false;
    if (reqs.hasAnyOfFlags && !reqs.hasAnyOfFlags.some(f => this.flags[f])) return false;
    if (reqs.hasIdentity && this.identity !== reqs.hasIdentity) return false;
    if (reqs.noIdentity && this.identity) return false;
    if (reqs.minFragments && this.prophecyFragments.size < reqs.minFragments) return false;
    if (reqs.hasRelic && !this.relicShards.has(reqs.hasRelic)) return false;
    if (reqs.hasFragment && !this.prophecyFragments.has(reqs.hasFragment)) return false;
    if (reqs.hasVrethkaiCompleted && !this.vrethkaiCompleted) return false;
    if (reqs.not) {
      if (reqs.not.hasFlag && this.flags[reqs.not.hasFlag]) return false;
      if (reqs.not.hasItem && this.hasItem(reqs.not.hasItem)) return false;
      if (reqs.not.hasIdentity && this.identity === reqs.not.hasIdentity) return false;
    }
    return true;
  }

  // ─────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────

  _directionLabel(dir) {
    const labels = {
      north: 'Go North', south: 'Go South', east: 'Go East', west: 'Go West',
      up: 'Go Up', down: 'Go Down',
      northeast: 'Go Northeast', northwest: 'Go Northwest',
      southeast: 'Go Southeast', southwest: 'Go Southwest'
    };
    return labels[dir] || `Go ${dir}`;
  }

  _emit(event, ...args) {
    const handler = {
      output: this.onOutput,
      choices: this.onChoices,
      inputMode: this.onInputMode,
      inventoryChange: this.onInventoryChange,
      stateChange: this.onStateChange,
      gameOver: this.onGameOver,
      tutorial: this.onTutorial,
      intro: this.onIntro
    }[event];
    if (handler) handler(...args);
  }

  // ─────────────────────────────────────────────
  // SERIALIZATION (for future save system)
  // ─────────────────────────────────────────────

  getState() {
    // Serialize NPC state (Sets → arrays for JSON safety)
    const npcs = {};
    for (const [id, npc] of Object.entries(this.npcs || {})) {
      npcs[id] = {
        currentRoom: npc.currentRoom,
        patrolIndex: npc.patrolIndex,
        lastMoveTurn: npc.lastMoveTurn,
        knownTopics: [...(npc.knownTopics || [])],
        greeted: !!npc.greeted
      };
    }
    // Serialize timers (drop function fields)
    const timers = {};
    for (const [k, t] of Object.entries(this.activeTimers || {})) {
      timers[k] = {
        turnsLeft: t.turnsLeft,
        onExpire: typeof t.onExpire === 'string' ? t.onExpire : null,
        warning: t.warning,
        warningAt: t.warningAt,
        bypassFlag: t.bypassFlag,
        bypassItem: t.bypassItem,
        deathText: t.deathText,
        roomId: t.roomId
      };
    }
    return {
      version: 1,
      currentRoom: this.currentRoom,
      previousRoom: this.previousRoom,
      visitedRooms: [...this.visitedRooms],
      turnCount: this.turnCount,
      inventory: this.inventory.map(i => i.id),
      prophecyFragments: [...this.prophecyFragments],
      prophecyOrder: [...this.prophecyOrder],
      relicShards: [...this.relicShards],
      fisherCatches: [...this.fisherCatches],
      identity: this.identity,
      flags: { ...this.flags },
      activeTimers: timers,
      activeConversation: this.activeConversation,
      npcs,
      isChangedWorld: !!this.isChangedWorld,
      vrethkaiCompleted: !!this.vrethkaiCompleted,
      fullVrethkaiEscape: !!this.fullVrethkaiEscape,
      sleepingGodNamed: !!this.sleepingGodNamed,
      gameOver: !!this.gameOver,
      gameOverReason: this.gameOverReason || null,
      hintsViewed: { ...this.hintsViewed }
    };
  }

  /**
   * Restore state from a saved snapshot. If `silent` is true, no extra
   * "you step back" line is emitted (used for save/load on tab-open;
   * undo always passes silent=false to get the recovery line).
   */
  loadState(state, fromUndo = false) {
    if (!state || !state.currentRoom) return false;
    this.currentRoom = state.currentRoom;
    this.previousRoom = state.previousRoom || null;
    this.visitedRooms = new Set(state.visitedRooms || []);
    this.turnCount = state.turnCount || 0;
    this.inventory = (state.inventory || [])
      .map(id => this.items[id] ? { ...this.items[id] } : null)
      .filter(Boolean);
    this.prophecyFragments = new Set(state.prophecyFragments || []);
    this.prophecyOrder = state.prophecyOrder || [];
    this.relicShards = new Set(state.relicShards || []);
    this.fisherCatches = new Set(state.fisherCatches || []);
    this.identity = state.identity || null;
    this.flags = { ...(state.flags || {}) };
    this.activeTimers = state.activeTimers || {};
    this.activeConversation = state.activeConversation || null;
    this.isChangedWorld = !!state.isChangedWorld;
    this.vrethkaiCompleted = !!state.vrethkaiCompleted;
    this.fullVrethkaiEscape = !!state.fullVrethkaiEscape;
    this.sleepingGodNamed = !!state.sleepingGodNamed;
    this.gameOver = !!state.gameOver;
    this.gameOverReason = state.gameOverReason || null;
    this.hintsViewed = state.hintsViewed ? { ...state.hintsViewed } : {};

    // Restore NPC state
    if (state.npcs) {
      for (const [id, savedNpc] of Object.entries(state.npcs)) {
        if (!this.npcs[id]) continue;
        this.npcs[id].currentRoom = savedNpc.currentRoom;
        this.npcs[id].patrolIndex = savedNpc.patrolIndex || 0;
        this.npcs[id].lastMoveTurn = savedNpc.lastMoveTurn || 0;
        this.npcs[id].knownTopics = new Set(savedNpc.knownTopics || ['greet']);
        this.npcs[id].greeted = !!savedNpc.greeted;
      }
    }

    // Re-render current room
    const room = this.rooms[this.currentRoom];
    if (room) {
      if (fromUndo) {
        this._emit('output', '\n— You step back. The choice unmakes itself. —', 'system');
      }
      const desc = (this.isChangedWorld && room.descriptionChanged)
        ? room.descriptionChanged
        : (room.description || room.descriptionFirst);
      if (desc) this._emit('output', desc, 'narration');

      // Show NPC presence if applicable
      for (const npc of this._npcsInCurrentRoom()) {
        const line = (this.flags.vrethkai_with_mind && npc.presenceLineVrethkai)
          ? npc.presenceLineVrethkai
          : npc.presenceLine;
        if (line) this._emit('output', line, 'narration');
      }

      // Restore conversation state if mid-dialogue
      if (this.activeConversation && this.npcs[this.activeConversation]) {
        this._presentConversationChoices(this.npcs[this.activeConversation]);
      } else {
        this._presentRoomChoices(room);
      }
    }

    // Re-render game-over UI if we're loading into a dead state
    if (this.gameOver) {
      this._emit('gameOver', this.gameOverReason === 'death' ? 'death' : 'escape', this.gameOverReason);
    }
    return true;
  }
}

// Export for module systems, or attach to window for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
} else {
  window.GameEngine = GameEngine;
}
