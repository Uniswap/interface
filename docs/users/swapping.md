# Swapping

## How a swap works

1. **Connect** your wallet and select a [supported chain](./chains.md).
2. Pick the **token you pay** (Sell) and the **token you receive** (Buy). Enter an amount.
3. The app requests a **quote** from HookSwap's routing backend, which finds the best route
   across the v2 and v3 pools that hold liquidity.
4. Review the details — rate, price impact, minimum received, network cost — then **Swap**.
5. Approve the token (a one-time Permit2/ERC-20 approval) if prompted, then **confirm** the
   swap in your wallet. Swaps execute through HookSwap's **Universal Router**.

> **If you see "no route" / no price:** the token pair has no liquidity yet, or the routing
> backend for that chain is not yet serving quotes. HookSwap never shows a fabricated price —
> a missing route means there is genuinely nothing to route against. See the [FAQ](./faq.md).

## The Terminal UI

The HookSwap interface is being redesigned as a **Terminal** — a dense, keyboard-friendly
trading layout with a market list, price chart, and a swap ticket (Market / Limit / TWAMM
tabs). Numbers, prices, and addresses render in a monospace font. Every value shown is bound
to a live source (price/quote/subgraph) — there is no mock data in shipped screens.

## MEV protection

The swap ticket includes an **MEV protection** toggle. When enabled, the transaction is
routed through a private/protected transaction flow (private RPC) rather than the public
mempool, which reduces exposure to front-running and sandwich attacks. Availability depends
on the chain's operator configuration.

## Slippage

Slippage tolerance is the maximum price movement you accept between quote and execution:

- A **minimum received** amount is derived from your slippage setting; if the real output
  would fall below it, the swap reverts instead of filling at a worse price.
- Default slippage is a small percentage (e.g. 0.5%). You can adjust it in settings.
- Higher slippage fills more reliably in volatile or thin pools but gives worse worst-case
  pricing; lower slippage protects price but may fail to fill.

## Price impact

**Price impact** is how much your own trade moves the pool price — a function of your size
relative to pool liquidity. Large trades in thin pools have high impact. Because many
HookSwap pools are newly seeded, watch price impact carefully on large orders and consider
splitting them.

## Fees

Swaps pay the pool's trading fee to liquidity providers:

- **v2 pools:** a flat 0.30% fee.
- **v3 pools:** the pool's fee tier — 0.01%, 0.05%, 0.30%, or 1.00%.

Plus normal network gas (paid in the chain's native token — see [Chains](./chains.md); on
Tempo gas is paid in an ERC-20, not native).
