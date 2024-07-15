import { showTestnetsAtom } from 'components/AccountDrawer/TestnetsToggle'
import Column from 'components/Column'
import { DropdownSelector, StyledMenuContent } from 'components/DropdownSelector'
import { ChainLogo } from 'components/Logo/ChainLogo'
import ChainSelectorRow from 'components/NavBar/ChainSelector/ChainSelectorRow'
import { NavDropdown } from 'components/NavBar/NavDropdown/NavDropdown'
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
import { t } from 'i18n'
import { useAtomValue } from 'jotai/utils'
import styled, { css, useTheme } from 'lib/styled-components'
import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useSwapAndLimitContext } from 'state/swap/hooks'
import { Flex, Popover } from 'ui/src'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfaceChainId, UniverseChainId } from 'uniswap/src/types/chains'
import { Connector } from 'wagmi'

const StyledDropdownButton = css`
  display: flex;
  flex-direction: row;
  padding: 10px 8px;
  background: none;
  gap: 4px;
  border: none;
  & ${StyledMenuContent} {
    gap: 4px;
  }
`
const ChainsList = styled(Column)`
  width: 240px;
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.xs}px) {
    width: 100%;
  }
`
const styledMobileMenuCss = css`
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.xs}px) {
    bottom: 50px;
  }
`
const ChainsDropdownWrapper = styled(Column)`
  padding: 8px;
`

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

export const ChainSelector = ({ leftAlign }: { leftAlign?: boolean }) => {
  const { chainId, setSelectedChainId, multichainUXEnabled } = useSwapAndLimitContext()
  // multichainFlagEnabled is different from multichainUXEnabled, multichainUXEnabled applies to swap
  // flag can be true but multichainUXEnabled can be false (TDP page)
  const multichainFlagEnabled = useFeatureFlag(FeatureFlags.MultichainUX)

  const theme = useTheme()
  const popoverRef = useRef<Popover>(null)
  const walletSupportsChain = useWalletSupportedChains()
  const isSupportedChain = useIsSupportedChainIdCallback()
  const showTestnets = useAtomValue(showTestnetsAtom)
  const navRefreshEnabled = useFeatureFlag(FeatureFlags.NavRefresh)
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
      targetChainId && searchParams.set('chain', CHAIN_IDS_TO_NAMES[targetChainId])
      setSearchParams(searchParams)

      setIsOpen(false)
      popoverRef.current?.close()
    },
    [multichainUXEnabled, setSelectedChainId, selectChain, searchParams, setSearchParams],
  )

  const styledMenuCss = css`
    ${leftAlign ? 'left: 0;' : 'right: 0;'}
    ${styledMobileMenuCss};
  `

  const menuLabel = !chainId ? (
    <AlertTriangle size={20} color={theme.neutral2} />
  ) : (
    <ChainLogo chainId={chainId} size={20} testId="chain-selector-logo" />
  )

  if (multichainFlagEnabled) {
    return (
      <Flex px={4}>
        <NetworkFilter includeAllNetworks selectedChain={chainId ?? null} onPressChain={onSelectChain} />
      </Flex>
    )
  }

  if (navRefreshEnabled) {
    return (
      <Popover ref={popoverRef} placement="bottom" stayInFrame allowFlip onOpenChange={setIsOpen}>
        <Popover.Trigger padding={8} cursor="pointer">
          {menuLabel}
        </Popover.Trigger>
        <NavDropdown width={240} isOpen={isOpen}>
          <ChainsDropdownWrapper>
            {supportedChains.map((selectorChain) => (
              <ChainSelectorRow
                disabled={!walletSupportsChain.includes(selectorChain)}
                onSelectChain={onSelectChain}
                targetChain={selectorChain}
                key={selectorChain}
                isPending={selectorChain === pendingChainId}
              />
            ))}
            {unsupportedChains.map((selectorChain) => (
              <ChainSelectorRow
                disabled
                onSelectChain={() => undefined}
                targetChain={selectorChain}
                key={selectorChain}
                isPending={false}
              />
            ))}
          </ChainsDropdownWrapper>
        </NavDropdown>
      </Popover>
    )
  }

  return (
    <DropdownSelector
      isOpen={isOpen}
      toggleOpen={() => setIsOpen(!isOpen)}
      menuLabel={menuLabel}
      tooltipText={chainId ? undefined : t`wallet.networkUnsupported`}
      dataTestId="chain-selector"
      optionsContainerTestId="chain-selector-options"
      internalMenuItems={
        <ChainsList>
          {supportedChains.map((selectorChain) => (
            <ChainSelectorRow
              disabled={!walletSupportsChain.includes(selectorChain)}
              onSelectChain={onSelectChain}
              targetChain={selectorChain}
              key={selectorChain}
              isPending={selectorChain === pendingChainId}
            />
          ))}
          {unsupportedChains.map((selectorChain) => (
            <ChainSelectorRow
              disabled
              onSelectChain={() => undefined}
              targetChain={selectorChain}
              key={selectorChain}
              isPending={false}
            />
          ))}
        </ChainsList>
      }
      buttonCss={StyledDropdownButton}
      menuFlyoutCss={styledMenuCss}
    />
  )
}
