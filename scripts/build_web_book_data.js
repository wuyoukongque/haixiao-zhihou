const fs = require("fs");
const path = require("path");

const sourceDir = "/Users/lincoln/Claude-workspace/claw-business-school/content/book-ai-future";
const outPath = path.join(process.cwd(), "web/data/book.js");

const chapters = [
  { id: "prologue", file: "序章-我们还没看远.md", part: "序章", image: "assets/images/interior-prologue.jpeg" },
  { id: "act1", file: "第一幕-冲撞.md", part: "第一幕", image: "assets/images/interior-prologue.jpeg" },
  { id: "ch1", file: "第一章-两百年的幻觉.md", part: "第一章", image: "assets/images/interior-ch1.jpeg" },
  { id: "ch2", file: "第二章-两种速度的撕裂.md", part: "第二章", image: "assets/images/interior-prologue.jpeg" },
  { id: "ch3", file: "第三章-不为工作的教育.md", part: "第三章", image: "assets/images/interior-ch1.jpeg" },
  { id: "act2", file: "第二幕-富足.md", part: "第二幕", image: "assets/images/interior-act2.jpeg" },
  { id: "ch4", file: "第五章-人类第一次自由.md", part: "第四章", image: "assets/images/interior-act2.jpeg" },
  { id: "ch5", file: "第六章-身份的重塑.md", part: "第五章", image: "assets/images/interior-act2.jpeg" },
  { id: "ch6", file: "第七章-爱在AI之后.md", part: "第六章", image: "assets/images/interior-act2.jpeg" },
  { id: "ch7", file: "第八章-掌握一切的超级组织.md", part: "第七章", image: "assets/images/interior-ch1.jpeg" },
  { id: "ch8", file: "第九章-以一敌百的超级个体.md", part: "第八章", image: "assets/images/interior-ch1.jpeg" },
  { id: "act3", file: "第三幕-交接.md", part: "第三幕", image: "assets/images/interior-act3.jpeg" },
  { id: "ch9", file: "第十章-思考的退化.md", part: "第九章", image: "assets/images/interior-act3.jpeg" },
  { id: "ch10", file: "第十一章-溶解的边界.md", part: "第十章", image: "assets/images/interior-act3.jpeg" },
  { id: "ch11", file: "第十二章-认知复利.md", part: "第十一章", image: "assets/images/interior-act3.jpeg" },
  { id: "ch12", file: "第十三章-价值对齐.md", part: "第十二章", image: "assets/images/interior-act3.jpeg" },
  { id: "ch13", file: "第十四章-碳与硅.md", part: "第十三章", image: "assets/images/interior-act3.jpeg" },
  { id: "epilogue", file: "尾章-人类还没回答的那个问题.md", part: "尾章", image: "assets/images/interior-prologue.jpeg" },
];

function parseMarkdown(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let title = "";
  const blocks = [];
  let paragraph = [];

  function flushParagraph() {
    const text = paragraph.join("").trim();
    if (text) blocks.push({ type: "p", text });
    paragraph = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") {
      flushParagraph();
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      title = trimmed.slice(2).trim();
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      continue;
    }
    if (trimmed.startsWith(">")) {
      flushParagraph();
      blocks.push({ type: "quote", text: trimmed.replace(/^>\s?/, "") });
      continue;
    }
    paragraph.push(trimmed);
  }
  flushParagraph();
  return { title, blocks };
}

const data = chapters.map((chapter) => {
  const filePath = path.join(sourceDir, chapter.file);
  const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const parsed = parseMarkdown(raw);
  return {
    ...chapter,
    title: parsed.title || chapter.part,
    blocks: parsed.blocks,
  };
});

fs.writeFileSync(
  outPath,
  `window.BOOK_DATA = ${JSON.stringify(data, null, 2)};\n`,
  "utf8"
);
console.log(`Wrote ${outPath}`);
