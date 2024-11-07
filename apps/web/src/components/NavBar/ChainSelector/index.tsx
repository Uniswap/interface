import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { Flex, Popover } from 'ui/src'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains, useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

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

  const { chains } = useEnabledChains()

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
      targetChainId && searchParams.set('chain', getChainInfo(targetChainId).interfaceName)
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
        chainIds={chains}
        styles={{
          sticky: true,
        }}
      />
    </Flex>
  )
}
