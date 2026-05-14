/* =========================================================
   正文阅读页 — 一屏一页，无滚动
   ========================================================= */
const { useEffect, useRef, useMemo } = React;

function Reader({
  chapterId, pageIndex, onPageChange,
  onOpenToc, onBack, onOpenSettings, onOpenPodcast,
  playerVisible, anim, bodySize, bodyLeading, bodyFamily, theme
}) {
  const B = window.BOOK;
  const pages = B.chapterPages[chapterId] || B.chapterPages.c1;
  const page = pages[Math.min(pageIndex, pages.length-1)];
  const totalPages = pages.length;

  const chapterIdx = B.toc.flatMap(p=>p.chapters).findIndex(c=>c.id===chapterId);
  const allChapters = B.toc.flatMap(p=>p.chapters);
  const ch = allChapters[chapterIdx];

  const prev = () => {
    if (pageIndex > 0) onPageChange(chapterId, pageIndex - 1);
    else if (chapterIdx > 0) {
      const prevCh = allChapters[chapterIdx-1];
      const prevPages = B.chapterPages[prevCh.id] || [];
      onPageChange(prevCh.id, Math.max(0, prevPages.length-1));
    }
  };
  const next = () => {
    if (pageIndex < totalPages-1) onPageChange(chapterId, pageIndex + 1);
    else if (chapterIdx < allChapters.length-1) {
      onPageChange(allChapters[chapterIdx+1].id, 0);
    }
  };

  // 键盘
  useEffect(()=>{
    const h = (e)=>{
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', h);
    return ()=>window.removeEventListener('keydown', h);
  });

  // 翻页动画
  const animClass = anim === 'slide' ? 'page-slide-r'
                  : anim === 'curl'  ? 'page-curl'
                  : anim === 'fade'  ? 'reader-fade'
                  : '';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background:'var(--paper)',
      display:'flex', flexDirection:'column', overflow:'hidden'
    }}>
      {/* 顶栏 */}
      <header style={readerHeader}>
        <button onClick={onBack} style={iconBtn} aria-label="返回">
          <Icons.Back size={18}/>
        </button>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1.15, minWidth: 0 }}>
          <div style={{
            fontFamily:'var(--font-serif)', fontSize: 13, color:'var(--ink-2)',
            letterSpacing:'0.04em', whiteSpace:'nowrap'
          }}>
            {B.title}<span style={{ color:'var(--ink-4)', margin:'0 6px' }}>·</span>{/^\d+$/.test(ch?.n||'') ? `第 ${ch.n} 章` : `${ch?.n||''}章`}
          </div>
          <div style={{ fontSize: 10.5, color:'var(--ink-3)', marginTop: 2, letterSpacing:'0.16em', fontFamily:'var(--font-mono)' }}>
            {pageIndex+1} / {totalPages}
          </div>
        </div>
        <div style={{ display:'flex', gap: 4, justifyContent:'flex-end' }}>
          {playerVisible && (
            <button style={iconBtn} onClick={onOpenPodcast} aria-label="播客">
              <span style={{ position:'relative', display:'inline-flex' }}>
                <Icons.Headphone size={18}/>
                <span style={{
                  position:'absolute', top:-2, right:-2,
                  width: 6, height: 6, borderRadius:'50%',
                  background:'var(--accent)',
                  boxShadow:'0 0 0 2px var(--paper)'
                }}/>
              </span>
            </button>
          )}
          <button style={iconBtn} onClick={onOpenSettings} aria-label="字号"><Icons.Aa size={18}/></button>
          <button style={iconBtn} onClick={onOpenToc} aria-label="目录"><Icons.Menu size={18}/></button>
        </div>
      </header>

      {/* 正文 — 翻页跨 section，section 内允许滚动 */}
      <main
        key={`${chapterId}-${pageIndex}-${anim}`}
        className={animClass + ' scroll-soft'}
        style={{
          flex: 1, minHeight: 0, overflowY:'auto', overflowX:'hidden',
          width:'100%',
          maxWidth: 680, margin:'0 auto',
          padding: '24px 28px 40px',
          fontFamily: bodyFamily || 'var(--font-serif)',
          fontSize: bodySize || 'var(--body-size)',
          lineHeight: bodyLeading || 'var(--body-leading)',
          color:'var(--ink)',
        }}>

        {/* 章节标题 — 仅每章第一页 */}
        {pageIndex === 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize: 11,
              color:'var(--accent)', letterSpacing:'0.32em'
            }}>CHAPTER {page.chapter}</div>
            <h1 style={{
              fontFamily:'var(--font-serif)',
              fontSize: 'clamp(22px, 5.5vw, 30px)',
              margin: '10px 0 0',
              fontWeight: 600, letterSpacing: '0.04em', color:'var(--ink)',
              lineHeight: 1.3
            }}>{page.title}</h1>
            <div style={{
              width: 28, height: 2, background:'var(--accent)',
              marginTop: 14, borderRadius: 2
            }}/>
          </div>
        )}

        {/* 引言 — 章首页用 */}
        {pageIndex === 0 && page.pull && (
          <p style={{
            fontFamily:'var(--font-serif)',
            fontSize: 'calc(1em + 2px)',
            color:'var(--accent-ink)',
            lineHeight: 1.55,
            fontStyle:'italic',
            margin:'0 0 20px',
            borderLeft: '2px solid var(--accent)',
            paddingLeft: 14,
          }}>"{page.pull}"</p>
        )}

        {/* 小节标题 — 非章首页 + 有 heading 时显示 */}
        {pageIndex > 0 && page.heading && (
          <h2 style={{
            fontFamily:'var(--font-serif)', fontSize: 'calc(1em + 4px)',
            fontWeight: 600, color:'var(--ink)',
            margin:'4px 0 18px', letterSpacing:'0.02em',
            display:'flex', alignItems:'center', gap: 12
          }}>
            <span style={{
              width: 14, height: 2, background:'var(--accent)', borderRadius: 2,
              flex:'0 0 auto'
            }}/>
            {page.heading}
          </h2>
        )}

        {page.body.map((b,i)=>{
          if (b.type === 'quote') {
            return (
              <blockquote key={i} style={{
                margin:'14px 0 18px', padding:'2px 0 2px 14px',
                borderLeft:'2px solid var(--accent-soft)',
                color:'var(--ink-2)', fontStyle:'italic',
                fontFamily:'var(--font-serif)',
              }}>{b.text}</blockquote>
            );
          }
          return (
            <p key={i} style={{
              margin: '0 0 1em',
              textIndent: (i===0 && (pageIndex===0 || page.heading)) ? 0 : '2em',
              textAlign: 'justify',
              textWrap: 'pretty',
            }}>{b.text}</p>
          );
        })}
      </main>

      {/* 翻页区域 — 不可见，仅左右两侧轻触 */}
      <button aria-label="上一页" onClick={prev} style={{...edgeTap, left: 0}}/>
      <button aria-label="下一页" onClick={next} style={{...edgeTap, right: 0}}/>

      {/* 底栏：上一页 · 页码 · 下一页（薄薄一条，不占空间，融入纸张） */}
      <footer style={{
        flex:'0 0 auto',
        display:'flex', justifyContent:'center', alignItems:'center', gap: 8,
        padding: '6px 0 calc(env(safe-area-inset-bottom) + 10px)',
        color:'var(--ink-3)'
      }}>
        <button onClick={prev} style={pillNav} aria-label="上一页"><Icons.Back size={14}/></button>
        <span style={{ fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--ink-3)', minWidth: 70, textAlign:'center' }}>
          {String(pageIndex+1).padStart(2,'0')} / {String(totalPages).padStart(2,'0')}
        </span>
        <button onClick={next} style={pillNav} aria-label="下一页"><Icons.Chevron size={14}/></button>
      </footer>

    </div>
  );
}

// ── 浮动播客按钮内容（图 + 小播放角标 + 跳动声波） ──
function PodcastFabContent() {
  return (
    <>
      <img src={window.BOOK.cover} alt="" style={{
        position:'absolute', inset: 0, width:'100%', height:'100%',
        objectFit:'cover', borderRadius:'50%'
      }}/>
      <span style={{
        position:'absolute', inset: 0, borderRadius:'50%',
        background:'rgba(0,0,0,0.35)'
      }}/>
      {/* 圆环 */}
      <span style={{
        position:'absolute', inset: -4, borderRadius:'50%',
        border:'1.5px solid oklch(0.68 0.14 var(--hue) / 0.55)',
        animation:'pulse 2.2s ease-out infinite'
      }}/>
      {/* 播放图标 */}
      <span style={{
        position:'absolute', inset: 0, display:'grid', placeItems:'center',
        color:'oklch(0.99 0.01 80)'
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
  flex:'0 0 auto',
  display:'grid', gridTemplateColumns:'40px 1fr 120px', alignItems:'center',
  padding:'calc(env(safe-area-inset-top) + 14px) 18px 12px',
  background: 'color-mix(in oklab, var(--paper) 82%, transparent)',
  backdropFilter:'blur(10px) saturate(1.05)',
  borderBottom: '1px solid var(--hairline)',
};

const edgeTap = {
  position:'absolute',
  top: 70, bottom: 60,
  width: 56,
  background:'transparent', border:'none', cursor:'pointer'
};

const pillNav = {
  width: 30, height: 30, borderRadius:'50%',
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  background:'transparent', color:'var(--ink-3)', border:'none', cursor:'pointer'
};

const fabPodcast = {
  position:'absolute',
  right: 18, bottom: 60,
  width: 56, height: 56, borderRadius:'50%',
  border:'none', padding: 0, cursor:'pointer',
  boxShadow: '0 10px 26px rgba(40,20,10,0.30), 0 0 0 4px var(--paper)',
  background:'transparent',
  overflow:'visible'
};

window.Reader = Reader;
window.PodcastFabContent = PodcastFabContent;
