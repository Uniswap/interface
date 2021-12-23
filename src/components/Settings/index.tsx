// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useActiveWeb3React } from 'hooks/web3'
import { useContext, useRef, useState } from 'react'
import { Settings, X } from 'react-feather'
import ReactGA from 'react-ga'
import { Text } from 'rebass'
import { AUTO_ROUTER_SUPPORTED_CHAINS } from 'state/routing/clientSideSmartOrderRouter/constants'
import styled, { ThemeContext } from 'styled-components/macro'

import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { useClientSideRouter, useExpertModeManager } from '../../state/user/hooks'
import { ThemedText } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import Toggle from '../Toggle'
import TransactionSettings from '../TransactionSettings'

const StyledMenuIcon = styled(Settings)`
  height: 20px;
  width: 20px;

  > * {
    stroke: ${({ theme }) => theme.text1};
  }

  :hover {
    opacity: 0.7;
  }
`

const StyledCloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledMenuButton = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  border-radius: 0.5rem;
  height: 20px;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
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

const MenuFlyout = styled.span`
  min-width: 20.125rem;
  background-color: ${({ theme }) => theme.bg2};
  border: 1px solid ${({ theme }) => theme.bg3};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 2rem;
  right: 0rem;
  z-index: 100;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-width: 18.125rem;
  `};

  user-select: none;
`

const Break = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.bg3};
`

const ModalContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 20px;
`

export default function SettingsTab({ placeholderSlippage }: { placeholderSlippage: Percent }) {
  const { chainId } = useActiveWeb3React()

  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.SETTINGS)
  const toggle = useToggleSettingsMenu()

  const theme = useContext(ThemeContext)

  const [expertMode, toggleExpertMode] = useExpertModeManager()

  const [clientSideRouter, setClientSideRouter] = useClientSideRouter()

  // show confirmation view before turning on
  const [showConfirmation, setShowConfirmation] = useState(false)

  useOnClickOutside(node, open ? toggle : undefined)

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <Modal isOpen={showConfirmation} onDismiss={() => setShowConfirmation(false)} maxHeight={100}>
        <ModalContentWrapper>
          <AutoColumn gap="lg">
            <RowBetween style={{ padding: '0 2rem' }}>
              <div />
              <Text fontWeight={500} fontSize={20}>
                <Trans>Are you sure?</Trans>
              </Text>
              <StyledCloseIcon onClick={() => setShowConfirmation(false)} />
            </RowBetween>
            <Break />
            <AutoColumn gap="lg" style={{ padding: '0 2rem' }}>
              <Text fontWeight={500} fontSize={20}>
                <Trans>
                  Expert mode turns off the confirm transaction prompt and allows high slippage trades that often result
                  in bad rates and lost funds.
                </Trans>
              </Text>
              <Text fontWeight={600} fontSize={20}>
                <Trans>ONLY USE THIS MODE IF YOU KNOW WHAT YOU ARE DOING.</Trans>
              </Text>
              <ButtonError
                error={true}
                padding={'12px'}
                onClick={() => {
                  const confirmWord = t`confirm`
                  if (window.prompt(t`Please type the word "${confirmWord}" to enable expert mode.`) === confirmWord) {
                    toggleExpertMode()
                    setShowConfirmation(false)
                  }
                }}
              >
                <Text fontSize={20} fontWeight={500} id="confirm-expert-mode">
                  <Trans>Turn On Expert Mode</Trans>
                </Text>
              </ButtonError>
            </AutoColumn>
          </AutoColumn>
        </ModalContentWrapper>
      </Modal>
      <StyledMenuButton onClick={toggle} id="open-settings-dialog-button" aria-label={t`Transaction Settings`}>
        <StyledMenuIcon />
        {expertMode ? (
          <EmojiWrapper>
            <span role="img" aria-label="wizard-icon">
              🧙
            </span>
          </EmojiWrapper>
        ) : null}
      </StyledMenuButton>
      {open && (
        <MenuFlyout>
          <AutoColumn gap="md" style={{ padding: '1rem' }}>
            <Text fontWeight={600} fontSize={14}>
              <Trans>Transaction Settings</Trans>
            </Text>
            <TransactionSettings placeholderSlippage={placeholderSlippage} />
            <Text fontWeight={600} fontSize={14}>
              <Trans>Interface Settings</Trans>
            </Text>
            {chainId && AUTO_ROUTER_SUPPORTED_CHAINS.includes(chainId) && (
              <RowBetween>
                <RowFixed>
                  <ThemedText.Black fontWeight={400} fontSize={14} color={theme.text2}>
                    <Trans>Auto Router API</Trans>
                  </ThemedText.Black>
                  <QuestionHelper text={<Trans>Use the Uniswap Labs API to get faster quotes.</Trans>} />
                </RowFixed>
                <Toggle
                  id="toggle-optimized-router-button"
                  isActive={!clientSideRouter}
                  toggle={() => {
                    ReactGA.event({
                      category: 'Routing',
                      action: clientSideRouter ? 'enable routing API' : 'disable routing API',
                    })
                    setClientSideRouter(!clientSideRouter)
                  }}
                />
              </RowBetween>
            )}
            <RowBetween>
              <RowFixed>
                <ThemedText.Black fontWeight={400} fontSize={14} color={theme.text2}>
                  <Trans>Expert Mode</Trans>
                </ThemedText.Black>
                <QuestionHelper
                  text={
                    <Trans>Allow high price impact trades and skip the confirm screen. Use at your own risk.</Trans>
                  }
                />
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
          </AutoColumn>
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
