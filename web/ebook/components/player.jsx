/* =========================================================
   播放器：迷你 bar + 全屏播客模式
   ========================================================= */

function fmtTime(s) {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60), r = s % 60;
  return `${m}:${String(r).padStart(2,'0')}`;
}

// ---- 模拟播放循环 ----
function usePlaybackClock(playing, speed, durationSec) {
  const [t, setT] = React.useState(28);
  React.useEffect(()=>{
    if (!playing) return;
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now;
      setT(prev => {
        const nx = prev + dt * speed;
        if (nx >= durationSec) return durationSec;
        return nx;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  }, [playing, speed, durationSec]);
  return [t, setT];
}

// ---- 简易波形（视觉用，不是真音频） ----
function Waveform({ progress = 0, bars = 56, accent = true, height = 32 }) {
  const seed = useMemo(()=>Array.from({length: bars}, (_, i) => 0.25 + (Math.sin(i*1.3) + Math.sin(i*0.42)) * 0.32 + Math.sin(i*2.7)*0.18), [bars]);
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 2, height, width:'100%'
    }}>
      {seed.map((v, i) => {
        const played = (i / bars) <= progress;
        const h = Math.max(3, Math.abs(v) * height);
        return <span key={i} style={{
          flex: 1,
          height: h,
          background: played ? 'var(--accent)' : 'var(--hairline-2)',
          borderRadius: 4,
          opacity: played ? 1 : 0.5
        }}/>;
      })}
    </div>
  );
}

// ---- 迷你 bar ----
function MiniPlayer({ playing, setPlaying, t, setT, onExpand, onHide }) {
  const B = window.BOOK;
  const dur = B.podcast.duration;
  const progress = t / dur;
  return (
    <div style={{
      position:'fixed', left: 12, right: 12, bottom: 12, zIndex: 30,
      maxWidth: 720, margin:'0 auto',
      background:'var(--paper-2)',
      border:'1px solid var(--hairline)',
      borderRadius: 'var(--r-lg)',
      boxShadow:'var(--shadow-pop)',
      padding: '12px 14px',
      display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 14, alignItems:'center'
    }}>
      {/* 缩略图 */}
      <button onClick={onExpand} style={{
        width: 50, height: 50, borderRadius: 12, overflow:'hidden',
        border:'none', position:'relative', cursor:'pointer', padding: 0
      }}>
        <CoverArt/>
        <div style={{
          position:'absolute', inset: 0, background:'rgba(0,0,0,0.25)',
          display:'grid', placeItems:'center', color:'oklch(0.98 0.02 80)'
        }}>
          <Icons.Headphone size={16}/>
        </div>
      </button>

      {/* 标题 + 进度 */}
      <div onClick={onExpand} style={{ cursor:'pointer', minWidth: 0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap: 10 }}>
          <div style={{
            fontFamily:'var(--font-serif)', fontSize: 14.5, fontWeight: 600,
            color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
          }}>{B.podcast.title}</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--ink-3)', whiteSpace:'nowrap' }}>
            {fmtTime(t)} / {fmtTime(dur)}
          </div>
        </div>
        <div style={{ marginTop: 6, height: 3, borderRadius: 4, background:'var(--paper-3)', overflow:'hidden' }}>
          <div style={{ width: `${progress*100}%`, height: '100%', background:'var(--accent)', transition:'width 100ms linear' }}/>
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color:'var(--ink-3)', letterSpacing:'0.08em' }}>
          {B.podcast.narrator}
        </div>
      </div>

      {/* 控件 */}
      <div style={{ display:'flex', alignItems:'center', gap: 4 }}>
        <button onClick={()=>setT(Math.max(0, t-15))} style={iconBtn} aria-label="回退 15 秒"><Icons.Back15 size={20}/></button>
        <button onClick={()=>setPlaying(!playing)} style={{
          ...iconBtn, width: 44, height: 44, background:'var(--accent)', color:'oklch(0.99 0.01 80)',
          boxShadow:'0 6px 16px oklch(0.68 0.14 var(--hue) / 0.30)'
        }} aria-label="播放/暂停">
          {playing ? <Icons.Pause size={18}/> : <Icons.Play size={18}/>}
        </button>
        <button onClick={onHide} style={iconBtn} aria-label="关闭"><Icons.Close size={16}/></button>
      </div>
    </div>
  );
}

// ---- 全屏播客模式 ----
function PodcastView({ playing, setPlaying, t, setT, onClose, speed, setSpeed }) {
  const B = window.BOOK;
  const dur = B.podcast.duration;
  const tr = B.podcast.transcript;
  const activeIdx = useMemo(()=>{
    let idx = 0;
    for (let i=0; i<tr.length; i++) {
      if (tr[i].t <= t) idx = i; else break;
    }
    return idx;
  }, [t, tr]);

  // 自动滚动字幕
  const scrollerRef = useRef(null);
  useEffect(()=>{
    const el = scrollerRef.current;
    if (!el) return;
    const active = el.querySelector('[data-active="1"]');
    if (active) {
      const cRect = el.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();
      const dy = (aRect.top - cRect.top) - (cRect.height/2 - aRect.height/2);
      el.scrollBy({ top: dy, behavior: 'smooth' });
    }
  }, [activeIdx]);

  const progress = t / dur;

  return (
    <div className="page-fade" style={{
      position:'fixed', inset: 0, zIndex: 40,
      background: `radial-gradient(120% 80% at 50% 0%, oklch(0.40 0.06 var(--hue)) 0%, oklch(0.18 0.02 60) 70%)`,
      color: 'oklch(0.96 0.02 80)',
      display:'flex', flexDirection:'column', overflow: 'hidden'
    }}>
      {/* 顶栏 */}
      <header style={{
        display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center',
        padding: '18px 22px',
      }}>
        <button onClick={onClose} style={{ ...iconBtn, color:'inherit' }} aria-label="收起">
          <Icons.Collapse size={18}/>
        </button>
        <div style={{ textAlign:'center', lineHeight:1.2 }}>
          <div style={{ fontSize: 11, letterSpacing:'0.32em', opacity: 0.7 }}>正在朗读</div>
          <div style={{ fontFamily:'var(--font-serif)', fontSize: 16, marginTop: 4 }}>{B.title} · 第一章</div>
        </div>
        <button style={{ ...iconBtn, color:'inherit' }} aria-label="更多"><Icons.Settings size={18}/></button>
      </header>

      {/* 唱片 + 波形 */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr', justifyItems:'center',
        padding: '8px 24px 4px'
      }}>
        <div style={{
          position:'relative', width: 220, height: 220, borderRadius: '50%',
          overflow:'hidden', boxShadow:'0 30px 60px rgba(0,0,0,0.4)',
          animation: playing ? 'spin 18s linear infinite' : 'none'
        }}>
          <CoverArt/>
          <div style={{
            position:'absolute', inset: 0, background:'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.0) 25%, rgba(0,0,0,0.55) 100%)'
          }}/>
          <div style={{
            position:'absolute', top:'50%', left:'50%', width: 36, height: 36,
            background:'oklch(0.96 0.02 80)', borderRadius:'50%',
            transform:'translate(-50%,-50%)', border:'3px solid oklch(0.20 0.02 60)'
          }}/>
        </div>

        <div style={{ marginTop: 22, fontFamily:'var(--font-serif)', fontSize: 22, fontWeight: 600, whiteSpace:'nowrap' }}>
          {B.podcast.title}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7, letterSpacing:'0.14em', whiteSpace:'nowrap' }}>
          {B.podcast.narrator}
        </div>
      </div>

      {/* 字幕区 */}
      <div ref={scrollerRef} className="scroll-soft" style={{
        flex:1, minHeight: 0,
        overflowY:'auto',
        padding: '24px 28px 20px',
        margin: '8px 0 0',
        maskImage: 'linear-gradient(180deg, transparent 0, black 12%, black 88%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(180deg, transparent 0, black 12%, black 88%, transparent 100%)',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display:'flex', flexDirection:'column', gap: 16 }}>
          {tr.map((line, i) => {
            const active = i === activeIdx;
            const past = i < activeIdx;
            return (
              <div key={i} data-active={active ? 1 : 0}
                onClick={()=>setT(line.t)}
                style={{
                  fontFamily:'var(--font-serif)',
                  fontSize: active ? 26 : 20,
                  lineHeight: 1.5,
                  color: active ? 'oklch(0.98 0.02 80)' : past ? 'oklch(0.75 0.02 80 / 0.55)' : 'oklch(0.85 0.02 80 / 0.40)',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 280ms ease',
                  cursor:'pointer',
                  letterSpacing: '0.02em',
                  transform: active ? 'translateX(0)' : 'translateX(0)',
                }}>
                {line.text}
              </div>
            );
          })}
        </div>
      </div>

      {/* 进度条 + 控件 */}
      <div style={{ padding:'10px 28px 26px', background:'transparent' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Waveform progress={progress} bars={72} height={36}/>
          <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--font-mono)', fontSize: 11, opacity: 0.7, marginTop: 6 }}>
            <span>{fmtTime(t)}</span><span>-{fmtTime(dur - t)}</span>
          </div>

          <div style={{
            marginTop: 14,
            display:'grid', gridTemplateColumns:'40px 1fr auto 1fr 40px',
            alignItems:'center', gap: 12
          }}>
            <button style={{ ...iconBtn, color:'inherit', opacity: 0.7 }} onClick={()=>setSpeed(speed >= 2 ? 0.75 : speed+0.25)} aria-label="speed">
              <span style={{ fontSize: 11, fontFamily:'var(--font-mono)', letterSpacing:'0.04em' }}>{speed.toFixed(2)}×</span>
            </button>

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button onClick={()=>setT(Math.max(0, t-15))} style={{ ...iconBtn, color:'inherit', width: 44, height: 44 }}>
                <Icons.Back15 size={22}/>
              </button>
            </div>

            <button onClick={()=>setPlaying(!playing)} style={{
              width: 64, height: 64, borderRadius:'50%',
              background:'oklch(0.96 0.02 80)', color:'oklch(0.20 0.02 60)',
              border:'none', cursor:'pointer',
              display:'grid', placeItems:'center',
              boxShadow:'0 12px 30px rgba(0,0,0,0.35)'
            }}>
              {playing ? <Icons.Pause size={26}/> : <Icons.Play size={26}/>}
            </button>

            <div style={{ display:'flex' }}>
              <button onClick={()=>setT(Math.min(dur, t+15))} style={{ ...iconBtn, color:'inherit', width: 44, height: 44 }}>
                <Icons.Fwd15 size={22}/>
              </button>
            </div>

            <button style={{ ...iconBtn, color:'inherit', opacity: 0.7 }} aria-label="sleep">
              <Icons.Moon size={18}/>
            </button>
          </div>

          <div style={{ display:'flex', justifyContent:'center', gap: 28, marginTop: 18, opacity: 0.7, fontSize: 11, letterSpacing:'0.16em' }}>
            <span>跟读字幕</span>
            <span>·</span>
            <span>AI 朗读 · 嗓音「沉静男声」</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

window.usePlaybackClock = usePlaybackClock;
window.MiniPlayer = MiniPlayer;
window.PodcastView = PodcastView;
window.Waveform = Waveform;
