import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { ClaimLPFeesRequest, ClaimLPFeesResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { encodeFunctionData } from 'viem'
import { POSITION_MANAGER_ABI } from '../abi'
import { client } from '../client'

export const claimLpFees = async (params: ClaimLPFeesRequest): Promise<ClaimLPFeesResponse> => {
  if (params.tokenId == null) {
    throw new Error('tokenId must be defined')
  }

  if (params.walletAddress == null) {
    throw new Error('Wallet address must be defined')
  }

  // Get current position data from the Position Manager contract
  const currentPosition = (await client.readContract({
    address: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress as `0x${string}`,
    abi: POSITION_MANAGER_ABI,
    functionName: 'positions',
    args: [params.tokenId as unknown as string],
  })) as unknown[]

  // Extract position data
  const [
    nonce,
    operator,
    token0Address,
    token1Address,
    fee,
    tickLower,
    tickUpper,
    currentLiquidity,
    feeGrowthInside0LastX128,
    feeGrowthInside1LastX128,
    tokensOwed0,
    tokensOwed1,
  ] = currentPosition

  // Validate that there are fees to collect
  if (tokensOwed0 === 0n && tokensOwed1 === 0n) {
    throw new Error('No fees available to collect')
  }

  // Optional validation against expected amounts
  if (params.expectedTokenOwed0RawAmount != null && tokensOwed0.toString() !== params.expectedTokenOwed0RawAmount) {
    console.warn(
      `Token0 fees mismatch. Expected: ${params.expectedTokenOwed0RawAmount}, Actual: ${tokensOwed0.toString()}`,
    )
  }

  if (params.expectedTokenOwed1RawAmount != null && tokensOwed1.toString() !== params.expectedTokenOwed1RawAmount) {
    console.warn(
      `Token1 fees mismatch. Expected: ${params.expectedTokenOwed1RawAmount}, Actual: ${tokensOwed1.toString()}`,
    )
  }

  // Prepare collect parameters
  const collectParams = {
    tokenId: params.tokenId,
    recipient: params.walletAddress,
    amount0Max: tokensOwed0, // Collect all available fees for token0
    amount1Max: tokensOwed1, // Collect all available fees for token1
  }

  let calldata: `0x${string}`
  let value: bigint = 0n

  if (params.collectAsWETH) {
    // Use collectAsWETH if one of the tokens is WETH and user wants to collect as WETH
    // First check if either token is WETH
    const WETH_ADDRESS = chainInfo.wrappedNativeCurrency.address as `0x${string}`
    const isToken0WETH = token0Address.toLowerCase() === WETH_ADDRESS.toLowerCase()
    const isToken1WETH = token1Address.toLowerCase() === WETH_ADDRESS.toLowerCase()

    if (isToken0WETH || isToken1WETH) {
      // Use multicall to collect and unwrap WETH
      const collectCalldata = encodeFunctionData({
        abi: [
          {
            name: 'collect',
            type: 'function',
            inputs: [
              {
                name: 'params',
                type: 'tuple',
                components: [
                  { name: 'tokenId', type: 'uint256' },
                  { name: 'recipient', type: 'address' },
                  { name: 'amount0Max', type: 'uint128' },
                  { name: 'amount1Max', type: 'uint128' },
                ],
              },
            ],
            outputs: [
              { name: 'amount0', type: 'uint256' },
              { name: 'amount1', type: 'uint256' },
            ],
          },
        ],
        functionName: 'collect',
        args: [collectParams],
      })

      const unwrapCalldata = encodeFunctionData({
        abi: [
          {
            name: 'unwrapWETH9',
            type: 'function',
            inputs: [
              { name: 'amountMinimum', type: 'uint256' },
              { name: 'recipient', type: 'address' },
            ],
            outputs: [],
          },
        ],
        functionName: 'unwrapWETH9',
        args: [isToken0WETH ? tokensOwed0 : tokensOwed1, params.walletAddress],
      })

      calldata = encodeFunctionData({
        abi: [
          {
            name: 'multicall',
            type: 'function',
            inputs: [{ name: 'data', type: 'bytes[]' }],
            outputs: [{ name: 'results', type: 'bytes[]' }],
          },
        ],
        functionName: 'multicall',
        args: [[collectCalldata, unwrapCalldata]],
      })
    } else {
      // Neither token is WETH, fallback to regular collect
      calldata = encodeFunctionData({
        abi: [
          {
            name: 'collect',
            type: 'function',
            inputs: [
              {
                name: 'params',
                type: 'tuple',
                components: [
                  { name: 'tokenId', type: 'uint256' },
                  { name: 'recipient', type: 'address' },
                  { name: 'amount0Max', type: 'uint128' },
                  { name: 'amount1Max', type: 'uint128' },
                ],
              },
            ],
            outputs: [
              { name: 'amount0', type: 'uint256' },
              { name: 'amount1', type: 'uint256' },
            ],
          },
        ],
        functionName: 'collect',
        args: [collectParams],
      })
    }
  } else {
    // Standard collect function
    calldata = encodeFunctionData({
      abi: [
        {
          name: 'collect',
          type: 'function',
          inputs: [
            {
              name: 'params',
              type: 'tuple',
              components: [
                { name: 'tokenId', type: 'uint256' },
                { name: 'recipient', type: 'address' },
                { name: 'amount0Max', type: 'uint128' },
                { name: 'amount1Max', type: 'uint128' },
              ],
            },
          ],
          outputs: [
            { name: 'amount0', type: 'uint256' },
            { name: 'amount1', type: 'uint256' },
          ],
        },
      ],
      functionName: 'collect',
      args: [collectParams],
    })
  }

  // Prepare the transaction request
  const transactionRequest = await client.prepareTransactionRequest({
    data: calldata,
    to: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress,
    value: value,
    from: params.walletAddress,
    gas: 200000, // Collecting fees typically requires less gas than position management
  })

  let gasFee: string | undefined

  // Simulate transaction if requested
  if (params.simulateTransaction) {
    try {
      const simulationResult = await client.simulateContract({
        address: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress as `0x${string}`,
        abi: [
          {
            name: 'collect',
            type: 'function',
            inputs: [
              {
                name: 'params',
                type: 'tuple',
                components: [
                  { name: 'tokenId', type: 'uint256' },
                  { name: 'recipient', type: 'address' },
                  { name: 'amount0Max', type: 'uint128' },
                  { name: 'amount1Max', type: 'uint128' },
                ],
              },
            ],
            outputs: [
              { name: 'amount0', type: 'uint256' },
              { name: 'amount1', type: 'uint256' },
            ],
          },
        ],
        functionName: 'collect',
        args: [collectParams],
        account: params.walletAddress,
      })

      // Calculate gas fee estimate
      const gasPrice = await client.getGasPrice()
      gasFee = (BigInt(transactionRequest.gas!) * gasPrice).toString()
    } catch (error) {
      console.warn('Transaction simulation failed:', error)
    }
  }

  return {
    claim: transactionRequest,
    gasFee,
  }
}
