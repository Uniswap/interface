import { useListTransactions } from 'uniswap/src/features/dataApi/listTransactions/listTransactions'
import { useRecentTransfersByAddress } from 'uniswap/src/features/send/useRecentTransfersByAddress'
import {
  approveTransactionInfo,
  sendTokenTransactionInfo,
  transactionDetails,
} from 'uniswap/src/test/fixtures/wallet/transactions'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/features/dataApi/listTransactions/listTransactions')

const CHECKSUMMED_RECIPIENT = '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a'
const OTHER_CHECKSUMMED_RECIPIENT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const INVALID_EVM_LIKE_RECIPIENT = `0x${'z'.repeat(40)}`

describe(useRecentTransfersByAddress, () => {
  it('returns checksummed recipients while preserving order, counts, and invalid-address fallback', () => {
    vi.mocked(useListTransactions).mockReturnValue({
      data: [
        transactionDetails({
          typeInfo: sendTokenTransactionInfo({ recipient: `  ${CHECKSUMMED_RECIPIENT.toLowerCase().slice(2)}  ` }),
        }),
        transactionDetails({ typeInfo: sendTokenTransactionInfo({ recipient: CHECKSUMMED_RECIPIENT }) }),
        transactionDetails({
          typeInfo: sendTokenTransactionInfo({ recipient: OTHER_CHECKSUMMED_RECIPIENT.toLowerCase() }),
        }),
        transactionDetails({ typeInfo: sendTokenTransactionInfo({ recipient: '  not-an-address  ' }) }),
        transactionDetails({ typeInfo: sendTokenTransactionInfo({ recipient: 'not-an-address' }) }),
        transactionDetails({
          typeInfo: sendTokenTransactionInfo({ recipient: `  ${INVALID_EVM_LIKE_RECIPIENT}  ` }),
        }),
        transactionDetails({ typeInfo: approveTransactionInfo() }),
      ],
      loading: false,
      isFetching: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })

    const { result } = renderHook(() => useRecentTransfersByAddress('0x0000000000000000000000000000000000000001'))

    expect(result.current).toEqual({
      transfers: [
        { address: CHECKSUMMED_RECIPIENT, count: 2 },
        { address: OTHER_CHECKSUMMED_RECIPIENT, count: 1 },
        { address: 'not-an-address', count: 2 },
        { address: INVALID_EVM_LIKE_RECIPIENT, count: 1 },
      ],
      loading: false,
    })
  })
})
