export type ValidationResult = "VALID" | "ALREADY_USED" | "WRONG_EVENT" | "INVALID_CODE";

export function playFeedbackAudio(result: ValidationResult) {
  if (typeof window === "undefined" || !window.AudioContext) return;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (result === "VALID") {
    // Two ascending tones (Mi5 -> Si5)
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.setValueAtTime(987.77, now + 0.15);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gain.gain.setValueAtTime(0.5, now + 0.25);
    gain.gain.linearRampToValueAtTime(0, now + 0.35);
    
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (result === "ALREADY_USED") {
    // Two medium alert tones (440Hz)
    osc.type = "square";
    osc.frequency.setValueAtTime(440, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.setValueAtTime(0.3, now + 0.15);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    
    gain.gain.setValueAtTime(0, now + 0.25);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
    gain.gain.setValueAtTime(0.3, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 0.45);
    
    osc.start(now);
    osc.stop(now + 0.45);
  } else if (result === "WRONG_EVENT") {
    // Three descending attention tones
    osc.type = "triangle";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.setValueAtTime(320, now + 0.15);
    osc.frequency.setValueAtTime(240, now + 0.3);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.setValueAtTime(0.4, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);
  } else if (result === "INVALID_CODE") {
    // Low buzz error (150Hz sawtooth)
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.setValueAtTime(0.4, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

export function triggerHapticFeedback(result: ValidationResult) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;

  if (result === "VALID") {
    navigator.vibrate([100, 50, 100]); // Short double vibration
  } else if (result === "ALREADY_USED") {
    navigator.vibrate([200, 100, 200]); // Medium double vibration
  } else if (result === "WRONG_EVENT") {
    navigator.vibrate([150, 100, 150, 100, 150]); // Three quick vibrations
  } else if (result === "INVALID_CODE") {
    navigator.vibrate(500); // Long single vibration
  }
}

export function triggerGatekeeperFeedback(result: ValidationResult) {
  playFeedbackAudio(result);
  triggerHapticFeedback(result);
}
