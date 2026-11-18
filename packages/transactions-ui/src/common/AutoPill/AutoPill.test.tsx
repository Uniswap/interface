// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { AutoPill } from '@universe/transactions-ui/src/common/AutoPill/AutoPill'
import { describe, expect, it } from 'vitest'

describe('AutoPill', () => {
  it('renders the label it is given', () => {
    render(<AutoPill label="Auto" />)
    expect(screen.getByText('Auto')).toBeTruthy()
  })
})
