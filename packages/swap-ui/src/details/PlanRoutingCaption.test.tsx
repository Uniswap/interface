// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlanStepLogoKind } from '../types'
import { PlanRoutingCaption, PlanStepLogo } from './PlanRoutingCaption'

describe('PlanRoutingCaption', () => {
  it('renders every step logo and one separator fewer', () => {
    render(
      <PlanRoutingCaption
        stepLogos={[<span key="a">step a</span>, <span key="b">step b</span>, <span key="c">step c</span>]}
        stepSeparator={<span>sep</span>}
      />,
    )
    expect(screen.getAllByText(/^step/)).toHaveLength(3)
    expect(screen.getAllByText('sep')).toHaveLength(2)
    expect(screen.getByText('swap.details.routingInfo.plan')).toBeTruthy()
  })

  it('renders nothing between steps for a single step', () => {
    render(<PlanRoutingCaption stepLogos={[<span key="only">only</span>]} stepSeparator={<span>sep</span>} />)
    expect(screen.queryByText('sep')).toBeNull()
  })
})

describe('PlanStepLogo', () => {
  it('renders both logos for a bridge step', () => {
    render(<PlanStepLogo kind={PlanStepLogoKind.Bridge} inputLogo={<span>in</span>} outputLogo={<span>out</span>} />)
    expect(screen.getByText('in')).toBeTruthy()
    expect(screen.getByText('out')).toBeTruthy()
  })

  it('renders only the input logo for an approval step', () => {
    render(<PlanStepLogo kind={PlanStepLogoKind.Approval} inputLogo={<span>in</span>} outputLogo={<span>out</span>} />)
    expect(screen.getByText('in')).toBeTruthy()
    expect(screen.queryByText('out')).toBeNull()
  })
})
