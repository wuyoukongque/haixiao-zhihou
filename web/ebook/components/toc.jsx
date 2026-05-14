/* =========================================================
   目录页
   ========================================================= */
function TOC({ onSelect, onClose, currentId }) {
  const B = window.BOOK;
  const flatChapters = B.toc.flatMap(p => p.chapters);
  const totalChapters = flatChapters.length;
  const totalMinutes = (B.meta && B.meta.totalMinutes) || flatChapters.reduce((acc, ch) => {
    const m = (ch.est || '').match(/\d+/); return acc + (m ? +m[0] : 0);
  }, 0);
  const currentIdx = Math.max(0, flatChapters.findIndex(c => c.id === currentId));
  const progressPct = Math.round(((currentIdx + 1) / Math.max(1, totalChapters)) * 100);
  return (
    <div className="page-fade" style={{ minHeight:'100%', background:'var(--paper)' }}>
      <header style={tocHeader}>
        <button onClick={onClose} style={iconBtn} aria-label="返回">
          <Icons.Back size={18}/>
        </button>
          <div style={{ fontFamily:'var(--font-serif)', fontSize: 14, color:'var(--ink-3)', letterSpacing:'0.16em', whiteSpace:'nowrap' }}>目录</div>
        <button style={iconBtn} aria-label="搜索"><Icons.Search size={18}/></button>
      </header>

      <div style={{ padding: '8px 24px 120px', maxWidth: 720, margin: '0 auto' }}>
        {/* 书本卡 */}
        <div style={{
          display:'flex', gap: 16, alignItems:'center',
          padding: '20px 18px',
          background:'var(--paper-2)', borderRadius:'var(--r-md)',
          border: '1px solid var(--hairline)'
        }}>
          <div style={{ width: 56, height: 84, borderRadius: 6, overflow:'hidden', position:'relative', boxShadow:'var(--shadow-soft)' }}>
            <CoverArt/>
          </div>
          <div style={{ flex:1, minWidth: 0 }}>
            <div style={{ fontFamily:'var(--font-serif)', fontSize: 22, color:'var(--ink)' }}>{B.title}</div>
            <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2, letterSpacing: '0.18em' }}>{B.subtitle}</div>
            <div style={{ display:'flex', gap: 12, marginTop: 8, fontSize: 12, color:'var(--ink-3)', whiteSpace:'nowrap' }}>
              <span>{totalChapters} 章</span><span>·</span><span>~{totalMinutes} 分钟</span><span>·</span><span>已读 {progressPct}%</span>
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div style={{ marginTop: 14, height: 4, borderRadius: 4, background:'var(--paper-3)', overflow:'hidden' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background:'var(--accent)' }}/>
        </div>

        {/* 章节 */}
        {B.toc.map((part, i) => (
          <section key={i} style={{ marginTop: 36 }}>
            <h3 style={{
              fontFamily:'var(--font-serif)',
              fontSize: 13, letterSpacing:'0.32em',
              color:'var(--ink-3)', margin: '0 0 14px', fontWeight: 500
            }}>{part.part}</h3>
            <ul style={{ listStyle:'none', padding: 0, margin: 0, display:'flex', flexDirection:'column' }}>
              {part.chapters.map(ch => {
                const active = ch.id === currentId;
                return (
                  <li key={ch.id}>
                    <button onClick={()=>onSelect(ch.id)} style={{
                      width:'100%', textAlign:'left',
                      display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', gap: 16,
                      padding: '14px 4px',
                      background:'transparent', border: 'none',
                      borderTop:'1px solid var(--hairline)',
                      color: active ? 'var(--accent-ink)' : 'var(--ink)',
                      cursor:'pointer'
                    }}>
                      <span style={{
                        width: 28, fontFamily:'var(--font-mono)',
                        fontSize: 12, color: active ? 'var(--accent)' : 'var(--ink-3)',
                        letterSpacing: '0.04em'
                      }}>{ch.n}</span>
                      <span style={{
                        fontFamily:'var(--font-serif)', fontSize: 18.5,
                        fontWeight: active ? 600 : 500
                      }}>
                        {ch.title}
                        {active && <span style={{ marginLeft: 10, fontSize: 11, color:'var(--accent)', verticalAlign: 'middle' }}>● 正在阅读</span>}
                      </span>
                      <span style={{ fontSize: 12, color:'var(--ink-3)', fontFamily:'var(--font-mono)', whiteSpace:'nowrap' }}>{ch.est}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {/* 关于本书 */}
        {B.about && (
          <section style={{ marginTop: 48 }}>
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize: 13, letterSpacing:'0.32em', color:'var(--ink-3)', margin: '0 0 14px', fontWeight: 500 }}>关 于 本 书</h3>
            <p style={{ fontFamily:'var(--font-serif)', fontSize: 15, color:'var(--ink-2)', lineHeight: 1.85, margin: 0 }}>
              {B.about}
            </p>
            <p style={{ marginTop: 14, fontSize: 12, color:'var(--ink-3)', letterSpacing:'0.04em' }}>
              {B.author} · {B.authorMeta} · {B.publisher} {B.year}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

const tocHeader = {
  position: 'sticky', top: 0, zIndex: 10,
  display:'grid', gridTemplateColumns: '40px 1fr 40px', alignItems:'center',
  padding: '40px 20px 12px',
  background: 'color-mix(in oklab, var(--paper) 80%, transparent)',
  backdropFilter: 'blur(8px)',
  borderBottom: '1px solid var(--hairline)',
};

const iconBtn = {
  width: 36, height: 36, borderRadius: 999,
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  background:'transparent', border:'none', color:'var(--ink)'
};

window.TOC = TOC;
window.iconBtn = iconBtn;
