import { CHAIN_IDS_TO_NAMES, useIsSupportedChainIdCallback } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useSupportedChainIds } from 'hooks/useSupportedChainIds'
import { useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { Flex, Popover } from 'ui/src'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { UniverseChainId } from 'uniswap/src/types/chains'

type ChainSelectorProps = {
  hideArrow?: boolean
}
export const ChainSelector = ({ hideArrow }: ChainSelectorProps) => {
  const account = useAccount()
  const { chainId, setSelectedChainId, multichainUXEnabled } = useSwapAndLimitContext()

  const popoverRef = useRef<Popover>(null)
  const isSupportedChain = useIsSupportedChainIdCallback()
  const selectChain = useSelectChain()
  const [searchParams, setSearchParams] = useSearchParams()

  const { supported: supportedChains } = useSupportedChainIds()

  const onSelectChain = useCallback(
    async (targetChainId: UniverseChainId | null) => {
      if (multichainUXEnabled || !targetChainId) {
        setSelectedChainId(targetChainId)
      } else {
        await selectChain(targetChainId)
      }
      searchParams.delete('inputCurrency')
      searchParams.delete('outputCurrency')
      searchParams.delete('value')
      searchParams.delete('field')
      targetChainId && searchParams.set('chain', CHAIN_IDS_TO_NAMES[targetChainId])
      setSearchParams(searchParams)

      popoverRef.current?.close()
    },
    [multichainUXEnabled, setSelectedChainId, selectChain, searchParams, setSearchParams],
  )

  const isUnsupportedConnectedChain = account.isConnected && !isSupportedChain(account.chainId)

  return (
    <Flex px="$spacing8">
      <NetworkFilter
        selectedChain={chainId ?? null}
        onPressChain={onSelectChain}
        showUnsupportedConnectedChainWarning={isUnsupportedConnectedChain}
        hideArrow={hideArrow}
        chainIds={supportedChains}
        styles={{
          sticky: true,
        }}
      />
    </Flex>
  )
}
