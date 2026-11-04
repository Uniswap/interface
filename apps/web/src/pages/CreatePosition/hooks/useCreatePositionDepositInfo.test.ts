import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import {
  type CreatePositionDepositInfoArgs,
  useCreatePositionDepositInfo,
} from '~/pages/CreatePosition/hooks/useCreatePositionDepositInfo'
import type { DepositInfo } from '~/types/liquidity'
import { PositionField } from '~/types/position'

const mocks = vi.hoisted(() => ({ depositInfo: {} as DepositInfo }))

vi.mock('~/features/Liquidity/Create/hooks/useDepositInfo', () => ({
  useDepositInfo: () => mocks.depositInfo,
}))
vi.mock('~/pages/CreatePosition/hooks/usePreEstimatedCreatePositionGas', () => ({
  usePreEstimatedCreatePositionGas: () => ({ gasFee: undefined }),
}))

const WBTC = new Token(UniverseChainId.Base, '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c', 8, 'WBTC')
const CBBTC = new Token(UniverseChainId.Base, '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', 8, 'cbBTC')

function setAmounts(raw0: string, raw1: string, error?: string): void {
  const amounts: { [field in PositionField]: CurrencyAmount<Currency> } = {
    [PositionField.TOKEN0]: CurrencyAmount.fromRawAmount(WBTC, raw0),
    [PositionField.TOKEN1]: CurrencyAmount.fromRawAmount(CBBTC, raw1),
  }
  mocks.depositInfo = { currencyAmounts: amounts, error }
}

function renderInputError(overrides: Partial<CreatePositionDepositInfoArgs> = {}): unknown {
  const args: CreatePositionDepositInfoArgs = {
    evmAddress: undefined,
    protocolVersion: ProtocolVersion.V2,
    currencies: { display: { [PositionField.TOKEN0]: WBTC, [PositionField.TOKEN1]: CBBTC } },
    ticks: [undefined, undefined],
    poolOrPair: undefined,
    poolId: undefined,
    depositState: { exactField: PositionField.TOKEN0, exactAmounts: { [PositionField.TOKEN0]: '0.00000609' } },
    creatingPoolOrPair: true,
    ...overrides,
  }
  return renderHook(() => useCreatePositionDepositInfo(args)).result.current.inputError
}

describe('useCreatePositionDepositInfo', () => {
  it('blocks a new v2 pair whose first deposit is below MINIMUM_LIQUIDITY (reported repro amounts)', () => {
    setAmounts('609', '608')
    expect(renderInputError()).toBe('Amounts too small to create a v2 pool')
  })

  it('allows a new v2 pair whose first deposit clears MINIMUM_LIQUIDITY', () => {
    setAmounts('1001', '1001')
    expect(renderInputError()).toBeUndefined()
  })

  it('does not apply the floor when adding to an existing v2 pair', () => {
    setAmounts('609', '608')
    expect(renderInputError({ creatingPoolOrPair: false })).toBeUndefined()
  })

  it('does not apply the v2 floor to v3 or v4 pools', () => {
    setAmounts('609', '608')
    expect(renderInputError({ protocolVersion: ProtocolVersion.V3 })).toBeUndefined()
    expect(renderInputError({ protocolVersion: ProtocolVersion.V4 })).toBeUndefined()
  })

  it('keeps an existing deposit error ahead of the floor', () => {
    setAmounts('609', '608', 'Insufficient WBTC balance')
    expect(renderInputError()).toBe('Insufficient WBTC balance')
  })
})
