# ChatGPT：个人对话过滤器
解决共享GPT对话混乱。在本机把“我的”对话标记并一键只显示：圆形悬浮按钮、横向工具条、点击外部关闭、Toast 不遮挡面板。**不改服务器数据，只影响本机显示**。

[![一键安装（Tampermonkey）](https://img.shields.io/badge/⚡%20一键安装-点击安装脚本（直链）-blue)](https://raw.githubusercontent.com/Muhe-nye/chatgpt-my-filter/main/ChatGPT-MyFilter.user.js) [![一键安装（Tampermonkey）](https://img.shields.io/badge/⚡%20一键安装-点击安装脚本（镜像）-blue)](https://cdn.jsdelivr.net/gh/Muhe-nye/chatgpt-my-filter@latest/ChatGPT-MyFilter.user.js)

> 若安装按钮无反应，请先安装浏览器扩展 **Tampermonkey**（或 Violentmonkey），再点击。

---

## ✨ 功能
- 【标记为我的 / 取消标记】对话本地打标，侧栏显示“我的”标签。
- 【只看我的】开关（彩色状态），一键隐藏非本人标记会话。
- 圆形悬浮按钮 → **横向工具条**在按钮上方展开，**点击外部关闭**。
- **Toast 提示**在面板上方出现和消失，不遮挡面板。
- 数据仅存在本机 `localStorage`，**不上传任何对话内容**。

## 🖼️ 预览
（建议放 2~3 张截图或动图 GIF：标记/只看我的/Toast/横向工具条）

## 🧩 安装
1. 安装浏览器扩展：  
   - Chrome/Edge：Tampermonkey  
   - 或 Firefox：Tampermonkey / Violentmonkey
2. 点击上面的 **“一键安装”** 按钮，确认安装。
3. 打开 ChatGPT（`chat.openai.com` 或 `chatgpt.com`），右下角出现圆形按钮即可使用。

## ⚙️ 兼容与权限
- 站点：`https://chat.openai.com/*`, `https://chatgpt.com/*`
- 权限：仅 `GM_addStyle`（注入样式），**不跨域，不读写外部接口**。

## 🔐 隐私
- 脚本只在本地运行，使用 `localStorage` 记录你手动标记的会话 ID。  
- **不会上传、分享或同步任何对话或标记数据**。

## 📝 更新日志
- **1.0.0**：首发（横向工具条、上方 Toast、彩色开关、点击外部关闭）

## 🧭 常见问题
- **只看我的没生效？**  
  请先展开左侧会话列表；首次安装后刷新页面；确认当前域名是 `chat.openai.com` 或 `chatgpt.com`。
- **别人新建的会话会自动标记吗？**  
  不会。该脚本只在本机生效，需要你打开该会话后点击“标记为我的”。

## 🧑‍💻 开发
- 代码位于 `ChatGPT-MyFilter.user.js`。  
- 提交改动时记得递增 `@version`；若用 jsDelivr 发布特定版本，更新 `@version` 与 `README` 中的按钮链接版本号。

## 📄 许可证
MIT
