/*! RandomCircleReveal v1.4.0 | MIT License */
(function (global, document) {
  'use strict';

  var SELECTOR = '.rcr-panel';
  var states = new WeakMap();
  var manager = { observer: null, mutationObserver: null, started: false };

  // 編集用定数：円の出現間隔は従来の120msの5倍です。
  const APPEAR_INTERVAL_MS = 60;
  const EXPANSION_DURATION_MS = 900;
  const MIN_POSITION_DISTANCE_RATIO = 0.4;
  const POSITION_SEARCH_ATTEMPTS = 240;
  const TRANSPARENCY_PER_CIRCLE_PERCENT = 55;

  var DEFAULTS = {
    count: 6,
    duration: EXPANSION_DURATION_MS,
    alphaStep: 55,
    maxAlpha: 255,
    minRadius: 0,
    maxRadiusRatio: 1,
    coverColor: '#000000',
    ringColor: '#ffffff',
    ringWidth: 0.2,
    once: true,
    trigger: 'intersection'
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function numberOr(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function isReducedMotion() {
    return global.matchMedia && global.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
  }

  function readConfig(panel, overrides) {
    var data = panel.dataset || {};
    var config = {
      count: clamp(Math.round(DEFAULTS.count), 1, 80),
      duration: clamp(numberOr(data.rcrDuration, DEFAULTS.duration), 0, 10000),
      alphaStep: clamp(numberOr(data.rcrAlphaStep, DEFAULTS.alphaStep), 1, 255),
      maxAlpha: clamp(DEFAULTS.maxAlpha, 1, 255),
      minRadius: clamp(numberOr(data.rcrMinRadius, DEFAULTS.minRadius), 0, 1000),
      maxRadiusRatio: clamp(
        numberOr(data.rcrMaxRadiusRatio, DEFAULTS.maxRadiusRatio), 0.1, 2
      ),
      coverColor: data.rcrCoverColor || DEFAULTS.coverColor,
      ringColor: data.rcrRingColor || DEFAULTS.ringColor,
      ringWidth: clamp(DEFAULTS.ringWidth, 0.5, 30),
      once: data.rcrOnce === undefined
        ? DEFAULTS.once
        : data.rcrOnce !== 'false',
      trigger: data.rcrTrigger || DEFAULTS.trigger
    };

    if (overrides) {
      Object.keys(overrides).forEach(function (key) {
        if (overrides[key] !== undefined) {
          config[key] = overrides[key];
        }
      });
    }

    return config;
  }

  function getSize(panel) {
    var rect = panel.getBoundingClientRect();
    return {
      width: Math.max(1, panel.clientWidth || rect.width),
      height: Math.max(1, panel.clientHeight || rect.height)
    };
  }

  function getCoverRadius(circle, width, height, ratio) {
    var x = circle.xRatio * width;
    var y = circle.yRatio * height;
    var corners = [
      Math.hypot(x, y),
      Math.hypot(width - x, y),
      Math.hypot(x, height - y),
      Math.hypot(width - x, height - y)
    ];
    return Math.max.apply(Math, corners) * ratio + 2;
  }

  function ensurePositioned(state) {
    if (getComputedStyle(state.panel).position !== 'static') {
      return;
    }
    state.previousPosition = state.panel.style.position;
    state.panel.style.position = 'relative';
    state.changedPosition = true;
  }

  function resizeCanvas(state) {
    var size = getSize(state.panel);
    var dpr = clamp(global.devicePixelRatio || 1, 1, 2);

    state.width = size.width;
    state.height = size.height;
    state.canvas.width = Math.max(1, Math.round(size.width * dpr));
    state.canvas.height = Math.max(1, Math.round(size.height * dpr));
    state.canvas.style.width = size.width + 'px';
    state.canvas.style.height = size.height + 'px';
    state.context.setTransform(dpr, 0, 0, dpr, 0, 0);

    state.circles.forEach(function (circle) {
      circle.x = circle.xRatio * size.width;
      circle.y = circle.yRatio * size.height;
      circle.endRadius = Math.max(
        state.config.minRadius,
        getCoverRadius(
          circle, size.width, size.height, state.config.maxRadiusRatio
        )
      );
    });
  }

  function createCircles(state) {
    var positions = [];

    state.circles = Array.from({ length: state.config.count }, function () {
      var position = createSpreadPosition(positions);
      positions.push(position);

      return {
        xRatio: position.xRatio,
        yRatio: position.yRatio,
        x: 0,
        y: 0,
        startRadius: random(0, 2),
        endRadius: 0,
        alpha: state.config.maxAlpha,
        delay: positions.length === 1
          ? 0
          : (positions.length - 1) * APPEAR_INTERVAL_MS
      };
    });
  }

  function getNearestPositionDistance(candidate, positions) {
    if (positions.length === 0) {
      return Infinity;
    }

    return positions.reduce(function (nearest, position) {
      var distance = Math.hypot(
        candidate.xRatio - position.xRatio,
        candidate.yRatio - position.yRatio
      );
      return Math.min(nearest, distance);
    }, Infinity);
  }

  function createSpreadPosition(positions) {
    var bestCandidate = null;
    var bestDistance = -1;

    for (var attempt = 0; attempt < POSITION_SEARCH_ATTEMPTS; attempt += 1) {
      var candidate = {
        xRatio: random(0, 1),
        yRatio: random(0, 1)
      };
      var nearestDistance = getNearestPositionDistance(candidate, positions);

      if (nearestDistance > bestDistance) {
        bestCandidate = candidate;
        bestDistance = nearestDistance;
      }

      if (nearestDistance >= MIN_POSITION_DISTANCE_RATIO) {
        return candidate;
      }
    }

    return bestCandidate;
  }

  function pathCircle(context, circle, radius) {
    context.beginPath();
    context.arc(circle.x, circle.y, radius, 0, Math.PI * 2);
  }

  function draw(state, elapsed) {
    var config = state.config;
    var context = state.context;

    context.clearRect(0, 0, state.width, state.height);
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    context.fillStyle = config.coverColor;
    context.fillRect(0, 0, state.width, state.height);

    state.circles.forEach(function (circle) {
      var localElapsed = elapsed - circle.delay;
      var progress = clamp(
        localElapsed / Math.max(1, config.duration), 0, 1
      );
      var radius = circle.startRadius + (
        circle.endRadius - circle.startRadius
      ) * easeOutCubic(progress);

      if (localElapsed >= 0) {
        circle.alpha = progress >= 1
          ? 0
          : Math.max(0, circle.alpha - config.alphaStep);
      }

      // 1個の円の透明化量を最大100/17%に制限します。
      context.globalCompositeOperation = 'destination-out';
      context.globalAlpha = (
        1 - circle.alpha / 255
      ) * (TRANSPARENCY_PER_CIRCLE_PERCENT / 100);
      pathCircle(context, circle, radius);
      context.fill();
    });

    // 穴の境界を輪郭線として表示します。
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    context.strokeStyle = config.ringColor;
    context.lineWidth = config.ringWidth;
    context.lineJoin = 'round';

    state.circles.forEach(function (circle) {
      var localElapsed = elapsed - circle.delay;
      var progress = clamp(
        localElapsed / Math.max(1, config.duration), 0, 1
      );
      var radius = circle.startRadius + (
        circle.endRadius - circle.startRadius
      ) * easeOutCubic(progress);

      if (localElapsed < 0) {
        return;
      }

      context.globalAlpha = clamp(0.35 + progress * 0.65, 0, 1);
      pathCircle(context, circle, radius);
      context.stroke();
    });

    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
  }

  function cleanupState(state) {
    if (state.resizeObserver) {
      state.resizeObserver.disconnect();
      state.resizeObserver = null;
    }
    if (state.frameId) {
      global.cancelAnimationFrame(state.frameId);
      state.frameId = 0;
    }
    if (state.layer && state.layer.parentNode) {
      state.layer.parentNode.removeChild(state.layer);
    }
    if (state.changedPosition) {
      state.panel.style.position = state.previousPosition;
      state.changedPosition = false;
    }
    state.running = false;
    if (state.resolve) {
      var resolve = state.resolve;
      state.resolve = null;
      resolve();
    }
  }

  function play(panel, overrides) {
    if (!(panel instanceof Element)) {
      return Promise.reject(new TypeError(
        'RandomCircleReveal.play() expects an Element.'
      ));
    }

    var previous = states.get(panel);
    if (previous) {
      cleanupState(previous);
    }
    if (isReducedMotion()) {
      return Promise.resolve();
    }

    var state = {
      panel: panel,
      config: readConfig(panel, overrides),
      layer: document.createElement('div'),
      canvas: document.createElement('canvas'),
      context: null,
      circles: [],
      frameId: 0,
      resizeObserver: null,
      width: 1,
      height: 1,
      running: true,
      changedPosition: false,
      previousPosition: '',
      resolve: null
    };

    states.set(panel, state);
    ensurePositioned(state);
    state.layer.className = 'rcr-layer';
    state.layer.style.position = 'absolute';
    state.layer.style.inset = '0';
    state.layer.style.zIndex = '2147483647';
    state.layer.style.pointerEvents = 'none';
    state.layer.style.overflow = 'hidden';
    state.layer.style.borderRadius = 'inherit';
    state.canvas.className = 'rcr-canvas';
    state.canvas.setAttribute('aria-hidden', 'true');
    state.canvas.style.display = 'block';
    state.layer.appendChild(state.canvas);
    panel.appendChild(state.layer);
    state.context = state.canvas.getContext('2d');

    if (!state.context) {
      cleanupState(state);
      return Promise.resolve();
    }

    createCircles(state);
    resizeCanvas(state);
    draw(state, 0);

    if (typeof ResizeObserver === 'function') {
      state.resizeObserver = new ResizeObserver(function () {
        if (state.running) {
          resizeCanvas(state);
        }
      });
      state.resizeObserver.observe(panel);
    }

    return new Promise(function (resolve) {
      state.resolve = resolve;
      var startTime = null;
      var endTime = state.config.duration + (
        Math.max(0, state.config.count - 1) * APPEAR_INTERVAL_MS
      );

      function frame(timestamp) {
        if (!state.running) {
          return;
        }
        if (startTime === null) {
          startTime = timestamp;
        }
        var elapsed = timestamp - startTime;
        draw(state, elapsed);
        if (elapsed < endTime) {
          state.frameId = global.requestAnimationFrame(frame);
          return;
        }
        cleanupState(state);
      }

      state.frameId = global.requestAnimationFrame(frame);
    });
  }

  function destroy(panel) {
    var state = states.get(panel);
    if (!state) {
      return;
    }
    cleanupState(state);
    states.delete(panel);
  }

  function observePanel(panel) {
    if (!(panel instanceof Element) || !panel.matches(SELECTOR)) {
      return;
    }
    if (panel.dataset.rcrTrigger === 'manual') {
      return;
    }
    if (manager.observer) {
      manager.observer.observe(panel);
      return;
    }
    play(panel);
  }

  function scan(root) {
    if (!root || root.nodeType !== 1 && root.nodeType !== 9) {
      return;
    }
    if (root.matches && root.matches(SELECTOR)) {
      observePanel(root);
    }
    Array.from(root.querySelectorAll(SELECTOR)).forEach(observePanel);
  }

  function start(root) {
    if (manager.started) {
      scan(root || document);
      return api;
    }
    manager.started = true;
    var target = root || document;

    if (typeof IntersectionObserver === 'function') {
      manager.observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          var panel = entry.target;
          if (panel.dataset.rcrOnce !== 'false') {
            manager.observer.unobserve(panel);
          }
          play(panel);
        });
      }, { threshold: 0.12 });
    }

    scan(target);

    if (typeof MutationObserver === 'function' && document.body) {
      manager.mutationObserver = new MutationObserver(function (records) {
        records.forEach(function (record) {
          Array.from(record.addedNodes).forEach(function (node) {
            scan(node);
          });
        });
      });
      manager.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    return api;
  }

  function stop() {
    if (manager.observer) {
      manager.observer.disconnect();
      manager.observer = null;
    }
    if (manager.mutationObserver) {
      manager.mutationObserver.disconnect();
      manager.mutationObserver = null;
    }
    manager.started = false;
    return api;
  }

  var api = {
    selector: SELECTOR,
    start: start,
    stop: stop,
    play: play,
    destroy: destroy
  };

  global.RandomCircleReveal = api;

  function autoStart() {
    start(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStart, { once: true });
  } else {
    autoStart();
  }
})(window, document);
