import { ChainId } from '@teleswap/smart-order-router'

import { route } from './slice'

test('routing', async () => {
  const result = await route({
    tokenInAddress: '0x5986c8ffadca9cee5c28a85cc3d4f335aab5dc90',
    tokenInChainId: ChainId.OPTIMISTIC_GOERLI,
    tokenInDecimals: 18,
    tokenOutAddress: '0x53b1c6025e3f9b149304cf1b39ee7c577d76c6ca',
    tokenOutChainId: ChainId.OPTIMISTIC_GOERLI,
    tokenOutDecimals: 18,
    amount: '1000000000000000000000',
    type: 'exactOut',
    slippageTolerance: '50'
  })
  console.log('debug joy', result)
}, 100000)
