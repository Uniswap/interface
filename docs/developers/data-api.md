# HookSwap Data API (REST)

A public, read-only REST/JSON facade over the HookSwap data-api. It exposes live on-chain **pool**,
**token**, **search**, and **protocol-stats** reads so integrators (launchpads, dashboards, scripts)
can consume HookSwap data over plain `GET` + JSON — no Connect-RPC/protobuf client needed.

- **Base URL:** `https://data.hookswap.org`
- **Methods:** `GET` only. Responses are `application/json`.
- **CORS:** open (`Access-Control-Allow-Origin: *`), no credentials — these routes are read-only and
  cookie-free, so they are callable directly from any browser origin.
- **Data source:** the SAME real, on-chain-derived handlers the HookSwap interface uses over
  Connect-RPC. Nothing is fabricated — see the honesty note below.

> These REST routes are a thin JSON view of the read-only surface. Wallet-scoped data (portfolio,
> balances, positions, transaction history) is intentionally **not** exposed here.

## Supported chains

The API serves HookSwap's own deployed chains. `chainId` is a numeric EVM chain id:

| chainId | Chain | Native |
|---|---|---|
| `4663` | Robinhood *(priority)* | ETH |
| `4326` | MegaETH | ETH |
| `57073` | Ink | ETH |
| `196` | XLayer | OKB |
| `999` | HyperEVM | HYPE |
| `11155111` | Sepolia *(testnet)* | ETH |

Pass an unsupported/invalid `chainId` and the endpoint returns `400`.

## Honesty note — USD fields

Identity and native-denominated data is **live now**: token metadata (chain / address / symbol /
name / decimals / type), pool existence (token0 / token1 / fee tier / protocol version), and
native-denominated token stats (`priceChange1d`, `priceHistory1d`) from the event indexer.

USD-denominated fields — pool `tvl` / `volume1d` / `apr`, token `price` / `volume1d`, and the
protocol-stats TVL/volume series — are **unset until the WETH/USDG anchor pool is seeded and indexed
on Robinhood**. There is no external price oracle: every USD figure derives from that one on-chain
anchor pool, so until it exists these fields are simply **absent from the JSON** (never zero-filled,
never fabricated). They light up automatically once the anchor pool is ingested.

---

## `GET /v1/pools`

Live pools (v2 + v3), discovered on-chain.

| Param | Required | Description |
|---|---|---|
| `chainId` | no | A supported chain id. Omit to query **all** supported chains. |
| `limit` | no | Max pools to return (default `100`). |

> Ordering is on-chain discovery order — pools are **not** yet ranked by TVL (no USD anchor). `limit`
> truncates the returned list.

```bash
curl "https://data.hookswap.org/v1/pools?chainId=4663&limit=25"
```

```json
{
  "pools": [
    {
      "chainId": 4663,
      "poolId": "0x…",
      "token0": { "chainId": 4663, "address": "0x0Bd7D308…", "symbol": "WETH", "name": "Wrapped Ether", "decimals": 18, "type": "TOKEN_TYPE_ERC20" },
      "token1": { "chainId": 4663, "address": "0x3b5a01Ef…", "symbol": "tHOOK", "name": "Test Hook Token", "decimals": 18, "type": "TOKEN_TYPE_ERC20" },
      "protocolVersion": "PROTOCOL_VERSION_V2",
      "feeTier": 3000
    }
  ]
}
```

`stats` (`tvl` / `volume1d` / `apr`) is present on a pool only once its chain has a USD anchor pool.

## `GET /v1/tokens`

The chain's real token set: native + wrapped-native + seeded ERC-20s + tokens discovered in live
v2/v3 pools (metadata read on-chain).

| Param | Required | Description |
|---|---|---|
| `chainId` | no | A supported chain id. Omit to query **all** supported chains. |

```bash
curl "https://data.hookswap.org/v1/tokens?chainId=4663"
```

```json
{
  "tokens": [
    { "chainId": 4663, "symbol": "ETH", "name": "ETH", "decimals": 18, "type": "TOKEN_TYPE_NATIVE" },
    { "chainId": 4663, "address": "0x0Bd7D308…", "symbol": "WETH", "name": "Wrapped Ether", "decimals": 18, "type": "TOKEN_TYPE_ERC20" }
  ],
  "multichainTokens": [
    { "multichainId": "4663:native", "symbol": "ETH", "name": "ETH", "type": "TOKEN_TYPE_NATIVE", "chainTokens": [ { "chainId": 4663, "decimals": 18 } ] }
  ]
}
```

The native asset has an empty `address` (the native sentinel — no contract address is invented).
`multichainTokens[].stats` carries native-denominated `priceChange1d` / `priceHistory1d` when the
event indexer has a 24h baseline; USD `price`/`volume1d` stay unset until the anchor pool exists.

## `GET /v1/search`

Search the chain's real token set by symbol / name / address (case-insensitive substring). A bare
`0x…` address that isn't in the known set triggers a live ERC-20 metadata read, so any valid token
address resolves.

| Param | Required | Description |
|---|---|---|
| `q` | **yes** | Search query (symbol, name, or address). `400` if missing/empty. |
| `chainId` | no | A supported chain id. Omit to search **all** supported chains. |
| `size` | no | Max results (default `50`). |

```bash
curl "https://data.hookswap.org/v1/search?q=tHOOK&chainId=4663"
```

```json
{
  "tokens": [
    { "tokenId": "4663-0x3b5a01ef…", "chainId": 4663, "address": "0x3b5a01Ef…", "symbol": "tHOOK", "name": "Test Hook Token", "decimals": 18, "standard": "ERC20" }
  ],
  "pools": [],
  "auctions": [],
  "multichainTokens": []
}
```

## `GET /v1/stats`

Protocol TVL / 24h-volume aggregates (v2), USD-anchored.

| Param | Required | Description |
|---|---|---|
| `chainId` | no | A supported chain id. Omit for the aggregate across **all** supported chains. |

```bash
curl "https://data.hookswap.org/v1/stats?chainId=4663"
```

```json
{
  "dailyProtocolTvl": { "v2": [], "v3": [], "v4": [] },
  "historicalProtocolVolume": {
    "Month": { "v2": [], "v3": [], "v4": [] },
    "Year": { "v2": [], "v3": [], "v4": [] },
    "Max": { "v2": [], "v3": [], "v4": [] }
  }
}
```

The `v2` series carry a single current USD point **once the WETH/USDG anchor pool is seeded +
indexed** on Robinhood; until then they are honest empty arrays (the UI shows `$0` / `0%`). `v3`/`v4`
are always empty (the indexer ingests only v2 events; v4 is excluded from HookSwap).

## Errors

```json
{ "error": "unsupported or invalid chainId \"12345\"" }
```

- `400` — bad/missing required param (invalid `chainId`, or missing `q` on `/v1/search`).
- `500` — `{ "error": "internal error" }` (internals are never leaked; data is never fabricated).
