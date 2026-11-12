import { focusManager } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { ClaimFeesResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { TestID } from '@universe/test'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { type TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { sleep } from 'utilities/src/time/timing'
import { ClaimFeeModal } from '~/features/Liquidity/ClaimFeeModal'
import { useAppDispatch } from '~/state/hooks'
import { liquiditySaga } from '~/state/sagas/liquidity/liquiditySaga'
import { mocked } from '~/test-utils/mocked'
import { act, render, screen, waitFor } from '~/test-utils/render'

const WALLET_ADDRESS = '0x0000000000000000000000000000000000000001'
const CALLDATA_ERROR_DESCRIPTION = /error fetching data required for your transaction/i

const mocks = vi.hoisted(() => ({
  claimFees: vi.fn(),
  // The render helper shares one QueryClient across tests; a fresh key per test keeps cached calldata from leaking.
  queryKeySuffix: 0,
}))

vi.mock('uniswap/src/data/apiClients/liquidityService/liquidityQueries', () => ({
  liquidityQueries: {
    claimFees: ({ params, ...rest }: { params: unknown; enabled?: boolean }) => ({
      queryKey: ['claimFees', mocks.queryKeySuffix, params],
      queryFn: mocks.claimFees,
      retry: false,
      staleTime: 0,
      ...rest,
    }),
  },
}))
vi.mock('~/hooks/useModalInitialState', () => ({
  useModalInitialState: () => ({
    version: ProtocolVersion.V4,
    chainId: 1,
    tokenId: '1',
    isPermissioned: false,
    currency0Amount: CurrencyAmount.fromRawAmount(DAI, '1000000000000000000'),
    currency1Amount: CurrencyAmount.fromRawAmount(USDC_MAINNET, '1000000'),
    fee0Amount: CurrencyAmount.fromRawAmount(DAI, '1000000000000000'),
    fee1Amount: CurrencyAmount.fromRawAmount(USDC_MAINNET, '1000'),
  }),
}))
vi.mock('~/hooks/useModalState', () => ({ useModalState: () => ({ isOpen: true, closeModal: vi.fn() }) }))
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('uniswap/src/features/wallet/hooks/useWallet', () => ({
  useWallet: () => ({ evmAccount: { accountType: AccountType.SignerMnemonic, address: WALLET_ADDRESS } }),
}))
vi.mock('~/connection/hooks/useAccount', () => ({
  useAccount: () => ({ chainId: 1, isConnected: true, connector: { id: 'injected' } }),
}))
vi.mock('~/connection/hooks/useSelectChain', () => ({ useSelectChain: () => vi.fn() }))
vi.mock('@universe/embedded-wallet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/embedded-wallet')>()),
  useGetPasskeyAuthStatus: () => ({
    isSignedInWithPasskey: false,
    isSessionAuthenticated: false,
    needsPasskeySignin: false,
  }),
}))
vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({ useUSDCValue: () => undefined }))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfo: () => undefined }))
vi.mock('~/state/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/hooks')>()),
  useAppDispatch: vi.fn(),
}))

const dispatch = vi.fn()

type TriggerParams = Parameters<typeof liquiditySaga.actions.trigger>[0]

function claimResponse(): ClaimFeesResponse {
  return new ClaimFeesResponse({
    claim: {
      from: WALLET_ADDRESS,
      to: '0x0000000000000000000000000000000000000002',
      chainId: 1,
      value: '0',
      data: '0x1234',
    },
  })
}

async function refocusWindow(): Promise<void> {
  await act(async () => {
    focusManager.setFocused(false)
    focusManager.setFocused(true)
    await sleep(50)
  })
}

async function submitCollect(): Promise<TriggerParams> {
  const button = await screen.findByTestId(TestID.ClaimFees)
  await waitFor(() => expect(button).not.toBeDisabled())
  act(() => {
    button.click()
  })
  await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(1))
  const { payload: params } = dispatch.mock.calls[0]?.[0] as ReturnType<typeof liquiditySaga.actions.trigger>
  act(() => {
    params.setCurrentStep({
      step: { type: TransactionStepType.CollectFeesTransactionStep } as TransactionStep,
      accepted: false,
    })
  })
  return params
}

describe('ClaimFeeModal calldata refetching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.queryKeySuffix += 1
    mocks.claimFees.mockResolvedValue(claimResponse())
    mocked(useAppDispatch).mockReturnValue(dispatch)
  })

  afterEach(() => {
    focusManager.setFocused(undefined)
  })

  it('refetches the calldata when the window regains focus before the collect starts', async () => {
    render(<ClaimFeeModal />)
    await waitFor(() => expect(mocks.claimFees).toHaveBeenCalledTimes(1))

    await refocusWindow()

    await waitFor(() => expect(mocks.claimFees).toHaveBeenCalledTimes(2))
  })

  it('shows the calldata error when a refocus refetch fails before the collect starts', async () => {
    render(<ClaimFeeModal />)
    await waitFor(() => expect(mocks.claimFees).toHaveBeenCalledTimes(1))
    mocks.claimFees.mockRejectedValue(new Error('no fees to collect'))

    await refocusWindow()

    await waitFor(() => expect(mocks.claimFees).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(CALLDATA_ERROR_DESCRIPTION)).toBeInTheDocument()
  })

  it('does not refetch or show a calldata error when the window refocuses while the collect is in the wallet', async () => {
    render(<ClaimFeeModal />)
    await submitCollect()
    // A collect that already landed leaves nothing to claim, so a re-simulation would fail.
    mocks.claimFees.mockRejectedValue(new Error('no fees to collect'))

    await refocusWindow()

    expect(mocks.claimFees).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(CALLDATA_ERROR_DESCRIPTION)).not.toBeInTheDocument()
  })

  it('fetches fresh calldata again once the wallet rejects the collect', async () => {
    render(<ClaimFeeModal />)
    const params = await submitCollect()
    await refocusWindow()
    expect(mocks.claimFees).toHaveBeenCalledTimes(1)

    act(() => {
      params.onFailure()
    })

    await waitFor(() => expect(mocks.claimFees).toHaveBeenCalledTimes(2))
  })
})
