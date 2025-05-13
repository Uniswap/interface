import { PermitMethod, PermitTypedData } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'

export const mockPermit = {
  method: PermitMethod.TypedData,
  typedData: {
    domain: {
      name: 'Uniswap',
      version: '1.0',
      chainId: 1,
      verifyingContract: '0x123',
    },
    types: {
      real: 'data',
    },
    values: {
      such: 'permit',
    },
  },
} satisfies PermitTypedData
