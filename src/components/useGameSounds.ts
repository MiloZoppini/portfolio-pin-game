"use client";

import { useCallback, useRef } from "react";

/**
 * Procedural game sounds via Web Audio API — no audio files needed.
 */
export function useGameSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  function ctx(): AudioContext {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }

  /** Short metallic "clink" when a pin is pulled */
  const playPinPull = useCallback(() => {
    const ac = ctx();
    const now = ac.currentTime;

    // metallic click
    const osc = ac.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // noise burst for texture
    const bufferSize = ac.sampleRate * 0.06;
    const noiseBuffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2000;

    osc.connect(gain).connect(ac.destination);
    noise.connect(hp).connect(noiseGain).connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.15);
    noise.start(now);
    noise.stop(now + 0.06);
  }, []);

  /** Cascading coin tinkle sounds */
  const playCoinDrop = useCallback(() => {
    const ac = ctx();
    const now = ac.currentTime;

    const notes = [2200, 2600, 3000, 2400, 2800, 3200];
    notes.forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq + Math.random() * 200, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.12);

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    });
  }, []);

  /** Victory fanfare — ascending arpeggio + shimmer */
  const playWin = useCallback(() => {
    const ac = ctx();
    const now = ac.currentTime;

    // ascending major chord arpeggio
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    freqs.forEach((freq, i) => {
      const t = now + i * 0.12;
      const osc = ac.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.setValueAtTime(0.18, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });

    // shimmer on top
    const shimmerStart = now + 0.4;
    for (let i = 0; i < 8; i++) {
      const t = shimmerStart + i * 0.04;
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(3000 + Math.random() * 2000, t);

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }, []);

  /** Soft click for button hover / UI */
  const playClick = useCallback(() => {
    const ac = ctx();
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }, []);

  /** Whoosh for reset */
  const playReset = useCallback(() => {
    const ac = ctx();
    const now = ac.currentTime;

    const bufferSize = ac.sampleRate * 0.3;
    const buf = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;

    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(3000, now);
    bp.frequency.exponentialRampToValueAtTime(300, now + 0.25);
    bp.Q.value = 1.5;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    src.connect(bp).connect(gain).connect(ac.destination);
    src.start(now);
    src.stop(now + 0.3);
  }, []);

  return { playPinPull, playCoinDrop, playWin, playClick, playReset };
}
