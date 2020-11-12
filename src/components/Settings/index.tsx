import React, { useRef, useState } from 'react'
import { Settings, X, Info, Code } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'
import { transparentize } from 'polished'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks'
import {
  useExpertModeManager,
  useUserTransactionTTL,
  useUserSlippageTolerance,
  useDarkModeManager
} from '../../state/user/hooks'
import { TYPE, ExternalLink, LinkStyledButton } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import QuestionHelper from '../QuestionHelper'
import Row, { RowBetween, RowFixed } from '../Row'
import Toggle from '../Toggle'
import TransactionSettings from '../TransactionSettings'
import border8pxRadius from '../../assets/images/border-8px-radius.png'

const StyledMenuIcon = styled(Settings)`
  height: 18px;
  width: 18px;
  margin: 0 16px;
  cursor: pointer;

  > * {
    stroke: ${({ theme }) => theme.text4};
  }
`

const StyledCloseIcon = styled(X)`
  position: absolute;
  right: 18px;
  height: 20px;
  width: 20px;

  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.bg5};
  }
`
const EmojiWrapper = styled.div`
  position: absolute;
  bottom: -6px;
  right: 0px;
  font-size: 14px;
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuContainer = styled.span`
  min-width: 322px;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 48px;
  right: 0rem;
  z-index: 100;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    position: fixed;
    width: 100%;
    height: 100%;
    padding-top: 50px;
    padding-left: 25%;
    padding-right: 25%;
    align-items: center;
  `};
`

const MenuFlyout = styled.span`
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 8px;
  backdrop-filter: blur(16px);
  background-color: ${({ theme }) => transparentize(0.6, theme.purpleBase)};
  border-radius: 8px;
  border: 8px solid;
  border-radius: 8px;
  border-image: url(${border8pxRadius}) 8;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  height: auto;
  box-shadow: 0px 0px 12px ${({ theme }) => transparentize(0.84, theme.black)};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: 18.125rem;
    right: -46px;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-width: 18.125rem;
    top: -22rem;
  `};
`

const MenuFlyoutBottom = styled(MenuFlyout)`
  margin-top: 1rem;
  align-items: right;
  flex-direction: row;
  justify-content: center;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
     min-width: 0;
     right: -46px;
   `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
     min-width: 0;
     top: -22rem;
   `};
`

const ModalContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 26px 0;
  background-color: ${({ theme }) => transparentize(0.45, theme.bg2)};
`
const MenuItem = styled(ExternalLink)`
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

const CloseTextButton = styled(LinkStyledButton)`
  color: ${({ theme }) => theme.text4};
  font-size: 13px;
  text-decoration: underline;
`

const CODE_LINK = !!process.env.REACT_APP_GIT_COMMIT_HASH
  ? `https://github.com/levelkdev/dxswap-dapp/tree/${process.env.REACT_APP_GIT_COMMIT_HASH}`
  : 'https://github.com/levelkdev/dxswap-dapp'

export default function SettingsTab() {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.SETTINGS)
  const toggle = useToggleSettingsMenu()

  const [userSlippageTolerance, setUserslippageTolerance] = useUserSlippageTolerance()

  const [ttl, setTtl] = useUserTransactionTTL()

  const [expertMode, toggleExpertMode] = useExpertModeManager()

  const [darkMode, toggleDarkMode] = useDarkModeManager()

  // show confirmation view before turning on
  const [showConfirmation, setShowConfirmation] = useState(false)

  useOnClickOutside(node, open ? toggle : undefined)

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <Modal isOpen={showConfirmation} onDismiss={() => setShowConfirmation(false)} maxHeight={100}>
        <ModalContentWrapper>
          <AutoColumn gap="25px">
            <Row style={{ padding: '0 25px', justifyContent: 'center' }}>
              <TYPE.body fontWeight={500} fontSize="20px" color="text3">
                Are you sure?
              </TYPE.body>
              <StyledCloseIcon onClick={() => setShowConfirmation(false)} />
            </Row>
            <AutoColumn gap="24px" style={{ padding: '0 24px' }}>
              <TYPE.body fontWeight={400} fontSize="16px" lineHeight="20px" color="text1" textAlign="center">
                Expert mode turns off the confirm transaction prompt and allows high slippage trades that often result
                in bad rates and lost funds.
              </TYPE.body>
              <TYPE.body fontWeight={600} fontSize="13px" color="text1" textAlign="center">
                ONLY USE THIS MODE IF YOU KNOW WHAT YOU ARE DOING.
              </TYPE.body>
              <ButtonError
                error={true}
                padding={'18px'}
                onClick={() => {
                  toggleExpertMode()
                  setShowConfirmation(false)
                }}
              >
                <TYPE.body fontSize="13px" fontWeight={600} color="text1" id="confirm-expert-mode">
                  Turn on Expert mode
                </TYPE.body>
              </ButtonError>
              <Row style={{ justifyContent: 'center' }}>
                <CloseTextButton onClick={() => setShowConfirmation(false)}>Cancel</CloseTextButton>
              </Row>
            </AutoColumn>
          </AutoColumn>
        </ModalContentWrapper>
      </Modal>
      <StyledMenuIcon onClick={toggle} id="open-settings-dialog-button">
        {expertMode && (
          <EmojiWrapper>
            <span role="img" aria-label="wizard-icon">
              😎
            </span>
          </EmojiWrapper>
        )}
      </StyledMenuIcon>
      {open && (
        <MenuContainer>
          <MenuFlyout>
            <AutoColumn gap="md" style={{ padding: '8px' }}>
              <Text fontWeight={600} fontSize={14}>
                Transaction settings
              </Text>
              <TransactionSettings
                rawSlippage={userSlippageTolerance}
                setRawSlippage={setUserslippageTolerance}
                deadline={ttl}
                setDeadline={setTtl}
              />
              <Text fontWeight={600} fontSize={14}>
                Interface settings
              </Text>
              <RowBetween>
                <RowFixed>
                  <TYPE.body fontWeight={500} fontSize="12px" lineHeight="15px">
                    Toggle expert mode
                  </TYPE.body>
                  <QuestionHelper text="Bypasses confirmation modals and allows high slippage trades. Use at your own risk." />
                </RowFixed>
                <Toggle
                  id="toggle-expert-mode-button"
                  isActive={expertMode}
                  toggle={
                    expertMode
                      ? () => {
                          toggleExpertMode()
                          setShowConfirmation(false)
                        }
                      : () => {
                          toggle()
                          setShowConfirmation(true)
                        }
                  }
                />
              </RowBetween>
              {
                <RowBetween>
                  <RowFixed>
                    <TYPE.body fontWeight={500} fontSize="12px" lineHeight="15px">
                      Toggle Dark Mode
                    </TYPE.body>
                  </RowFixed>
                  <Toggle disabled isActive={darkMode} toggle={toggleDarkMode} />
                </RowBetween>
              }
            </AutoColumn>
          </MenuFlyout>
          <RowFixed alignSelf="flex-end">
            <MenuFlyoutBottom>
              <MenuItem id="link" href="https://dxdao.eth.link/">
                <Info size={14} />
                About
              </MenuItem>
              <MenuItem id="link" href={CODE_LINK}>
                <Code size={14} />
                Code
              </MenuItem>
            </MenuFlyoutBottom>
          </RowFixed>
        </MenuContainer>
      )}
    </StyledMenu>
  )
}
