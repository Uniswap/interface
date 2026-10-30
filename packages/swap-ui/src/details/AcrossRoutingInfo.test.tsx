// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AcrossApiLabel, AcrossPoweredBy, AcrossRoutingCaption, AcrossRoutingRow } from './AcrossRoutingInfo'

describe('Across routing views', () => {
  it('renders the row slots', () => {
    render(<AcrossRoutingRow info={<span>info slot</span>} apiInfo={<span>api slot</span>} />)
    expect(screen.getByText('info slot')).toBeTruthy()
    expect(screen.getByText('api slot')).toBeTruthy()
  })

  it('renders the API label and the caption copy', () => {
    render(<AcrossApiLabel />)
    expect(screen.getByText('Across API')).toBeTruthy()
    render(<AcrossRoutingCaption />)
    expect(screen.getByText('swap.details.orderRoutingInfo')).toBeTruthy()
  })

  it('renders the powered-by slots', () => {
    render(<AcrossPoweredBy learnMoreLink={<span>learn</span>} logo={<span>logo</span>} />)
    expect(screen.getByText('swap.details.poweredBy')).toBeTruthy()
    expect(screen.getByText('learn')).toBeTruthy()
    expect(screen.getByText('logo')).toBeTruthy()
  })
})
