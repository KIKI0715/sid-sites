/* =========================================================
   BERATAN — 공통 스크립트 (index / notes / my scent 공용)
   1) 타이핑 효과 (#42): 55ms 간격으로 한 글자씩
   2) 스크롤 고정 문장: 위에서 내려와 화면 중간에 고정
   ========================================================= */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TYPE_INTERVAL = 55; // ms, 한 글자당 간격

  /* ---------- 1) 타이핑 효과 ---------- */
  function typeText(el, onDone) {
    if (el.dataset.started) return;
    el.dataset.started = 'true';
    el.classList.add('is-typing'); // 이때부터 커서 표시

    var done = el.querySelector('.done');
    var ghost = el.querySelector('.ghost');
    var full = ghost.textContent;

    if (reduceMotion) {
      done.textContent = full;
      ghost.textContent = '';
      el.classList.add('is-done');
      if (onDone) onDone();
      return;
    }

    var count = 0; // 지금까지 찍은 글자 수, 처음에는 0
    ghost.textContent = full; // 자리 미리 확보

    var timer = setInterval(function () {
      count += 1;
      done.textContent = full.slice(0, count);
      ghost.textContent = full.slice(count);

      if (count >= full.length) {
        clearInterval(timer);
        el.classList.add('is-done'); // 문장이 끝나면 커서 제거
        if (onDone) onDone();
      }
    }, TYPE_INTERVAL);
  }

  // 문단 체인: 앞 문단이 다 쓰이면 data-next로 지정된 다음 문단이 이어서 쓰임
  function startTypeChain(el) {
    typeText(el, function () {
      var nextId = el.dataset.next;
      var next = nextId && document.getElementById(nextId);
      if (next) startTypeChain(next);
    });
  }

  function initTyping() {
    // 페이지가 열릴 때 시작 (체인의 첫 문단)
    document.querySelectorAll('[data-trigger="load"]').forEach(startTypeChain);

    // 스크롤로 화면에 들어올 때 시작 (페이지 로드 시 화면 밖에 있는 문장용)
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            typeText(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      document.querySelectorAll('[data-trigger="view"]').forEach(function (el) {
        io.observe(el);
      });
    } else {
      document.querySelectorAll('[data-trigger="view"]').forEach(typeText);
    }
  }

  /* ---------- 2) 스크롤 고정 문장 ---------- */
  function initStickyStory() {
    var stage = document.querySelector('.sticky-stage');
    var story = document.querySelector('.story');
    if (!stage || !story) return;

    var ticking = false;

    function update() {
      ticking = false;
      if (reduceMotion) {
        story.style.setProperty('--p', '1');
        return;
      }
      // 0: 고정 구간 시작 전 / 1: 화면 중간에 완전히 고정된 상태
      var rect = stage.getBoundingClientRect();
      var progress = Math.min(Math.max(-rect.top / window.innerHeight, 0), 1);
      story.style.setProperty('--p', progress.toFixed(4));
    }

    function requestUpdate() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }

  /* ---------- 3) KEY NOTES 아코디언 (#49) ---------- */
  function initAccordion() {
    var items = document.querySelectorAll('.acc-item');
    if (!items.length) return;

    items.forEach(function (item) {
      var trigger = item.querySelector('.acc-trigger');
      trigger.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');

        // 한 번에 하나만 열리도록 나머지는 닫기
        items.forEach(function (other) {
          other.classList.remove('is-open');
          other.querySelector('.acc-trigger').setAttribute('aria-expanded', 'false');
        });

        if (willOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------- 4) KEY NOTES 일러스트 클릭 모션 ---------- */
  function initNoteTap() {
    document.querySelectorAll('.note-art').forEach(function (btn) {
      var timer = null;

      btn.addEventListener('click', function () {
        btn.classList.remove('is-tap');
        void btn.offsetWidth; // 같은 모션을 다시 재생하기 위해 강제 리플로우
        btn.classList.add('is-tap');

        // 흔들림(0.7s)이 끝난 뒤 상태 해제
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.classList.remove('is-tap');
        }, 700);
      });
    });
  }

  /* ---------- 초기화 ---------- */
  function init() {
    initTyping();
    initStickyStory();
    initAccordion();
    initNoteTap();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
