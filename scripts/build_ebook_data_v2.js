// Build web/ebook/components/data.js from the V2 source markdown.
// Each "## section" in the source becomes one page in the reader.

const fs = require("fs");
const path = require("path");

const sourceDir =
  "/Users/lincoln/Claude-workspace/claw-business-school/content/book-ai-future-v2";
const outPath = path.join(
  __dirname,
  "..",
  "web",
  "ebook",
  "components",
  "data.js",
);

// id / file / part-label / chapter-number / display-title (for TOC)
const TOC_SPEC = [
  { part: "写在前面", chapters: [
    { id: "pre", file: "自序-未来已来.md", n: "前", title: "未来已来" },
  ]},
  { part: "序章 · 站上山顶", chapters: [
    { id: "p0", file: "序章-我们还没看远.md", n: "序", title: "我们还没看远" },
  ]},
  { part: "第一幕 · 冲撞", chapters: [
    { id: "c1", file: "第一章-两百年的幻觉.md",     n: "01", title: "两百年的幻觉" },
    { id: "c2", file: "第二章-两种速度的撕裂.md",   n: "02", title: "两种速度的撕裂" },
    { id: "c3", file: "第三章-不为工作的教育.md",   n: "03", title: "不为工作的教育" },
    { id: "c4", file: "第四章-当人不再是原子.md",   n: "04", title: "当人不再是原子" },
  ]},
  { part: "第二幕 · 自由", chapters: [
    { id: "c5", file: "第五章-第一次自由.md",       n: "05", title: "第一次自由" },
    { id: "c6", file: "第六章-爱与归属.md",         n: "06", title: "爱与归属" },
    { id: "c7", file: "第七章-活着的意义.md",       n: "07", title: "活着的意义" },
  ]},
  { part: "第三幕 · 交接", chapters: [
    { id: "c8",  file: "第八章-思考的退化.md",      n: "08", title: "思考的退化" },
    { id: "c9",  file: "第九章-溶解的边界.md",      n: "09", title: "溶解的边界" },
    { id: "c10", file: "第十章-认知复利.md",        n: "10", title: "认知复利" },
    { id: "c11", file: "第十一章-价值对齐.md",      n: "11", title: "价值对齐" },
    { id: "c12", file: "第十二章-碳与硅.md",        n: "12", title: "碳与硅" },
  ]},
  { part: "尾章 · 站在新土地上", chapters: [
    { id: "p13", file: "尾章-人类还没回答的那个问题.md", n: "尾", title: "人类还没回答的那个问题" },
  ]},
];

function stripInline(s) {
  // Markdown inline: keep text only.
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function parseChapter(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let title = "";
  const sections = []; // [{ heading, paragraphs:[{type, text}] }]
  let current = { heading: null, paragraphs: [] };
  let paraBuf = [];
  let inQuote = false;
  let quoteBuf = [];

  const flushPara = () => {
    if (paraBuf.length) {
      const text = stripInline(paraBuf.join("")).trim();
      if (text) current.paragraphs.push({ type: "p", text });
      paraBuf = [];
    }
  };
  const flushQuote = () => {
    if (quoteBuf.length) {
      const text = stripInline(quoteBuf.join(" ")).trim();
      if (text) current.paragraphs.push({ type: "quote", text });
      quoteBuf = [];
    }
    inQuote = false;
  };
  const flushSection = () => {
    flushPara();
    flushQuote();
    if (current.paragraphs.length) sections.push(current);
    current = { heading: null, paragraphs: [] };
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      flushPara();
      flushQuote();
      continue;
    }
    if (t === "---") {
      flushPara();
      flushQuote();
      continue;
    }
    if (t.startsWith("# ")) {
      flushPara();
      flushQuote();
      title = stripInline(t.slice(2)).trim();
      continue;
    }
    if (t.startsWith("## ")) {
      flushSection();
      current.heading = stripInline(t.slice(3)).trim();
      continue;
    }
    if (t.startsWith(">")) {
      flushPara();
      inQuote = true;
      quoteBuf.push(t.replace(/^>\s?/, ""));
      continue;
    }
    if (inQuote) flushQuote();
    paraBuf.push(t);
  }
  flushSection();

  return { title, sections };
}

// First sentence of first paragraph (Chinese 。 / 西文 .) — trim aggressively.
function pullFromSection(section) {
  const first = section.paragraphs.find((p) => p.type === "p");
  if (!first) return "";
  const text = first.text;
  const m = text.match(/^.+?[。！？!?]/);
  let s = (m ? m[0] : text).trim();
  // Strip trailing ending punctuation for cleaner pull quote.
  s = s.replace(/[。]$/, "");
  if (s.length > 60) s = s.slice(0, 56) + "…";
  return s;
}

function estimateMinutes(text) {
  // ~320 zh chars per minute
  return Math.max(1, Math.round(text.length / 320));
}

const toc = [];
const chapterPages = {};

for (const group of TOC_SPEC) {
  const groupChapters = [];
  for (const ch of group.chapters) {
    const p = path.join(sourceDir, ch.file);
    if (!fs.existsSync(p)) {
      console.warn("MISSING:", p);
      continue;
    }
    const raw = fs.readFileSync(p, "utf8");
    const parsed = parseChapter(raw);
    const fullText = parsed.sections
      .flatMap((s) => s.paragraphs.map((b) => b.text))
      .join("");
    const words = fullText.length;
    const est = `${estimateMinutes(fullText)} 分钟`;

    // Each section becomes a page.
    const pages = parsed.sections.map((section, i) => ({
      chapter: ch.n,
      title: parsed.title || ch.title,
      heading: section.heading || null,
      // Show pull quote only on the very first page of the chapter.
      pull: i === 0 ? pullFromSection(section) : "",
      body: section.paragraphs, // [{type:'p'|'quote', text}]
    }));

    chapterPages[ch.id] = pages;
    groupChapters.push({ id: ch.id, n: ch.n, title: ch.title, est, words });
  }
  toc.push({ part: group.part, chapters: groupChapters });
}

const totalWords = Object.values(chapterPages)
  .flat()
  .reduce(
    (acc, p) => acc + p.body.reduce((a, b) => a + b.text.length, 0),
    0,
  );
const totalMinutes = Math.round(totalWords / 320);

const BOOK = {
  title: "海啸之后",
  subtitle: "AI 之后，人类如何重新定义自己",
  author: "王 林",
  authorMeta: "MindsLeap 创始人 · Founders Space 中国 CEO",
  publisher: "MindsLeap",
  year: "2026",
  about:
    "Token 海啸冲刷的不是海岸线，而是工作与身份、教育、组织、家庭、活着的意义。这本书想带你爬上那座山，看远一点。",
  cover: "assets/cover-face.png",
  coverFull: "assets/cover.png",
  meta: {
    totalChapters: Object.keys(chapterPages).length,
    totalMinutes,
  },
  toc,
  chapterPages,
  podcast: {
    title: "海啸之后 · 序章",
    narrator: "AI 朗读 · 沉静男声",
    duration: 720,
    transcript: [
      { t: 0,   text: "2004 年，印度洋海啸发生的前几分钟，泰国普吉岛的海滩上发生了一件奇怪的事。" },
      { t: 9,   text: "海水突然退了。" },
      { t: 13,  text: "不是慢慢退，是快速地、大幅度地退。" },
      { t: 19,  text: "沙滩暴露出来，礁石裸露，搁浅的鱼在沙地上扑腾。" },
      { t: 27,  text: "很多游客没有离开。" },
      { t: 31,  text: "他们走向海边，弯腰去捡那些搁浅的鱼，拿出手机拍照。" },
      { t: 40,  text: "他们没有做错什么。他们只是没见过这种景象。" },
      { t: 49,  text: "几分钟后，海啸来了。" },
      { t: 56,  text: "我写这本书，不是要预言灾难，也不是要评判谁的对错。" },
      { t: 66,  text: "站在海滩上的人们，缺少的是一个视角——" },
      { t: 73,  text: "一个从更高处、更远处看海面的视角。" },
      { t: 81,  text: "这本书想做的事，就是带你爬上那座山。" },
      { t: 88,  text: "不是为了让你恐惧，而是为了让你看清楚。" },
    ],
  },
};

const banner =
  "/* AUTO-GENERATED by scripts/build_ebook_data_v2.js — do not edit by hand.\n" +
  "   Source: " + sourceDir + "\n*/\n";
fs.writeFileSync(
  outPath,
  banner + "window.BOOK = " + JSON.stringify(BOOK, null, 2) + ";\n",
  "utf8",
);

console.log(
  `wrote ${outPath} · ${toc.length} parts · ${
    Object.keys(chapterPages).length
  } chapters · ${totalWords.toLocaleString()} chars · ~${totalMinutes} min`,
);
