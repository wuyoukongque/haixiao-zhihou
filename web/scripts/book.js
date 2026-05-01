const chapters = window.BOOK_DATA || [];
const reader = document.querySelector("#reader");
const currentPart = document.querySelector("#currentPart");
const currentTitle = document.querySelector("#currentTitle");
const audioTitle = document.querySelector("#audioTitle");
const progressBar = document.querySelector("#progressBar");
const tocPanel = document.querySelector("#tocPanel");
const tocList = document.querySelector("#tocList");
const fontPanel = document.querySelector("#fontPanel");
const fontButtons = Array.from(document.querySelectorAll("[data-font-size]"));

let pages = [];
let pageIndex = 0;
let fontSize = localStorage.getItem("haixiao-font-size") || "medium";

const fontChunkLimits = {
  small: { plain: 170, heading: 210 },
  medium: { plain: 145, heading: 185 },
  large: { plain: 112, heading: 148 },
  xlarge: { plain: 88, heading: 118 },
};

const inlineIllustrations = {
  ch2: [
    {
      id: "luddite-loom",
      afterText: "历史把这批人称为\"卢德分子\"。今天，\"卢德主义\"成了\"反对技术进步\"的代名词，带着一丝嘲讽。",
      image: "assets/images/inline-luddite-loom.jpeg",
      alt: "诺丁汉郡纺织工人与织布机的历史场景插图",
    },
  ],
};

function makePage(className) {
  const section = document.createElement("section");
  section.className = `page ${className}`;
  return section;
}

function pageNumber(section, n) {
  const el = document.createElement("span");
  el.className = "page-number";
  el.textContent = String(n).padStart(2, "0");
  section.appendChild(el);
}

function appendInlineText(parent, text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**")) {
      const strong = document.createElement("strong");
      strong.textContent = part.slice(2, -2);
      parent.appendChild(strong);
    } else {
      parent.appendChild(document.createTextNode(part));
    }
  }
}

function textChunks(blocks) {
  const limits = fontChunkLimits[fontSize] || fontChunkLimits.medium;
  const chunks = [];
  let current = [];
  let count = 0;

  for (const block of blocks) {
    if (block.type === "h2") {
      if (current.length) chunks.push(current);
      current = [block];
      count = 42;
      continue;
    }
    const length = block.text.length;
    const limit = current.some((item) => item.type === "h2") ? limits.heading : limits.plain;
    if (current.length && count + length > limit) {
      chunks.push(current);
      current = [];
      count = 0;
    }
    current.push(block);
    count += length;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

function contentKey(block) {
  return `${block.type}:${block.text}`;
}

function imagePage(illustration, chapter) {
  const page = makePage("inline-art-page");
  page.dataset.chapter = chapter.id;
  page.dataset.part = chapter.part;
  page.dataset.title = chapter.title;
  page.dataset.page = illustration.id;
  page.innerHTML = `<img src="${illustration.image}" alt="${illustration.alt || ""}" />`;
  return page;
}

function renderChapter(chapter) {
  const titlePage = makePage("chapter-page");
  titlePage.dataset.chapter = chapter.id;
  titlePage.dataset.part = chapter.part;
  titlePage.dataset.title = chapter.title;
  titlePage.innerHTML = `
    <img class="chapter-art" src="${chapter.image}" alt="" />
    <div class="page-inner">
      <p class="eyebrow">${chapter.part}</p>
      <h2 class="chapter-title">${chapter.title.replace(/^.*?：/, "")}</h2>
      <p class="chapter-subtitle">${chapter.title}</p>
    </div>
  `;
  reader.appendChild(titlePage);

  const illustrations = inlineIllustrations[chapter.id] || [];
  const illustrationsByText = new Map(illustrations.map((item) => [item.afterText, item]));
  const usedIllustrations = new Set();
  const chunks = textChunks(chapter.blocks);
  chunks.forEach((chunk, i) => {
    const hasQuote = chunk.length === 1 && chunk[0].type === "quote";
    const page = makePage(hasQuote ? "quote-page" : "text-page");
    page.dataset.chapter = chapter.id;
    page.dataset.part = chapter.part;
    page.dataset.title = chapter.title;
    const inner = document.createElement("div");
    inner.className = "page-inner";
    for (const block of chunk) {
      if (block.type === "h2") {
        const h = document.createElement("h2");
        h.textContent = block.text;
        inner.appendChild(h);
      } else if (block.type === "quote") {
        const quote = document.createElement("blockquote");
        appendInlineText(quote, block.text);
        inner.appendChild(quote);
      } else {
        const p = document.createElement("p");
        appendInlineText(p, block.text);
        inner.appendChild(p);
      }
    }
    page.appendChild(inner);
    reader.appendChild(page);

    const illustration = chunk
      .map((block) => illustrationsByText.get(block.text))
      .find((item) => item && !usedIllustrations.has(item.id));
    if (illustration) {
      usedIllustrations.add(illustration.id);
      reader.appendChild(imagePage(illustration, chapter));
    }

    if (i === 2 && chapter.image) {
      const artPage = makePage("art-page");
      artPage.dataset.chapter = chapter.id;
      artPage.dataset.part = chapter.part;
      artPage.dataset.title = chapter.title;
      artPage.innerHTML = `<img src="${chapter.image}" alt="" />`;
      reader.appendChild(artPage);
    }
  });
}

function buildBook() {
  reader.querySelectorAll(".page:not(.page-cover)").forEach((page) => page.remove());
  reader.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("is-active", "turning-forward", "turning-back");
  });
  reader.querySelectorAll(".page-number").forEach((number) => number.remove());
  chapters.forEach(renderChapter);
  pages = Array.from(document.querySelectorAll(".page"));
  pages.forEach((page, index) => pageNumber(page, index + 1));
  buildToc();
  pageIndex = -1;
  showPage(0);
}

function buildToc() {
  tocList.innerHTML = "";
  chapters.forEach((chapter) => {
    const firstPage = pages.findIndex((page) => page.dataset.chapter === chapter.id);
    const link = document.createElement("a");
    link.href = "#";
    link.innerHTML = `<span>${chapter.part}</span><strong>${chapter.title}</strong>`;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      closeToc();
      showPage(firstPage);
    });
    tocList.appendChild(link);
  });
}

function showPage(nextIndex, direction = 1) {
  if (nextIndex < 0 || nextIndex >= pages.length || nextIndex === pageIndex && pages[pageIndex]?.classList.contains("is-active")) {
    return;
  }
  const oldPage = pages[pageIndex];
  const newPage = pages[nextIndex];
  if (oldPage && oldPage !== newPage) {
    const turnClass = direction > 0 ? "turning-forward" : "turning-back";
    oldPage.classList.remove("is-active", "is-entering", "turning-forward", "turning-back");
    oldPage.classList.add("is-leaving", turnClass);
    newPage.classList.remove("is-leaving", "turning-forward", "turning-back");
    newPage.classList.add("is-entering", turnClass);
    setTimeout(() => {
      oldPage.classList.remove("is-leaving", "turning-forward", "turning-back");
      newPage.classList.remove("is-entering", "turning-forward", "turning-back");
    }, 920);
  }
  newPage.classList.add("is-active");
  pageIndex = nextIndex;
  updateChrome();
}

function updateChrome() {
  const page = pages[pageIndex];
  const part = page?.dataset.part || "海啸之后";
  const title = page?.dataset.title || "封面";
  currentPart.textContent = part;
  currentTitle.textContent = title;
  audioTitle.textContent = title;
  progressBar.style.width = `${((pageIndex + 1) / pages.length) * 100}%`;
  localStorage.setItem("haixiao-page", String(pageIndex));
}

function nextPage() {
  showPage(Math.min(pages.length - 1, pageIndex + 1), 1);
}

function prevPage() {
  showPage(Math.max(0, pageIndex - 1), -1);
}

function openToc() {
  tocPanel.classList.add("is-open");
  tocPanel.setAttribute("aria-hidden", "false");
}

function closeToc() {
  tocPanel.classList.remove("is-open");
  tocPanel.setAttribute("aria-hidden", "true");
}

function openFontPanel() {
  fontPanel.classList.add("is-open");
  fontPanel.setAttribute("aria-hidden", "false");
}

function closeFontPanel() {
  fontPanel.classList.remove("is-open");
  fontPanel.setAttribute("aria-hidden", "true");
}

function updateFontButtons() {
  fontButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.fontSize === fontSize);
  });
}

function applyFontSize(size, rebuild = false) {
  const nextSize = fontChunkLimits[size] ? size : "medium";
  document.body.classList.remove("font-small", "font-large", "font-xlarge");
  if (nextSize !== "medium") document.body.classList.add(`font-${nextSize}`);
  fontSize = nextSize;
  localStorage.setItem("haixiao-font-size", fontSize);
  updateFontButtons();

  if (rebuild) {
    const current = pages[pageIndex];
    const chapterId = current?.dataset.chapter;
    const currentPageType = current?.dataset.page || "";
    buildBook();
    const nextIndex = pages.findIndex((page) => (
      page.dataset.chapter === chapterId && (!currentPageType || page.dataset.page === currentPageType)
    ));
    showPage(nextIndex >= 0 ? nextIndex : Math.min(pageIndex, pages.length - 1));
  }
}

document.querySelector("#nextButton").addEventListener("click", nextPage);
document.querySelector("#prevButton").addEventListener("click", prevPage);
document.querySelector("#tocButton").addEventListener("click", openToc);
document.querySelector("#closeToc").addEventListener("click", closeToc);
document.querySelector("#fontButton").addEventListener("click", openFontPanel);
document.querySelector("#closeFont").addEventListener("click", closeFontPanel);
document.querySelector("#themeButton").addEventListener("click", () => document.body.classList.toggle("night"));
document.querySelector("#playButton").addEventListener("click", () => {
  const button = document.querySelector("#playButton");
  button.textContent = button.textContent === "▶" ? "Ⅱ" : "▶";
});

fontButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyFontSize(button.dataset.fontSize, true);
    closeFontPanel();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " ") nextPage();
  if (event.key === "ArrowLeft") prevPage();
  if (event.key === "Escape") {
    closeToc();
    closeFontPanel();
  }
});

let touchStartX = 0;
reader.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });
reader.addEventListener("touchend", (event) => {
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) > 46) {
    delta < 0 ? nextPage() : prevPage();
  }
}, { passive: true });

applyFontSize(fontSize);
buildBook();
const saved = Number(localStorage.getItem("haixiao-page"));
if (Number.isFinite(saved) && saved > 0) showPage(Math.min(saved, pages.length - 1));
