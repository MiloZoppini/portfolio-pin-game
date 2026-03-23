"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./FrozenPinGame.module.css";
import { useGameSounds } from "./useGameSounds";

const FINAL_SCORE = 100;

/*
  Stages:
  0 = intro  — character-idle with greeting bubble, tap to start
  1 = game   — character-bucket, board + coins + pins, pin-top active
  2 = mid    — pin-top pulled, coins fell to middle, pin-bottom active
  3 = won    — pin-bottom pulled, coins fall to bucket, celebration
*/

// Coins inside the upper channel area of the board
const COIN_POSITIONS_TOP = [
  { x: 10, y: 21, rot: -8, delay: 0 },
  { x: 19, y: 14, rot: 12, delay: 30 },
  { x: 20, y: 18, rot: -15, delay: 60 },
  { x: 14, y: 12, rot: 5, delay: 90 },
  { x: 6, y: 15, rot: 20, delay: 120 },
  { x: 13, y: 16, rot: -10, delay: 150 },
];

// Coins in the middle channel (below pin-top, above pin-bottom)
const COIN_POSITIONS_MID = [
  { x: 38, y: 59, rot: -5, delay: 0 },
  { x: 39, y: 55, rot: 15, delay: 40 },
  { x: 27, y: 47, rot: -12, delay: 80 },
  { x: 31, y: 56, rot: 8, delay: 120 },
  { x: 24, y: 52, rot: -18, delay: 160 },
  { x: 32, y: 51, rot: 10, delay: 200 },
];

const burstParticles = [
  { x: -58, y: -24, delay: "0ms" },
  { x: -38, y: -66, delay: "40ms" },
  { x: 14, y: -74, delay: "80ms" },
  { x: 48, y: -46, delay: "120ms" },
  { x: 62, y: -6, delay: "160ms" },
  { x: 34, y: 26, delay: "200ms" },
  { x: -6, y: 38, delay: "240ms" },
  { x: -40, y: 22, delay: "280ms" },
];

const ambientParticles = [
  { top: "10%", left: "14%", size: "8px", delay: "0s", duration: "8s" },
  { top: "16%", left: "76%", size: "10px", delay: "1.2s", duration: "9.5s" },
  { top: "24%", left: "32%", size: "6px", delay: "0.4s", duration: "7.6s" },
  { top: "30%", left: "68%", size: "9px", delay: "2s", duration: "8.8s" },
  { top: "38%", left: "20%", size: "7px", delay: "1.8s", duration: "7.4s" },
  { top: "44%", left: "82%", size: "11px", delay: "0.8s", duration: "10s" },
  { top: "56%", left: "18%", size: "8px", delay: "2.4s", duration: "8.4s" },
  { top: "62%", left: "73%", size: "7px", delay: "1s", duration: "7.8s" },
  { top: "70%", left: "30%", size: "10px", delay: "2.8s", duration: "9.2s" },
  { top: "78%", left: "62%", size: "6px", delay: "1.5s", duration: "8.6s" },
  { top: "86%", left: "44%", size: "8px", delay: "3s", duration: "10.4s" },
];

const confettiColors = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
];

export default function FrozenPinGame() {
  const [stage, setStage] = useState(0);
  const [scoreTarget, setScoreTarget] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const mouseHandRef = useRef<HTMLDivElement | null>(null);
  const { playPinPull, playCoinDrop, playWin, playClick, playReset } = useGameSounds();

  const isIntro = stage === 0;
  const isPlaying = stage >= 1;
  const pin1Active = stage === 1;
  const pin1Pulled = stage >= 2;
  const pin2Active = stage === 2;
  const pin2Pulled = stage >= 3;
  const isWon = stage === 3;

  // Score counter animation
  useEffect(() => {
    if (displayScore === scoreTarget) return;
    const intervalId = window.setInterval(() => {
      setDisplayScore((current) => {
        if (current === scoreTarget) {
          window.clearInterval(intervalId);
          return current;
        }
        const diff = scoreTarget - current;
        const step = Math.max(1, Math.ceil(Math.abs(diff) / 7));
        const next = current + Math.sign(diff) * step;
        if ((diff > 0 && next >= scoreTarget) || (diff < 0 && next <= scoreTarget)) {
          window.clearInterval(intervalId);
          return scoreTarget;
        }
        return next;
      });
    }, 32);
    return () => window.clearInterval(intervalId);
  }, [displayScore, scoreTarget]);

  // Custom cursor (desktop only)
  useEffect(() => {
    if (!mouseHandRef.current) return;
    function handleMove(event: MouseEvent) {
      const handNode = mouseHandRef.current;
      if (!handNode) return;
      handNode.style.opacity = "1";
      handNode.style.transform = `translate3d(${event.clientX - 28}px, ${event.clientY - 12}px, 0)`;
    }
    function handleLeave() {
      const handNode = mouseHandRef.current;
      if (!handNode) return;
      handNode.style.opacity = "0";
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  function handleStart() {
    playClick();
    triggerHaptic(20);
    setStage(1);
  }

  function handlePullPin1() {
    if (stage !== 1) return;
    playPinPull();
    triggerHaptic(30);
    setStage(2);
    setTimeout(() => {
      playCoinDrop();
      triggerHaptic([10, 20, 10, 20, 10]);
    }, 300);
  }

  function handlePullPin2() {
    if (stage !== 2) return;
    playPinPull();
    triggerHaptic(30);
    setStage(3);

    setTimeout(() => {
      playCoinDrop();
      setScoreTarget(FINAL_SCORE);
      setBurstKey((c) => c + 1);
      triggerHaptic([10, 20, 10, 20, 10, 20, 10]);
    }, 400);

    setTimeout(() => {
      playWin();
      setShowConfetti(true);
      setScreenShake(true);
      triggerHaptic([50, 30, 50, 30, 80]);
    }, 800);

    setTimeout(() => setScreenShake(false), 1300);
    setTimeout(() => setShowConfetti(false), 4000);
  }

  function resetGame() {
    playReset();
    triggerHaptic(20);
    setStage(0);
    setScoreTarget(0);
    setDisplayScore(0);
    setBurstKey((c) => c + 1);
    setShowConfetti(false);
    setScreenShake(false);
  }

  return (
    <main className={`${styles.scene} ${screenShake ? styles.shake : ""}`}>
      {/* Background layers */}
      <Image fill priority alt="" sizes="100vw" src="/game/background.jpeg" className={styles.background} />
      <div className={styles.backgroundGlow} />
      <div className={styles.backgroundShade} />

      <div className={styles.playfield}>
        <Image fill priority alt="" sizes="(max-width: 900px) 100vw, 56vh" src="/game/background.jpeg" className={styles.playfieldBackground} />
        <div className={styles.playfieldVignette} />

        {/* Ambient snow/sparkle particles */}
        <div className={styles.ambientLayer} aria-hidden="true">
          {ambientParticles.map((p, i) => (
            <span key={`a-${i}`} className={styles.ambientParticle} style={{ "--particle-top": p.top, "--particle-left": p.left, "--particle-size": p.size, "--particle-delay": p.delay, "--particle-duration": p.duration } as React.CSSProperties} />
          ))}
        </div>

        <div className={styles.stage}>
          {/* Restart button (only during gameplay) */}
          {isPlaying ? (
            <button type="button" onClick={resetGame} className={styles.resetButton}>
              Restart
            </button>
          ) : null}

          {/* ═══════ INTRO PHASE ═══════ */}
          {isIntro ? (
            <div className={styles.introWrap}>
              <div className={styles.introCharacter}>
                <div className={styles.speechBubble}>
                  <span>Ciao!</span>
                </div>
                <Image src="/game/character-idle.png" alt="Character" width={800} height={1800} priority className={styles.introCharacterImage} />
              </div>
              <button type="button" onClick={handleStart} className={styles.playButton}>
                Gioca
              </button>
            </div>
          ) : null}

          {/* ═══════ GAME PHASE ═══════ */}
          {isPlaying ? (
            <>
              {/* Tutorial hints */}
              {pin1Active ? (
                <div className={`${styles.hintOverlay} ${styles.hintPin1}`} aria-hidden="true">
                  <div className={styles.hintPulse} />
                  <span className={styles.hintText}>Pull this pin!</span>
                </div>
              ) : null}
              {pin2Active ? (
                <div className={`${styles.hintOverlay} ${styles.hintPin2}`} aria-hidden="true">
                  <div className={styles.hintPulse} />
                  <span className={styles.hintText}>Now this one!</span>
                </div>
              ) : null}

              {/* Win badge */}
              {isWon ? (
                <div className={`${styles.winBadge} ${styles.winBadgeAnimate}`}>
                  <span className={styles.winStar}>&#9733;</span> Perfect <span className={styles.winStar}>&#9733;</span>
                </div>
              ) : null}

              {/* Confetti */}
              {showConfetti ? (
                <div className={styles.confettiLayer} aria-hidden="true">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <span key={`c-${i}`} className={styles.confettiPiece} style={{ "--confetti-x": `${Math.random() * 100}%`, "--confetti-delay": `${Math.random() * 0.6}s`, "--confetti-duration": `${1.5 + Math.random() * 1.5}s`, "--confetti-color": confettiColors[Math.floor(Math.random() * confettiColors.length)], "--confetti-rotation": `${Math.random() * 720 - 360}deg`, "--confetti-drift": `${Math.random() * 60 - 30}px` } as React.CSSProperties} />
                  ))}
                </div>
              ) : null}

              {/* ── Board with coins & pins ── */}
              <div className={styles.boardWrap}>
                <Image priority alt="" width={1406} height={1856} src="/game/board-empty.png" className={styles.boardImage} />

                {/* Coins in top section (visible at stage 1, fall away at stage 2) */}
                <div className={`${styles.coinGroup} ${styles.coinGroupTop} ${pin1Pulled ? styles.coinsFallToMid : ""}`} aria-hidden="true">
                  {COIN_POSITIONS_TOP.map((coin, i) => (
                    <div key={`ct-${i}`} className={styles.coinItem} style={{ left: `${coin.x}%`, top: `${coin.y}%`, "--coin-rot": `${coin.rot}deg`, "--coin-delay": `${coin.delay}ms` } as React.CSSProperties}>
                      <Image src="/game/coin.png" alt="" width={80} height={80} className={styles.coinImage} />
                    </div>
                  ))}
                </div>

                {/* Coins in mid section (appear after pin1 pull, fall at pin2 pull) */}
                {pin1Pulled ? (
                  <div className={`${styles.coinGroup} ${styles.coinGroupMid} ${pin2Pulled ? styles.coinsFallToBucket : ""}`} aria-hidden="true">
                    {COIN_POSITIONS_MID.map((coin, i) => (
                      <div key={`cm-${i}`} className={`${styles.coinItem} ${styles.coinAppear}`} style={{ left: `${coin.x}%`, top: `${coin.y}%`, "--coin-rot": `${coin.rot}deg`, "--coin-delay": `${coin.delay}ms` } as React.CSSProperties}>
                        <Image src="/game/coin.png" alt="" width={80} height={80} className={styles.coinImage} />
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Pin Top */}
                <button
                  type="button"
                  onClick={handlePullPin1}
                  disabled={!pin1Active}
                  className={`${styles.pinBtn} ${styles.pinBtnTop} ${pin1Pulled ? styles.pinPulledRight : ""} ${pin1Active ? styles.pinActive : ""}`}
                  aria-label="Pull top pin"
                >
                  <Image src="/game/pin-top.png" alt="" width={353} height={235} className={styles.pinImage} />
                </button>

                {/* Pin Bottom */}
                <button
                  type="button"
                  onClick={handlePullPin2}
                  disabled={!pin2Active}
                  className={`${styles.pinBtn} ${styles.pinBtnBottom} ${pin2Pulled ? styles.pinPulledLeft : ""} ${pin2Active ? styles.pinActive : ""}`}
                  aria-label="Pull bottom pin"
                >
                  <Image src="/game/pin-bottom.png" alt="" width={554} height={373} className={styles.pinImage} />
                </button>
              </div>

              {/* ── Character ── */}
              <div className={`${styles.characterWrap} ${isWon ? styles.characterBounce : ""}`} aria-hidden="true">
                {/* Score bubble on the bucket */}
                <div className={`${styles.scoreBubble} ${isWon ? styles.scorePop : ""}`}>
                  <span>{displayScore}</span>
                </div>

                {/* Before win: character with empty bucket */}
                {!isWon ? (
                  <img src="/game/character-bucket.png?v=2" alt="" className={styles.characterImage} />
                ) : null}

                {/* After win: character with bucket full of money */}
                {isWon ? (
                  <img src="/game/character-money.png?v=2" alt="" className={`${styles.characterImage} ${styles.characterWinSwap}`} />
                ) : null}
              </div>

              {/* Burst particles */}
              <div key={burstKey} className={styles.bucketBurst} aria-hidden="true">
                {burstParticles.map((p, i) => (
                  <span key={`b-${i}`} className={styles.bucketParticle} style={{ "--particle-x": `${p.x}px`, "--particle-y": `${p.y}px`, "--particle-delay": p.delay } as React.CSSProperties} />
                ))}
              </div>
            </>
          ) : null}

          {/* Custom cursor hand */}
          <div ref={mouseHandRef} className={styles.mouseHand} aria-hidden="true">
            <Image alt="" width={1727} height={981} src="/game/hand.png" className={styles.handImage} />
          </div>
        </div>
      </div>
    </main>
  );
}
