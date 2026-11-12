import { render, waitFor } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { MemoryRouter, useLocation } from 'react-router'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { useResumeMarginPlanFromUrl } from '~/pages/Swap/Margin/hooks/useResumeMarginPlanFromUrl'

const ACCOUNT = '0x00000000000000000000000000000000000000a1'

const mocks = vi.hoisted(() => ({
  chainId: 1 as number | undefined,
  isConnected: true,
  localPlanIds: ['plan-123'],
  selectChain: vi.fn().mockResolvedValue(true),
  refetch: vi.fn(),
}))

vi.mock('~/connection/hooks/useAccount', () => ({
  useAccount: () => ({
    address: mocks.isConnected ? ACCOUNT : undefined,
    chainId: mocks.chainId,
    isConnected: mocks.isConnected,
  }),
}))
vi.mock('~/state/useStateRehydrated', () => ({ useStateRehydrated: () => true }))
vi.mock('~/state/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      transactions: {
        [ACCOUNT]: {
          [MARGIN_CHAIN_ID]: Object.fromEntries(
            mocks.localPlanIds.map((planId) => [
              planId,
              { id: planId, typeInfo: { type: TransactionType.Plan, planId } },
            ]),
          ),
        },
      },
    }),
}))
vi.mock('~/connection/hooks/useSelectChain', () => ({ useSelectChain: () => mocks.selectChain }))
vi.mock('wagmi', () => ({
  useConnectorClient: ({ chainId }: { chainId: number }) => ({
    data: mocks.chainId === chainId ? {} : undefined,
    refetch: mocks.refetch,
  }),
}))

function renderHarness(resumePlan: () => Promise<void>): { search: () => string; rerender: () => void } {
  let search = ''
  function Harness(): null {
    useResumeMarginPlanFromUrl(resumePlan)
    search = useLocation().search
    return null
  }
  const tree = (): JSX.Element => (
    <MemoryRouter initialEntries={['/margin?resumePlan=plan-123']}>
      <Harness />
    </MemoryRouter>
  )
  const { rerender } = render(tree())
  return { search: () => search, rerender: () => rerender(tree()) }
}

describe(useResumeMarginPlanFromUrl, () => {
  beforeEach(() => {
    mocks.isConnected = true
    mocks.localPlanIds = ['plan-123']
    mocks.selectChain.mockClear()
    mocks.refetch.mockClear()
  })

  it('resumes the plan named in the URL once and drops the param', async () => {
    mocks.chainId = MARGIN_CHAIN_ID
    const resumePlan = vi.fn().mockResolvedValue(undefined)
    const { search } = renderHarness(resumePlan)

    await waitFor(() => expect(search()).toBe(''))
    expect(resumePlan).toHaveBeenCalledExactlyOnceWith({ planId: 'plan-123' })
  })

  it('drops a link to a plan missing from the wallet’s local activity without switching or resuming', async () => {
    mocks.chainId = UniverseChainId.Base
    mocks.localPlanIds = []
    const resumePlan = vi.fn().mockResolvedValue(undefined)
    const { search } = renderHarness(resumePlan)

    await waitFor(() => expect(search()).toBe(''))
    expect(mocks.selectChain).not.toHaveBeenCalled()
    expect(resumePlan).not.toHaveBeenCalled()
  })

  it('switches a wallet on another chain first and keeps the param until it lands', async () => {
    mocks.chainId = UniverseChainId.Base
    const resumePlan = vi.fn().mockResolvedValue(undefined)
    const { search, rerender } = renderHarness(resumePlan)

    expect(mocks.selectChain).toHaveBeenCalledWith(MARGIN_CHAIN_ID)
    expect(resumePlan).not.toHaveBeenCalled()
    expect(search()).toBe('?resumePlan=plan-123')

    mocks.chainId = MARGIN_CHAIN_ID
    rerender()
    await waitFor(() => expect(resumePlan).toHaveBeenCalledExactlyOnceWith({ planId: 'plan-123' }))
  })

  it('switches a wallet on an unsupported network, whose chain reads as undefined', () => {
    mocks.chainId = undefined
    renderHarness(vi.fn().mockResolvedValue(undefined))

    expect(mocks.selectChain).toHaveBeenCalledWith(MARGIN_CHAIN_ID)
  })

  it('refetches the margin-chain wallet client once the switch lands', async () => {
    mocks.chainId = UniverseChainId.Base
    renderHarness(vi.fn().mockResolvedValue(undefined))

    await waitFor(() => expect(mocks.refetch).toHaveBeenCalled())
  })

  it('leaves a disconnected wallet alone', () => {
    mocks.chainId = undefined
    mocks.isConnected = false
    const resumePlan = vi.fn().mockResolvedValue(undefined)
    const { search } = renderHarness(resumePlan)

    expect(mocks.selectChain).not.toHaveBeenCalled()
    expect(resumePlan).not.toHaveBeenCalled()
    expect(search()).toBe('?resumePlan=plan-123')
  })
})
