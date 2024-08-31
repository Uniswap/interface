import { showTestnetsAtom } from 'components/AccountDrawer/TestnetsToggle'
import { ChainLogo } from 'components/Logo/ChainLogo'
import ChainSelectorRow from 'components/NavBar/ChainSelector/ChainSelectorRow'
import { NavDropdown } from 'components/NavBar/NavDropdown/NavDropdown'
import { NavIcon } from 'components/NavBar/NavIcon'
import { CONNECTION } from 'components/Web3Provider/constants'
import {
  ALL_CHAIN_IDS,
  CHAIN_IDS_TO_NAMES,
  TESTNET_CHAIN_IDS,
  getChainPriority,
  useIsSupportedChainIdCallback,
} from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useAtomValue } from 'jotai/utils'
import { useTheme } from 'lib/styled-components'
import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { Flex, Popover } from 'ui/src'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfaceChainId, UniverseChainId } from 'uniswap/src/types/chains'
import { Connector } from 'wagmi'

type WalletConnectConnector = Connector & {
  type: typeof CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID
  getNamespaceChainsIds: () => InterfaceChainId[]
}

function useWalletSupportedChains(): InterfaceChainId[] {
  const { connector } = useAccount()

  switch (connector?.type) {
    case CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID:
    case CONNECTION.WALLET_CONNECT_CONNECTOR_ID:
      // Wagmi currently offers no way to discriminate a Connector as a WalletConnect connector providing access to getNamespaceChainsIds.
      return (connector as WalletConnectConnector).getNamespaceChainsIds?.().length
        ? (connector as WalletConnectConnector).getNamespaceChainsIds?.()
        : ALL_CHAIN_IDS
    default:
      return ALL_CHAIN_IDS
  }
}

type ChainSelectorProps = {
  isNavSelector?: boolean
  hideArrow?: boolean
}
export const ChainSelector = ({ isNavSelector, hideArrow }: ChainSelectorProps) => {
  const { chainId, setSelectedChainId, multichainUXEnabled } = useSwapAndLimitContext()
  // multichainFlagEnabled is different from multichainUXEnabled, multichainUXEnabled applies to swap
  // flag can be true but multichainUXEnabled can be false (TDP page)
  const multichainFlagEnabled = useFeatureFlag(FeatureFlags.MultichainUX)

  const theme = useTheme()
  const popoverRef = useRef<Popover>(null)
  const walletSupportsChain = useWalletSupportedChains()
  const isSupportedChain = useIsSupportedChainIdCallback()
  const showTestnets = useAtomValue(showTestnetsAtom)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const selectChain = useSelectChain()
  const [searchParams, setSearchParams] = useSearchParams()

  const [supportedChains, unsupportedChains] = useMemo(() => {
    const { supported, unsupported } = ALL_CHAIN_IDS.filter((chain: number) => {
      return isSupportedChain(chain) && (showTestnets || !TESTNET_CHAIN_IDS.includes(chain))
    })
      .sort((a, b) => getChainPriority(a) - getChainPriority(b))
      .reduce(
        (acc, chain) => {
          if (walletSupportsChain.includes(chain)) {
            acc.supported.push(chain)
          } else {
            acc.unsupported.push(chain)
          }
          return acc
        },
        { supported: [], unsupported: [] } as Record<string, InterfaceChainId[]>,
      )
    return [supported, unsupported]
  }, [isSupportedChain, showTestnets, walletSupportsChain])

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

  const menuLabel = !chainId ? (
    <AlertTriangle size={20} color={theme.neutral2} />
  ) : (
    <ChainLogo chainId={chainId} size={20} testId="chain-selector-logo" />
  )

  // NetworkFilter modified to use WEB_SUPPORTED_CHAIN_IDS instead of WALLET_SUPPORTED_CHAIN_IDS
  if (multichainFlagEnabled) {
    return (
      <Flex px={8}>
        <NetworkFilter
          selectedChain={chainId ?? null}
          onPressChain={onSelectChain}
          hideArrow={hideArrow}
          styles={{
            sticky: true,
          }}
        />
      </Flex>
    )
  }

  const hideUnsupportedChains = true

  // TODO: the following prompts switching chain, while the former allows selecting another chain
  //  and switching only when when sending the transaction.
  return (
    <Popover ref={popoverRef} placement="bottom" stayInFrame allowFlip onOpenChange={setIsOpen}>
      <Popover.Trigger padding={8} cursor="pointer" data-testid="chain-selector">
        {isNavSelector ? <NavIcon isActive={isOpen}>{menuLabel}</NavIcon> : menuLabel}
      </Popover.Trigger>
      <NavDropdown width={240} isOpen={isOpen}>
        <Flex p="$spacing8" data-testid="chain-selector-options">
          {supportedChains.map((selectorChain) => (
            <ChainSelectorRow
              disabled={!walletSupportsChain.includes(selectorChain)}
              onSelectChain={onSelectChain}
              targetChain={selectorChain}
              key={selectorChain}
              isPending={selectorChain === pendingChainId}
            />
          ))}
          {!hideUnsupportedChains && (
            unsupportedChains.map((selectorChain) => (
              <ChainSelectorRow
                disabled
                onSelectChain={() => undefined}
                targetChain={selectorChain}
                key={selectorChain}
                isPending={false}
              />
            ))
          )}
        </Flex>
      </NavDropdown>
    </Popover>
  )
}
