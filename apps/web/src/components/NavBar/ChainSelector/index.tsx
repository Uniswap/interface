import { ChainLogo } from 'components/Logo/ChainLogo'
import ChainSelectorRow from 'components/NavBar/ChainSelector/ChainSelectorRow'
import { NavDropdown } from 'components/NavBar/NavDropdown/NavDropdown'
import { NavIcon } from 'components/NavBar/NavIcon'
import { CHAIN_IDS_TO_NAMES, useIsSupportedChainIdCallback } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useConnectedWalletSupportedChains } from 'hooks/useConnectedWalletSupportedChains'
import useSelectChain from 'hooks/useSelectChain'
import { useSupportedChainIds } from 'hooks/useSupportedChainIds'
import { useTheme } from 'lib/styled-components'
import { useCallback, useRef, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { Flex, Popover } from 'ui/src'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfaceChainId, UniverseChainId } from 'uniswap/src/types/chains'

type ChainSelectorProps = {
  isNavSelector?: boolean
  hideArrow?: boolean
}
export const ChainSelector = ({ isNavSelector, hideArrow }: ChainSelectorProps) => {
  const account = useAccount()
  const { chainId, setSelectedChainId, multichainUXEnabled } = useSwapAndLimitContext()
  // multichainFlagEnabled is different from multichainUXEnabled, multichainUXEnabled applies to swap
  // flag can be true but multichainUXEnabled can be false (TDP page)
  const multichainFlagEnabled = useFeatureFlag(FeatureFlags.MultichainUX)

  const theme = useTheme()
  const popoverRef = useRef<Popover>(null)
  const connectedWalletSupportedChains = useConnectedWalletSupportedChains()
  const isSupportedChain = useIsSupportedChainIdCallback()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const selectChain = useSelectChain()
  const [searchParams, setSearchParams] = useSearchParams()

  const { supported: supportedChains, unsupported: unsupportedChains } = useSupportedChainIds()

  const [pendingChainId, setPendingChainId] = useState<InterfaceChainId | undefined>(undefined)

  const onSelectChain = useCallback(
    async (targetChainId: UniverseChainId | null) => {
      if (multichainUXEnabled || !targetChainId) {
        setSelectedChainId(targetChainId)
      } else {
        setPendingChainId(targetChainId)
        await selectChain(targetChainId)
        setPendingChainId(undefined)
      }
      searchParams.delete('inputCurrency')
      searchParams.delete('outputCurrency')
      searchParams.delete('value')
      searchParams.delete('field')
      targetChainId && searchParams.set('chain', CHAIN_IDS_TO_NAMES[targetChainId])
      setSearchParams(searchParams)

      setIsOpen(false)
      popoverRef.current?.close()
    },
    [multichainUXEnabled, setSelectedChainId, selectChain, searchParams, setSearchParams],
  )

  const isUnsupportedConnectedChain = account.isConnected && !isSupportedChain(account.chainId)

  if (multichainFlagEnabled) {
    return (
      <Flex px={8}>
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

  const menuLabel =
    isUnsupportedConnectedChain || !chainId ? (
      <AlertTriangle size={20} color={theme.neutral2} />
    ) : (
      <ChainLogo chainId={chainId} size={20} testId="chain-selector-logo" />
    )

  return (
    <Popover ref={popoverRef} placement="bottom" stayInFrame allowFlip onOpenChange={setIsOpen}>
      <Popover.Trigger padding={8} cursor="pointer" data-testid="chain-selector">
        {isNavSelector ? <NavIcon isActive={isOpen}>{menuLabel}</NavIcon> : menuLabel}
      </Popover.Trigger>
      <NavDropdown width={240} isOpen={isOpen}>
        <Flex p="$spacing8" data-testid="chain-selector-options">
          {supportedChains.map((selectorChain) => (
            <ChainSelectorRow
              disabled={!connectedWalletSupportedChains.includes(selectorChain)}
              onSelectChain={onSelectChain}
              targetChain={selectorChain}
              key={selectorChain}
              isPending={selectorChain === pendingChainId}
            />
          ))}
          {unsupportedChains.map((selectorChain) => (
            <ChainSelectorRow disabled targetChain={selectorChain} key={selectorChain} isPending={false} />
          ))}
        </Flex>
      </NavDropdown>
    </Popover>
  )
}
