const BOOKS = [
  {...window.BOOK, id:'haixiao-zhihou', edition:'在线阅读版', physicalCover:'assets/book-cover-preview.webp'},
  window.AI_NATIVE_BOOK
];
function bookLink(id, hash='') {
  return window.location.pathname + '?book=' + encodeURIComponent(id) + hash;
}
function getSaved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; }
}
function saveLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}
function BookImage({book}) {
  if(book.physicalCover) return <img src={book.physicalCover} alt={book.title} className="shelf-cover-image" loading="eager" fetchPriority="high"/>;
  return <div className="type-cover" role="img" aria-label={book.title+'：'+book.subtitle}>
    <span className="cover-imprint">MINDSLEAP 心智悦动</span>
    <span className="cover-book-title">成为<br/>AI原生<br/>企业</span>
    <span className="cover-book-subtitle">中国中小企业的<br/>AI 转型实战</span>
    <span className="cover-author">王林 Lincoln 著</span>
  </div>;
}
function Library() {
  return <div className="library">
    <header className="library-header"><a href={location.pathname}>MindsLeap 心智悦动</a><span>王林 Lincoln 的书架</span></header>
    <main className="library-main">
      <h1>从看见未来，到开始改变。</h1>
      <p className="library-intro">两本书，一次从时代变革走向企业实践的阅读。</p>
      <div className="bookshelf">{BOOKS.map((book,i)=>{
        const saved=getSaved('mindsleap-book:'+book.id,null);
        const valid=saved && book.chapterPages[saved.chapterId];
        return <article className="shelf-book" key={book.id}>
          <a className="shelf-art" href={bookLink(book.id)} aria-label={'打开'+book.title}><BookImage book={book}/></a>
          <div className="shelf-copy"><span className="shelf-number">0{i+1} / {book.edition}</span>
            <h2><a href={bookLink(book.id)}>{book.title}</a></h2><p className="shelf-subtitle">{book.subtitle}</p>
            <p className="shelf-description">{book.about}</p>
            <div className="shelf-actions"><a className="shelf-read" href={bookLink(book.id,valid?'#'+saved.chapterId+'/page-'+(saved.pageIndex+1):'#read')}>{valid?'继续阅读':'开始阅读'} <Icons.Chevron size={15}/></a>
              <a href={bookLink(book.id,'#toc')}>目录</a></div>
          </div>
        </article>;
      })}</div>
    </main>
    <footer className="library-footer"><span>王林 Lincoln 著</span><a href="https://www.mindsleap.ai">MindsLeap 心智悦动</a></footer>
  </div>;
}
function BookRouter() {
  const id=new URLSearchParams(location.search).get('book');
  const book=BOOKS.find(b=>b.id===id);
  if(!book) { document.title='MindsLeap 心智悦动 · Lincoln 的书架'; return <Library/>; }
  window.BOOK=book;
  document.title=book.title+' · MindsLeap 心智悦动';
  return <App key={book.id}/>;
}
