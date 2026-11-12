import { fireEvent } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { Mock } from 'vitest'
import { useActiveAddresses } from '~/connection/accounts/hooks'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { SelectStepError } from '~/features/Liquidity/Create/SelectTokenStep'
import { mocked } from '~/test-utils/mocked'
import { render } from '~/test-utils/render'

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

vi.mock('~/connection/accounts/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/connection/accounts/hooks')>()),
  useActiveAddresses: vi.fn(),
}))

vi.mock('~/features/Liquidity/Create/CreateLiquidityContextProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Liquidity/Create/CreateLiquidityContextProvider')>()),
  useCreateLiquidityContext: vi.fn(),
}))

const EVM_ADDRESS = '0x52A6c53869Ce09a731CD772f245b97A4401d3348'
const SVM_ADDRESS = '5oNDL3swdJJF1g9DzJiZ4ynHXgszjAEpUkxVYejchzrY'

function renderSolanaTokenError() {
  return render(
    <SelectStepError
      isUnsupportedTokenSelected={true}
      unsupportedChainId={UniverseChainId.Solana}
      protocolVersion={ProtocolVersion.V4}
    />,
  )
}

describe('SelectStepError', () => {
  beforeEach(() => {
    mocked(useCreateLiquidityContext).mockReturnValue({
      setPositionState: vi.fn(),
    } as unknown as ReturnType<typeof useCreateLiquidityContext>)
  })

  it('shows dual-VM copy when connected on both EVM and SVM', () => {
    mocked(useActiveAddresses).mockReturnValue({ evmAddress: EVM_ADDRESS, svmAddress: SVM_ADDRESS })

    const { getByText } = renderSolanaTokenError()

    expect(getByText('Solana pools are not supported.')).toBeInTheDocument()
    expect(getByText('To create a pool, select a token on an EVM chain.')).toBeInTheDocument()
  })

  it('shows switch-chain copy when connected on EVM only', () => {
    mocked(useActiveAddresses).mockReturnValue({ evmAddress: EVM_ADDRESS, svmAddress: undefined })

    const { getByText } = renderSolanaTokenError()

    expect(getByText('Solana pools are not supported.')).toBeInTheDocument()
    expect(getByText('To create a pool, switch to a supported EVM chain.')).toBeInTheDocument()
  })

  it('shows switch-chain copy when connected on SVM only', () => {
    mocked(useActiveAddresses).mockReturnValue({ evmAddress: undefined, svmAddress: SVM_ADDRESS })

    const { getByText } = renderSolanaTokenError()

    expect(getByText('To create a pool, switch to a supported EVM chain.')).toBeInTheDocument()
  })

  it('shows switch-chain copy when no wallet is connected', () => {
    mocked(useActiveAddresses).mockReturnValue({ evmAddress: undefined, svmAddress: undefined })

    const { getByText } = renderSolanaTokenError()

    expect(getByText('To create a pool, switch to a supported EVM chain.')).toBeInTheDocument()
  })

  describe('fee-on-transfer v2 fallback', () => {
    const FOT_TOKEN = { currency: { symbol: 'FOT' } } as CurrencyInfo

    function renderFotError(pathname: string): { setPositionState: Mock } {
      const setPositionState = vi.fn()
      mocked(useCreateLiquidityContext).mockReturnValue({ setPositionState } as unknown as ReturnType<
        typeof useCreateLiquidityContext
      >)
      mocked(useActiveAddresses).mockReturnValue({ evmAddress: EVM_ADDRESS, svmAddress: undefined })
      globalThis.window.history.replaceState(null, '', pathname)
      render(
        <SelectStepError
          isUnsupportedTokenSelected={false}
          protocolVersion={ProtocolVersion.V4}
          fotToken={FOT_TOKEN}
        />,
      )
      return { setPositionState }
    }

    function pressCta(): void {
      fireEvent.click(globalThis.document.querySelectorAll('[role="button"], button')[0])
    }

    it('switches version in place on the create leg, without navigating', () => {
      const { setPositionState } = renderFotError('/positions/add/new')

      pressCta()

      expect(setPositionState).toHaveBeenCalledTimes(1)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    // Migration hides the deposit step and an existing v2 pair skips straight to it, so switching in
    // place there renders nothing and strands the user with no next action.
    it('starts a fresh v2 create when the caller is the migration flow', () => {
      renderFotError('/migrate/v3/ethereum/123')

      pressCta()

      expect(mockNavigate).toHaveBeenCalledWith('/positions/add/new?protocolVersion=v2')
    })

    // Same reasoning for an existing pool: there is no v2 form to switch into on that route.
    it('starts a fresh v2 create when the caller is an existing pool', () => {
      renderFotError('/positions/add/ethereum/0xpool')

      pressCta()

      expect(mockNavigate).toHaveBeenCalledWith('/positions/add/new?protocolVersion=v2')
    })
  })
})
