import { shouldCollapseTabBar } from '~/pages/Swap/hooks/useTabBarOverflow'

describe('shouldCollapseTabBar', () => {
  it('keeps the tabs expanded when they fit with room to spare', () => {
    expect(shouldCollapseTabBar({ naturalTabsWidth: 300, rightContentWidth: 40, containerWidth: 480 })).toBe(false)
  })

  it('collapses when the tabs plus right content overflow the container', () => {
    expect(shouldCollapseTabBar({ naturalTabsWidth: 320, rightContentWidth: 40, containerWidth: 360 })).toBe(true)
  })

  it('keeps the tabs expanded when they fit exactly at the minimum gap', () => {
    // 312 + 8 (MIN_TAB_BAR_GAP) + 40 === 360: fits, no collapse
    expect(shouldCollapseTabBar({ naturalTabsWidth: 312, rightContentWidth: 40, containerWidth: 360 })).toBe(false)
  })

  it('collapses one pixel past the minimum gap', () => {
    expect(shouldCollapseTabBar({ naturalTabsWidth: 313, rightContentWidth: 40, containerWidth: 360 })).toBe(true)
  })
})
