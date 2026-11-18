// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { SettingsStepButton } from '@universe/transactions-ui/src/common/SettingsStepButton/SettingsStepButton'
import { describe, expect, it, vi } from 'vitest'

describe('SettingsStepButton', () => {
  it('reports the press', () => {
    const onPress = vi.fn()
    render(<SettingsStepButton direction="increment" disabled={false} testID="step" onPress={onPress} />)
    fireEvent.click(screen.getByTestId('step'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('ignores presses while disabled', () => {
    const onPress = vi.fn()
    render(<SettingsStepButton disabled direction="decrement" testID="step" onPress={onPress} />)
    fireEvent.click(screen.getByTestId('step'))
    expect(onPress).not.toHaveBeenCalled()
  })
})
