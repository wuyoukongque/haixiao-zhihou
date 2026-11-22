/* Shared settings; per-book bookmarks. */
function App() {
  const B=window.BOOK;
  const first=B.toc[0].chapters[0].id;
  const storageKey='mindsleap-book:'+B.id;
  const parseRoute=()=>{
    const bookmark=getSaved(storageKey,{chapterId:first,pageIndex:0});
    const hash=decodeURIComponent(location.hash.slice(1));
    if(hash==='toc') return {route:'toc',chapterId:bookmark.chapterId,pageIndex:bookmark.pageIndex};
    if(hash==='read') return {route:'reader',chapterId:first,pageIndex:0};
    const [id,page]=hash.split('/page-');
    if(B.chapterPages[id]) return {route:'reader',chapterId:id,pageIndex:Math.max(0,(Number(page)||1)-1)};
    return {route:'cover',chapterId:B.chapterPages[bookmark.chapterId]?bookmark.chapterId:first,pageIndex:bookmark.pageIndex||0};
  };
  const [state,setState]=React.useState(parseRoute);
  const [settingsOpen,setSettingsOpen]=React.useState(false);
  const [settings,setSettings]=React.useState(()=>getSaved('mindsleap-reader-settings',{size:18,leading:1.85,family:'serif',theme:'day'}));
  React.useEffect(()=>{
    const onHash=()=>setState(parseRoute());
    window.addEventListener('hashchange',onHash);
    window.addEventListener('popstate',onHash);
    return ()=>{window.removeEventListener('hashchange',onHash);window.removeEventListener('popstate',onHash);};
  },[]);
  React.useEffect(()=>{
    document.documentElement.setAttribute('data-theme',settings.theme);
    saveLocal('mindsleap-reader-settings',settings);
  },[settings]);
  const navigate=(route,chapterId=state.chapterId,pageIndex=0)=>{
    setState({route,chapterId,pageIndex});
    const hash=route==='reader'?'#'+chapterId+'/page-'+(pageIndex==='end'?1:pageIndex+1):route==='toc'?'#toc':'';
    history.pushState(null,'',bookLink(B.id,hash));
  };
  const recordPage=(chapterId,pageIndex)=>{
    saveLocal(storageKey,{chapterId,pageIndex});
    history.replaceState(null,'',bookLink(B.id,'#'+chapterId+'/page-'+(pageIndex+1)));
  };
  const families={serif:"'Source Han Serif SC','Songti SC','Noto Serif SC',Georgia,serif",kai:"'Kaiti SC','STKaiti','KaiTi','PingFang SC',serif",sans:"'PingFang SC','Hiragino Sans GB','Inter',system-ui,sans-serif"};
  return <div style={{height:'100dvh',width:'100%',position:'relative',overflow:'hidden',background:'var(--paper)'}}>
    <div className="scroll-soft" style={{width:'100%',height:'100%',overflow:'auto',position:'relative'}}>
      {state.route==='cover' && <Cover onOpenBook={()=>{
        const saved=getSaved(storageKey,null);
        navigate('reader',saved&&B.chapterPages[saved.chapterId]?saved.chapterId:first,saved?.pageIndex||0);
      }} onOpenToc={()=>navigate('toc')} />}
      {state.route==='toc' && <TOC onSelect={id=>navigate('reader',id)} onClose={()=>navigate('cover')} currentId={state.chapterId}/>}
      {state.route==='reader' && <Reader chapterId={state.chapterId} pageIndex={state.pageIndex}
        onPageChange={(id,page)=>navigate('reader',id,page)} onVisiblePage={recordPage}
        onOpenToc={()=>navigate('toc')} onBack={()=>navigate('cover')}
        onOpenSettings={()=>setSettingsOpen(true)} anim="fade"
        bodySize={settings.size+'px'} bodyLeading={settings.leading} bodyFamily={families[settings.family]} theme={settings.theme} />}
      <Settings open={settingsOpen} onClose={()=>setSettingsOpen(false)} settings={settings} setSettings={setSettings}/>
    </div>
  </div>;
}
window.App=App;
