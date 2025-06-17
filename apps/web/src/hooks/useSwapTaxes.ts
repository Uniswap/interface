import { Percent } from '@uniswap/sdk-core'
import { WETH_ADDRESS as getWethAddress } from '@uniswap/universal-router-sdk'
import { BIPS_BASE, ZERO_PERCENT } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import { useContract } from 'hooks/useContract'
import { useEffect, useState } from 'react'
import FOT_DETECTOR_ABI from 'uniswap/src/abis/fee-on-transfer-detector.json'
import { FeeOnTransferDetector } from 'uniswap/src/abis/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'

// TODO(WEB-4058): Move all of these contract addresses into the top-level wagmi config
function getFeeOnTransferAddress(chainId?: UniverseChainId) {
  switch (chainId) {
    case UniverseChainId.Mainnet:
      return '0x19C97dc2a25845C7f9d1d519c8C2d4809c58b43f'
    case UniverseChainId.Optimism:
      return '0xa7c17505B43955A474fb6AFE61E093907a7567c9'
    case UniverseChainId.Bnb:
      return '0x331f6D0AAB4A1F039f0d75A613a7F1593DbDE1BB'
    case UniverseChainId.Polygon:
      return '0x92bCCCb6c8c199AAcA38408621E38Ab6dBfA00B5'
    case UniverseChainId.Base:
      return '0x331f6D0AAB4A1F039f0d75A613a7F1593DbDE1BB'
    case UniverseChainId.ArbitrumOne:
      return '0x64CF365CC5CCf5E64380bc05Acd5df7D0618c118'
    case UniverseChainId.Celo:
      return '0x3dfF0145E68a5880EAbE8F56b6Bc30C4AdCF3413'
    case UniverseChainId.Avalanche:
      return '0xBF2B9F6A6eCc4541b31ab2dCF8156D33644Ca3F3'
    default:
      return undefined
  }
}

function useFeeOnTransferDetectorContract(chainId?: UniverseChainId): FeeOnTransferDetector | null {
  const account = useAccount()
  const contract = useContract<FeeOnTransferDetector>({
    address: getFeeOnTransferAddress(chainId),
    ABI: FOT_DETECTOR_ABI,
    withSignerIfPossible: true,
    chainId,
  })

  useEffect(() => {
    if (contract && account.address) {
      sendAnalyticsEvent(InterfaceEventName.WalletProviderUsed, {
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

async function getSwapTaxes({
  fotDetector,
  inputTokenAddress,
  outputTokenAddress,
  chainId,
}: {
  fotDetector: FeeOnTransferDetector
  inputTokenAddress?: string
  outputTokenAddress?: string
  chainId: UniverseChainId
}) {
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
export function useSwapTaxes({
  inputTokenAddress,
  outputTokenAddress,
  tokenChainId,
}: {
  inputTokenAddress?: string
  outputTokenAddress?: string
  tokenChainId?: UniverseChainId
}) {
  const account = useAccount()
  const chainId = tokenChainId ?? account.chainId
  const fotDetector = useFeeOnTransferDetectorContract(chainId)
  const [{ inputTax, outputTax }, setTaxes] = useState({ inputTax: ZERO_PERCENT, outputTax: ZERO_PERCENT })

  useEffect(() => {
    if (!fotDetector || !chainId) {
      return
    }
    getSwapTaxes({ fotDetector, inputTokenAddress, outputTokenAddress, chainId }).then(setTaxes)
  }, [fotDetector, inputTokenAddress, outputTokenAddress, chainId])

  return { inputTax, outputTax }
}
