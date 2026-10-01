/* SnapDog site demos: animated, resolution-independent illustrations of the
   capture → annotate → share flow, drawn over a sample page.
   <figure class="sd-demo" data-demo="flow|loupe|compare"> … fallback <img> … </figure> */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1840, H = 1224;
  const IMG = '/media/order-page.webp';
  // Targets on the sample page, in image pixels (2x render of a 920x612 page).
  const T = {
    sheet: [40, 40, 1800, 1186],
    box: [104, 522, 1736, 690],
    nan: [490, 604],
    pill: [1286, 566, 1702, 650],
    email: [532, 333, 896, 385],
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;

  const el = (name, attrs = {}, parent) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  // Progress of time t through [a, b], eased.
  const seg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const lerp = (a, b, p) => a + (b - a) * p;

  function base(fig, label) {
    const id = 'sd' + (++uid);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': label });
    const defs = el('defs', {}, svg);
    const blur = el('filter', { id: id + 'b', x: '-5%', y: '-20%', width: '110%', height: '140%' }, defs);
    el('feGaussianBlur', { stdDeviation: 13 }, blur);
    const shadow = el('filter', { id: id + 's', x: '-20%', y: '-20%', width: '140%', height: '160%' }, defs);
    el('feDropShadow', { dx: 0, dy: 10, stdDeviation: 14, 'flood-opacity': .22 }, shadow);
    el('image', { href: IMG, width: W, height: H }, svg);
    fig.querySelector('img')?.remove();
    fig.prepend(svg);
    return { svg, defs, id };
  }

  // Annotation layer shared by flow and compare: arrow, highlight, steps, blur.
  function annotations(svg, defs, id) {
    const g = el('g', {}, svg);
    const clip = el('clipPath', { id: id + 'c' }, defs);
    const [ex0, ey0, ex1, ey1] = T.email;
    const blurRect = el('rect', { x: ex0 - 6, y: ey0 - 6, width: ex1 - ex0 + 12, height: ey1 - ey0 + 12, rx: 10 }, clip);
    const blurLayer = el('g', { 'clip-path': `url(#${id}c)` }, g);
    el('image', { href: IMG, width: W, height: H, filter: `url(#${id}b)` }, blurLayer);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: '#eef2ff', opacity: .35 }, blurLayer);

    const [px0, py0, px1, py1] = T.pill;
    const hi = el('rect', { x: px0 - 14, y: py0 - 14, width: px1 - px0 + 28, height: py1 - py0 + 28, rx: 40,
      fill: 'none', stroke: '#ff9f0a', 'stroke-width': 9, pathLength: 1, 'stroke-dasharray': 1 }, g);

    const arrow = el('path', { d: `M 1010 600 C 860 520, 700 520, ${T.nan[0] + 20} ${T.nan[1] - 6}`,
      fill: 'none', stroke: '#ff3b30', 'stroke-width': 15, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1 }, g);
    const head = el('path', { d: 'M 0 0 L 58 -30 L 46 0 L 58 30 Z', fill: '#ff3b30',
      transform: `translate(${T.nan[0] + 8} ${T.nan[1] - 2}) rotate(18)` }, g);

    const step = (n, x, y) => {
      const s = el('g', { transform: `translate(${x} ${y})` }, g);
      const inner = el('g', {}, s);
      el('circle', { r: 34, fill: '#ff3b30', stroke: '#fff', 'stroke-width': 6 }, inner);
      const t = el('text', { 'text-anchor': 'middle', y: 13, fill: '#fff',
        'font-family': '-apple-system,BlinkMacSystemFont,system-ui,sans-serif', 'font-size': 38, 'font-weight': 800 }, inner);
      t.textContent = n;
      return inner;
    };
    const s1 = step(1, 1048, 600);
    const s2 = step(2, px0 - 6, py0 - 8);
    return { g, blurRect, ex0, ew: ex1 - ex0 + 12, hi, arrow, head, s1, s2 };
  }

  function setAnn(a, p) {
    a.arrow.setAttribute('stroke-dashoffset', 1 - p.arrow);
    a.head.style.opacity = p.arrow > .97 ? 1 : 0;
    a.hi.setAttribute('stroke-dashoffset', 1 - p.hi);
    const pop = (n, v) => { n.style.transform = `scale(${v})`; n.style.opacity = v > 0 ? 1 : 0; };
    pop(a.s1, p.s1); pop(a.s2, p.s2);
    a.blurRect.setAttribute('width', Math.max(0, a.ew * p.blur));
  }

  function cursor(svg) {
    return el('path', { d: 'M0 0 L0 54 L13 41 L22 62 L32 58 L23 38 L40 38 Z', fill: '#111',
      stroke: '#fff', 'stroke-width': 4, 'stroke-linejoin': 'round' }, svg);
  }
  const moveCursor = (c, x, y) => c.setAttribute('transform', `translate(${x} ${y})`);

  function badge(svg, id) {
    const g = el('g', { filter: `url(#${id}s)` }, svg);
    const r = el('rect', { height: 56, rx: 14, fill: 'rgba(17,24,39,.9)' }, g);
    const t = el('text', { x: 20, y: 38, fill: '#fff', 'font-size': 30, 'font-weight': 650,
      'font-family': 'ui-monospace,"SF Mono",Menlo,monospace' }, g);
    return { g, set(x, y, text) {
      t.textContent = text;
      const w = text.length * 18.2 + 40;
      r.setAttribute('width', w);
      g.setAttribute('transform', `translate(${x} ${y})`);
    } };
  }

  // Dimmed screen with a clear selection rectangle cut out of it.
  function selection(svg, id, defs) {
    const mask = el('mask', { id: id + 'm' }, defs);
    el('rect', { width: W, height: H, fill: '#fff' }, mask);
    const hole = el('rect', { fill: '#000' }, mask);
    const dim = el('rect', { width: W, height: H, fill: 'rgba(8,14,26,.42)', mask: `url(#${id}m)` }, svg);
    const outline = el('rect', { fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '14 10' }, svg);
    return { set(x0, y0, x1, y1, on) {
      for (const n of [hole, outline]) {
        n.setAttribute('x', Math.min(x0, x1)); n.setAttribute('y', Math.min(y0, y1));
        n.setAttribute('width', Math.abs(x1 - x0)); n.setAttribute('height', Math.abs(y1 - y0));
      }
      dim.style.opacity = on; outline.style.opacity = on;
    } };
  }

  function run(fig, duration, frame) {
    const pinned = new URLSearchParams(location.search).get('sd-t');   // render one frame, for stills
    if (pinned !== null) { frame(+pinned % duration); return; }
    let start = 0, raf = 0, visible = false;
    const tick = now => {
      if (!start) start = now;
      frame((now - start) % duration);
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    }, { threshold: .15 }).observe(fig);
  }

  const DEMOS = {
    flow(fig) {
      const { svg, defs, id } = base(fig, 'Animated illustration: a region is selected, then marked up with an arrow, numbered steps, a highlight and a blur, then copied and saved');
      const sel = selection(svg, id, defs);
      const a = annotations(svg, defs, id);
      const b = badge(svg, id);
      const flash = el('rect', { width: W, height: H, fill: '#fff', opacity: 0 }, svg);
      const toast = el('g', { filter: `url(#${id}s)` }, svg);
      el('rect', { x: -330, y: -46, width: 660, height: 92, rx: 46, fill: 'rgba(17,24,39,.92)' }, toast);
      el('circle', { cx: -268, cy: 0, r: 22, fill: '#34c759' }, toast);
      el('path', { d: 'M -279 0 l 8 9 l 16 -18', fill: 'none', stroke: '#fff', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, toast);
      const tt = el('text', { x: -228, y: 11, fill: '#fff', 'font-size': 32, 'font-weight': 600,
        'font-family': '-apple-system,BlinkMacSystemFont,system-ui,sans-serif' }, toast);
      tt.textContent = 'Copied · Saved to History';
      const cur = cursor(svg);
      const [sx0, sy0, sx1, sy1] = [24, 24, 1816, 1200];
      const arrowLen = a.arrow.getTotalLength();

      const frame = t => {
        // 1. Drag out a region.
        const d = seg(t, 500, 2100);
        const x1 = lerp(sx0, sx1, d), y1 = lerp(sy0, sy1, d);
        const selOn = t < 2500 ? (t < 300 ? t / 300 : 1) : 1 - seg(t, 2500, 2700);
        sel.set(sx0, sy0, t < 500 ? sx0 : x1, t < 500 ? sy0 : y1, selOn);
        b.set(Math.min(x1 + 18, W - 290), Math.min(y1 + 18, H - 70), `${Math.round((x1 - sx0) / 2)} × ${Math.round((y1 - sy0) / 2)}`);
        b.g.style.opacity = t > 450 && t < 2500 ? 1 : 0;
        flash.setAttribute('opacity', t > 2450 && t < 2900 ? .75 * (1 - seg(t, 2450, 2900)) : 0);
        // 2. Annotate.
        const fade = 1 - seg(t, 10200, 10800);
        setAnn(a, { arrow: seg(t, 3700, 4500), hi: seg(t, 4800, 5500), s1: seg(t, 5600, 5850), s2: seg(t, 5850, 6100), blur: seg(t, 6300, 7200) });
        a.g.style.opacity = fade;
        // Cursor path: corner drag, then to each annotation.
        let cx, cy;
        if (t < 2500) { cx = t < 500 ? sx0 : x1; cy = t < 500 ? sy0 : y1; }
        else if (t < 3700) { const m = seg(t, 2900, 3600); cx = lerp(sx1, 1010, m); cy = lerp(sy1, 600, m); }
        else if (t < 4500) { const pt = a.arrow.getPointAtLength(arrowLen * seg(t, 3700, 4500)); cx = pt.x; cy = pt.y; }
        else if (t < 6300) { const m = seg(t, 4600, 6200); cx = lerp(T.nan[0] + 20, T.email[0], m); cy = lerp(T.nan[1] - 6, 360, m); }
        else if (t < 7200) { cx = lerp(T.email[0], T.email[2], seg(t, 6300, 7200)); cy = 360; }
        else { const m = seg(t, 7300, 8000); cx = lerp(T.email[2], 1500, m); cy = lerp(360, 1000, m); }
        moveCursor(cur, cx, cy);
        cur.style.opacity = t > 9800 ? fade : 1;
        // 3. Share.
        const up = seg(t, 7600, 8000) * (1 - seg(t, 9800, 10200));
        toast.setAttribute('transform', `translate(${W / 2} ${lerp(H + 60, H - 110, up)})`);
        toast.style.opacity = up;
      };
      if (reduce) {
        sel.set(0, 0, 0, 0, 0); b.g.style.opacity = 0; cur.style.opacity = 0; toast.style.opacity = 0;
        setAnn(a, { arrow: 1, hi: 1, s1: 1, s2: 1, blur: 1 });
      } else run(fig, 11000, frame);
    },

    loupe(fig) {
      const { svg, defs, id } = base(fig, 'Animated illustration: the precision loupe magnifies pixels while a region is selected, with live coordinates and a size badge');
      const sel = selection(svg, id, defs);
      const b = badge(svg, id);
      const R = 170, Z = 4;
      const clip = el('clipPath', { id: id + 'l' }, defs);
      const lc = el('circle', { r: R }, clip);
      const loupe = el('g', { filter: `url(#${id}s)` }, svg);
      const lens = el('g', { 'clip-path': `url(#${id}l)` }, loupe);
      el('rect', { x: -R, y: -R, width: 2 * R, height: 2 * R, fill: '#fff' }, lens);
      const mag = el('image', { href: IMG, width: W, height: H, style: 'image-rendering:pixelated' }, lens);
      const pat = el('pattern', { id: id + 'g', width: Z * 2, height: Z * 2, patternUnits: 'userSpaceOnUse' }, defs);
      el('path', { d: `M ${Z * 2} 0 L 0 0 0 ${Z * 2}`, fill: 'none', stroke: 'rgba(0,0,0,.12)', 'stroke-width': 1 }, pat);
      const grid = el('rect', { fill: `url(#${id}g)` }, lens);
      const cross = el('g', {}, lens);
      el('path', { d: `M -${R} 0 H -10 M 10 0 H ${R} M 0 -${R} V -10 M 0 10 V ${R}`, stroke: '#0a84ff', 'stroke-width': 3 }, cross);
      el('rect', { x: -Z, y: -Z, width: Z * 2, height: Z * 2, fill: 'none', stroke: '#0a84ff', 'stroke-width': 3 }, cross);
      const ring = el('circle', { r: R, fill: 'none', stroke: '#fff', 'stroke-width': 8 }, loupe);
      el('circle', { r: R + 4, fill: 'none', stroke: 'rgba(0,0,0,.25)', 'stroke-width': 1.5 }, loupe);
      const read = badge(svg, id);
      const cur = el('g', {}, svg);
      el('path', { d: 'M -36 0 H 36 M 0 -36 V 36', stroke: '#fff', 'stroke-width': 7 }, cur);
      el('path', { d: 'M -34 0 H 34 M 0 -34 V 34', stroke: '#111', 'stroke-width': 3 }, cur);

      const [bx0, by0, bx1, by1] = T.box;
      const A = [bx0 - 4, by0 - 4], B = [bx1 + 4, by1 + 4];
      const start = [700, 300];
      const frame = t => {
        let x, y, dragging = false;
        if (t < 1800) { const m = seg(t, 300, 1700); x = lerp(start[0], A[0], m); y = lerp(start[1], A[1], m); }
        else if (t < 2600) { x = A[0]; y = A[1]; }
        else if (t < 4600) { const m = seg(t, 2600, 4400); x = lerp(A[0], B[0], m); y = lerp(A[1], B[1], m); dragging = true; }
        else { x = B[0]; y = B[1]; dragging = t < 6200; }
        const fade = 1 - seg(t, 6600, 7200);
        sel.set(A[0], A[1], dragging || t >= 4600 ? x : A[0], dragging || t >= 4600 ? y : A[1], (t < 300 ? t / 300 : 1) * fade);
        cur.setAttribute('transform', `translate(${x} ${y})`);
        cur.style.opacity = fade;
        // Loupe sits below-right of the cursor, flipping to stay on canvas.
        const lx = x + (x > W - 480 ? -260 : 260), ly = y + (y > H - 420 ? -250 : 250);
        loupe.setAttribute('transform', `translate(${lx} ${ly})`);
        mag.setAttribute('transform', `scale(${Z}) translate(${-x} ${-y})`);
        grid.setAttribute('x', -R - ((x * Z) % (Z * 2))); grid.setAttribute('y', -R - ((y * Z) % (Z * 2)));
        grid.setAttribute('width', 2 * R + Z * 4); grid.setAttribute('height', 2 * R + Z * 4);
        loupe.style.opacity = fade;
        read.set(lx - 150, ly + R + 22, `x ${Math.round(x / 2)}  y ${Math.round(y / 2)}`);
        read.g.style.opacity = fade;
        const w = Math.round(Math.abs(x - A[0]) / 2), h = Math.round(Math.abs(y - A[1]) / 2);
        b.set(Math.min(x, W - 300) - 270, A[1] - 76, `${w} × ${h}`);
        b.g.style.opacity = (dragging || (t >= 4600 && t < 6200)) && w > 4 ? fade : 0;
      };
      if (reduce) frame(3600); else run(fig, 7600, frame);
    },

    // On-device analysis. Text boxes and outputs are what SnapDog's built-in
    // mode (Apple Vision: VNRecognizeTextRequest + VNClassifyImageRequest)
    // returns for this sample page; long outputs are truncated with "…".
    analyze(fig) {
      const { svg, defs, id } = base(fig, 'Animated illustration: on-device analysis finds the text on a sample page, then shows the extracted text, a description, and a suggested filename, all computed on the Mac without a network connection');
      const BOXES = [[101,93,625,50],[98,253,147,40],[98,336,205,42],[98,416,104,40],[529,256,155,42],[544,336,345,45],[529,418,353,53],
        [145,577,331,60],[1318,593,353,30],[115,772,69,29],[1045,772,53,32],[1588,766,139,40],[119,863,201,40],[1045,865,21,29],[1609,857,115,43],
        [119,956,204,41],[1045,959,21,29],[1606,952,118,45],[117,1050,284,39],[1048,1055,13,24],[1609,1046,115,47]];
      const SANS = '-apple-system,BlinkMacSystemFont,system-ui,sans-serif', MONO = 'ui-monospace,"SF Mono",Menlo,monospace';
      const boxes = BOXES.map(([x, y, w, h]) => el('rect', { x: x - 8, y: y - 6, width: w + 16, height: h + 12, rx: 10,
        fill: 'rgba(10,132,255,.14)', stroke: '#0a84ff', 'stroke-width': 3 }, svg));
      const scan = el('g', {}, svg);
      const grad = el('linearGradient', { id: id + 'g', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: 0, 'stop-color': '#0a84ff', 'stop-opacity': 0 }, grad);
      el('stop', { offset: 1, 'stop-color': '#0a84ff', 'stop-opacity': .28 }, grad);
      el('rect', { x: 0, y: -120, width: W, height: 120, fill: `url(#${id}g)` }, scan);
      el('rect', { x: 0, y: -4, width: W, height: 5, fill: '#0a84ff' }, scan);
      const dim = el('rect', { width: W, height: H, fill: 'rgba(8,14,26,.5)' }, svg);

      const card = el('g', { filter: `url(#${id}s)` }, svg);
      el('rect', { x: 170, y: 70, width: 1500, height: 1084, rx: 40, fill: '#fff' }, card);
      const text = (x, y, size, attrs = {}) => el('text', { x, y, 'font-size': size, 'font-family': SANS, fill: '#111827', ...attrs }, card);
      text(240, 168, 54, { 'font-weight': 750 }).textContent = 'On-device analysis';
      el('rect', { x: 1150, y: 118, width: 450, height: 66, rx: 33, fill: '#e3f6ee' }, card);
      el('circle', { cx: 1192, cy: 151, r: 11, fill: '#18a172' }, card);
      text(1218, 163, 33, { fill: '#087650', 'font-weight': 650 }).textContent = 'Offline · Apple Vision';
      el('rect', { x: 240, y: 212, width: 1360, height: 3, fill: '#e5e7eb' }, card);
      const chip = (y, label) => text(240, y, 30, { fill: '#18a172', 'font-weight': 800, 'letter-spacing': 3 }).textContent = label;
      chip(278, 'EXTRACT TEXT');
      chip(632, 'DESCRIBE');
      chip(902, 'SUGGEST FILENAME');
      // Each section: [first line y, line height, font, lines]
      const SECTIONS = [
        [344, 56, { 'font-family': MONO, 'font-size': 42 }, ['Order #4417 Acme Internal • Fulfilment', 'Customer', 'Account email', '… 18 more lines']],
        [696, 58, { 'font-size': 44 }, ['This 1840×1224 capture appears to contain', 'document, screenshot. Visible text includes', '“Order #4417 Acme Internal • Fulfilment …”']],
        [978, 0, { 'font-family': MONO, 'font-size': 48, 'font-weight': 650, fill: '#0b5cc8' }, ['order-4417-acme-internal-fulfilment']],
      ];
      el('rect', { x: 226, y: 924, width: 1388, height: 82, rx: 16, fill: '#eef4ff' }, card);
      const typed = SECTIONS.map(([y0, lh, attrs, lines]) => lines.map((line, i) => {
        const t = text(240, y0 + i * lh, attrs['font-size'], attrs);
        if (line.startsWith('…')) t.setAttribute('fill', '#6b7280');
        return { t, line };
      }));
      text(240, 1104, 32, { fill: '#6b7280' }).textContent = 'No account, API key, model download, or network connection.';

      const type = (rows, p) => {
        const total = rows.reduce((n, r) => n + r.line.length, 0);
        let left = Math.round(total * p);
        for (const r of rows) { r.t.textContent = r.line.slice(0, Math.max(0, left)); left -= r.line.length; }
      };
      const frame = t => {
        const fade = 1 - seg(t, 12000, 12700);
        const sy = lerp(-10, H + 130, seg(t, 300, 2700));
        scan.setAttribute('transform', `translate(0 ${sy})`);
        scan.style.opacity = t < 2800 ? 1 : 0;
        boxes.forEach((b, i) => {
          const cy = BOXES[i][1] + BOXES[i][3] / 2;
          b.style.opacity = (sy > cy ? 1 : 0) * (1 - seg(t, 3000, 3400)) * fade;
        });
        dim.style.opacity = seg(t, 2900, 3400) * fade;
        const pop = seg(t, 3300, 3750);
        card.style.opacity = pop * fade;
        card.setAttribute('transform', `translate(${W / 2} ${H / 2}) scale(${lerp(.94, 1, pop)}) translate(${-W / 2} ${-H / 2})`);
        type(typed[0], seg(t, 3800, 5600));
        type(typed[1], seg(t, 5800, 8200));
        type(typed[2], seg(t, 8400, 9500));
      };
      if (reduce) frame(11000); else run(fig, 13000, frame);
    },

    compare(fig) {
      const { svg, defs, id } = base(fig, 'Before and after: the same sample page, plain and annotated with an arrow, numbered steps, a highlight and a blurred email address');
      const clip = el('clipPath', { id: id + 'k' }, defs);
      const reveal = el('rect', { x: 0, y: 0, width: W / 2, height: H }, clip);
      const holder = el('g', { 'clip-path': `url(#${id}k)` }, svg);
      const a = annotations(holder, defs, id);
      setAnn(a, { arrow: 1, hi: 1, s1: 1, s2: 1, blur: 1 });
      const line = el('g', {}, svg);
      el('rect', { x: -3, y: 0, width: 6, height: H, fill: '#fff' }, line);
      el('circle', { cy: H / 2, r: 40, fill: '#fff', filter: `url(#${id}s)` }, line);
      el('path', { d: `M -12 ${H / 2 - 14} l -14 14 l 14 14 M 12 ${H / 2 - 14} l 14 14 l -14 14`, fill: 'none', stroke: '#111', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, line);
      const tag = (txt, x, anchor) => {
        const t = el('text', { x, y: 1150, 'text-anchor': anchor, fill: '#fff', 'font-size': 40, 'font-weight': 750, 'letter-spacing': 2, stroke: 'rgba(17,24,39,.85)', 'stroke-width': 10, 'paint-order': 'stroke',
          'font-family': '-apple-system,BlinkMacSystemFont,system-ui,sans-serif' }, svg);
        t.textContent = txt;
      };
      tag('MARKED UP', 70, 'start'); tag('ORIGINAL', W - 70, 'end');
      const range = document.createElement('input');
      Object.assign(range, { type: 'range', min: 0, max: 100, value: 55, className: 'sd-range' });
      range.setAttribute('aria-label', 'Compare original and marked-up capture');
      fig.appendChild(range);
      const set = v => { const x = W * v / 100; reveal.setAttribute('width', x); line.setAttribute('transform', `translate(${x} 0)`); };
      range.addEventListener('input', () => set(+range.value));
      set(55);
      // One gentle sweep the first time it scrolls into view, so it reads as interactive.
      if (!reduce) {
        const io = new IntersectionObserver(([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          let s = 0;
          const f = now => {
            s ||= now;
            const p = (now - s) / 1800;
            const v = 55 + Math.sin(p * Math.PI * 2) * 30 * (1 - p);
            if (p < 1 && document.activeElement !== range) { set(v); range.value = v; requestAnimationFrame(f); }
          };
          requestAnimationFrame(f);
        }, { threshold: .5 });
        io.observe(fig);
      }
    },
  };

  document.querySelectorAll('.sd-demo[data-demo]').forEach(fig => DEMOS[fig.dataset.demo]?.(fig));

  // Recorded clips: honour Reduce Motion, and only play while on screen.
  document.querySelectorAll('.clip video').forEach(v => {
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); v.controls = true; return; }
    new IntersectionObserver(([e]) => { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: .2 }).observe(v);
  });
})();
