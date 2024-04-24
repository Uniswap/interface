// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useContext, useRef, useState } from 'react'
import { Settings, X } from 'react-feather'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components/macro'

import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { useGaslessModeManager } from '../../state/user/hooks'
import { TYPE } from '../../theme'
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
    stroke: ${({ theme }) => theme.text2};
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
  border-radius: 20px;

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
  background-color: ${({ theme }) => (theme.darkMode ? theme.bg1 : theme.bg0)};
  //box-shadow: 0 0 2px 2px ${({ theme }) => theme.shadow2};
  border: 2px solid ${({ theme }) => theme.bg3};
  border-radius: 20px;
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

  const [gaslessMode, toggleGaslessMode] = useGaslessModeManager()

  // FIXME enable for Polygon first
  const isGaslessEnabledForNetwork =
    chainId !== SupportedChainId.OPTIMISM && chainId !== SupportedChainId.BASE && chainId !== SupportedChainId.MAINNET

  useOnClickOutside(node, open ? toggle : undefined)

  const handleGaslessToggle = () => {
    if (gaslessMode) {
      toggleGaslessMode()
    } else {
      toggleGaslessMode()
    }
  }

  return (
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle} id="open-settings-dialog-button" aria-label={t`Transaction Settings`}>
        <StyledMenuIcon />
        {gaslessMode ? (
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
            <Text fontWeight={600} fontSize={16}>
              <Trans>Transaction Settings</Trans>
            </Text>
            <TransactionSettings placeholderSlippage={placeholderSlippage} />
            <RowBetween>
              <RowFixed>
                <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                  <Trans>Gasless Mode</Trans>
                </TYPE.black>
                <QuestionHelper text={<Trans>Enables gasless transactions by compensating them with KROM.</Trans>} />
              </RowFixed>
              {isGaslessEnabledForNetwork ? (
                <Toggle id="toggle-expert-mode-button" isActive={gaslessMode} toggle={handleGaslessToggle} />
              ) : (
                <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                  <Trans>Coming Soon</Trans>
                </TYPE.black>
              )}
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                  <Trans>Frontrun Protection</Trans>
                </TYPE.black>
                <QuestionHelper text={<Trans>Prevents front-running of swaps</Trans>} />
              </RowFixed>
              <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                <Trans>Coming Soon</Trans>
              </TYPE.black>{' '}
            </RowBetween>
          </AutoColumn>
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
