import React, { useRef } from 'react'

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
  NetworkTagRow,
  Wrapper,
  TitleWrapper
} from './NetworkSwitcher.styles'
import ethereumHintImage1x from '../../assets/images/ethereum-hint@1x.png'
import ethereumHintImage2x from '../../assets/images/ethereum-hint@2x.png'

import { EthereumOptionPopoverProps, NetworkSwitcherProps } from './NetworkSwitcher.types'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { useIsMobileByMedia } from '../../hooks/useIsMobileByMedia'
import Modal, { ModalProps } from '../Modal'
import { TYPE } from '../../theme'

export const NetworkSwitcher = ({
  show,
  networksList,
  children,
  placement,
  onOuterClick,
  parentRef,
  showWalletConnector = true,
  showEthOptionPopover = false
}: NetworkSwitcherProps) => {
  const popoverRef = useRef(null)
  const { account } = useActiveWeb3React()
  const { error } = useWeb3React()
  const ethereumOptionPopoverOpen = useModalOpen(ApplicationModal.ETHEREUM_OPTION)
  const networkSwitcherPopoverOpen = useModalOpen(ApplicationModal.NETWORK_SWITCHER)
  const isWrongNetwork = error instanceof UnsupportedChainIdError
  const isMobileByMedia = useIsMobileByMedia()

  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()
  const toggleNetworkSwitcherPopover = useNetworkSwitcherPopoverToggle()

  useOnClickOutside(parentRef || popoverRef, () => {
    if (show || ethereumOptionPopoverOpen) onOuterClick()
  })

  if (isWrongNetwork && !networkSwitcherPopoverOpen) {
    toggleNetworkSwitcherPopover()
  }

  if (isWrongNetwork) {
    if (isMobileByMedia) {
      return <WrongNetworkMobileModal isOpen={isWrongNetwork} onDismiss={onOuterClick}></WrongNetworkMobileModal>
    }
    return <EthereumOptionPopover show={showEthOptionPopover}>{children}</EthereumOptionPopover>
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

const EthereumOptionPopover = ({ children, show }: EthereumOptionPopoverProps) => {
  return (
    <StyledPopover
      placement="bottom-end"
      show={show}
      content={
        <View>
          <Row>
            <Text>Please open up Metamask and switch to supported network manually.</Text>
          </Row>
          <Image src={ethereumHintImage1x} srcSet={ethereumHintImage2x} alt="hint screenshot" />
        </View>
      }
    >
      {children}
    </StyledPopover>
  )
}

const WrongNetworkMobileModal = ({ isOpen, onDismiss }: ModalProps) => {
  return (
    <Modal isOpen={true} onDismiss={() => null} maxHeight={90}>
      <Wrapper>
        <TitleWrapper>
          <TYPE.mediumHeader lineHeight="24px" color="text5">
            {'WRONG NETWORK'}
          </TYPE.mediumHeader>
        </TitleWrapper>
        <TYPE.body mb="15px">
          <Row>
            <Image src={ethereumHintImage1x} srcSet={ethereumHintImage2x} alt="hint screenshot" />
          </Row>
          <Text>Please open up Metamask and switch to supported network manually.</Text>
        </TYPE.body>
      </Wrapper>
    </Modal>
  )
}
