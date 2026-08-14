/*! RandomCircleReveal Screen v1.5.0 | MIT License */
(function (global, document) {
  'use strict';

  var SELECTOR = '.rcr-panel';
  var states = new WeakMap();
  var manager = { observer: null, mutationObserver: null, started: false };
  var scriptElement = document.currentScript;
  var initialScreenCover = null;

  var APPEAR_INTERVAL_MS = 60;
  var TRANSPARENCY_PER_COMPLETED_CIRCLE = 0.2;
  var POSITION_SEARCH_ATTEMPTS = 240;
  var MIN_POSITION_DISTANCE_RATIO = 0.4;

  var DEFAULTS = {
    count: 5,
    duration: 900,
    minRadius: 0,
    maxRadiusRatio: 1,
    coverColor: '#ffffff',
    ringColor: '#000000',
    ringWidth: 1.5,
    once: true,
    trigger: 'intersection'
  };


  // ページの初回描画よりできるだけ早く、全画面を確実に覆います。
  // アニメーション用Canvasの準備が終わるまで、この被せは外しません。
  function installInitialScreenCover() {
    if (initialScreenCover || !document.documentElement) {
      return;
    }

    var coverColor = DEFAULTS.coverColor;
    if (scriptElement && scriptElement.dataset && scriptElement.dataset.rcrCoverColor) {
      coverColor = scriptElement.dataset.rcrCoverColor;
    }

    initialScreenCover = document.createElement('div');
    initialScreenCover.className = 'rcr-initial-screen-cover';
    initialScreenCover.setAttribute('aria-hidden', 'true');
    initialScreenCover.style.position = 'fixed';
    initialScreenCover.style.inset = '0';
    initialScreenCover.style.width = '100vw';
    initialScreenCover.style.height = '100vh';
    initialScreenCover.style.margin = '0';
    initialScreenCover.style.padding = '0';
    initialScreenCover.style.background = coverColor;
    initialScreenCover.style.zIndex = '2147483647';
    initialScreenCover.style.pointerEvents = 'none';
    initialScreenCover.style.touchAction = 'none';

    document.documentElement.appendChild(initialScreenCover);
  }

  function removeInitialScreenCover() {
    if (initialScreenCover && initialScreenCover.parentNode) {
      initialScreenCover.parentNode.removeChild(initialScreenCover);
    }
    initialScreenCover = null;
  }

  installInitialScreenCover();

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

  function readConfig(panel) {
    var data = panel.dataset || {};
    return {
      count: clamp(Math.round(numberOr(data.rcrCount, DEFAULTS.count)), 1, 80),
      duration: clamp(numberOr(data.rcrDuration, DEFAULTS.duration), 0, 10000),
      minRadius: clamp(numberOr(data.rcrMinRadius, DEFAULTS.minRadius), 0, 1000),
      maxRadiusRatio: clamp(
        numberOr(data.rcrMaxRadiusRatio, DEFAULTS.maxRadiusRatio), 0.1, 2
      ),
      coverColor: data.rcrCoverColor || DEFAULTS.coverColor,
      ringColor: data.rcrRingColor || DEFAULTS.ringColor,
      ringWidth: clamp(numberOr(data.rcrRingWidth, DEFAULTS.ringWidth), 0, 30),
      once: data.rcrOnce === undefined
        ? DEFAULTS.once
        : data.rcrOnce !== 'false',
      trigger: data.rcrTrigger || DEFAULTS.trigger,
      screen: data.rcrScreen === 'true'
    };
  }

  function getSize(state) {
    if (state.screen) {
      return {
        width: Math.max(1, global.innerWidth),
        height: Math.max(1, global.innerHeight)
      };
    }

    var rect = state.panel.getBoundingClientRect();
    return {
      width: Math.max(1, state.panel.clientWidth || rect.width),
      height: Math.max(1, state.panel.clientHeight || rect.height)
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
      var candidate = { xRatio: random(0, 1), yRatio: random(0, 1) };
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
        delay: (positions.length - 1) * APPEAR_INTERVAL_MS
      };
    });
  }

  function pathCircle(context, circle, radius) {
    context.beginPath();
    context.arc(circle.x, circle.y, radius, 0, Math.PI * 2);
  }

  function resizeCanvas(state) {
    var size = getSize(state);
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
          circle,
          size.width,
          size.height,
          state.config.maxRadiusRatio
        )
      );
    });
  }

  function draw(state, elapsed) {
    var context = state.context;

    var completedCount = state.circles.reduce(function (count, circle) {
      var completedAt = circle.delay + state.config.duration;
      return count + (elapsed >= completedAt ? 1 : 0);
    }, 0);
    var coverAlpha = Math.max(
      0,
      1 - completedCount * TRANSPARENCY_PER_COMPLETED_CIRCLE
    );

    // 毎フレーム、画面全体を白く塗り直します。
    // 円が1個完了するたびに白画面を20%透明にします。
    context.clearRect(0, 0, state.width, state.height);
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = coverAlpha;
    context.fillStyle = state.config.coverColor;
    context.fillRect(0, 0, state.width, state.height);

    // 円の進行度を透明度に反転し、白い画面を円形に消します。
    state.circles.forEach(function (circle) {
      var localElapsed = elapsed - circle.delay;
      if (localElapsed < 0) {
        return;
      }

      var progress = clamp(
        localElapsed / Math.max(1, state.config.duration), 0, 1
      );
      var radius = circle.startRadius + (
        circle.endRadius - circle.startRadius
      ) * easeOutCubic(progress);

      context.globalCompositeOperation = 'destination-out';
      context.globalAlpha = easeOutCubic(progress);
      pathCircle(context, circle, radius);
      context.fill();
    });

    // 円の輪郭は、白い画面が消えるにつれて薄くします。
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = state.config.ringColor;
    context.lineWidth = state.config.ringWidth;
    context.lineJoin = 'round';

    state.circles.forEach(function (circle) {
      var localElapsed = elapsed - circle.delay;
      if (localElapsed < 0) {
        return;
      }

      var progress = clamp(
        localElapsed / Math.max(1, state.config.duration), 0, 1
      );
      var radius = circle.startRadius + (
        circle.endRadius - circle.startRadius
      ) * easeOutCubic(progress);

      context.globalAlpha = 1 - progress;
      pathCircle(context, circle, radius);
      context.stroke();
    });

    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
  }

  function ensurePositioned(state) {
    if (state.screen || getComputedStyle(state.panel).position !== 'static') {
      return;
    }
    state.previousPosition = state.panel.style.position;
    state.panel.style.position = 'relative';
    state.changedPosition = true;
  }

  function cleanupState(state) {
    if (state.resizeObserver) {
      state.resizeObserver.disconnect();
      state.resizeObserver = null;
    }
    if (state.resizeHandler) {
      global.removeEventListener('resize', state.resizeHandler);
      state.resizeHandler = null;
    }
    if (state.loadHandler) {
      global.removeEventListener('load', state.loadHandler);
      state.loadHandler = null;
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
      if (panel.dataset && panel.dataset.rcrScreen === 'true') {
        removeInitialScreenCover();
      }
      return Promise.resolve();
    }

    var config = readConfig(panel);
    if (overrides) {
      Object.keys(overrides).forEach(function (key) {
        if (overrides[key] !== undefined) {
          config[key] = overrides[key];
        }
      });
    }

    var state = {
      panel: panel,
      config: config,
      screen: config.screen,
      layer: document.createElement('div'),
      canvas: document.createElement('canvas'),
      context: null,
      circles: [],
      frameId: 0,
      elapsed: 0,
      loadHandler: null,
      resizeObserver: null,
      resizeHandler: null,
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
    state.layer.style.position = state.screen ? 'fixed' : 'absolute';
    state.layer.style.inset = '0';
    state.layer.style.width = state.screen ? '100vw' : '100%';
    state.layer.style.height = state.screen ? '100vh' : '100%';
    state.layer.style.zIndex = '2147483647';
    state.layer.style.pointerEvents = 'none';
    state.layer.style.touchAction = 'none';
    state.layer.style.overflow = 'hidden';
    state.layer.style.borderRadius = state.screen ? '0' : 'inherit';
    state.layer.setAttribute('aria-hidden', 'true');

    state.canvas.className = 'rcr-canvas';
    state.canvas.setAttribute('aria-hidden', 'true');
    state.canvas.style.display = 'block';
    state.layer.appendChild(state.canvas);

    if (state.screen) {
      document.body.appendChild(state.layer);
    } else {
      panel.appendChild(state.layer);
    }

    state.context = state.canvas.getContext('2d');
    if (!state.context) {
      if (state.screen) {
        removeInitialScreenCover();
      }
      cleanupState(state);
      return Promise.resolve();
    }

    createCircles(state);
    resizeCanvas(state);
    state.elapsed = 0;
    draw(state, state.elapsed);

    // Canvasが全面を塗り終えた後にだけ、初期被せを外します。
    // これによりCanvas生成前やload直後に背後が1フレーム見えるのを防ぎます。
    if (state.screen) {
      removeInitialScreenCover();
    }

    if (state.screen) {
      state.resizeHandler = function () {
        if (state.running) {
          resizeCanvas(state);
          draw(state, state.elapsed);
        }
      };
      global.addEventListener('resize', state.resizeHandler, { passive: true });
    } else if (typeof ResizeObserver === 'function') {
      state.resizeObserver = new ResizeObserver(function () {
        if (state.running) {
          resizeCanvas(state);
          draw(state, state.elapsed);
        }
      });
      state.resizeObserver.observe(panel);
    }

    var waitForLoad = overrides && overrides.waitForLoad === true;

    return new Promise(function (resolve) {
      state.resolve = resolve;
      var animationStarted = false;

      function startAnimation() {
        if (!state.running || animationStarted) {
          return;
        }
        animationStarted = true;
        state.loadHandler = null;

        // load直後にCanvasがリセットされていても、円を動かす前の被せ状態を同期的に戻します。
        state.elapsed = 0;
        draw(state, state.elapsed);

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
          state.elapsed = elapsed;
          draw(state, elapsed);
          if (elapsed < endTime) {
            state.frameId = global.requestAnimationFrame(frame);
          } else {
            cleanupState(state);
          }
        }

        state.frameId = global.requestAnimationFrame(frame);
      }

      if (waitForLoad && document.readyState !== 'complete') {
        // 自動スクリーンは被せたままにし、サイト全体の読み込み完了後に円を開始します。
        state.loadHandler = startAnimation;
        global.addEventListener('load', state.loadHandler, { once: true });
      } else {
        startAnimation();
      }
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
    } else {
      play(panel);
    }
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

  function copyScriptConfig(panel) {
    if (!scriptElement || !scriptElement.dataset) {
      return;
    }

    [
      'rcrCount',
      'rcrDuration',
      'rcrMinRadius',
      'rcrMaxRadiusRatio',
      'rcrCoverColor',
      'rcrRingColor',
      'rcrRingWidth'
    ].forEach(function (key) {
      if (scriptElement.dataset[key] !== undefined) {
        panel.dataset[key] = scriptElement.dataset[key];
      }
    });
  }

  function createAutoScreenPanel() {
    var existing = document.querySelector('[data-rcr-screen="true"]');
    if (existing) {
      return { panel: existing, created: false };
    }

    var panel = document.createElement('div');
    panel.className = 'rcr-auto-screen rcr-panel';
    panel.dataset.rcrScreen = 'true';
    panel.dataset.rcrTrigger = 'manual';
    panel.setAttribute('aria-hidden', 'true');
    panel.style.display = 'none';
    copyScriptConfig(panel);
    document.body.appendChild(panel);
    return { panel: panel, created: true };
  }

  function autoPlayScreen() {
    var target = createAutoScreenPanel();
    global.requestAnimationFrame(function () {
      play(target.panel, { waitForLoad: true }).then(function () {
        if (target.created && target.panel.parentNode) {
          target.panel.parentNode.removeChild(target.panel);
        }
      });
    });
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
    autoPlayScreen();
  }

  // 初期被せ自体はスクリプト評価時点ですでに表示済みです。
  // bodyが利用可能になってからアニメーション用Canvasを準備します。
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStart, { once: true });
  } else {
    autoStart();
  }
})(window, document);