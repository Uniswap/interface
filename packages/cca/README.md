# @universe/cca

Pure bigint + viem math and safety checks for continuous clearing auction (CCA) bids and settles.
Shared by apps/web (Toucan) and apps/pools-xyz.

- **Bid prices** (`src/bid`): the Q96 tick-grid rules the auction contract enforces on a bid's
  `maxPrice` (`calculateMinValidBidQ96`, `calculateMaxValidBidQ96`, `snapToNearestTick`, ...) and
  the FDV-capped ceiling for a market-style bid (`fdvToPriceQ96`, `calculateCappedMaxBidQ96`).
- **Settle checks** (`src/settle`): verification of server-built claim/exit calldata before it is
  signed — target, value, chain, selector, bid set, payout owner, and the Multicall3 batch of the
  combined ExitBidAndClaimTokens method (`assertSettleCalldata`, `refuseExitAndClaimCalldata`).

## Boundary

Runtime dependencies are `viem` and nothing else: no Apollo, ethers, `@universe/chains`,
react-native, redux or i18n. `src/importGraph.test.ts` enforces it. App-specific inputs — chain
registries, the quick-launch preset supply, wallet state, logging — are passed in by the caller.

## Testing

```sh
bun nx run @universe/cca:test
```
