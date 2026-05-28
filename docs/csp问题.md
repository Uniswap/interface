# issue
打开 http://192.168.71.61:3000 在浏览器的console看到错误：Fetch API cannot load http://192.168.71.61:4000/graphql. Refused to connect because it violates the document's Content Security Policy. 实际上graphql服务单独请求也可以。

# solution
我先看了你这套的 CSP 注入逻辑，已经把开发环境的 connect-src 白名单加上你的 GraphQL 服务地址，现在说下原因、改动和怎么验证。

问题原因

- 浏览器阻止跨域连接是因为页面的 CSP connect-src 没允许 http://192.168.71.61:4000 ，导致从 http://192.168.71.61:3000 发起的 fetch 被拒绝。
- 你这个项目用的是 Vite 的 HTML 插件在开发环境动态注入 CSP：它读取 apps/web/public/csp.json 并合并 apps/web/public/dev-csp.json ，然后把 <meta http-equiv="Content-Security-Policy"> 注入到 apps/web/index.html 的占位注释处。
已修改

- 更新了 apps/web/public/dev-csp.json ，把 http://192.168.71.61:4000 加入了 connectSrc ：
  - 文件： apps/web/public/dev-csp.json
  - 修改后：
    ```
    {
      "connectSrc": [
        "http://127.0.0.1:8545",
        "http://127.0.0.1:8546",
        "http://192.168.71.61:4000"
      ]
    }
    ```
- 你当前的 Apollo 链接指向 http://192.168.71.61:4000/graphql ，CSP 只需要白名单到“源”即可（ http://192.168.71.61:4000 ），这个已包含。
如何生效与验证

- 刷新浏览器页面即可生效；如果仍看到旧的 CSP，可以重启一下开发服务器再试。
- 在浏览器里检查：打开开发者工具 → Elements → <head> 中找到 Content-Security-Policy 的 <meta> ，确认 connect-src 包含 http://192.168.71.61:4000 。
- 控制台试一下：
  - await fetch('http://192.168.71.61:4000/graphql', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: '{ __typename }' }) })
  - 应不再出现“Refused to connect because it violates the document's Content Security Policy.”，若出现其他错误，多半就是 CORS 配置问题。