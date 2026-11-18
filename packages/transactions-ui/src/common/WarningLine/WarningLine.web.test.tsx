// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { OctagonExclamation } from '@universe/mycelium/icons/OctagonExclamation'
import { WarningLine } from '@universe/transactions-ui/src/common/WarningLine/WarningLine'
import { describe, expect, it } from 'vitest'

// Web DOM assertions (svg counts): the native leg renders through react-native-web and does
// not produce them.
describe('WarningLine (web DOM)', () => {
  it('renders the message with the alert triangle by default', () => {
    const { container } = render(<WarningLine layout="start" level="critical" message="Insufficient ETH balance" />)
    expect(screen.getByText('Insufficient ETH balance')).toBeTruthy()
    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })

  it('renders an icon override in the centered layout', () => {
    const { container } = render(
      <WarningLine Icon={OctagonExclamation} layout="center" level="warning" message="High price impact" />,
    )
    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })
})
