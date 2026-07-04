# Providing liquidity

HookSwap supports two pool types. As a liquidity provider (LP) you earn the pool's trading
fees on your share of the pool.

## v2 vs v3 — which to use

| | v2 (constant product) | v3 (concentrated liquidity) |
|---|---|---|
| Model | Both sides deposited at the current ratio | Liquidity placed in a chosen **price range** |
| Fee | Flat **0.30%** | Choose a **fee tier**: 0.01% / 0.05% / 0.30% / 1.00% |
| Simplicity | Simplest — deposit and forget | More complex — you pick a range and may need to rebalance |
| Capital efficiency | Lower (spread across all prices) | Higher (concentrated where trading happens) |
| Best for | "Throw both sides in" and passive LPing | LPs who want efficiency and can manage a range |

## Adding v2 liquidity

1. Choose the token pair. On a **new** pair, the ratio you deposit **defines the opening
   price** — deposit both sides at your intended price.
2. Approve the router to spend your tokens.
3. Add liquidity. You receive LP tokens representing your share; fees accrue into the pool
   and are realized when you withdraw.

Keep both sides roughly equal in value at the intended price.

## Adding v3 liquidity

v3 pools are per **(token0, token1, fee tier)**. Instead of covering all prices, you place
liquidity between two prices (a **range**):

1. **Pick the pair and fee tier.** Each fee tier has a matching tick spacing:

   | Fee tier | Tick spacing |
   |---|---|
   | 0.01% | 1 |
   | 0.05% | 10 |
   | 0.30% | 60 |
   | 1.00% | 200 |

2. **Set a price range** (min/max). Your capital only earns fees while the market price is
   inside your range:
   - A **wide/full range** behaves like v2 (fees on all trades, lower efficiency).
   - A **concentrated range** around the current price earns much deeper fees per dollar,
     but stops earning if price leaves the band (and becomes single-sided).
3. **Deposit** both tokens (amounts depend on where the current price sits in your range) and
   confirm. You receive an NFT position representing your liquidity.

> **Out of range:** if price moves outside your v3 range, your position converts fully to one
> side and stops earning fees until price returns or you rebalance.

## Notes per chain

- **Tempo** has no native-gas wrapper — you cannot add liquidity with native gas
  (`addLiquidityETH`). Pair tokens against `pathUSD` or another ERC-20 quote asset instead.
- New pools may be thin. Small pools give volatile prices and shallow quotes; see the
  operator [seed-liquidity guidance](../operators/seed-liquidity.md) for what "usable"
  liquidity looks like.
