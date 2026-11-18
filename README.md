# Portfolio Studio · 作品集及可发布管理后台

在原个人作品集模板基础上增加后台，**首页风格保持不变**。

## 文件入口

- `index.html`：公开作品集，访客可查看项目、点击图片放大。
- `admin.html`：管理后台，可新增 / 编辑 / 删除 / 排序项目，上传封面及详情图片、修改首页内容、保存草稿及发布。
- `data/site.json`：已经发布的项目与首页资料；公开网页自动读取它。
- `assets/uploads/`：后台上传的图片会写在这里。
- `content.js`：原网站默认内容，作为读取 JSON 失败时的后备数据；正常使用不必再编辑它。

## 第一次部署（GitHub Pages）

1. 在 GitHub 创建一个**公开**仓库，例如 `portfolio`。如果已经有网站仓库，建议先备份，并上传新版文件**覆盖旧模板**，保留已有作品图片。
2. 解压 ZIP，把 `index.html`、`admin.html`、`admin.js`、`admin.css`、`script.js`、`site-loader.js`、`content.js`、`data/` 和 `assets/` 上传到仓库的**根目录**（不要多套一层文件夹）。
3. GitHub 仓库 → **Settings → Pages** → Build and deployment → **Deploy from a branch** → `main` / `(root)` → Save。
4. 网站地址通常为 `https://你的用户名.github.io/portfolio/`，后台为 `https://你的用户名.github.io/portfolio/admin.html`。
5. 站点未部署到公网前，也可双击 `index.html` 查看模板；后台的远程发布功能请在 HTTPS 网址使用。

## 如何登录后台

GitHub Pages 只有静态文件，不能像传统网站一样安全处理用户密码。因此，本项目采用 GitHub 官方 API 的**Fine-grained Personal Access Token** 进行授权，而不是自己做一个不安全的假密码登录框。

1. 进入 GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**，创建一个新令牌。
2. Resource owner 选择你自己的 GitHub 账号；Repository access 选择 **Only select repositories** 并勾选作品集仓库。
3. Repository permissions 里，将 **Contents** 设为 **Read and write**；其他权限保持最小必要权限。设置合适的过期日期。
4. 打开后台 `admin.html` → **发布与设置**，填入 GitHub 用户名、仓库名称、分支 `main` 和令牌。点击 **验证连接**。
5. **令牌不要放入 HTML、JSON、GitHub 仓库，也不要发送给任何人。** 它只存放在浏览器当前标签页会话中，可点「断开连接」清除；建议只在自己的电脑管理网站。

这属于**GitHub Token 授权**，不是 GitHub OAuth 一键登录。账号密码不会经过这个网页。

## 编辑和发布

1. 后台打开「项目管理」→ 选中项目或新建。
2. 填写项目名称、分类、年份、标签、背景、职责、行动及结果。
3. 选择本地图片作为封面或详情图；单图上限 5MB，支持 JPG、PNG、WebP、GIF。原始比例保持不变。
4. 点击「保存本次编辑」；「保存草稿」可将**文字**保存在这台浏览器。
5. 切到「发布与设置」，点击「发布所有修改」。后台会逐张上传新图片，再更新 `data/site.json`。
6. 等待 GitHub Pages 重新部署后，在公开网站检查结果。发布未完成前不要关闭页面。

**重要：** 草稿的本地图片不会跨页面刷新保留；刷新前请发布，或下次重新选择图片。已经发布的图片会永久保存在仓库。删除项目只删除公开展示记录，不会自动删除仓库里的旧图片。

## 其他建议

- 发布前检查图片是否含个人隐私、客户数据、未授权内部资料。
- 多人或多设备同时编辑同一份 `site.json` 可能互相覆盖：发布前可以使用后台「从仓库重新加载」获取最新版本。
- 图片路径及站点公开数据放在 GitHub 公共仓库，**任何人都可以查看**。不要上传机密文件。
- 目前是**单管理员、GitHub API 发布方案**，没有独立后端服务器、第三方数据库或多用户角色系统。
- 如需一键 GitHub OAuth 登录、多人协作和审批流，需额外部署可信的授权服务及后端。
