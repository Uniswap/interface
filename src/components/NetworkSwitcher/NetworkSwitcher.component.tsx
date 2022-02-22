import React, { useMemo, useRef } from 'react'

import Option from './Option'
import { useActiveWeb3React } from '../../hooks'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import {
  useModalOpen,
  useNetworkSwitcherPopoverToggle,
  useWalletSwitcherPopoverToggle
} from '../../state/application/hooks'

import {
  Row,
  View,
  Text,
  Image,
  OptionGrid,
  StyledPopover,
  ChangeWalletButton,
  NetworkTagRow
} from './NetworkSwitcher.styles'
import unsupportedNetworkHintImage1x from '../../assets/images/unsupported-network-hint.png'

import { EthereumOptionPopoverProps, NetworkSwitcherProps } from './NetworkSwitcher.types'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { useIsMobileByMedia } from '../../hooks/useIsMobileByMedia'
import { CloseIcon } from '../../theme'

export const NetworkSwitcher = ({
  show,
  networksList,
  children,
  placement,
  onOuterClick,
  parentRef,
  showWalletConnector = true,
  showWrongNetworkPopover = false
}: NetworkSwitcherProps) => {
  const popoverRef = useRef(null)
  const { account } = useActiveWeb3React()
  const { error } = useWeb3React()
  const ethereumOptionPopoverOpen = useModalOpen(ApplicationModal.ETHEREUM_OPTION)
  const networkSwitcherPopoverOpen = useModalOpen(ApplicationModal.NETWORK_SWITCHER)
  const isMobileByMedia = useIsMobileByMedia()
  const isUnsupportedNetwork = useMemo(() => {
    return error instanceof UnsupportedChainIdError
  }, [error])

  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()
  const toggleNetworkSwitcherPopover = useNetworkSwitcherPopoverToggle()

  useOnClickOutside(parentRef || popoverRef, () => {
    if (show || ethereumOptionPopoverOpen) onOuterClick()
  })

  if (isUnsupportedNetwork && !networkSwitcherPopoverOpen) {
    toggleNetworkSwitcherPopover()
  }

  if (isUnsupportedNetwork && !isMobileByMedia) {
    return <UnsupportedNetworkPopover show={showWrongNetworkPopover}>{children}</UnsupportedNetworkPopover>
  }

  return (
    <div ref={popoverRef}>
      <StyledPopover
        placement={placement}
        content={
          <>
            {networksList.map((network, index) => (
              <OptionGrid key={index}>
                <NetworkTagRow>{network.tag}</NetworkTagRow>
                {network.networks.map((props, index) => (
                  <Option key={index} {...props} />
                ))}
              </OptionGrid>
            ))}
            {showWalletConnector && !!account && (
              <ChangeWalletButton onClick={toggleWalletSwitcherPopover}>Change wallet</ChangeWalletButton>
            )}
          </>
        }
        show={show}
      >
        {children}
      </StyledPopover>
    </div>
  )
}

const UnsupportedNetworkPopover = ({ children, show }: EthereumOptionPopoverProps) => {
  return (
    <StyledPopover
      placement="bottom-end"
      show={show}
      content={
        <View>
          <Row>
            <Text>Please use our network switcher and switch to a supported network.</Text>
            <CloseIcon onClick={() => {}} />
          </Row>
          <Image src={unsupportedNetworkHintImage1x} srcSet={unsupportedNetworkHintImage1x} alt="hint screenshot" />
        </View>
      }
    >
      {children}
    </StyledPopover>
  )
}
