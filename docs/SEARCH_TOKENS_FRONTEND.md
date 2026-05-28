# SearchTokens 接口说明（前端对接）

后端 **没有新增接口**，仍是同一个 **SearchTokens**（`/Search.v1.SearchService/SearchTokens` 或 `/v2/Search.v1.SearchService/SearchTokens`）。  
只是 **searchQuery 的语义扩展了**：除了按**地址**查，还可以按 **symbol / name** 在服务端缓存的 token 列表里搜索。

---

## 1. 请求（和之前一致）

- **方法**：`GET` 或 `POST`
- **参数**（body 或 query）：
  - `searchQuery`： string，**必填**（有搜索时）。现在支持三种用法：
    - **0x 开头的 40 位十六进制** → 按**地址**查（行为同之前，走 getToken）
    - **普通字符串**（如 `USDT`、`Tether`、`WETH`）→ 按 **symbol 或 name** 在服务端缓存的 token 列表里搜索
  - `chainIds`：number[]，必填，例如 `[1]`、`[11155111]`、`[1, 11155111]`
  - `searchType`：固定 `"TOKEN"`
  - `page` / `size`：可选，分页（默认 page=1, size=15，size 最大 100）

示例（POST body）：

```json
{
  "searchQuery": "USDT",
  "chainIds": [1, 11155111],
  "searchType": "TOKEN",
  "page": 1,
  "size": 20
}
```

按地址查（和以前一样）：

```json
{
  "searchQuery": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "chainIds": [1],
  "searchType": "TOKEN"
}
```

---

## 2. 响应（和之前一致）

```json
{
  "tokens": [
    {
      "tokenId": "1_0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "chainId": 1,
      "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "decimals": 6,
      "symbol": "USDT",
      "name": "Tether USD",
      "standard": "ERC20",
      "projectName": "Tether USD"
    }
  ]
}
```

有分页时可能带 `pagination`（和之前一致）。

---

## 3. 前端建议改法（减轻内存）

- **之前**：前端拉全量 token list、多链切换后缓存很多 token → 内存占用大。
- **现在**：搜索逻辑在 ring-api，服务端已缓存各链 token list。

建议：

1. **不再在前端维护“全量 token list”做搜索**  
   用户输入（地址或 symbol/name）后，直接调 **SearchTokens**，把用户输入当作 `searchQuery` 传上去即可。

2. **调用方式保持不变**  
   继续用现有 SearchTokens 的 URL 和参数；只需保证：
   - 有搜索时传 `searchQuery`（可以是地址，也可以是 "USDT"、"WETH"、"Tether" 等）。
   - 传当前需要搜索的链 `chainIds`。

3. **可选：防抖**  
   用户输入 symbol/name 时建议做防抖（例如 200–300ms）再请求，减少请求次数。

4. **可选：结果缓存**  
   可以按 `(searchQuery, chainIds)` 做短期缓存（内存或 sessionStorage），避免重复输入重复请求；不必再缓存“全量 list”。

这样多切几次链也不会在前端堆大量 token 缓存，内存会轻很多。

---

## 4. 小结

| 项目       | 说明 |
|------------|------|
| 是否新接口 | 否，仍是 SearchTokens |
| 入参变化   | 无，`searchQuery` 仍为 string，只是语义扩展为支持 symbol/name |
| 出参变化   | 无，仍是 `{ tokens: [...], pagination?: {...} }` |
| 前端必改   | 无，现有调用方式兼容 |
| 前端建议   | 用 SearchTokens 做“按输入搜 token”，不再在前端拉全量 list 做搜索，可减内存 |
