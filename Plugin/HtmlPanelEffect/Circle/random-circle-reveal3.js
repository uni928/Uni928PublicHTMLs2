(() => {
  'use strict';

  const CIRCLE_COUNT = 5;
  const CIRCLE_DURATION = 900;
  const START_DELAY = 120;
  const STYLE_ID = 'random-circle-reveal2-style';
  const OVERLAY_CLASS = 'rcr2-overlay';

  const easeOutCubic = (value) => 1 - ((1 - value) ** 3);

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @layer base {
        /* デモページに近い暗色グラデーション背景をJSから適用します。 */
        :root {
          color-scheme: dark;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #0b1517;
          color: #eaf4f1;
        }

        html,
        body {
          min-height: 100%;
        }

        body.rcr2-demo-background {
          margin: 0;
          color: #eaf4f1;
          background:
            radial-gradient(
              circle at 78% 12%,
              rgb(40 104 98 / 20%),
              transparent 28rem
            ),
            linear-gradient(
              135deg,
              #0b1517 0%,
              #0b1517 58%,
              #102124 100%
            );
        }
      }

      @layer components {
        /* 演出用レイヤーは画面全体を覆いますが、操作を通過させます。 */
        .${OVERLAY_CLASS} {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          display: block;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          touch-action: none;
          background: #000;
          opacity: 1;
          transition: opacity 180ms ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .${OVERLAY_CLASS} {
            transition-duration: 1ms;
          }
        }
      }
    `;
    document.head.appendChild(style);
  }

  function applyDemoBackground() {
    document.body.classList.add('rcr2-demo-background');
  }

  function createOverlay() {
    const canvas = document.createElement('canvas');
    canvas.className = OVERLAY_CLASS;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('role', 'presentation');
    document.body.appendChild(canvas);

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      canvas.remove();
      return null;
    }

    const state = {
      canvas,
      context,
      width: 0,
      height: 0,
      scale: 1,
    };

    const resize = () => {
      state.scale = Math.min(window.devicePixelRatio || 1, 2);
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(state.width * state.scale));
      canvas.height = Math.max(1, Math.round(state.height * state.scale));
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;
      context.setTransform(state.scale, 0, 0, state.scale, 0, 0);
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = '#000';
      context.fillRect(0, 0, state.width, state.height);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    state.dispose = () => {
      window.removeEventListener('resize', resize);
      canvas.remove();
    };

    return state;
  }

  function randomPoint(width, height) {
    return {
      x: width * (0.15 + Math.random() * 0.7),
      y: height * (0.15 + Math.random() * 0.7),
    };
  }

  function revealCircle(state, point, duration) {
    return new Promise((resolve) => {
      const startedAt = performance.now();
      const radius = Math.hypot(
        Math.max(point.x, state.width - point.x),
        Math.max(point.y, state.height - point.y),
      );

      const frame = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const easedProgress = easeOutCubic(progress);

        state.context.save();
        state.context.globalCompositeOperation = 'destination-out';
        state.context.beginPath();
        state.context.arc(
          point.x,
          point.y,
          Math.max(0, radius * easedProgress),
          0,
          Math.PI * 2,
        );
        state.context.fill();
        state.context.restore();

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(frame);
    });
  }

  async function play() {
    if (document.querySelector(`.${OVERLAY_CLASS}`)) return;

    installStyles();
    applyDemoBackground();

    const state = createOverlay();
    if (!state) return;

    try {
      for (let index = 0; index < CIRCLE_COUNT; index += 1) {
        if (index > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, START_DELAY));
        }

        await revealCircle(
          state,
          randomPoint(state.width, state.height),
          CIRCLE_DURATION,
        );

        const completed = index + 1;
        state.canvas.style.opacity = String(
          Math.max(0, 1 - completed / CIRCLE_COUNT),
        );
      }

      await new Promise((resolve) => window.setTimeout(resolve, 220));
    } finally {
      state.dispose();
    }
  }

  function start() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', play, { once: true });
    } else {
      play();
    }
  }

  window.RandomCircleReveal2 = Object.freeze({ play });
  start();
})();
