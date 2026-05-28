# 前端安全配置指南

> 本文档面向运维/非技术人员，详细说明如何在 Cloudflare 和 Vercel 上配置安全设置，防止类似 SteakhouseFi / Inferno Drainer 的前端劫持攻击。

---

## 目录

1. [背景：为什么需要这些设置](#背景为什么需要这些设置)
2. [代码层面已完成的防护](#代码层面已完成的防护)
3. [Cloudflare 安全设置（生产环境）](#cloudflare-安全设置生产环境)
4. [Vercel 安全设置（预览环境）](#vercel-安全设置预览环境)
5. [部署后验证](#部署后验证)
6. [日常安全检查清单](#日常安全检查清单)
7. [紧急响应流程](#紧急响应流程)

---

## 背景：为什么需要这些设置

DeFi 前端攻击通常是这样发生的：

1. 攻击者通过社工/供应链攻击获取托管平台（Vercel/Netlify）的部署权限
2. 注入恶意 JavaScript 脚本到前端页面
3. 恶意脚本伪造钱包交互，诱导用户签署 `approve` 授权或直接转账
4. 用户资产被盗

**CSP（Content Security Policy）安全头**是最有效的防御手段——它告诉浏览器"只允许从指定来源加载脚本"，即使攻击者注入了恶意代码，浏览器也会拒绝执行。

---

## 代码层面已完成的防护

以下防护已在代码中实现，部署后自动生效：

| 防护措施 | 说明 | 文件 |
|---------|------|------|
| CSP Meta 标签 | 构建时注入 HTML 的 CSP 策略 | `public/csp.json` + `vite/vite.plugins.ts` |
| CSP HTTP 头 | Cloudflare Function 动态设置 CSP HTTP 响应头 | `functions/utils/securityHeaders.ts` |
| X-Frame-Options: DENY | 禁止页面被嵌入 iframe（防止点击劫持） | `_headers` + Function |
| X-Content-Type-Options: nosniff | 禁止浏览器猜测 MIME 类型 | `_headers` + Function |
| Strict-Transport-Security (HSTS) | 强制 HTTPS 连接 | `_headers` + Function |
| Referrer-Policy | 控制 Referer 头信息泄露 | `_headers` + Function |
| Permissions-Policy | 禁用摄像头、麦克风、地理位置 API | `_headers` + Function |
| base-uri 'self' | 防止 `<base>` 标签注入攻击 | `csp.json` |
| frame-ancestors 'none' | HTTP 头级别禁止 iframe 嵌入 | `functions/utils/securityHeaders.ts` |
| form-action 'none' | 禁止表单提交到外部地址 | `csp.json` |

---

## Cloudflare 安全设置（生产环境）

### 1. 启用 HTTPS（必须）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择你的域名（如 `ring.exchange`）
3. 左侧菜单点击 **SSL/TLS** → **Overview**
4. 加密模式选择 **Full (strict)**
5. 点击 **保存**

### 2. 启用 "Always Use HTTPS"

1. 在 **SSL/TLS** → **Edge Certificates** 页面
2. 找到 **Always Use HTTPS**
3. 开关设为 **开启（On）**

### 3. 启用 HSTS

1. 在 **SSL/TLS** → **Edge Certificates** 页面
2. 找到 **HTTP Strict Transport Security (HSTS)**
3. 点击 **Enable HSTS**
4. 按以下设置：
   - **Max Age**: `12 months`（即 31536000 秒）
   - **Include subdomains**: ✅ 勾选
   - **Preload**: ✅ 勾选
   - **No-Sniff**: ✅ 勾选
5. 勾选 "I understand" 确认
6. 点击 **Save**

### 4. 启用 Minimum TLS Version

1. 在 **SSL/TLS** → **Edge Certificates** 页面
2. 找到 **Minimum TLS Version**
3. 选择 **TLS 1.2**

### 5. 配置 WAF（Web Application Firewall）

1. 左侧菜单点击 **Security** → **WAF**
2. 确保 **Managed Rules** 已开启
3. 切换到 **Custom Rules** 标签
4. 建议添加以下规则：

#### 规则 A：限制非预期国家的管理访问

> 如果你的运维团队只在特定国家，可以为 Cloudflare Dashboard 登录添加地理限制。这在 Cloudflare Access 中设置（见下方第 7 步）。

#### 规则 B：速率限制

1. 在 **Security** → **WAF** → **Rate limiting rules**
2. 创建规则：
   - 名称：`API Rate Limit`
   - 匹配条件：URI Path contains `/api/`
   - 速率：`100 requests per 10 seconds`
   - 操作：`Block`

### 6. 启用 Bot Management（如果有企业版）

1. 左侧菜单 **Security** → **Bots**
2. 启用 **Bot Fight Mode**（Free 计划可用）
3. 如果是 Enterprise 计划，启用 **Super Bot Fight Mode**

### 7. 配置 Cloudflare Access（强烈建议）

保护部署管理入口，防止未授权人员修改部署：

1. 前往 [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. 左侧菜单 **Access** → **Applications**
3. 点击 **Add an application**
4. 选择 **Self-hosted**
5. 设置：
   - Application name: `Ring Deploy Admin`
   - Application domain: 你的 Pages 项目管理域名
6. 添加策略（Policy）：
   - Policy name: `Team Only`
   - Action: **Allow**
   - 包含规则：**Emails** = 你的团队邮箱列表
7. 点击 **Save**

### 8. 配置 Pages 部署通知

1. 前往 Cloudflare Dashboard → **Notifications**
2. 点击 **Add**
3. 选择 **Pages project deployment**
4. 设置通知方式：Email / Webhook（推荐接入 Slack/Telegram）
5. 选择你的 Pages 项目
6. 点击 **Save**

> **重要**：任何非团队成员触发的部署都应立即调查。

### 9. 审计日志

1. 前往 Cloudflare Dashboard → **Audit Log**（需在账户级别设置中查找）
2. 定期检查是否有非预期的：
   - DNS 记录修改
   - Pages 部署
   - 安全设置变更
   - API Token 创建

---

## Vercel 安全设置（预览环境）

Vercel 用于生成预览链接，虽不是生产环境，但预览链接可能被分享给外部人员，也需要保护。

### 1. 启用部署保护（Deployment Protection）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 点击 **Settings** → **Deployment Protection**
4. 按以下设置：

#### Standard Protection（推荐开启）

- **Vercel Authentication**：设为 **Enabled**
  - 这样只有你的团队成员登录 Vercel 后才能访问预览链接
  - 未登录的人看到的是 Vercel 登录页面，而不是你的应用

#### 或 Password Protection（更简单）

- 设置一个访问密码
- 所有预览链接访问时需要输入密码

### 2. 限制分支部署

1. 在项目 **Settings** → **Git**
2. 找到 **Ignored Build Step** 或 **Production Branch**
3. 确保：
   - 生产分支设置正确（如 `main`）
   - 考虑关闭 fork 的自动部署（**Settings** → **Git** → 关闭 **Deploy Forks**）

### 3. 配置安全通知

1. 在 Vercel Dashboard 中点击你的头像 → **Settings**
2. 点击 **Notifications**
3. 确保以下通知已开启：
   - **Deployment succeeded / failed**
   - **Domain configuration changed**
4. 建议配置 Webhook 通知到你的团队 Slack/Telegram

### 4. 审计团队成员权限

1. 点击 Vercel Dashboard → 你的团队 → **Settings** → **Members**
2. 检查所有成员：
   - 移除不再需要访问的人员
   - 确保只有必要人员有 **Admin** / **Owner** 权限
   - 普通开发者设为 **Developer** 权限
3. 建议所有团队成员启用 **2FA（两步验证）**：
   - 点击个人 **Settings** → **Security** → 启用 2FA

### 5. 安全头验证

代码中的 `vercel.json` 已配置了安全头，部署后会自动生效。验证方式见下方"部署后验证"章节。

---

## 部署后验证

每次部署后，请验证安全头是否正确生效。

### 方法一：使用浏览器开发者工具

1. 打开 Chrome 浏览器
2. 访问你的网站
3. 按 `F12` 或 `Cmd + Option + I` 打开开发者工具
4. 切换到 **Network** 标签
5. 刷新页面
6. 点击第一个请求（通常是你的域名）
7. 在 **Response Headers** 中确认以下头信息存在：

```
content-security-policy: default-src 'self'; script-src 'self' data: 'wasm-unsafe-eval'; ...
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
```

### 方法二：使用在线检测工具

1. 访问 [SecurityHeaders.com](https://securityheaders.com/)
2. 输入你的网站地址（如 `https://app.ring.exchange`）
3. 点击 **Scan**
4. 目标评级：**A** 或 **A+**

### 方法三：使用命令行（技术人员）

在终端中运行：

```bash
curl -I https://app.ring.exchange
```

检查返回的响应头中是否包含上述安全头。

---

## 日常安全检查清单

建议每周执行一次以下检查：

### 平台账号安全

- [ ] 检查 Cloudflare 团队成员列表，移除不需要的人员
- [ ] 检查 Vercel 团队成员列表，移除不需要的人员
- [ ] 确认所有团队成员已启用 2FA
- [ ] 检查 Cloudflare API Token 列表，撤销不使用的 Token
- [ ] 检查 Vercel 的 Access Token 列表

### 部署安全

- [ ] 检查 Cloudflare Audit Log，确认无异常操作
- [ ] 检查 Vercel 部署历史，确认所有部署都是团队成员触发
- [ ] 检查 DNS 记录是否被修改
- [ ] 确认生产域名指向正确的 Pages 项目

### 前端安全

- [ ] 用 SecurityHeaders.com 扫描生产站点
- [ ] 检查浏览器控制台是否有 CSP 违规报告
- [ ] 确认 HTTPS 证书状态正常

---

## 紧急响应流程

如果怀疑前端被劫持：

### 第一步：立即停止访问（0-5 分钟）

1. 通过所有渠道通知用户**立即停止使用网站**
2. 在社交媒体发布安全警告

### 第二步：冻结部署（5-10 分钟）

**Cloudflare：**
1. 登录 Cloudflare Dashboard
2. 进入你的 Pages 项目
3. 点击 **Settings** → **General** → **Pause project**
4. 或者：进入 **DNS** → 将域名指向一个安全的维护页面

**Vercel：**
1. 登录 Vercel Dashboard
2. 进入你的项目
3. 点击 **Settings** → **Domains** → 移除所有自定义域名
4. 或者：**Settings** → **General** → **Pause Project**

### 第三步：调查和恢复（10-60 分钟）

1. 检查最近的部署记录，找到最后一个"安全"的版本
2. 检查 Git 历史，确认是否有可疑的 commit
3. 回滚到已知安全的版本
4. 更换所有平台的密码和 API Token
5. 检查 Cloudflare / Vercel 的审计日志

### 第四步：通知用户（恢复后）

1. 公开披露事件经过
2. 建议用户使用 [revoke.cash](https://revoke.cash/) 检查并撤销可疑授权
3. 提供受影响时间窗口，帮助用户评估风险

---

## 附录：关键概念解释

| 术语 | 解释 |
|------|------|
| **CSP** | Content Security Policy，浏览器安全策略，控制页面能加载哪些外部资源 |
| **HSTS** | HTTP Strict Transport Security，强制浏览器使用 HTTPS 连接 |
| **X-Frame-Options** | 控制页面是否可以被嵌入到其他网站的 iframe 中 |
| **2FA** | Two-Factor Authentication，两步验证，登录时需要额外的验证码 |
| **WAF** | Web Application Firewall，Web 应用防火墙，过滤恶意请求 |
| **approve 授权** | DeFi 中，用户授权某个合约可以使用自己的代币，如果恶意合约获得授权，可以转走用户代币 |
| **SRI** | Subresource Integrity，子资源完整性校验，确保加载的外部资源未被篡改 |
