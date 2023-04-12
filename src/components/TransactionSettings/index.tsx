import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useState } from 'react'
import styled, { css } from 'styled-components'

import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import MenuFlyout from 'components/MenuFlyout'
import Toggle from 'components/Toggle'
import Tooltip from 'components/Tooltip'
import SlippageSetting from 'components/swapv2/SwapSettingsPanel/SlippageSetting'
import TransactionTimeLimitSetting from 'components/swapv2/SwapSettingsPanel/TransactionTimeLimitSetting'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleTransactionSettingsMenu } from 'state/application/hooks'
import { useDegenModeManager } from 'state/user/hooks'

import AdvanceModeModal from './AdvanceModeModal'

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const SettingsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;

  ${Toggle} {
    background: ${({ theme }) => theme.buttonBlack};
    &[data-active='true'] {
      background: ${({ theme }) => rgba(theme.primary, 0.2)};
    }
  }
`

const MenuFlyoutBrowserStyle = css`
  min-width: 322px;
  right: -10px;
  top: 3.25rem;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: 3.25rem;
    bottom: unset;
    & > div:after {
      top: -40px;
      border-top-color: transparent;
      border-bottom-color: ${({ theme }) => theme.tableHeader};
      border-width: 10px;
      margin-left: -10px;
    }
  `};
`

type Props = {
  hoverBg?: string
}

export default function TransactionSettings({ hoverBg }: Props) {
  const theme = useTheme()
  const [isDegenMode] = useDegenModeManager()
  const toggle = useToggleTransactionSettingsMenu()
  // show confirmation view before turning on
  const [showConfirmation, setShowConfirmation] = useState(false)
  const open = useModalOpen(ApplicationModal.TRANSACTION_SETTINGS)

  const [isShowTooltip, setIsShowTooltip] = useState<boolean>(false)
  const showTooltip = useCallback(() => setIsShowTooltip(true), [setIsShowTooltip])
  const hideTooltip = useCallback(() => setIsShowTooltip(false), [setIsShowTooltip])

  return (
    <>
      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
      {/* https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451 */}
      <StyledMenu>
        <MenuFlyout
          trigger={
            <Tooltip
              width="fit-content"
              placement="top"
              text={t`Degen mode is on. Be cautious!`}
              show={isDegenMode && isShowTooltip}
            >
              <div onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                <StyledActionButtonSwapForm
                  hoverBg={hoverBg}
                  active={open}
                  onClick={toggle}
                  id="open-settings-dialog-button"
                  aria-label="Transaction Settings"
                >
                  <TransactionSettingsIcon fill={isDegenMode ? theme.warning : theme.subText} />
                </StyledActionButtonSwapForm>
              </div>
            </Tooltip>
          }
          customStyle={MenuFlyoutBrowserStyle}
          isOpen={open}
          toggle={toggle}
          title={t`Advanced Settings`}
          mobileCustomStyle={{ paddingBottom: '40px' }}
          hasArrow
        >
          <SettingsWrapper>
            <SlippageSetting shouldShowPinButton={false} />
            <TransactionTimeLimitSetting />
          </SettingsWrapper>
        </MenuFlyout>
      </StyledMenu>
    </>
  )
}
