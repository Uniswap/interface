import {
  StocksHorizontalRow,
  type StocksHorizontalRowProps,
} from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StocksHorizontalRow'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

/**
 * The Stocks shelf plus its impression, shared by the legacy and V2 selector lists so the two can't report the
 * shelf differently. The impression is a render, not a viewport impression — the repo has no visibility
 * instrumentation — and it refires whenever the shelf's token list changes identity (e.g. a network-filter change).
 *
 * The token-warning modal renders inside this Trace, so its own impression inherits this `element` too; the two are
 * told apart by `modal` (`token-selector-modal` for the shelf, `token-warning-modal` for the warning).
 */
export function StocksShelfRow(props: StocksHorizontalRowProps): JSX.Element {
  return (
    <Trace
      logImpression
      element={ElementName.TokenSelectorStocksShelf}
      section={SectionName.TokenSelector}
      properties={{ suggestion_count: props.tokens.length }}
    >
      <StocksHorizontalRow {...props} />
    </Trace>
  )
}
