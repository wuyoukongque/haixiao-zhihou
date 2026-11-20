# 双书在线阅读站

## 发布来源

- 仓库：`wuyoukongque/haixiao-zhihou`
- 正式域名：`https://book.mindsleap.ai`
- Vercel 静态目录：`web/ebook`；沿用已有项目，不新建项目、不改域名归属。
- 根地址显示两本书。`?book=haixiao-zhihou`、`?book=ai-native-enterprise` 分别打开书籍；`#toc` 打开目录，`#u1/page-1` 等锚点定位阅读位置。
- 旧站的静态资源路径不变，原 `海啸.html` 文件保留。

## 内容边界

《海啸之后》的 `components/data.js` 保持原样。
《成为AI原生企业》由 2026-11-17 V12 HTML（含 11-18 三篇结构）导入，标注“V12 · 在线试读版”，不宣称出版定稿。
十三章、序章、尾声及三篇导读共 18 个阅读单元。保留表格、图示与尾注。
不发布本地其他工作区中的有声书实验、客户文件、原始提案或内部审核记录。

## 阅读器

两本书共用 `Reader`、`TOC`、`Settings`。字体、行距和主题偏好共用，阅读位置以书籍 ID 隔离。
沿用原阅读器按窗口分页；长于一屏的完整段落/表格允许页内滚动，避免截断。
移除正式入口的开发 Tweaks 和仅模拟时间、尚无实际音源的播放器入口；其原开发文件未删除。
React 18.3.1 和 Babel 7.29.0 在站内托管，沿用原固定版本与 SRI 校验。
新书文字封面为在线阅读版临时封面，不代表正式出版封面。

## 更新和验证

```bash
# 需 Python beautifulsoup4。导入后核对生成 diff，不手改章节数据。
python3 scripts/import_ai_native_book.py /absolute/path/to/approved-v12.html
python3 -m http.server 5188 --bind 127.0.0.1 --directory web/ebook
# 测试依赖 Playwright。可用 PLAYWRIGHT_PATH 指向安装路径。
node scripts/test_library.cjs
```

发布前检查：两本书入口、全部阅读单元、字体/主题、刷新恢复、分书书签、图片、移动端和桌面横向溢出、旧书数据未变。
发布后检查正式域名，不以推送或 PR 合并代替上线核验。

## 视觉说明

优先延续现有书籍阅读器的纸张、字体、颜色和控件；书架使用完整“MindsLeap 心智悦动”文字标识，不引入未经批准的联合标志。新书绿色文字封面用于与旧书蓝色封面区分。
