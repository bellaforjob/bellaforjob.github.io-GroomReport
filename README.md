# GroomReport

宠物美容效果报告（React + Vite）：表单、照片与 PDF/PNG 导出。

## GitHub Pages（避免白屏）

线上必须是 **`npm run build` 出来的 `dist/`**。根目录的 `index.html` 是给 `npm run dev` 用的，里面有 `/src/main.jsx`，**绝不能**作为 Pages 站点根目录发布。

### 不要用网页「Upload files」代替 git push

在 GitHub 网页里上传文件夹 **不会** 触发 `.github/workflows/` 里的构建，也 **不会** 把 Pages 从「main 根目录」切走。你必须用 **Git、GitHub Desktop 或 Cursor 的 Source Control** 把整个仓库（含 `.github/workflows/`）**push 到 `main`**。

---

### 推荐：从 `gh-pages` 分支发布

1. **Settings** → **Actions** → **General** → **Workflow permissions** → **Read and write permissions** → Save。  
   （否则无法自动创建/更新 `gh-pages` 分支。）

2. **Settings** → **Pages** → **Build and deployment** → **Source** → **Deploy from a branch**。  
   - **Branch**：**`gh-pages`**（第一次需等第 4 步 workflow 跑完才有该分支；没有就先做第 4 步再回来选）。  
   - **Folder**：**`/ (root)`**  
   - **不要**选 **main / (root)**（那是源码，会白屏）。  
   - Save。

3. 在本机：

   ```bash
   cd /path/to/GroomReport
   git add -A
   git commit -m "chore: pages deploy via gh-pages"
   git push origin main
   ```

4. **Actions** → **Deploy GitHub Pages** → 等运行 **全部绿色**。成功后会出现 **`gh-pages`** 分支（内容 = 构建后的 `dist`）。

5. 若第 2 步时还没有 `gh-pages`，再回到 **Settings → Pages** 选 **gh-pages / (root)**。

6. 打开站点 → **查看网页源代码**：应看到 `src="/你的完整仓库名/assets/index-xxxxx.js"`，**不能**是 `/src/main.jsx`。

---

### 备选：Pages 用「GitHub Actions」

1. **Settings** → **Pages** → **Source** → **GitHub Actions**。  
2. **Actions** → **Deploy static content to Pages** → **Run workflow**（本文件 **不会**在每次 push 自动跑，避免和上面 `gh-pages` 双发）。  
3. 若提示 **environment** 待批准，在 Actions 里 **Approve**。

---

### 本地构建与校验

```bash
npm ci
npm run build
npm run verify:pages-dist
```

模拟项目页：

```bash
VITE_BASE_PATH=<你的GitHub仓库名> npm run build
VITE_BASE_PATH=<你的GitHub仓库名> npm run verify:pages-dist
```

## 开发

```bash
npm install
npm run dev
```

## 技术栈

- [Vite](https://vite.dev/)
- [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
