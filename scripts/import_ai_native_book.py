"""Import the approved V12 reading HTML without rewriting its chapter content."""
import hashlib
import json
from pathlib import Path
import shutil
import sys
from bs4 import BeautifulSoup

source = Path(sys.argv[1])
root = Path(__file__).resolve().parents[1]
target = root / 'web/ebook'
soup = BeautifulSoup(source.read_text(), 'html.parser')
book = dict(id='ai-native-enterprise', title='成为AI原生企业',
            subtitle='中国中小企业的 AI 转型实战', author='王林 Lincoln',
            authorMeta='MindsLeap 心智悦动创始人', publisher='MindsLeap 心智悦动',
            year='2026', edition='V12 · 在线试读版', cover=None,
            about='从选出值得做的 AI 项目，到重做人和 Agent 协作的组织，再到真实交付、反馈与持续进化。',
            toc=[], chapterPages={}, meta={'totalChapters': 13})
group = {'part': '序章', 'chapters': []}
book['toc'].append(group)
count = 0
for section in soup.select('main > section.chapter, main > section.book-part'):
    cid = section['id']
    is_part = 'book-part' in section.get('class', [])
    if is_part:
        label = section['data-label']
        title = section['data-title']
        group = {'part': label + ' · ' + title, 'chapters': []}
        book['toc'].append(group)
    else:
        label = section.select_one('.ch-label').get_text(strip=True)
        title = section.select_one('.ch-head h1').get_text(strip=True)
        if cid == 'u14':
            group = {'part': '尾声', 'chapters': []}
            book['toc'].append(group)
    body = []
    for el in section.find_all(recursive=False):
        if not getattr(el, 'name', None) or el.name == 'nav':
            continue
        if 'ch-head' in el.get('class', []):
            continue
        if is_part and (el.name == 'h2' or 'part-kicker' in el.get('class', [])):
            continue
        for img in el.select('img'):
            src = source.parent / img['src']
            dest = target / 'assets/ai-native' / src.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            img['src'] = 'assets/ai-native/' + src.name
        for a in el.select('a[href]'):
            if a['href'].startswith('http'):
                a['target'] = '_blank'
                a['rel'] = 'noopener noreferrer'
        body.append({'type': 'html', 'html': str(el), 'text': el.get_text()})
    words = sum(len(b['text']) for b in body)
    count += words
    group['chapters'].append(dict(id=cid, n='导读' if is_part else label.replace('第','').replace('章',''),
                                 label=label, title='篇章导读' if is_part else title,
                                 est=f'{max(1, round(words/350))} 分钟', words=words))
    book['chapterPages'][cid] = [dict(chapter=label, title=title, label=label, body=body)]
assert len(book['chapterPages']) == 18
book['meta']['totalMinutes'] = round(count / 350)
book['source'] = {'version': 'V12', 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()}
(target/'components/ai-native-data.js').write_text('window.AI_NATIVE_BOOK = ' + json.dumps(book, ensure_ascii=False, indent=2) + ';\n')
print(f'Imported 18 reading units, {count} characters; source SHA256 {book["source"]["sha256"]}')
