import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount, Fraction } from '@uniswap/sdk-core'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { useLiquidityPositionDropdownOptions } from '~/features/Liquidity/hooks/useLiquidityPositionDropdownOptions'
import { useReportPositionHandler } from '~/features/Liquidity/hooks/useReportPositionHandler'
import { useAccount } from '~/hooks/useAccount'
import { useSelectChain } from '~/hooks/useSelectChain'
import { useAppDispatch } from '~/state/hooks'
import { mocked } from '~/test-utils/mocked'
import { renderHook } from '~/test-utils/render'

vi.mock('~/state/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/hooks')>()),
  useAppDispatch: vi.fn(),
}))

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => vi.fn(),
}))

vi.mock('~/hooks/useAccount', () => ({ useAccount: vi.fn() }))
vi.mock('~/hooks/useSelectChain', () => ({ useSelectChain: vi.fn() }))
vi.mock('~/features/Liquidity/hooks/useReportPositionHandler', () => ({
  useReportPositionHandler: vi.fn(),
}))

function buildPosition(overrides: Partial<PositionInfo> = {}): PositionInfo {
  return {
    poolId: 'pool-eth-usdc',
    tokenId: '1',
    chainId: UniverseChainId.Mainnet,
    version: ProtocolVersion.V3,
    status: PositionStatus.IN_RANGE,
    currency0Amount: CurrencyAmount.fromRawAmount(USDC_MAINNET, '0'),
    currency1Amount: CurrencyAmount.fromRawAmount(DAI, '0'),
    fee0Amount: new Fraction(0),
    fee1Amount: new Fraction(0),
    ...overrides,
  } as unknown as PositionInfo
}

describe('useLiquidityPositionDropdownOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useAppDispatch).mockReturnValue(vi.fn())
    mocked(useAccount).mockReturnValue({ chainId: UniverseChainId.Mainnet } as ReturnType<typeof useAccount>)
    mocked(useSelectChain).mockReturnValue(vi.fn() as unknown as ReturnType<typeof useSelectChain>)
    mocked(useReportPositionHandler).mockReturnValue(vi.fn())
  })

  it('returns only the View Pool Info option when readOnly', () => {
    const { result } = renderHook(() =>
      useLiquidityPositionDropdownOptions({
        liquidityPosition: buildPosition({
          fee0Amount: CurrencyAmount.fromRawAmount(USDC_MAINNET, '1000'),
        }),
        showVisibilityOption: true,
        isVisible: true,
        readOnly: true,
      }),
    )

    expect(result.current.map((option) => option.label)).toEqual(['Pool info'])
  })

  it('includes write actions when not readOnly', () => {
    const { result } = renderHook(() =>
      useLiquidityPositionDropdownOptions({
        liquidityPosition: buildPosition({
          fee0Amount: CurrencyAmount.fromRawAmount(USDC_MAINNET, '1000'),
        }),
        showVisibilityOption: true,
        isVisible: true,
        readOnly: false,
      }),
    )

    const labels = result.current.map((option) => option.label)
    expect(labels).toContain('Collect fees')
    expect(labels).toContain('Add liquidity')
    expect(labels).toContain('Remove liquidity')
    expect(labels).toContain('Pool info')
    expect(labels).toContain('Hide position')
  })
})
