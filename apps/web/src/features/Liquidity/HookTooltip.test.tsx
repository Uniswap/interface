import { HookEntry, HookFlags } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { shortenAddress } from 'utilities/src/addresses'
import { describe, expect, it } from 'vitest'
import { HookTooltip } from '~/features/Liquidity/HookTooltip'
import { render, screen } from '~/test-utils/render'

const BASE_HOOK = new HookEntry({
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chain: 'Base',
  chainId: 8453,
  name: 'TestHook',
  description: 'Adjusts LP fees dynamically',
  verifiedSource: true,
  flags: new HookFlags({ beforeSwap: true, afterSwap: true }),
})

describe('HookTooltip', () => {
  it('renders the full hook name', () => {
    render(<HookTooltip hookEntry={BASE_HOOK} />)
    expect(screen.getByText('TestHook')).toBeTruthy()
  })

  it('renders the address middle-ellipsized, not in full', () => {
    render(<HookTooltip hookEntry={BASE_HOOK} />)
    const ellipsized = shortenAddress({ address: BASE_HOOK.address, chars: 9, charsEnd: 6 })
    expect(ellipsized).toContain('...')
    expect(screen.getByText(ellipsized)).toBeTruthy()
    expect(screen.queryByText(BASE_HOOK.address)).toBeNull()
  })

  it('falls back to shortened address when name is empty', () => {
    const hookNoName = new HookEntry({
      ...BASE_HOOK,
      name: '',
    })
    render(<HookTooltip hookEntry={hookNoName} />)
    expect(screen.queryByText('TestHook')).toBeNull()
    expect(screen.getAllByText(/0x1234/).length).toBeGreaterThan(0)
  })

  it('does not render richer details — those live in the details dialog', () => {
    render(<HookTooltip hookEntry={BASE_HOOK} />)
    expect(screen.queryByText('Base')).toBeNull()
    expect(screen.queryByText('Adjusts LP fees dynamically')).toBeNull()
    expect(screen.queryByText('beforeSwap')).toBeNull()
  })
})
