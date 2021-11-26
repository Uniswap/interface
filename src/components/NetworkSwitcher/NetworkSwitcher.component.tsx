import { X } from 'react-feather'
import React, { useRef } from 'react'

import Option from './Option'
import { useActiveWeb3React } from '../../hooks'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useWalletSwitcherPopoverToggle } from '../../state/application/hooks'

import {
  Row,
  View,
  Text,
  Image,
  OptionGrid,
  CloseButton,
  StyledPopover,
  ChangeWalletButton,
  NetworkTagRow
} from './NetworkSwitcher.styles'
import ethereumHintImage1x from '../../assets/images/ethereum-hint@1x.png'
import ethereumHintImage2x from '../../assets/images/ethereum-hint@2x.png'

import { EthereumOptionPopoverProps, NetworkSwitcherProps } from './NetworkSwitcher.types'

export const NetworkSwitcher = ({
  show,
  options,
  children,
  placement,
  onOuterClick,
  parentRef,
  showWalletConnector = true,
  list
}: NetworkSwitcherProps) => {
  const popoverRef = useRef(null)
  const { account } = useActiveWeb3React()
  const ethereumOptionPopoverOpen = useModalOpen(ApplicationModal.ETHEREUM_OPTION)

  useOnClickOutside(parentRef || popoverRef, () => {
    if (show || ethereumOptionPopoverOpen) onOuterClick()
  })

  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()
  return (
    <div ref={popoverRef}>
      <EthereumOptionPopover show={ethereumOptionPopoverOpen}>
        <StyledPopover
          placement={placement}
          content={
            <>
              {list.map((network, index) => (
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
      </EthereumOptionPopover>
    </div>
  )
}

const EthereumOptionPopover = ({ children, show }: EthereumOptionPopoverProps) => {
  return (
    <StyledPopover
      placement="bottom-end"
      show={show}
      content={
        <View>
          <Row>
            <Text>Please open up Metamask and Switch to Ethereum manually.</Text>
            <CloseButton>
              <X size="16" />
            </CloseButton>
          </Row>
          <Image src={ethereumHintImage1x} srcSet={ethereumHintImage2x} alt="hint screenshot" />
        </View>
      }
    >
      {children}
    </StyledPopover>
  )
}
