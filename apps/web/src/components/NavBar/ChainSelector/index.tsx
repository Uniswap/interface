import { ChainId } from '@uniswap/sdk-core'
import { showTestnetsAtom } from 'components/AccountDrawer/TestnetsToggle'
import Column from 'components/Column'
import { DropdownSelector, StyledMenuContent } from 'components/DropdownSelector'
import { ChainLogo } from 'components/Logo/ChainLogo'
import ChainSelectorRow from 'components/NavBar/ChainSelector/ChainSelectorRow'
import { NavDropdown } from 'components/NavBar/NavDropdown/NavDropdown'
import { CONNECTION } from 'components/Web3Provider/constants'
import {
  L1_CHAIN_IDS,
  L2_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  getChainPriority,
  useIsSupportedChainIdCallback,
} from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { t } from 'i18n'
import { useAtomValue } from 'jotai/utils'
import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useSwapAndLimitContext } from 'state/swap/hooks'
import styled, { css, useTheme } from 'styled-components'
import { Popover } from 'ui/src'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Connector } from 'wagmi'

const NETWORK_SELECTOR_CHAINS = [...L1_CHAIN_IDS, ...L2_CHAIN_IDS]

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
  getNamespaceChainsIds: () => ChainId[]
}

function useWalletSupportedChains(): ChainId[] {
  const { connector } = useAccount()

  switch (connector?.type) {
    case CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID:
    case CONNECTION.WALLET_CONNECT_CONNECTOR_ID:
      // Wagmi currently offers no way to discriminate a Connector as a WalletConnect connector providing access to getNamespaceChainsIds.
      return (connector as WalletConnectConnector).getNamespaceChainsIds?.().length
        ? (connector as WalletConnectConnector).getNamespaceChainsIds?.()
        : NETWORK_SELECTOR_CHAINS
    default:
      return NETWORK_SELECTOR_CHAINS
  }
}

export const ChainSelector = ({ leftAlign }: { leftAlign?: boolean }) => {
  const account = useAccount()
  const { chainId: swapChainId, setSelectedChainId, multichainUXEnabled } = useSwapAndLimitContext()
  const chainId = multichainUXEnabled ? swapChainId : account.chainId

  const theme = useTheme()
  const popoverRef = useRef<Popover>(null)
  const walletSupportsChain = useWalletSupportedChains()
  const isSupportedChain = useIsSupportedChainIdCallback()
  const showTestnets = useAtomValue(showTestnetsAtom)
  const navRefreshEnabled = useFeatureFlag(FeatureFlags.NavRefresh)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const selectChain = useSelectChain()
  const chainIdRef = useRef<number | undefined>(undefined)
  useSyncChainQuery(chainIdRef)

  const [supportedChains, unsupportedChains] = useMemo(() => {
    const { supported, unsupported } = NETWORK_SELECTOR_CHAINS.filter((chain: number) => {
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
        { supported: [], unsupported: [] } as Record<string, ChainId[]>
      )
    return [supported, unsupported]
  }, [isSupportedChain, showTestnets, walletSupportsChain])

  const [pendingChainId, setPendingChainId] = useState<ChainId | undefined>(undefined)

  const onSelectChain = useCallback(
    async (targetChainId: ChainId) => {
      if (multichainUXEnabled) {
        setSelectedChainId(targetChainId)
      } else {
        setPendingChainId(targetChainId)
        await selectChain(targetChainId)
        setPendingChainId(undefined)
      }
      setIsOpen(false)
      popoverRef.current?.close()
    },
    [popoverRef, selectChain, setIsOpen, setSelectedChainId, multichainUXEnabled]
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

  if (navRefreshEnabled) {
    return (
      <Popover ref={popoverRef} placement="bottom" stayInFrame allowFlip>
        <Popover.Trigger padding={8} cursor="pointer">
          {menuLabel}
        </Popover.Trigger>
        <NavDropdown width={240}>
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
