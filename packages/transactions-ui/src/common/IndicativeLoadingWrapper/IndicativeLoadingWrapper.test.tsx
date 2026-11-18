// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { IndicativeLoadingWrapper } from '@universe/transactions-ui/src/common/IndicativeLoadingWrapper/IndicativeLoadingWrapper'
import { describe, expect, it } from 'vitest'

describe('IndicativeLoadingWrapper', () => {
  it('renders its children when not loading', () => {
    render(<IndicativeLoadingWrapper>value</IndicativeLoadingWrapper>)
    expect(screen.getByText('value')).toBeTruthy()
  })

  it('replaces its children with the skeleton while loading', () => {
    render(<IndicativeLoadingWrapper loading>value</IndicativeLoadingWrapper>)
    expect(screen.queryByText('value')).toBeNull()
  })
})
