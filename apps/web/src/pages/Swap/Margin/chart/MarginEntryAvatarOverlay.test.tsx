import { fireEvent, screen } from '@testing-library/react'
import type { UTCTimestamp } from 'lightweight-charts'
import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { describe, expect, it, vi } from 'vitest'
import { MarginEntryAvatarOverlay, marginEntryAvatarMarkers } from '~/pages/Swap/Margin/chart/MarginEntryAvatarOverlay'
import { render } from '~/test-utils/render'

const X18 = (n: number): string => (BigInt(n) * 10n ** 18n).toString()
// Only the fields the markers read.
const position = (positionId: string, openedAt: string, entry = 2000): MarginActivePosition =>
  ({ positionId, openedAt, entryPrice: X18(entry) }) as unknown as MarginActivePosition
const candles = [100, 200, 300].map((time) => ({ time: time as UTCTimestamp, low: 1900, high: 2100 }))
const candleSeconds = 100
// An older position on another market, which takes ID 1.
const elsewhere = position('z', '10')

describe(marginEntryAvatarMarkers, () => {
  it('pins each entry to the candle it opened in, badged with its table-wide ID when the market holds several', () => {
    const charted = [position('a', '250'), position('b', '300')]
    expect(
      marginEntryAvatarMarkers({ positions: charted, allPositions: [elsewhere, ...charted], candles, candleSeconds }),
    ).toEqual([
      { positionId: 'a', time: 200, price: 2000, displayId: 2 },
      { positionId: 'b', time: 300, price: 2000, displayId: 3 },
    ])
  })

  it('pins an open before the loaded candles to the first one', () => {
    const charted = [position('a', '50')]
    expect(marginEntryAvatarMarkers({ positions: charted, allPositions: charted, candles, candleSeconds })).toEqual([
      { positionId: 'a', time: 100, price: 2000 },
    ])
  })

  it('draws none without an entry price', () => {
    const charted = [position('a', '250', 0)]
    expect(marginEntryAvatarMarkers({ positions: charted, allPositions: charted, candles, candleSeconds })).toEqual([])
  })

  it('pins an open since the previous candle closed to the live candle, restamped to now', () => {
    const live = [100, 200, 345].map((time) => ({ time: time as UTCTimestamp, low: 1900, high: 2100 }))
    const charted = [position('a', '310'), position('b', '250')]
    expect(
      marginEntryAvatarMarkers({ positions: charted, allPositions: charted, candles: live, candleSeconds }),
    ).toMatchObject([
      { positionId: 'a', time: 345 },
      { positionId: 'b', time: 200 },
    ])
  })

  it("clamps the entry into its candle's low–high so the avatar sits on the candle", () => {
    const charted = [position('a', '250', 2500), position('b', '300', 1500)]
    expect(
      marginEntryAvatarMarkers({ positions: charted, allPositions: charted, candles, candleSeconds }),
    ).toMatchObject([
      { positionId: 'a', price: 2100 },
      { positionId: 'b', price: 1900 },
    ])
  })

  it('leaves a lone position on its market unbadged', () => {
    const charted = [position('a', '250')]
    expect(
      marginEntryAvatarMarkers({ positions: charted, allPositions: [elsewhere, ...charted], candles, candleSeconds }),
    ).toEqual([{ positionId: 'a', time: 200, price: 2000 }])
  })
})

describe(MarginEntryAvatarOverlay, () => {
  it('reveals a position on keyboard focus like a hover, and hides it on blur', () => {
    const onHoverPosition = vi.fn()
    render(
      <MarginEntryAvatarOverlay
        points={[{ positionId: 'a', x: 10, y: 10, displayId: 2 }]}
        address="0x0000000000000000000000000000000000000001"
        emphasizedPositionId={undefined}
        onHoverPosition={onHoverPosition}
      />,
    )
    const avatar = screen.getByRole('button', { name: 'Show position #2’s levels on the chart' })
    fireEvent.focus(avatar)
    expect(onHoverPosition).toHaveBeenLastCalledWith('a')
    fireEvent.blur(avatar)
    expect(onHoverPosition).toHaveBeenLastCalledWith(undefined)
  })
})
