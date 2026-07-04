# ABIs

Clean JSON ABI arrays (the `abi` field only, no bytecode) for the contracts a launchpad calls to create and seed HookSwap pools. Each file is a plain JSON array you can pass straight to `new ethers.Contract(address, abi, signerOrProvider)`.

| File | Contract | Used for |
|---|---|---|
| `UniswapV2Factory.json` | `UniswapV2Factory` | `createPair`, `getPair` |
| `UniswapV2Router02.json` | `UniswapV2Router02` | `addLiquidity`, `addLiquidityETH` (v2 seed) |
| `UniswapV3Factory.json` | `UniswapV3Factory` | `getPool`, `feeAmountTickSpacing` |
| `NonfungiblePositionManager.json` | `NonfungiblePositionManager` | `createAndInitializePoolIfNecessary`, `mint` (v3 create + seed) |
| `QuoterV2.json` | `QuoterV2` | `quoteExactInputSingle` (verify pool is quotable) |
| `ERC20.json` | `ERC20` | `approve`, `balanceOf`, `decimals` on the launched/quote token |

## Provenance

All ABIs are the **canonical Uniswap contract ABIs** — HookSwap deploys standard Uniswap bytecode, so these ABIs match the deployed contracts exactly.

- `UniswapV2Factory`, `UniswapV3Factory`, `NonfungiblePositionManager`, `QuoterV2`, `ERC20` — extracted from the compiled build artifacts in the HookSwap contract forks (`@uniswap/v2-core`, `@uniswap/v3-core`, `@uniswap/v3-periphery`, `@uniswap/swap-router-contracts`, `@openzeppelin/contracts`).
- `UniswapV2Router02` — assembled from the canonical `IUniswapV2Router02` Solidity interface (`forks/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol`), which is the stable public Router02 interface. Covers `factory`, `WETH`, all `addLiquidity*` / `removeLiquidity*`, all `swap*` (incl. fee-on-transfer variants), and the `quote` / `getAmount*` view helpers.

## Notes

- `QuoterV2.quoteExactInputSingle` / `quoteExactOutputSingle` are **not** `view` — they revert internally to bubble the result. Call them with `staticCall` (ethers v6) / `callStatic` (ethers v5), not a plain send.
- `NonfungiblePositionManager.mint` takes a single `MintParams` struct (tuple): `(token0, token1, fee, tickLower, tickUpper, amount0Desired, amount1Desired, amount0Min, amount1Min, recipient, deadline)`.
- The `ERC20.json` ABI is a standard ERC-20 (OpenZeppelin). For non-standard launched tokens, ensure at minimum `approve`, `transfer`, `balanceOf`, `decimals` are present.
