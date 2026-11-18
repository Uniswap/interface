// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { EstimatedTime } from '@universe/transactions-ui/src/swap/EstimatedTime/EstimatedTime'
import { describe, expect, it } from 'vitest'

// Web DOM assertions (svg counts, test ids on icons, class names, keyboard): the native leg
// renders through react-native-web and does not produce them.
describe('EstimatedTime (web DOM)', () => {
  it('shows the stopwatch only when asked', () => {
    const { container, unmount } = render(<EstimatedTime contentText="~2min" />)
    expect(container.querySelector('svg')).toBeNull()
    unmount()
    const withIcon = render(<EstimatedTime showIcon contentText="~2min" />)
    expect(withIcon.container.querySelector('svg')).toBeTruthy()
  })
})
