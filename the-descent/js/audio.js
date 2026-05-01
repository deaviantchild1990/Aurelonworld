/**
 * THE DESCENT — Audio Bed
 *
 * Synthesised ambient layer per zone, generated at runtime via the Web Audio
 * API. No audio assets — every sound is built from oscillators and filtered
 * pink noise. Cross-fades between zones over ~2 seconds.
 *
 * Default state: muted. Player opts in via the ♪ button. Preference is
 * persisted in localStorage so a returning player keeps their choice.
 *
 * Browser policy: AudioContext can't start until the user has interacted
 * with the page. The UI lazy-initialises this on first click/keypress.
 */

(function () {
  'use strict';

  // ─── Pink noise buffer (Voss-McCartney algorithm, ~2 seconds, looped) ───
  function createPinkNoiseBuffer(ctx, durationSec) {
    const length = Math.floor(durationSec * ctx.sampleRate);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // ─── Builder helpers — each returns a function that, given (ctx, master, t, fade),
  //     instantiates and starts a node-graph and returns a record for cleanup. ───

  function drone(freq, gainAmount, type) {
    return function (ctx, master, t, fade) {
      const osc = ctx.createOscillator();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(gainAmount, t + fade);
      osc.connect(gain).connect(master);
      osc.start(t);
      return { osc: osc, gain: gain };
    };
  }

  function modDrone(freq, gainAmount, lfoFreq, lfoDepth, lfoTarget, oscType) {
    return function (ctx, master, t, fade) {
      const osc = ctx.createOscillator();
      osc.type = oscType || 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(gainAmount, t + fade);

      const lfo = ctx.createOscillator();
      lfo.frequency.value = lfoFreq;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = lfoDepth;
      lfo.connect(lfoGain);
      if (lfoTarget === 'frequency') {
        lfoGain.connect(osc.frequency);
      } else {
        lfoGain.connect(gain.gain);
      }

      osc.connect(gain).connect(master);
      osc.start(t);
      lfo.start(t);
      return { osc: osc, gain: gain, lfo: lfo };
    };
  }

  function noise(filterFreq, gainAmount, filterType) {
    return function (ctx, master, t, fade) {
      const buffer = createPinkNoiseBuffer(ctx, 2);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType || 'lowpass';
      filter.frequency.value = filterFreq;
      filter.Q.value = 0.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(gainAmount, t + fade);

      src.connect(filter).connect(gain).connect(master);
      src.start(t);
      return { bufferSrc: src, gain: gain };
    };
  }

  // ─── Zone configurations — each a list of builder functions ───
  const ZONE_CONFIGS = {
    cavern: [
      drone(55, 0.22),                                // deep earth rumble
      noise(180, 0.05, 'lowpass'),                    // earth body
      modDrone(165, 0.05, 0.04, 2, 'frequency')       // distant slow shift
    ],
    forest: [
      modDrone(110, 0.18, 0.15, 2, 'frequency'),      // breathing tone
      noise(900, 0.05, 'bandpass'),                   // bioluminescent shimmer
      modDrone(220, 0.06, 0.08, 0.04)                 // slow tremolo on overtone
    ],
    fungal: [
      drone(70, 0.20),                                // deep
      modDrone(140, 0.10, 0.20, 0.06),                // slow breath
      noise(420, 0.06, 'lowpass')                     // muffled body
    ],
    ruins1: [
      drone(165, 0.16),                               // stone-cold mid
      noise(1400, 0.05, 'highpass'),                  // wind through corridors
      drone(110, 0.06)                                // sub
    ],
    ruins2: [
      drone(330, 0.13),                               // glass tone
      drone(333, 0.13),                               // detuned for slow beating
      noise(2200, 0.03, 'highpass')                   // glassy shimmer
    ],
    ruins3: [
      drone(60, 0.20),                                // deep body
      modDrone(60, 0.16, 0.55, 0.12),                 // heartbeat-rate pulse
      noise(220, 0.05, 'lowpass')                     // murk
    ],
    sleeping: [
      // Near-silence with a single rare-fading tone — preserves the silence test
      modDrone(220, 0.05, 0.025, 0.05)
    ],
    cultist: [
      modDrone(880, 0.08, 3.5, 80, 'frequency'),      // heat shimmer
      noise(3200, 0.04, 'highpass')
    ],
    default: [
      drone(110, 0.10)
    ]
  };

  // ─── AudioBed class ───
  function AudioBed() {
    this.ctx = null;
    this.masterGain = null;
    this.currentZone = null;
    this.currentNodes = [];
    this.muted = true;
    this.volume = 0.18;            // master ceiling — kept low; ambient, not music
    this.fadeSeconds = 2.0;
  }

  AudioBed.prototype.init = function () {
    if (this.ctx) return true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;

      // Permanent master filter for the Vreth'kai-with-Mind distortion.
      // Default is transparent (cutoff ≈ above human hearing). When the
      // player transforms, this drops to ~1.4kHz for a muffled, underwater
      // feel — the world heard through the changed jaw.
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.value = 20000;
      this.masterFilter.Q.value = 1;

      // Slow tremolo (LFO on master gain). Off by default; switches on with
      // Vreth'kai mode. ~2.5 Hz wobble at low depth — uncanny, not nauseating.
      this.tremoloOsc = this.ctx.createOscillator();
      this.tremoloOsc.frequency.value = 2.5;
      this.tremoloGain = this.ctx.createGain();
      this.tremoloGain.gain.value = 0;
      this.tremoloOsc.connect(this.tremoloGain);
      this.tremoloGain.connect(this.masterGain.gain);
      this.tremoloOsc.start();

      this.masterGain.connect(this.masterFilter).connect(this.ctx.destination);
      this.vrethkaiMode = false;
      return true;
    } catch (e) {
      this.ctx = null;
      return false;
    }
  };

  /**
   * Toggle the Vreth'kai-with-Mind distortion. Lowpass cutoff ramps to
   * 1400 Hz over 1.2s; tremolo depth ramps to 0.06 over the same window.
   * Reverses on `false`. Idempotent.
   */
  AudioBed.prototype.setVrethkaiMode = function (active) {
    if (!this.ctx || this.vrethkaiMode === !!active) return;
    this.vrethkaiMode = !!active;
    const t = this.ctx.currentTime;
    const ramp = 1.2;
    try {
      if (active) {
        this.masterFilter.frequency.cancelScheduledValues(t);
        this.masterFilter.frequency.setValueAtTime(this.masterFilter.frequency.value, t);
        this.masterFilter.frequency.linearRampToValueAtTime(1400, t + ramp);
        this.tremoloGain.gain.cancelScheduledValues(t);
        this.tremoloGain.gain.setValueAtTime(this.tremoloGain.gain.value, t);
        this.tremoloGain.gain.linearRampToValueAtTime(0.06, t + ramp);
      } else {
        this.masterFilter.frequency.cancelScheduledValues(t);
        this.masterFilter.frequency.setValueAtTime(this.masterFilter.frequency.value, t);
        this.masterFilter.frequency.linearRampToValueAtTime(20000, t + ramp);
        this.tremoloGain.gain.cancelScheduledValues(t);
        this.tremoloGain.gain.setValueAtTime(this.tremoloGain.gain.value, t);
        this.tremoloGain.gain.linearRampToValueAtTime(0, t + ramp);
      }
    } catch (e) {}
  };

  AudioBed.prototype.isAvailable = function () {
    return !!this.ctx || (typeof (window.AudioContext || window.webkitAudioContext) === 'function');
  };

  AudioBed.prototype.setMuted = function (muted) {
    this.muted = !!muted;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    try {
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.linearRampToValueAtTime(this.muted ? 0 : this.volume, t + 0.4);
    } catch (e) {}
    // Resume context if needed (autoplay policy may have suspended it)
    if (this.ctx.state === 'suspended' && !this.muted) {
      this.ctx.resume().catch(function () {});
    }
  };

  AudioBed.prototype.setZone = function (zone) {
    if (!this.ctx) {
      const ok = this.init();
      if (!ok) return;
    }
    if (this.currentZone === zone) return;
    this._fadeOut();
    this._fadeIn(zone);
    this.currentZone = zone;
  };

  AudioBed.prototype._fadeOut = function () {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const fade = this.fadeSeconds;
    const nodes = this.currentNodes;
    this.currentNodes = [];
    nodes.forEach(function (node) {
      if (node.gain) {
        try {
          node.gain.gain.cancelScheduledValues(t);
          node.gain.gain.setValueAtTime(node.gain.gain.value, t);
          node.gain.gain.linearRampToValueAtTime(0, t + fade);
        } catch (e) {}
      }
      setTimeout(function () {
        try { if (node.osc) node.osc.stop(); } catch (e) {}
        try { if (node.lfo) node.lfo.stop(); } catch (e) {}
        try { if (node.bufferSrc) node.bufferSrc.stop(); } catch (e) {}
      }, (fade + 0.2) * 1000);
    });
  };

  AudioBed.prototype._fadeIn = function (zone) {
    if (!this.ctx) return;
    const config = ZONE_CONFIGS[zone] || ZONE_CONFIGS.default;
    const t = this.ctx.currentTime;
    const fade = this.fadeSeconds;
    for (let i = 0; i < config.length; i++) {
      const node = config[i](this.ctx, this.masterGain, t, fade);
      if (node) this.currentNodes.push(node);
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioBed;
  } else {
    window.AudioBed = AudioBed;
  }
})();
