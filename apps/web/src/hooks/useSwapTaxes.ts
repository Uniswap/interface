import { InterfaceEventName } from '@uniswap/analytics-events'
import { Percent } from '@uniswap/sdk-core'
import { WETH_ADDRESS as getWethAddress } from '@uniswap/universal-router-sdk'
import { BIPS_BASE, ZERO_PERCENT } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import { useContract } from 'hooks/useContract'
import { useEffect, useState } from 'react'
import FOT_DETECTOR_ABI from 'uniswap/src/abis/fee-on-transfer-detector.json'
import { FeeOnTransferDetector } from 'uniswap/src/abis/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'

// TODO(WEB-4058): Move all of these contract addresses into the top-level wagmi config
function getFeeOnTransferAddress(chainId?: UniverseChainId) {
  switch (chainId) {
    case UniverseChainId.Mainnet:
      return '0x19C97dc2a25845C7f9d1d519c8C2d4809c58b43f'
    default:
      return undefined
  }
}

function useFeeOnTransferDetectorContract(chainId?: UniverseChainId): FeeOnTransferDetector | null {
  const account = useAccount()
  const contract = useContract<FeeOnTransferDetector>(getFeeOnTransferAddress(chainId), FOT_DETECTOR_ABI, true, chainId)

  useEffect(() => {
    if (contract && account.address) {
      sendAnalyticsEvent(InterfaceEventName.WALLET_PROVIDER_USED, {
        source: 'useFeeOnTransferDetectorContract',
        contract: {
          name: 'FeeOnTransferDetector',
          address: getFeeOnTransferAddress(chainId),
        },
      })
    }
  }, [account.address, chainId, contract])
  return contract
}

const AMOUNT_TO_BORROW = 10000 // smallest amount that has full precision over bps

const FEE_CACHE: { [address in string]?: { sellTax?: Percent; buyTax?: Percent } } = {}

async function getSwapTaxes(
  fotDetector: FeeOnTransferDetector,
  inputTokenAddress: string | undefined,
  outputTokenAddress: string | undefined,
  chainId: UniverseChainId,
) {
  const addresses = []
  if (inputTokenAddress && FEE_CACHE[inputTokenAddress] === undefined) {
    addresses.push(inputTokenAddress)
  }

  if (outputTokenAddress && FEE_CACHE[outputTokenAddress] === undefined) {
    addresses.push(outputTokenAddress)
  }

  try {
    if (addresses.length) {
      const data = await fotDetector.callStatic.batchValidate(addresses, getWethAddress(chainId), AMOUNT_TO_BORROW)

      addresses.forEach((address, index) => {
        const { sellFeeBps, buyFeeBps } = data[index]
        const sellTax = new Percent(sellFeeBps.toNumber(), BIPS_BASE)
        const buyTax = new Percent(buyFeeBps.toNumber(), BIPS_BASE)

        FEE_CACHE[address] = { sellTax, buyTax }
      })
    }
  } catch (e) {
    logger.warn('useSwapTaxes', 'getSwapTaxes', 'Failed to get swap taxes for token(s):', addresses, e)
  }

  const inputTax = (inputTokenAddress ? FEE_CACHE[inputTokenAddress]?.sellTax : ZERO_PERCENT) ?? ZERO_PERCENT
  const outputTax = (outputTokenAddress ? FEE_CACHE[outputTokenAddress]?.buyTax : ZERO_PERCENT) ?? ZERO_PERCENT

  return { inputTax, outputTax }
}

// Use the buyFeeBps/sellFeeBps fields from Token GQL query where possible instead of this hook
export function useSwapTaxes(inputTokenAddress?: string, outputTokenAddress?: string, tokenChainId?: UniverseChainId) {
  const account = useAccount()
  const chainId = tokenChainId ?? account.chainId
  const fotDetector = useFeeOnTransferDetectorContract(chainId)
  const [{ inputTax, outputTax }, setTaxes] = useState({ inputTax: ZERO_PERCENT, outputTax: ZERO_PERCENT })

  useEffect(() => {
    if (!fotDetector || !chainId) {
      return
    }
    getSwapTaxes(fotDetector, inputTokenAddress, outputTokenAddress, chainId).then(setTaxes)
  }, [fotDetector, inputTokenAddress, outputTokenAddress, chainId])

  return { inputTax, outputTax }
}
