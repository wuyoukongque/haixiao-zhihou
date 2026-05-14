/* =========================================================
   App · 主路由 + Tweaks
   ========================================================= */

function App() {
  // ---- Tweaks（可被 Tweaks 面板覆盖） ----
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "hue": 45,
    "paperTone": 0.96,
    "bodySize": 18,
    "bodyLeading": 1.85,
    "bodyFamily": "serif",
    "pageAnim": "fade",
    "showPlayer": true,
    "theme": "day",
    "device": "mobile"
  }/*EDITMODE-END*/;

  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // ---- 应用状态 ----
  // route: 'cover' | 'toc' | 'reader'
  const [route, setRoute] = React.useState('cover');
  const [chapterId, setChapterId] = React.useState('c1');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [podcastOpen, setPodcastOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // 播放状态（跨视图共享）
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const dur = window.BOOK.podcast.duration;
  const [time, setTime] = usePlaybackClock(playing, speed, dur);

  // 阅读样式（由 Settings 面板控制）
  const [settings, setSettings] = React.useState({
    size: t.bodySize,
    leading: t.bodyLeading,
    family: t.bodyFamily,
    theme: t.theme,
  });
  // tweaks → settings 同步
  React.useEffect(()=>{
    setSettings({
      size: t.bodySize, leading: t.bodyLeading,
      family: t.bodyFamily, theme: t.theme
    });
  }, [t.bodySize, t.bodyLeading, t.bodyFamily, t.theme]);

  // 同步 CSS 变量到 :root
  React.useEffect(()=>{
    const r = document.documentElement;
    r.style.setProperty('--hue', t.hue);
    r.style.setProperty('--paper-tone', t.paperTone);
    r.setAttribute('data-theme', settings.theme);
  }, [t.hue, t.paperTone, settings.theme]);

  // 字体映射（iOS 楷体真名是 "Kaiti SC"；其他系统按可用性回退）
  const families = {
    serif: "'Source Han Serif SC','Songti SC','Noto Serif SC',Georgia,serif",
    kai:   "'Kaiti SC','STKaiti','KaiTi','楷体-简','楷体','PingFang SC',serif",
    sans:  "'PingFang SC','Hiragino Sans GB','Inter',system-ui,sans-serif"
  };

  // ---- 路由处理 ----
  const openBook = () => { setRoute('reader'); };
  const openToc = () => setRoute('toc');
  const selectChapter = (id) => { setChapterId(id); setPageIndex(0); setRoute('reader'); };
  const onPageChange = (cid, idx) => { setChapterId(cid); setPageIndex(idx); window.scrollTo(0,0); };

  // 设备外观
  const isMobile = t.device === 'mobile';

  const inner = (
    <div style={{
      width:'100%', height:'100%', overflow:'auto', position:'relative',
      background:'var(--paper)',
    }} className="scroll-soft">
      {route === 'cover' && (
        <Cover onOpenBook={openBook} onOpenToc={openToc} hue={t.hue}/>
      )}
      {route === 'toc' && (
        <TOC onSelect={selectChapter} onClose={()=>setRoute(route==='toc' ? 'cover' : 'reader')} currentId={chapterId}/>
      )}
      {route === 'reader' && (
        <Reader
          chapterId={chapterId}
          pageIndex={pageIndex}
          onPageChange={onPageChange}
          onOpenToc={openToc}
          onBack={()=>setRoute('cover')}
          onOpenSettings={()=>setSettingsOpen(true)}
          onOpenPodcast={()=>setPodcastOpen(true)}
          playerVisible={t.showPlayer}
          anim={t.pageAnim}
          bodySize={settings.size + 'px'}
          bodyLeading={settings.leading}
          bodyFamily={families[settings.family]}
          theme={settings.theme}
        />
      )}

      {/* 全屏播客模式（可从任何页面打开） */}
      {podcastOpen && (
        <PodcastView
          playing={playing} setPlaying={setPlaying}
          t={time} setT={setTime}
          speed={speed} setSpeed={setSpeed}
          onClose={()=>setPodcastOpen(false)}
        />
      )}

      {/* 设置面板 */}
      <Settings
        open={settingsOpen} onClose={()=>setSettingsOpen(false)}
        settings={settings} setSettings={setSettings}
      />
    </div>
  );

  // ---- 全屏渲染 ----
  return (
    <div style={{
      height:'100dvh', width:'100%',
      background:'var(--paper)',
      position:'relative',
      overflow:'hidden'
    }}>
      {inner}

      {/* Tweaks */}
      <TweaksPanel title="Tweaks · 海啸 UI">
        <TweakSection label="设备">
          <TweakRadio label="设备" value={t.device}
            options={[{value:'mobile',label:'手机'},{value:'desktop',label:'桌面'}]}
            onChange={v=>setTweak('device', v)}/>
        </TweakSection>

        <TweakSection label="主题与色彩">
          <TweakRadio label="主题" value={t.theme}
            options={[{value:'day',label:'日间'},{value:'paper',label:'纸张'},{value:'night',label:'夜间'}]}
            onChange={v=>setTweak('theme', v)}/>
          <TweakSelect label="主色相" value={String(t.hue)}
            options={[
              {value:'45', label:'落日橙（默认）'},
              {value:'30', label:'砖红'},
              {value:'60', label:'暖琥珀'},
              {value:'20', label:'深红'},
              {value:'80', label:'金黄'},
            ]}
            onChange={v=>setTweak('hue', +v)}/>
          <TweakSlider label="纸张深浅" min={88} max={98} step={1} unit="%"
            value={Math.round(t.paperTone*100)} onChange={v=>setTweak('paperTone', v/100)}/>
        </TweakSection>

        <TweakSection label="排版">
          <TweakSlider label="正文字号" min={14} max={26} step={1} unit="px"
            value={t.bodySize} onChange={v=>setTweak('bodySize', v)}/>
          <TweakSlider label="行距 ×100" min={140} max={240} step={5}
            value={Math.round(t.bodyLeading*100)} onChange={v=>setTweak('bodyLeading', v/100)}/>
          <TweakSelect label="字体" value={t.bodyFamily}
            options={[{value:'serif',label:'宋体 · 衬线'},{value:'kai',label:'楷体'},{value:'sans',label:'无衬线'}]}
            onChange={v=>setTweak('bodyFamily', v)}/>
        </TweakSection>

        <TweakSection label="交互">
          <TweakSelect label="翻页动画" value={t.pageAnim}
            options={[{value:'fade',label:'渐隐淡入'},{value:'slide',label:'滑动'},{value:'curl',label:'仿真曲线'},{value:'none',label:'直接切换'}]}
            onChange={v=>setTweak('pageAnim', v)}/>
          <TweakToggle label="显示播放器" value={t.showPlayer}
            onChange={v=>setTweak('showPlayer', v)}/>
        </TweakSection>

        <TweakSection label="跳转">
          <TweakButton label="封面" onClick={()=>setRoute('cover')}/>
          <TweakButton label="目录" onClick={()=>setRoute('toc')}/>
          <TweakButton label="正文" onClick={()=>setRoute('reader')}/>
          <TweakButton label={podcastOpen?'关闭全屏播放器':'打开全屏播放器'} onClick={()=>setPodcastOpen(o=>!o)}/>
          <TweakButton label="打开设置面板" onClick={()=>setSettingsOpen(true)}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

window.App = App;
