import { PartialMessage } from '@bufbuild/protobuf'
import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { Balance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { OnChainMapRest } from 'uniswap/src/features/portfolio/portfolioUpdates/rest/fetchOnChainBalancesRest'
import {
  getCurrenciesToUpdate,
  mergeOnChainBalances,
} from 'uniswap/src/features/portfolio/portfolioUpdates/rest/refetchRestQueriesViaOnchainOverrideVariantSaga'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}))

const MOCK_TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890'
const MOCK_OTHER_ADDRESS = '0x9876543210987654321098765432109876543210'
const MOCK_EXISTING_TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111'
const MOCK_NEW_TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222'

const MOCK_BALANCE_2_ETH = '2000000000000000000'
const MOCK_BALANCE_4_ETH = '4000000000000000000'
const MOCK_BALANCE_5_ETH = '5000000000000000000'

describe('mergeOnChainBalances', () => {
  const mockChainId = UniverseChainId.Mainnet
  const mockCurrencyId = buildCurrencyId(mockChainId, MOCK_TOKEN_ADDRESS).toLowerCase()

  it('should return undefined when portfolioData is undefined', () => {
    const onchainBalances = new Map()
    const result = mergeOnChainBalances(undefined, onchainBalances)
    expect(result).toBeUndefined()
  })

  it('should return original portfolioData when no on-chain balances provided', () => {
    const mockPortfolioData: GetPortfolioResponse = {
      portfolio: {
        balances: [
          {
            token: { chainId: mockChainId, address: MOCK_TOKEN_ADDRESS },
            amount: { amount: 2, raw: MOCK_BALANCE_2_ETH },
            valueUsd: 20,
          },
        ],
      },
      clone: jest.fn().mockReturnThis(),
    } as unknown as GetPortfolioResponse

    const onchainBalances = new Map()
    const result = mergeOnChainBalances(mockPortfolioData, onchainBalances)

    expect(result).toBe(mockPortfolioData)
  })

  it('should update USD value when balance changes', () => {
    const portfolioData = {
      balances: [
        {
          token: { chainId: mockChainId, address: MOCK_TOKEN_ADDRESS },
          amount: { amount: 2, raw: MOCK_BALANCE_2_ETH },
          valueUsd: 20,
        },
      ],
    }

    const mockPortfolioData: GetPortfolioResponse = {
      portfolio: portfolioData,
      clone: jest.fn().mockReturnValue({
        portfolio: portfolioData,
      }),
    } as unknown as GetPortfolioResponse

    const onchainBalance: PartialMessage<Balance> = {
      amount: { amount: 4, raw: MOCK_BALANCE_4_ETH },
    }
    const onchainBalances: OnChainMapRest = new Map([[mockCurrencyId, onchainBalance]])

    const result = mergeOnChainBalances(mockPortfolioData, onchainBalances)

    expect(result?.portfolio?.balances[0]?.valueUsd).toBe(40)
    expect(result?.portfolio?.balances[0]?.amount?.amount).toBe(4)
    expect(result?.portfolio?.balances[0]?.amount?.raw).toBe(MOCK_BALANCE_4_ETH)
  })

  it('should not update USD value when balance has no valueUsd', () => {
    const portfolioData = {
      balances: [
        {
          token: { chainId: mockChainId, address: MOCK_TOKEN_ADDRESS },
          amount: { amount: 2, raw: MOCK_BALANCE_2_ETH },
          valueUsd: undefined,
        },
      ],
    }

    const mockPortfolioData: GetPortfolioResponse = {
      portfolio: portfolioData,
      clone: jest.fn().mockReturnValue({
        portfolio: portfolioData,
      }),
    } as unknown as GetPortfolioResponse

    const onchainBalance: PartialMessage<Balance> = {
      amount: { amount: 4, raw: MOCK_BALANCE_4_ETH },
    }
    const onchainBalances: OnChainMapRest = new Map([[mockCurrencyId, onchainBalance]])

    const result = mergeOnChainBalances(mockPortfolioData, onchainBalances)

    expect(result?.portfolio?.balances[0]?.valueUsd).toBeUndefined()
    expect(result?.portfolio?.balances[0]?.amount?.amount).toBe(4)
  })

  it('should add new balances for tokens not in portfolio', () => {
    const newCurrencyId = buildCurrencyId(mockChainId, MOCK_NEW_TOKEN_ADDRESS).toLowerCase()

    const portfolioData = {
      balances: [
        {
          token: { chainId: mockChainId, address: MOCK_EXISTING_TOKEN_ADDRESS },
          amount: { amount: 2, raw: MOCK_BALANCE_2_ETH },
          valueUsd: 20,
        },
      ],
    }

    const mockPortfolioData: GetPortfolioResponse = {
      portfolio: portfolioData,
      clone: jest.fn().mockReturnValue({
        portfolio: portfolioData,
      }),
    } as unknown as GetPortfolioResponse

    const newOnchainBalance: PartialMessage<Balance> = {
      token: { chainId: mockChainId, address: MOCK_NEW_TOKEN_ADDRESS },
      amount: { amount: 5, raw: MOCK_BALANCE_5_ETH },
      valueUsd: 50,
    }
    const onchainBalances: OnChainMapRest = new Map([[newCurrencyId, newOnchainBalance]])

    const result = mergeOnChainBalances(mockPortfolioData, onchainBalances)

    expect(result?.portfolio?.balances).toHaveLength(2)
    expect(result?.portfolio?.balances[1]?.token?.address).toBe(MOCK_NEW_TOKEN_ADDRESS)
    expect(result?.portfolio?.balances[1]?.amount?.amount).toBe(5)
    expect(result?.portfolio?.balances[1]?.valueUsd).toBe(50)
  })

  it('should remove balances that become zero', () => {
    const portfolioData = {
      balances: [
        {
          token: { chainId: mockChainId, address: MOCK_TOKEN_ADDRESS },
          amount: { amount: 2, raw: MOCK_BALANCE_2_ETH },
          valueUsd: 20,
        },
        {
          token: { chainId: mockChainId, address: MOCK_OTHER_ADDRESS },
          amount: { amount: 5, raw: MOCK_BALANCE_5_ETH },
          valueUsd: 50,
        },
      ],
    }

    const mockPortfolioData: GetPortfolioResponse = {
      portfolio: portfolioData,
      clone: jest.fn().mockReturnValue({
        portfolio: portfolioData,
      }),
    } as unknown as GetPortfolioResponse

    const zeroBalance: PartialMessage<Balance> = { amount: { amount: 0, raw: '0' } }

    const onchainBalances: OnChainMapRest = new Map([[mockCurrencyId, zeroBalance]])

    const result = mergeOnChainBalances(mockPortfolioData, onchainBalances)

    expect(result?.portfolio?.balances).toHaveLength(1)
    expect(result?.portfolio?.balances[0]?.token?.address).toBe(MOCK_OTHER_ADDRESS)
    expect(result?.portfolio?.balances[0]?.amount?.amount).toBe(5)
  })

  it('should handle balances without token information', () => {
    const portfolioData = {
      balances: [
        {
          token: undefined, // missing token info
          amount: { amount: 2, raw: MOCK_BALANCE_2_ETH },
          valueUsd: 20,
        },
        {
          token: { chainId: undefined, address: MOCK_TOKEN_ADDRESS }, // missing chainId
          amount: { amount: 2, raw: MOCK_BALANCE_2_ETH },
          valueUsd: 20,
        },
        {
          token: { chainId: mockChainId, address: undefined }, // missing address
          amount: { amount: 2, raw: MOCK_BALANCE_2_ETH },
          valueUsd: 20,
        },
      ],
    }

    const mockPortfolioData: GetPortfolioResponse = {
      portfolio: portfolioData,
      clone: jest.fn().mockReturnValue({
        portfolio: portfolioData,
      }),
    } as unknown as GetPortfolioResponse

    const onchainBalance: PartialMessage<Balance> = {
      amount: { amount: 4, raw: MOCK_BALANCE_4_ETH },
    }
    const onchainBalances: OnChainMapRest = new Map([[mockCurrencyId, onchainBalance]])

    const result = mergeOnChainBalances(mockPortfolioData, onchainBalances)

    // Should skip all balances without proper token info
    expect(result?.portfolio?.balances[0]?.amount?.amount).toBe(2)
    expect(result?.portfolio?.balances[1]?.amount?.amount).toBe(2)
    expect(result?.portfolio?.balances[2]?.amount?.amount).toBe(2)
  })
})

describe('getCurrenciesToUpdate', () => {
  it('should return null when transaction is not from active address', () => {
    const mockTransaction: TransactionDetails = {
      from: MOCK_OTHER_ADDRESS,
      addingFunds: false,
      typeInfo: {
        type: TransactionType.Swap,
      },
      status: TransactionStatus.Pending,
    } as unknown as TransactionDetails

    const result = getCurrenciesToUpdate(mockTransaction, MOCK_TOKEN_ADDRESS)
    expect(result).toBeNull()
  })

  it('should return null when active address is null', () => {
    const mockTransaction: TransactionDetails = {
      from: MOCK_TOKEN_ADDRESS,
      addingFunds: false,
      typeInfo: {
        type: TransactionType.Swap,
      },
      status: TransactionStatus.Pending,
    } as unknown as TransactionDetails

    const result = getCurrenciesToUpdate(mockTransaction, null)
    expect(result).toBeNull()
  })
})
