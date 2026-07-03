# HookSwap Contract Deploy Kit

Runnable tooling + docs to deploy the **Uniswap v2 + v3** stack (intentionally
**no v4**) for the HookSwap DEX to three chains:

| Chain            | chainId  | Native | Wrapped native (WETH)                          |
| ---------------- | -------- | ------ | ---------------------------------------------- |
| Sepolia          | 11155111 | ETH    | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` (canonical WETH9) |
| HyperEVM         | 999      | HYPE   | `0x5555555555555555555555555555555555555555` (WHYPE, already deployed) |
| Robinhood Chain  | 4663     | ETH    | none canonical → this kit deploys a fresh WETH9 |

> This is a **kit you run** with your own funded deployer key. Nothing here
> deploys automatically or on install. Read this whole file once before your
> first run.

---

## 1. Prerequisites

- **Foundry** (`forge` + `cast`) — https://getfoundry.sh
- **Node 18+** (for `npx @uniswap/deploy-v3`)
- **jq** — used by the orchestrator to read/write JSON
- **A funded deployer private key** — the same account must hold gas on every
  chain you target (real HYPE on HyperEVM, real ETH on Robinhood, test ETH on
  Sepolia).
- **One RPC URL per chain** (public defaults are provided but rate-limited).

The Uniswap contracts are built and deployed from **your HooksOS forks**, not
from this directory. Clone and build them first (one-time):

```bash
export FORKS_DIR="$HOME/hooksos-forks"
mkdir -p "$FORKS_DIR" && cd "$FORKS_DIR"
git clone https://github.com/HooksOS/v2-core.git
git clone https://github.com/HooksOS/v2-periphery.git
git clone https://github.com/HooksOS/v3-core.git
git clone https://github.com/HooksOS/v3-periphery.git
git clone https://github.com/HooksOS/swap-router-contracts.git
git clone https://github.com/HooksOS/universal-router.git
git clone https://github.com/HooksOS/permit2.git
# then build each per its own README (forge build, or yarn && yarn compile)
```

`v3-core` / `v3-periphery` are consumed indirectly through the
`@uniswap/deploy-v3` npm CLI, so you don't strictly need to build those two
locally unless you recompiled them (see the init-code-hash notes below).

### Setup

```bash
cd contracts
cp .env.example .env      # then edit .env: DEPLOYER_PRIVATE_KEY + RPC URLs
export FORKS_DIR="$HOME/hooksos-forks"
```

---

## 2. Deploy order (and which tool does each step)

The orchestrator `scripts/deploy.sh <chain>` runs these in order. The order is
**not optional** — later contracts take earlier addresses as constructor args.

### 1. Permit2

- If Permit2 already exists at the canonical CREATE2 address
  `0x000000000022D473030F116dDEE9F6B43aC78BA3`, **reuse it**.
- Otherwise, if the deterministic CREATE2 deployer
  `0x4e59b44847b379578588920cA78FbF26c0B4956C` is present on the chain, deploy
  Permit2 from the `permit2` fork to reproduce that same canonical address.
- Check both with `cast code <addr> --rpc-url <rpc>` (empty `0x` == not there).
- If neither is present, deploy Permit2 manually from the fork and record
  whatever address you get.

### 2. WETH / wrapped native

- **Sepolia** → reuse canonical WETH9 `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`.
- **HyperEVM** → reuse WHYPE `0x5555555555555555555555555555555555555555`.
- **Robinhood** → no canonical wrapped native, so `scripts/deploy-weth.sh`
  deploys the standard `src/WETH9.sol`.

### 3. Uniswap v2

- `UniswapV2Factory(feeToSetter = deployer)` — from `v2-core`.
- `UniswapV2Router02(factory, weth)` — from `v2-periphery`.
- **Record the pair init code hash**: `keccak256(type(UniswapV2Pair).creationCode)`.
  The kit computes it via `forge inspect ... bytecode` + `cast keccak`. A
  recompiled fork almost always has a **different** hash than mainnet's
  `0x96e8ac42...845f`, and the v2-sdk fork + `UniswapV2Library` hard-code it, so
  you must carry this exact value forward.

### 4. Uniswap v3

Deployed with the canonical CLI `@uniswap/deploy-v3`:

```bash
npx @uniswap/deploy-v3 \
  -pk <deployer_private_key> \
  -j  <rpc_url> \
  -w9 <weth_address> \
  -ncl <NativeLabel>          # e.g. ETH or HYPE \
  -o  <owner_address> \
  -v2 <v2Factory>             # wires up the V3Migrator to your v2 factory \
  -s  <state_file.json>       # progress + results; resume-safe
```

This one CLI deploys: **v3CoreFactory, multicall2, proxyAdmin, tickLens,
nftDescriptorLib, nftPositionDescriptor, nonfungiblePositionManager,
v3Migrator, quoterV2, v3Staker**. It writes every address to the `-s` state
file, which the orchestrator parses.

> The **v3 pool init code hash is fixed** at
> `0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54`
> **unless** you recompiled `v3-core` (different solc/optimizer → different
> hash). If you recompiled, recompute it and update it wherever it's used
> (SDK + UniversalRouter `poolInitCodeHash`).

### 5. SwapRouter02

From `swap-router-contracts`. Constructor:

```solidity
constructor(address _factoryV2, address factoryV3, address _positionManager, address _WETH9)
```

→ `(v2Factory, v3Factory, v3PositionManager, weth9)`.

### 6. UniversalRouter

From `universal-router`. Its constructor takes a single **`RouterParameters`
struct**. On the v4-era code (what you should be on) the struct is:

| Field                  | Value for HookSwap (v2+v3 only)                     |
| ---------------------- | --------------------------------------------------- |
| `permit2`              | your Permit2                                         |
| `weth9`                | your WETH                                            |
| `v2Factory`            | your `UniswapV2Factory`                              |
| `v3Factory`            | your v3 core factory                                 |
| `pairInitCodeHash`     | your recorded v2 pair init code hash **(critical)**  |
| `poolInitCodeHash`     | v3 pool init code hash (fixed value above) **(critical)** |
| `v4PoolManager`        | `address(0)` — **no v4**                             |
| `v3NFTPositionManager` | your v3 position manager (or `address(0)` if unused) |
| `v4PositionManager`    | `address(0)` — **no v4**                             |

The five load-bearing fields are `permit2`, `weth9`, `v2Factory`, `v3Factory`,
`pairInitCodeHash`, `poolInitCodeHash`. Everything v4 is `address(0)`.

> **Confirm the struct against your fork commit.** Older (pre-v4) universal-router
> commits use a *larger* `RouterParameters` with marketplace fields (seaport,
> x2y2, looksRare, sudoswap, cryptopunks, …). If you're on such a commit, set
> **every** non-Uniswap field to `address(0)` and keep the six Uniswap values.

Because struct encoding through `forge create --constructor-args` is brittle and
layout-dependent, the orchestrator does **not** auto-broadcast UniversalRouter.
It prints the exact parameter values and asks you to deploy via a small
`forge script` in your fork:

```solidity
// universal-router/script/DeployUniversalRouter.s.sol  (you write this)
import {Script} from "forge-std/Script.sol";
import {UniversalRouter} from "../contracts/UniversalRouter.sol";
import {RouterParameters} from "../contracts/base/RouterImmutables.sol"; // path per your fork

contract DeployUniversalRouter is Script {
    function run() external {
        RouterParameters memory params = RouterParameters({
            permit2:              0x000000000022D473030F116dDEE9F6B43aC78BA3, // from output
            weth9:                /* ... */,
            v2Factory:            /* ... */,
            v3Factory:            /* ... */,
            pairInitCodeHash:     /* 0x... */,
            poolInitCodeHash:     0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54,
            v4PoolManager:        address(0),
            v3NFTPositionManager: /* ... */,
            v4PositionManager:    address(0)
        });
        vm.startBroadcast();
        new UniversalRouter(params);
        vm.stopBroadcast();
    }
}
```

```bash
cd "$FORKS_DIR/universal-router" && forge script \
  script/DeployUniversalRouter.s.sol --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" --broadcast
```

Then write the resulting address into `deployments/<chain>.json`.

---

## 3. Running it

```bash
cd contracts
./scripts/deploy.sh sepolia
./scripts/deploy.sh hyperevm
./scripts/deploy.sh robinhood
```

Each run is defensive: it checks `forge`/`cast`/`jq`/`npx` exist, that
`.env` + `FORKS_DIR` are set, that the RPC's live chainId matches the config,
and that every reused address actually has code. It echoes each deployed
address and writes `deployments/<chain>.json`.

### Deployment record format

`deployments/<chain>.json`:

```json
{
  "chainId": 11155111,
  "permit2": "0x...",
  "weth": "0x...",
  "v2Factory": "0x...",
  "v2Router": "0x...",
  "v2PairInitCodeHash": "0x...",
  "v3Factory": "0x...",
  "v3PositionManager": "0x...",
  "v3QuoterV2": "0x...",
  "v3Migrator": "0x...",
  "swapRouter02": "0x...",
  "universalRouter": "0x..."
}
```

---

## 4. Feeding addresses back into HookSwap

Deploying the contracts is only half the job. The interface + routing must be
told these addresses exist, in **three** places:

### (a) The `HooksOS/sdks` fork

- **sdk-core** — add each chain to the `ChainId` enum and to the address maps
  (`V2_FACTORY_ADDRESSES`, `V3_CORE_FACTORY_ADDRESSES`,
  `SWAP_ROUTER_02_ADDRESSES`, `NONFUNGIBLE_POSITION_MANAGER_ADDRESSES`,
  `UNIVERSAL_ROUTER_ADDRESS`, `MULTICALL_ADDRESSES`, and the wrapped-native /
  `WETH9`/native currency entries).
- **v2-sdk** — set the per-chain `FACTORY_ADDRESS` and the
  **`INIT_CODE_HASH`** to the `v2PairInitCodeHash` you recorded. If this hash is
  wrong, `Pair.getAddress` computes the wrong pool address and **every v2 quote
  fails**.
- **v3-sdk** — set the per-chain `FACTORY_ADDRESS` and `POOL_INIT_CODE_HASH`
  (only differs from the canonical value if you recompiled v3-core).

### (b) This interface's chain config

- `packages/uniswap/src/features/chains/evm/info/*.ts` — add/adjust the per-chain
  info file: `wrappedNativeCurrency` (your WETH/WHYPE address + symbol/decimals),
  native currency, RPC, explorer, and any router addresses the config expects.
- Wherever the interface reads router addresses (SwapRouter02 / UniversalRouter /
  Permit2), point them at your `deployments/<chain>.json` values.

### (c) The routing-api

The frontend does **not** compute routes itself — it calls a routing service.
You must run a **self-hosted `routing-api`** (and its `smart-order-router`
dependency), configured with the same forked SDK addresses + init code hashes
and pointed at your chains' RPCs and subgraphs.

> **Be explicit / expect this:** with the contracts deployed but **no** address
> wiring in the SDK/interface **and no self-hosted routing-api**, the app will
> load but **swaps will not quote** — there is nothing to price routes against.
> All three of (a), (b), (c) are required before a swap can quote and execute.

---

## 5. Files in this kit

```
contracts/
├── README.md              # this file
├── .env.example           # env template (copy to .env)
├── foundry.toml           # foundry config for the WETH9 helper
├── config/chains.json     # per-chain metadata (ids, RPC env var, WETH, explorer)
├── src/WETH9.sol          # canonical WETH9, deployed on chains with no wrapped native
├── scripts/
│   ├── deploy.sh          # orchestrator: deploy.sh <chain>
│   └── deploy-weth.sh     # helper: deploy a WETH9 via forge create
└── deployments/           # deploy.sh writes <chain>.json here
```

## 6. Notes, gotchas, TODOs to confirm

- **Fork source paths**: `deploy.sh` assumes upstream Uniswap paths
  (`contracts/UniswapV2Factory.sol`, `contracts/UniswapV2Router02.sol`,
  `contracts/SwapRouter02.sol`, `script/DeployPermit2.s.sol`). If your HooksOS
  forks moved files, update the `forge create` / `forge script` targets (search
  the script for `TODO`).
- **UniversalRouter struct** is the one thing you must hand-confirm per fork
  commit (see step 6 above) — the script prints the values and leaves the deploy
  to you.
- **Init code hashes** are the most common footgun. Record the v2 pair hash from
  the actual fork build, and only trust the fixed v3 pool hash if you did **not**
  recompile v3-core.
- Verification (`forge verify-contract`) is optional and only wired for
  Etherscan-compatible explorers via `ETHERSCAN_API_KEY`.
```
