// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { EstimatedTime } from '@universe/transactions-ui/src/swap/EstimatedTime/EstimatedTime'
import { describe, expect, it } from 'vitest'

describe('EstimatedTime', () => {
  it('renders the label and the time it is given', () => {
    render(<EstimatedTime contentText="~2min 30s" />)
    expect(screen.getByText('swap.details.estimatedTime')).toBeTruthy()
    expect(screen.getByText('~2min 30s')).toBeTruthy()
  })
})
