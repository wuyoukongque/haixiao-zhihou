/* =========================================================
   正文阅读页 — 按屏幕自动分页，每页正好填满一屏，不滚动
   ========================================================= */
const { useEffect, useRef, useMemo, useState, useLayoutEffect } = React;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 把"章节—section—段落"结构展平成线性渲染块序列
function flattenChapter(chapterPages) {
  const out = [];
  const first = chapterPages[0];
  out.push({ kind: 'chapter-head', chapter: first.chapter, title: first.title });
  if (first.pull) out.push({ kind: 'pull', text: first.pull });
  for (let i = 0; i < chapterPages.length; i++) {
    const sec = chapterPages[i];
    if (i > 0 && sec.heading) out.push({ kind: 'heading', text: sec.heading });
    for (const b of sec.body) {
      if (b.type === 'quote') out.push({ kind: 'quote', text: b.text });
      else out.push({ kind: 'p', text: b.text });
    }
  }
  return out;
}

// 紧跟 chapter-head / pull / heading 的段落不缩进
function computeIndents(blocks) {
  const indents = new Array(blocks.length).fill(false);
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.kind !== 'p' && b.kind !== 'quote') continue;
    const prev = blocks[i - 1];
    if (prev && prev.kind === 'p') indents[i] = true;
  }
  return indents;
}

function blockHTML(b, indent) {
  if (b.kind === 'chapter-head') {
    return `<div class="rb-chapter-head"><div class="rb-chapter-no">CHAPTER ${esc(b.chapter)}</div><h1>${esc(b.title)}</h1><div class="rb-accent"></div></div>`;
  }
  if (b.kind === 'pull')    return `<p class="rb-pull">&ldquo;${esc(b.text)}&rdquo;</p>`;
  if (b.kind === 'heading') return `<h2 class="rb-heading">${esc(b.text)}</h2>`;
  if (b.kind === 'quote')   return `<blockquote class="rb-quote">${esc(b.text)}</blockquote>`;
  return `<p class="rb-p${indent ? ' rb-p-indent' : ''}">${esc(b.text)}</p>`;
}

function BlockView({ b, indent }) {
  if (b.kind === 'chapter-head') {
    return (
      <div className="rb-chapter-head">
        <div className="rb-chapter-no">CHAPTER {b.chapter}</div>
        <h1>{b.title}</h1>
        <div className="rb-accent"/>
      </div>
    );
  }
  if (b.kind === 'pull')    return <p className="rb-pull">&ldquo;{b.text}&rdquo;</p>;
  if (b.kind === 'heading') return <h2 className="rb-heading">{b.text}</h2>;
  if (b.kind === 'quote')   return <blockquote className="rb-quote">{b.text}</blockquote>;
  return <p className={'rb-p' + (indent ? ' rb-p-indent' : '')}>{b.text}</p>;
}

// 在隐藏的测量 div 里量好每个块的高度，按容器可用高度切页
function paginate(main, blocks, indents) {
  const cs = getComputedStyle(main);
  const div = document.createElement('div');
  div.style.cssText = [
    'position:fixed', 'top:0', 'left:-9999px',
    'visibility:hidden', 'pointer-events:none',
    'box-sizing:border-box',
    `width:${main.clientWidth}px`,
    `padding-left:${cs.paddingLeft}`,
    `padding-right:${cs.paddingRight}`,
    'padding-top:0', 'padding-bottom:0',
    `font-family:${cs.fontFamily}`,
    `font-size:${cs.fontSize}`,
    `line-height:${cs.lineHeight}`,
    `color:${cs.color}`,
  ].join(';');
  div.innerHTML = blocks.map((b, i) => blockHTML(b, indents[i])).join('');
  document.body.appendChild(div);

  const children = Array.from(div.children);
  const totalContent = div.scrollHeight;
  const tops = children.map(el => el.offsetTop);
  const heights = tops.map((t, i) => (i + 1 < tops.length ? tops[i + 1] : totalContent) - t);

  document.body.removeChild(div);

  const padT = parseFloat(cs.paddingTop) || 0;
  const padB = parseFloat(cs.paddingBottom) || 0;
  const maxH = Math.max(80, main.clientHeight - padT - padB);

  const pages = [[]];
  let cur = 0;
  for (let i = 0; i < blocks.length; i++) {
    const h = heights[i] || 0;
    if (cur + h > maxH && pages[pages.length - 1].length > 0) {
      pages.push([]);
      cur = 0;
    }
    pages[pages.length - 1].push(i);
    cur += h;
  }
  return pages;
}

function Reader({
  chapterId, pageIndex, onPageChange,
  onOpenToc, onBack, onOpenSettings, onOpenPodcast,
  playerVisible, anim, bodySize, bodyLeading, bodyFamily, theme
}) {
  const B = window.BOOK;
  const sourcePages = B.chapterPages[chapterId] || B.chapterPages.c1;
  const allChapters = useMemo(() => B.toc.flatMap(p => p.chapters), []);
  const chapterIdx = allChapters.findIndex(c => c.id === chapterId);
  const ch = allChapters[chapterIdx];

  const blocks = useMemo(() => flattenChapter(sourcePages), [chapterId]);
  const indents = useMemo(() => computeIndents(blocks), [blocks]);

  // pages 绑上 chapterId，避免切章瞬间 stale-pages 访问新 blocks 越界
  const [pagesState, setPagesState] = useState({ chapterId: null, pages: null });
  const pages = pagesState.chapterId === chapterId ? pagesState.pages : null;
  const [pageIdx, setPageIdx] = useState(0);
  const [paginateNonce, bumpPaginate] = useState(0);
  const mainRef = useRef(null);

  // 章节 / 字号 / 字体 / 行距 / nonce 变化时重新分页
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main || main.clientHeight < 50) return;
    const newPages = paginate(main, blocks, indents);
    setPagesState({ chapterId, pages: newPages });
  }, [chapterId, bodySize, bodyLeading, bodyFamily, paginateNonce, blocks, indents]);

  // 章节切换 / 外部 pageIndex 变化 → 重置内部页码（'end' 表示末页）
  useEffect(() => {
    if (!pages) return;
    if (pageIndex === 'end') setPageIdx(pages.length - 1);
    else setPageIdx(Math.max(0, Math.min(pageIndex | 0, pages.length - 1)));
  }, [chapterId, pageIndex, pages]);

  // 字体加载完后重测一次（webfont 替换 fallback 后高度有微差）
  useEffect(() => {
    if (!document.fonts || !document.fonts.ready) return;
    let alive = true;
    document.fonts.ready.then(() => { if (alive) bumpPaginate(n => n + 1); });
    return () => { alive = false; };
  }, []);

  // 视口变化（旋转屏、桌面调整窗口、iOS 地址栏收起）
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    let lastW = main.clientWidth;
    let lastH = main.clientHeight;
    let timer;
    const ro = new ResizeObserver(() => {
      const m = mainRef.current;
      if (!m) return;
      const w = m.clientWidth;
      const h = m.clientHeight;
      if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) return;
      lastW = w; lastH = h;
      clearTimeout(timer);
      timer = setTimeout(() => bumpPaginate(n => n + 1), 140);
    });
    ro.observe(main);
    return () => { ro.disconnect(); clearTimeout(timer); };
  }, []);

  const totalPages = (pages && pages.length) || 1;
  const safePage = Math.max(0, Math.min(pageIdx, totalPages - 1));
  const currentIdxList = (pages && pages[safePage]) || [];

  const prev = () => {
    if (safePage > 0) setPageIdx(safePage - 1);
    else if (chapterIdx > 0) onPageChange(allChapters[chapterIdx - 1].id, 'end');
  };
  const next = () => {
    if (safePage < totalPages - 1) setPageIdx(safePage + 1);
    else if (chapterIdx < allChapters.length - 1) onPageChange(allChapters[chapterIdx + 1].id, 0);
  };

  // 键盘
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const animClass = anim === 'slide' ? 'page-slide-r'
                  : anim === 'curl'  ? 'page-curl'
                  : anim === 'fade'  ? 'reader-fade'
                  : '';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'var(--paper)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      {/* 顶栏 */}
      <header style={readerHeader}>
        <button onClick={onBack} style={iconBtn} aria-label="返回">
          <Icons.Back size={18}/>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.15, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--ink-2)',
            letterSpacing: '0.04em', whiteSpace: 'nowrap'
          }}>
            {B.title}<span style={{ color: 'var(--ink-4)', margin: '0 6px' }}>·</span>{/^\d+$/.test(ch?.n || '') ? `第 ${ch.n} 章` : `${ch?.n || ''}章`}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2, letterSpacing: '0.16em', fontFamily: 'var(--font-mono)' }}>
            {safePage + 1} / {totalPages}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {playerVisible && (
            <button style={iconBtn} onClick={onOpenPodcast} aria-label="播客">
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icons.Headphone size={18}/>
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 0 2px var(--paper)'
                }}/>
              </span>
            </button>
          )}
          <button style={iconBtn} onClick={onOpenSettings} aria-label="字号"><Icons.Aa size={18}/></button>
          <button style={iconBtn} onClick={onOpenToc} aria-label="目录"><Icons.Menu size={18}/></button>
        </div>
      </header>

      {/* 正文 — 不滚动；尺寸 / 字号变化时自动重排 */}
      <main
        ref={mainRef}
        key={`${chapterId}-${safePage}-${anim}`}
        className={animClass}
        style={{
          flex: 1, minHeight: 0, overflow: 'hidden',
          width: '100%',
          maxWidth: 680, margin: '0 auto',
          padding: '20px 26px 20px',
          fontFamily: bodyFamily || 'var(--font-serif)',
          fontSize: bodySize || 'var(--body-size)',
          lineHeight: bodyLeading || 'var(--body-leading)',
          color: 'var(--ink)',
        }}
      >
        {currentIdxList.map(i => (
          <BlockView key={i} b={blocks[i]} indent={indents[i]} />
        ))}
      </main>

      {/* 翻页触发区 — 不可见 */}
      <button aria-label="上一页" onClick={prev} style={{ ...edgeTap, left: 0 }}/>
      <button aria-label="下一页" onClick={next} style={{ ...edgeTap, right: 0 }}/>

      {/* 底栏 */}
      <footer style={{
        flex: '0 0 auto',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
        padding: '6px 0 calc(env(safe-area-inset-bottom) + 10px)',
        color: 'var(--ink-3)'
      }}>
        <button onClick={prev} style={pillNav} aria-label="上一页"><Icons.Back size={14}/></button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', minWidth: 70, textAlign: 'center' }}>
          {String(safePage + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
        </span>
        <button onClick={next} style={pillNav} aria-label="下一页"><Icons.Chevron size={14}/></button>
      </footer>
    </div>
  );
}

function PodcastFabContent() {
  return (
    <>
      <img src={window.BOOK.cover} alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', borderRadius: '50%'
      }}/>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'rgba(0,0,0,0.35)'
      }}/>
      <span style={{
        position: 'absolute', inset: -4, borderRadius: '50%',
        border: '1.5px solid oklch(0.68 0.14 var(--hue) / 0.55)',
        animation: 'pulse 2.2s ease-out infinite'
      }}/>
      <span style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        color: 'oklch(0.99 0.01 80)'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 5v14l12-7z"/>
        </svg>
      </span>
      <style>{`@keyframes pulse {
        0% { transform: scale(1); opacity: 0.9; }
        70% { transform: scale(1.25); opacity: 0; }
        100% { transform: scale(1.25); opacity: 0; }
      }`}</style>
    </>
  );
}

const readerHeader = {
  flex: '0 0 auto',
  display: 'grid', gridTemplateColumns: '40px 1fr 120px', alignItems: 'center',
  padding: 'calc(env(safe-area-inset-top) + 14px) 18px 12px',
  background: 'color-mix(in oklab, var(--paper) 82%, transparent)',
  backdropFilter: 'blur(10px) saturate(1.05)',
  borderBottom: '1px solid var(--hairline)',
};

const edgeTap = {
  position: 'absolute',
  top: 70, bottom: 60,
  width: 56,
  background: 'transparent', border: 'none', cursor: 'pointer'
};

const pillNav = {
  width: 30, height: 30, borderRadius: '50%',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', color: 'var(--ink-3)', border: 'none', cursor: 'pointer'
};

window.Reader = Reader;
window.PodcastFabContent = PodcastFabContent;
