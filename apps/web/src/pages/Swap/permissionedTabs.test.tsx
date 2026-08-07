import { SwapTab } from 'uniswap/src/types/screens/interface'
import { buildSwapTabOptions, isTabPermissionedBlocked } from '~/pages/Swap/permissionedTabs'

describe('isTabPermissionedBlocked', () => {
  it('blocks Limit when the Limit/Swap pair is blocked', () => {
    expect(isTabPermissionedBlocked(SwapTab.Limit, { limitBlocked: true, buySellBlocked: false })).toBe(true)
  })

  it('blocks Buy and Sell when the Buy/Sell pair is blocked', () => {
    expect(isTabPermissionedBlocked(SwapTab.Buy, { limitBlocked: false, buySellBlocked: true })).toBe(true)
    expect(isTabPermissionedBlocked(SwapTab.Sell, { limitBlocked: false, buySellBlocked: true })).toBe(true)
  })

  it('never blocks Swap or Send — Swap hosts the Verify Identity path, Send is out of scope', () => {
    expect(isTabPermissionedBlocked(SwapTab.Swap, { limitBlocked: true, buySellBlocked: true })).toBe(false)
    expect(isTabPermissionedBlocked(SwapTab.Send, { limitBlocked: true, buySellBlocked: true })).toBe(false)
  })

  it('does not bleed one pair’s block onto the other tab group', () => {
    // Limit blocked must not disable Buy/Sell, and vice versa.
    expect(isTabPermissionedBlocked(SwapTab.Buy, { limitBlocked: true, buySellBlocked: false })).toBe(false)
    expect(isTabPermissionedBlocked(SwapTab.Limit, { limitBlocked: false, buySellBlocked: true })).toBe(false)
  })
})

describe('buildSwapTabOptions', () => {
  const TABS = [SwapTab.Swap, SwapTab.Limit, SwapTab.Buy, SwapTab.Sell] as const

  const build = (blockedTabs: SwapTab[], syncTabToUrl = true) =>
    buildSwapTabOptions({
      tabs: TABS,
      currentTab: SwapTab.Swap,
      syncTabToUrl,
      getTabLabel: (tab) => tab,
      isTabBlocked: (tab) => blockedTabs.includes(tab),
    })

  it('marks blocked tabs disabled and leaves the rest enabled', () => {
    const options = build([SwapTab.Limit, SwapTab.Buy, SwapTab.Sell])

    const byValue = Object.fromEntries(options.map((o) => [o.value, o]))
    expect(byValue[SwapTab.Swap].disabled).toBe(false)
    expect(byValue[SwapTab.Limit].disabled).toBe(true)
    expect(byValue[SwapTab.Buy].disabled).toBe(true)
    expect(byValue[SwapTab.Sell].disabled).toBe(true)
  })

  it('drops the href on a disabled tab so the anchor can’t navigate past the gate', () => {
    const options = build([SwapTab.Limit])
    const byValue = Object.fromEntries(options.map((o) => [o.value, o]))

    // Enabled tabs keep their link target when syncing to URL.
    expect(byValue[SwapTab.Swap].href).toBe(`/${SwapTab.Swap}`)
    // Disabled tab has no href.
    expect(byValue[SwapTab.Limit].href).toBeUndefined()
  })

  it('omits href entirely when not syncing to URL, regardless of disabled state', () => {
    const options = build([SwapTab.Limit], false)
    expect(options.every((o) => o.href === undefined)).toBe(true)
  })

  it('greys a disabled tab to $neutral3, distinct from active and inactive colors', () => {
    // A custom `display` element bypasses SegmentedControl's built-in disabled text color, so the
    // disabled tab must carry the dimmed token itself. Read the color prop off the Text element
    // directly (no render) to avoid needing a Tamagui theme provider in a logic-only test.
    const options = build([SwapTab.Limit])
    const byValue = Object.fromEntries(options.map((o) => [o.value, o]))
    const colorOf = (tab: SwapTab): unknown =>
      (byValue[tab].display as React.ReactElement<{ color?: unknown }>).props.color

    // currentTab is Swap → $neutral1; Buy is an enabled inactive tab → $neutral2; Limit is disabled → $neutral3.
    expect(colorOf(SwapTab.Swap)).toBe('$neutral1')
    expect(colorOf(SwapTab.Buy)).toBe('$neutral2')
    expect(colorOf(SwapTab.Limit)).toBe('$neutral3')
  })

  it('removes the hover-brighten on a disabled tab', () => {
    const options = build([SwapTab.Limit])
    const byValue = Object.fromEntries(options.map((o) => [o.value, o]))
    const hoverOf = (tab: SwapTab): unknown =>
      (byValue[tab].display as React.ReactElement<{ hoverStyle?: unknown }>).props.hoverStyle

    expect(hoverOf(SwapTab.Limit)).toBeUndefined()
    expect(hoverOf(SwapTab.Buy)).toEqual({ color: '$neutral1' })
  })
})
