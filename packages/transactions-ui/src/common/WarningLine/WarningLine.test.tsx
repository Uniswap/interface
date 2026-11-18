// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { WarningLine } from '@universe/transactions-ui/src/common/WarningLine/WarningLine'
import { describe, expect, it, vi } from 'vitest'

describe('WarningLine', () => {
  it('renders the message, with or without a tooltip', () => {
    render(<WarningLine level="warning" message="High slippage" />)
    expect(screen.getByText('High slippage')).toBeTruthy()
    render(<WarningLine level="warning" message="High deadline" tooltip="Hover text" />)
    expect(screen.getByText('High deadline')).toBeTruthy()
  })

  it('renders the message alone when the icon is null', () => {
    const { container } = render(<WarningLine Icon={null} layout="center" level="info" message="No quotes found" />)
    expect(screen.getByText('No quotes found')).toBeTruthy()
    expect(container.querySelectorAll('svg')).toHaveLength(0)
  })

  it('is not pressable without onPress', () => {
    render(<WarningLine layout="start" level="warning" message="High price impact" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('reports a press', () => {
    const onPress = vi.fn()
    render(<WarningLine layout="center" level="warning" message="High price impact" onPress={onPress} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
