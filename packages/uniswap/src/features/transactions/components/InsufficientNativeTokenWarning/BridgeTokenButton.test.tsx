import { UniverseChainId } from '@universe/chains'
import type { ReactNode } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { BridgeTokenButton } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/BridgeTokenButton'
import { renderWithProviders } from 'uniswap/src/test/render'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const mockButton = vi.hoisted(() => vi.fn(({ children }: { children?: ReactNode }) => children))
const mockButtonText = vi.hoisted(() => vi.fn(({ children }: { children?: ReactNode }) => children))
vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  Button: Object.assign(mockButton, { Text: mockButtonText }),
}))

const chainId = UniverseChainId.Robinhood
const outputToken = {
  currency: { chainId, symbol: 'ETH', name: 'Robinhood ETH', isNative: true },
  currencyId: buildCurrencyId(chainId, getNativeAddress(chainId)),
  logoUrl: undefined,
} as unknown as CurrencyInfo
const inputToken = {
  currency: { chainId: UniverseChainId.Mainnet, symbol: 'ETH', name: 'Ether', isNative: true },
  currencyId: buildCurrencyId(UniverseChainId.Mainnet, getNativeAddress(UniverseChainId.Mainnet)),
  logoUrl: undefined,
} as unknown as CurrencyInfo

function lastButtonProps(): { emphasis?: string; backgroundColor?: string; className?: string } {
  return mockButton.mock.lastCall?.[0] as { emphasis?: string; backgroundColor?: string; className?: string }
}

function lastButtonTextProps(): { color?: string } {
  return mockButtonText.mock.lastCall?.[0] as { color?: string }
}

function renderButton(props?: { usesNeutralTheme?: boolean }): void {
  renderWithProviders(
    <BridgeTokenButton
      inputToken={inputToken}
      outputToken={outputToken}
      outputNetworkName="Robinhood Chain"
      {...props}
    />,
  )
}

describe(BridgeTokenButton, () => {
  beforeEach(() => {
    mockButton.mockClear()
    mockButtonText.mockClear()
  })

  it('renders the accent button with white text by default', () => {
    renderButton()

    expect(lastButtonProps()).toMatchObject({ emphasis: 'text-only', backgroundColor: '$accent1' })
    expect(lastButtonTextProps().color).toBe('$white')
  })

  it('renders the neutral secondary button when usesNeutralTheme is set', () => {
    renderButton({ usesNeutralTheme: true })

    expect(lastButtonProps()).toMatchObject({ emphasis: 'secondary' })
    expect(lastButtonProps().backgroundColor).toBeUndefined()
    expect(lastButtonProps().className).toBeUndefined()
    expect(lastButtonTextProps().color).toBeUndefined()
  })
})
