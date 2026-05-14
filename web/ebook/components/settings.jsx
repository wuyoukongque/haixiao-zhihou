/* =========================================================
   设置面板（字号 / 字体 / 主题 / 行距）
   ========================================================= */

function Settings({ open, onClose, settings, setSettings }) {
  if (!open) return null;
  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const themes = [
    { id:'day',   label:'日间', icon: <Icons.Sun size={18}/>, sw:'oklch(0.965 0.012 80)' },
    { id:'paper', label:'纸张', icon: <Icons.Paper size={18}/>, sw:'oklch(0.93 0.025 78)' },
    { id:'night', label:'夜间', icon: <Icons.Moon size={18}/>, sw:'oklch(0.20 0.012 60)' },
  ];

  const families = [
    { id: 'serif', label: '宋体 · 衬线', sample: '海啸',
      v: "'Source Han Serif SC','Songti SC','Noto Serif SC',Georgia,serif" },
    { id: 'kai',   label: '楷体',        sample: '海啸',
      v: "'KaiTi','STKaiti','PingFang SC',serif" },
    { id: 'sans',  label: '无衬线',      sample: '海啸',
      v: "'PingFang SC','Hiragino Sans GB','Inter',system-ui,sans-serif" },
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex: 35, background:'rgba(20,15,10,0.18)'
      }}/>
      <div style={{
        position:'fixed', left: 12, right: 12, bottom: 'calc(env(safe-area-inset-bottom) + 12px)', zIndex: 36,
        maxWidth: 480, margin: '0 auto',
        background:'var(--paper)',
        border:'1px solid var(--hairline)',
        borderRadius:'var(--r-xl)',
        boxShadow:'var(--shadow-deep)',
        padding: '22px 22px 18px',
        animation:'rise 280ms cubic-bezier(.2,.6,.2,1) both'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14 }}>
          <div style={{ fontFamily:'var(--font-serif)', fontSize: 18, fontWeight: 600 }}>阅读样式</div>
          <button onClick={onClose} style={iconBtn} aria-label="关闭"><Icons.Close size={16}/></button>
        </div>

        {/* 字号 */}
        <SettingsRow label="字号" right={<span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ink-3)' }}>{settings.size}px</span>}>
          <div style={stepperWrap}>
            <button style={stepper} onClick={()=>set('size', Math.max(14, settings.size-1))}><Icons.Minus size={16}/></button>
            <div style={{ flex: 1, position:'relative', height: 28 }}>
              <input type="range" min="14" max="26" step="1" value={settings.size}
                     onChange={e=>set('size', +e.target.value)} style={range}/>
            </div>
            <button style={stepper} onClick={()=>set('size', Math.min(26, settings.size+1))}><Icons.Plus size={16}/></button>
          </div>
        </SettingsRow>

        {/* 行距 */}
        <SettingsRow label="行距" right={<span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ink-3)' }}>{settings.leading.toFixed(2)}</span>}>
          <div style={stepperWrap}>
            {[1.5, 1.7, 1.85, 2.05, 2.25].map(v=>(
              <button key={v} onClick={()=>set('leading', v)} style={{
                ...miniChip,
                background: Math.abs(settings.leading-v)<0.01 ? 'var(--accent-soft)' : 'var(--paper-2)',
                color: Math.abs(settings.leading-v)<0.01 ? 'var(--accent-ink)' : 'var(--ink-2)',
                borderColor: Math.abs(settings.leading-v)<0.01 ? 'var(--accent)' : 'var(--hairline)'
              }}>{v}</button>
            ))}
          </div>
        </SettingsRow>

        {/* 字体 */}
        <SettingsRow label="字体">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 8 }}>
            {families.map(f => {
              const active = settings.family === f.id;
              return (
                <button key={f.id} onClick={()=>set('family', f.id)} style={{
                  padding:'12px 8px', borderRadius:'var(--r-md)',
                  border: '1px solid ' + (active ? 'var(--accent)' : 'var(--hairline)'),
                  background: active ? 'var(--accent-soft)' : 'var(--paper-2)',
                  color: 'var(--ink)', cursor:'pointer'
                }}>
                  <div style={{ fontFamily: f.v, fontSize: 22 }}>{f.sample}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{f.label}</div>
                </button>
              );
            })}
          </div>
        </SettingsRow>

        {/* 主题 */}
        <SettingsRow label="主题">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 8 }}>
            {themes.map(t => {
              const active = settings.theme === t.id;
              return (
                <button key={t.id} onClick={()=>set('theme', t.id)} style={{
                  display:'flex', alignItems:'center', gap: 10,
                  padding:'12px 12px', borderRadius:'var(--r-md)',
                  border: '1px solid ' + (active ? 'var(--accent)' : 'var(--hairline)'),
                  background: active ? 'var(--accent-soft)' : 'var(--paper-2)',
                  color: 'var(--ink)', cursor:'pointer'
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius:'50%', background: t.sw,
                    border: '1px solid var(--hairline-2)'
                  }}/>
                  <span style={{ fontSize: 13 }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </SettingsRow>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 8, padding: '12px 4px 0', borderTop:'1px solid var(--hairline)' }}>
          <div style={{ fontSize: 12, color:'var(--ink-3)' }}>该样式将应用到当前书本</div>
          <button onClick={onClose} style={{
            background:'var(--accent)', color:'oklch(0.99 0.01 80)',
            border:'none', borderRadius:999, padding:'10px 18px', fontSize: 13, fontWeight: 600
          }}>完成</button>
        </div>
      </div>

      <style>{`@keyframes rise { from { opacity:0; transform: translateY(20px) scale(.98); } to { opacity:1; transform: none; } }`}</style>
    </>
  );
}

function SettingsRow({ label, right, children }) {
  return (
    <div style={{ padding:'14px 0', borderTop:'1px solid var(--hairline)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color:'var(--ink-3)', letterSpacing:'0.18em' }}>{label.toUpperCase()}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

const stepperWrap = { display:'flex', alignItems:'center', gap: 8 };
const stepper = {
  width: 36, height: 36, borderRadius:'50%',
  border:'1px solid var(--hairline)', background:'var(--paper-2)',
  color:'var(--ink)', display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
};
const miniChip = {
  flex: 1, padding:'8px 0', borderRadius: 10,
  border:'1px solid var(--hairline)', background:'var(--paper-2)',
  fontFamily:'var(--font-mono)', fontSize: 12, cursor:'pointer'
};
const range = {
  position:'absolute', inset:0, width:'100%', height:'100%',
  accentColor: 'oklch(0.68 0.14 var(--hue))', background:'transparent'
};

window.Settings = Settings;
