// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import {
  BridgeProviderLabel,
  BridgeProviderRoutingCaption,
} from '@universe/transactions-ui/src/swap/Routing/BridgeProviderRoutingInfo'
import { describe, expect, it } from 'vitest'

describe('Bridge provider routing views', () => {
  it('renders the logo slot and the vendor name', () => {
    render(<BridgeProviderLabel logo={<span>logo slot</span>} name="Relay API" />)
    expect(screen.getByText('logo slot')).toBeTruthy()
    expect(screen.getByText('Relay API')).toBeTruthy()
  })

  it('renders the caption', () => {
    render(<BridgeProviderRoutingCaption caption="routed via Relay" />)
    expect(screen.getByText('routed via Relay')).toBeTruthy()
  })
})
