import React, { useRef } from 'react'

import Option from './Option'
import { useActiveWeb3React } from '../../hooks'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useCloseModals, useModalOpen, useWalletSwitcherPopoverToggle } from '../../state/application/hooks'

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

import { NetworkSwitcherProps, UnsupportedNetworkPopoverProps } from './NetworkSwitcher.types'
import { CloseIcon } from '../../theme'

export const NetworkSwitcher = ({
  show,
  networksList,
  children,
  placement,
  onOuterClick,
  parentRef,
  showWalletConnector = true
}: NetworkSwitcherProps) => {
  const popoverRef = useRef(null)
  const { account } = useActiveWeb3React()
  const ethereumOptionPopoverOpen = useModalOpen(ApplicationModal.ETHEREUM_OPTION)

  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()

  useOnClickOutside(parentRef || popoverRef, () => {
    if (show || ethereumOptionPopoverOpen) onOuterClick()
  })

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

export default function UnsupportedNetworkPopover({ children, show, parentRef }: UnsupportedNetworkPopoverProps) {
  const closeModals = useCloseModals()
  const popoverRef = useRef(null)

  useOnClickOutside(parentRef || popoverRef, () => {
    if (show) closeModals()
  })

  return (
    <StyledPopover
      placement="bottom-end"
      show={show}
      content={
        <View>
          <Row>
            <Text>Please use our network switcher and switch to a supported network.</Text>
            <CloseIcon onClick={closeModals} />
          </Row>
          <Image src={unsupportedNetworkHintImage1x} srcSet={unsupportedNetworkHintImage1x} alt="hint screenshot" />
        </View>
      }
    >
      {children}
    </StyledPopover>
  )
}
