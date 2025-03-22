import { BigNumber } from '@ethersproject/bignumber'
import { Currency, CurrencyAmount, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from '@uniswap/sdk-core'
import { Pool } from '@uniswap/v3-sdk'
import { useAccount } from 'hooks/useAccount'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useEffect, useState } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { unwrappedToken } from 'utils/unwrappedToken'
import { assume0xAddress } from 'utils/wagmi'
import { erc721Abi } from 'viem'
import { useReadContract } from 'wagmi'

const MAX_UINT128 = BigNumber.from(2).pow(128).sub(1)

// compute current + counterfactual fees for a v3 position
export function useV3PositionFees(
  pool?: Pool,
  tokenId?: BigNumber,
  asWETH = false,
): [CurrencyAmount<Currency>, CurrencyAmount<Currency>] | [undefined, undefined] {
  const positionManager = useV3NFTPositionManagerContract(false)

  const { chainId } = useAccount()

  const { data: owner } = useReadContract({
    address: assume0xAddress(NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId ?? UniverseChainId.Mainnet]),
    abi: erc721Abi,
    functionName: 'ownerOf',
    args: tokenId ? [tokenId.toBigInt()] : undefined,
  })

  const tokenIdHexString = tokenId?.toHexString()
  const latestBlockNumber = useBlockNumber()

  // we can't use multicall for this because we need to simulate the call from a specific address
  // latestBlockNumber is included to ensure data stays up-to-date every block
  const [amounts, setAmounts] = useState<[BigNumber, BigNumber] | undefined>()
  useEffect(() => {
    ;(async function getFees() {
      if (positionManager && tokenIdHexString && owner) {
        try {
          const results = await positionManager.callStatic.collect(
            {
              tokenId: tokenIdHexString,
              recipient: owner, // some tokens might fail if transferred to address(0)
              amount0Max: MAX_UINT128,
              amount1Max: MAX_UINT128,
            },
            { from: owner }, // need to simulate the call as the owner
          )
          setAmounts([results.amount0, results.amount1])
        } catch {
          // If the static call fails, the default state will remain for `amounts`.
          // This case is handled by returning unclaimed fees as empty.
          // TODO(WEB-2283): Look into why we have failures with call data being 0x.
        }
      }
    })()
  }, [positionManager, tokenIdHexString, owner, latestBlockNumber])

  if (pool && amounts) {
    return [
      CurrencyAmount.fromRawAmount(asWETH ? pool.token0 : unwrappedToken(pool.token0), amounts[0].toString()),
      CurrencyAmount.fromRawAmount(asWETH ? pool.token1 : unwrappedToken(pool.token1), amounts[1].toString()),
    ]
  } else {
    return [undefined, undefined]
  }
}
