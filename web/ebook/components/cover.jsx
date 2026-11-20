/* =========================================================
   封面页 — 实体书展示
   上：3D 实体书（封面图作为书面）
   下：开始阅读 按钮
   ========================================================= */

function CoverArt({ src }) {
  // 给 TOC / 迷你播放器复用的小缩略图
  return (
    window.BOOK.id === 'ai-native-enterprise' ? <div style={{position:'absolute',inset:0,overflow:'hidden'}}><div style={{transform:'scale(.28)',transformOrigin:'top left'}}><BookImage book={window.BOOK}/></div></div> : <img src={src || 'assets/book-cover-preview.webp'}
         alt="书封"
         style={{
           position:'absolute', inset: 0, width:'100%', height:'100%',
           objectFit:'cover', objectPosition:'center'
         }}/>
  );
}

/* 实体书组件 —— 图片本身已含书形与厚度，只加投影 */
function PhysicalBook({ src }) {
  return (
    <div style={{
      display:'flex', justifyContent:'center', width:'100%',
    }}>
      <img src={src || 'assets/book-cover-cropped.png'}
           alt="海啸之后"
           style={{
             width:'min(72vw, 300px)',
             height:'auto',
             display:'block',
             filter:
               'drop-shadow(0 22px 32px rgba(40,20,10,0.22))' +
               ' drop-shadow(0 8px 14px rgba(40,20,10,0.14))',
           }}/>
    </div>
  );
}

function Cover({ onOpenBook, onOpenToc, hue }) {
  const B = window.BOOK;
  return (
    <div style={{
      position:'relative', minHeight:'100%', overflow:'hidden',
      background:'var(--paper)',
      color:'var(--ink)',
      display:'flex', flexDirection:'column',
    }}>
      {/* 顶部操作 */}
      <header style={{
        position:'relative', zIndex: 2,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'calc(env(safe-area-inset-top) + 16px) 18px 0'
      }}>
        <a href={location.pathname} className="book-home-link"><Icons.Back size={16}/>返回书架</a>
        <button onClick={onOpenToc} aria-label="目录" style={{
          width: 36, height: 36, borderRadius: 999,
          background:'transparent', border:'1px solid var(--hairline-2)',
          color:'var(--ink-2)',
          display:'inline-flex', alignItems:'center', justifyContent:'center'
        }}>
          <Icons.Menu size={16}/>
        </button>
      </header>

      {/* 小标贴 */}
      <div style={{
        position:'relative', zIndex: 2,
        textAlign:'center', marginTop: 22,
        fontSize: 11, letterSpacing:'0.22em', color:'var(--ink-3)'
      }}>
        {B.edition}
      </div>

      {/* 书 */}
      <div style={{
        position:'relative', zIndex: 2,
        flex: 1, display:'flex', alignItems:'center', justifyContent:'center',
        padding: '20px 24px 8px',
      }}>
        <BookImage book={B}/>
      </div>

      {/* 书名信息 */}
      <div style={{
        position:'relative', zIndex: 2,
        textAlign:'center', padding: '0 24px',
      }}>
        <div style={{
          fontFamily:'var(--font-serif)', fontSize: 22, letterSpacing:'0.08em',
          fontWeight: 600, color:'var(--ink)'
        }}>
          {B.title}
        </div>
        <div style={{
          marginTop: 6, fontSize: 12, color:'var(--ink-3)',
          letterSpacing:'0.02em'
        }}>
          {B.subtitle} · {B.author}
        </div>
      </div>

      {/* 主 CTA */}
      <div style={{
        position:'relative', zIndex: 2,
        padding:'18px 20px calc(env(safe-area-inset-bottom) + 22px)',
        display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10,
      }}>
        <button onClick={onOpenBook} style={primaryBtn}>
          <span style={{ display:'inline-flex', alignItems:'center', gap: 8 }}>
            开始阅读
            <span style={{ display:'inline-flex' }}><Icons.Chevron size={14}/></span>
          </span>
        </button>
        <button onClick={onOpenToc} style={ghostBtnLight}>查看目录</button>
      </div>
    </div>
  );
}

const primaryBtn = {
  background: 'var(--accent)',
  color: 'oklch(0.99 0.01 80)',
  border: 'none',
  borderRadius: 999,
  padding: '12px 18px',
  fontSize: 14, fontWeight: 600, letterSpacing: '0.06em',
  boxShadow: '0 6px 18px oklch(0.68 0.14 var(--hue) / 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
  display:'inline-flex', alignItems:'center', justifyContent:'center'
};
const ghostBtnLight = {
  background: 'transparent',
  color: 'var(--ink-2)',
  border: '1px solid var(--hairline-2)',
  borderRadius: 999,
  padding: '12px 18px',
  fontSize: 14,
  letterSpacing:'0.04em',
};

window.Cover = Cover;
window.CoverArt = CoverArt;
