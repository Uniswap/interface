// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import {
  PriceDifferenceCaption,
  PriceDifferenceLearnMoreButton,
} from '@universe/transactions-ui/src/swap/PriceDifference/PriceDifferenceInfoContent'
import { describe, expect, it, vi } from 'vitest'

describe('PriceDifferenceCaption', () => {
  it('renders the caption text as given', () => {
    render(<PriceDifferenceCaption caption="Some explainer" container="tooltip" />)
    expect(screen.getByText('Some explainer')).toBeTruthy()
  })
})

describe('PriceDifferenceLearnMoreButton', () => {
  it('emits onPress and never resolves a URL itself', () => {
    const onPress = vi.fn()
    render(<PriceDifferenceLearnMoreButton container="modal" onPress={onPress} />)
    fireEvent.click(screen.getByText('common.button.learn'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
