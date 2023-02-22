import { parseUnits } from '@ethersproject/units'
import { Trans, t } from '@lingui/macro'
import { darken } from 'polished'
import React, { useCallback, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import styled, { css } from 'styled-components'

import { AutoColumn } from 'components/Column'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import MenuFlyout from 'components/MenuFlyout'
import QuestionHelper from 'components/QuestionHelper'
import { RowBetween, RowFixed } from 'components/Row'
import LegacyToggle from 'components/Toggle/LegacyToggle'
import Tooltip from 'components/Tooltip'
import useTopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork/useTopTrendingSoonTokensInCurrentNetwork'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { MAX_SLIPPAGE_IN_BIPS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleTransactionSettingsMenu } from 'state/application/hooks'
import {
  useExpertModeManager,
  useShowLiveChart,
  useShowTokenInfo,
  useShowTopTrendingSoonTokens,
  useShowTradeRoutes,
  useToggleLiveChart,
  useToggleTokenInfo,
  useToggleTopTrendingTokens,
  useToggleTradeRoutes,
  useUserSlippageTolerance,
  useUserTransactionTTL,
} from 'state/user/hooks'
import { TYPE } from 'theme'
import { isEqual } from 'utils/numbers'

import AdvanceModeModal from './AdvanceModeModal'

enum SlippageError {
  InvalidInput = 'InvalidInput',
  RiskyLow = 'RiskyLow',
  RiskyHigh = 'RiskyHigh',
}

enum DeadlineError {
  InvalidInput = 'InvalidInput',
}

const FancyButton = styled.button`
  color: ${({ theme }) => theme.text};
  padding: 0;
  text-align: center;
  height: 2rem;
  border-radius: 36px;
  width: auto;
  min-width: 3.5rem;
  border: 1px solid transparent;
  outline: none;
  font-size: 16px;
  background: ${({ theme }) => theme.buttonBlack};
  :hover {
    border: 1px solid ${({ theme }) => theme.bg4};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary};
  }
`

const Option = styled(FancyButton)<{ active: boolean }>`
  margin-right: 6px;
  :hover {
    cursor: pointer;
  }
  background-color: ${({ active, theme }) => (active ? theme.primary : theme.buttonBlack)};
  color: ${({ active, theme }) => (active ? theme.textReverse : theme.text)};
`

const Input = styled.input`
  background: transparent;
  font-size: 16px;
  width: auto;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  color: ${({ theme, color }) => (color === 'red' ? theme.red1 : theme.text)};
  text-align: right;
`

const OptionCustom = styled(FancyButton)<{ active?: boolean; warning?: boolean }>`
  position: relative;
  padding: 0 0.75rem;
  flex: 1;
  min-width: 70px;
  border: ${({ theme, active, warning }) => active && `1px solid ${warning ? theme.red1 : theme.primary}`};
  :hover {
    border: ${({ theme, active, warning }) =>
      active && `1px solid ${warning ? darken(0.1, theme.red1) : darken(0.1, theme.primary)}`};
  }

  input {
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: 2rem;
  }
`

const SlippageEmojiContainer = styled.span`
  color: #f3841e;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
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

const StyledTitle = styled.div`
  font-size: ${isMobile ? '16px' : '16px'};
  font-weight: 500;
`
const StyledLabel = styled.div`
  font-size: ${isMobile ? '14px' : '12px'};
  color: ${({ theme }) => theme.text};
  font-weight: 400;
  line-height: 20px;
`

interface SlippageTabsProps {
  rawSlippage: number
  setRawSlippage: (rawSlippage: number) => void
  deadline: number
  setDeadline: (deadline: number) => void
}

function SlippageTabs({ rawSlippage, setRawSlippage, deadline, setDeadline }: SlippageTabsProps) {
  const theme = useTheme()

  const inputRef = useRef<HTMLInputElement>()

  const [slippageInput, setSlippageInput] = useState('')
  const [deadlineInput, setDeadlineInput] = useState('')

  const slippageInputIsValid =
    slippageInput === '' || isEqual(rawSlippage / 100, Number.parseFloat(slippageInput), 0.01)
  const deadlineInputIsValid = deadlineInput === '' || (deadline / 60).toString() === deadlineInput

  let slippageError: SlippageError | undefined
  if (slippageInput !== '' && !slippageInputIsValid) {
    slippageError = SlippageError.InvalidInput
  } else if (slippageInputIsValid && rawSlippage < 50) {
    slippageError = SlippageError.RiskyLow
  } else if (slippageInputIsValid && rawSlippage > 500) {
    slippageError = SlippageError.RiskyHigh
  } else {
    slippageError = undefined
  }

  let deadlineError: DeadlineError | undefined
  if (deadlineInput !== '' && !deadlineInputIsValid) {
    deadlineError = DeadlineError.InvalidInput
  } else {
    deadlineError = undefined
  }

  function parseCustomSlippage(value: string) {
    setSlippageInput(value)

    try {
      /*
      const valueAsIntFromRoundedFloat = Number.parseInt((Number.parseFloat(value) * 100).toString())
      This above code will cause unexpected bug when value = 4.1
      => Number.parseFloat(4.1) * 100 = 409.99999999999994
      => Number.parseInt(409.99999999999994) = 409
      => Wrong, expected 410.
      => Use parseUnits(value, 2) is safe.
      */
      const valueAsIntFromRoundedFloat = Number.parseInt(parseUnits(value, 2).toString())
      if (!Number.isNaN(valueAsIntFromRoundedFloat) && valueAsIntFromRoundedFloat <= MAX_SLIPPAGE_IN_BIPS) {
        setRawSlippage(valueAsIntFromRoundedFloat)
      }
    } catch {}
  }

  function parseCustomDeadline(value: string) {
    setDeadlineInput(value)

    try {
      const valueAsInt: number = Number.parseInt(value) * 60
      if (!Number.isNaN(valueAsInt) && valueAsInt > 0 && valueAsInt <= 9999 * 60) {
        setDeadline(valueAsInt)
      }
    } catch {}
  }

  return (
    <AutoColumn gap="md">
      <AutoColumn gap="md" style={{ padding: '6px 0' }}>
        <RowFixed>
          <StyledLabel>
            <Trans>Max Slippage</Trans>
          </StyledLabel>
          <QuestionHelper
            text={t`Transaction will revert if there is an adverse rate change that is higher than this %`}
          />
        </RowFixed>
        <RowBetween>
          <Option
            onClick={() => {
              setSlippageInput('')
              setRawSlippage(10)
            }}
            active={rawSlippage === 10}
          >
            0.1%
          </Option>
          <Option
            onClick={() => {
              setSlippageInput('')
              setRawSlippage(50)
            }}
            active={rawSlippage === 50}
          >
            0.5%
          </Option>
          <Option
            onClick={() => {
              setSlippageInput('')
              setRawSlippage(100)
            }}
            active={rawSlippage === 100}
          >
            1.0%
          </Option>
          <OptionCustom active={![10, 50, 100].includes(rawSlippage)} warning={!slippageInputIsValid} tabIndex={-1}>
            <RowBetween>
              {!!slippageInput &&
              (slippageError === SlippageError.RiskyLow || slippageError === SlippageError.RiskyHigh) ? (
                <SlippageEmojiContainer>
                  <span role="img" aria-label="warning">
                    ⚠️
                  </span>
                </SlippageEmojiContainer>
              ) : null}
              {/* https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451 */}
              <Input
                ref={inputRef as any}
                placeholder={(rawSlippage / 100).toFixed(2)}
                value={slippageInput}
                onBlur={() => {
                  parseCustomSlippage((rawSlippage / 100).toFixed(2))
                }}
                onChange={e => parseCustomSlippage(e.target.value)}
                color={!slippageInputIsValid ? 'red' : ''}
              />
              %
            </RowBetween>
          </OptionCustom>
        </RowBetween>
        {!!slippageError && (
          <RowBetween
            style={{
              fontSize: '14px',
              paddingTop: '7px',
              color: slippageError === SlippageError.InvalidInput ? 'red' : '#F3841E',
            }}
          >
            {slippageError === SlippageError.InvalidInput
              ? t`Enter a valid slippage percentage`
              : slippageError === SlippageError.RiskyLow
              ? t`Your transaction may fail`
              : t`Your transaction may be frontrun`}
          </RowBetween>
        )}
      </AutoColumn>

      <AutoColumn gap="sm">
        <RowFixed>
          <StyledLabel>
            <Trans>Transaction time limit</Trans>
          </StyledLabel>
          <QuestionHelper text={t`Transaction will revert if it is pending for longer than the indicated time`} />
        </RowFixed>
        <RowFixed>
          <OptionCustom style={{ width: '100px' }} tabIndex={-1}>
            <Input
              color={!!deadlineError ? 'red' : undefined}
              onBlur={() => {
                parseCustomDeadline((deadline / 60).toString())
              }}
              placeholder={(deadline / 60).toString()}
              value={deadlineInput}
              onChange={e => parseCustomDeadline(e.target.value)}
            />
          </OptionCustom>
          <TYPE.body style={{ paddingLeft: '8px' }} fontSize={12} color={theme.text11}>
            <Trans>minutes</Trans>
          </TYPE.body>
        </RowFixed>
      </AutoColumn>
    </AutoColumn>
  )
}

export default function TransactionSettings({
  isShowDisplaySettings = false,
  hoverBg,
}: {
  isShowDisplaySettings?: boolean
  hoverBg?: string
}) {
  const theme = useTheme()
  const [userSlippageTolerance, setUserSlippageTolerance] = useUserSlippageTolerance()
  const [ttl, setTtl] = useUserTransactionTTL()
  const [expertMode, toggleExpertMode] = useExpertModeManager()
  const toggle = useToggleTransactionSettingsMenu()
  // show confirmation view before turning on
  const [showConfirmation, setShowConfirmation] = useState(false)
  const open = useModalOpen(ApplicationModal.TRANSACTION_SETTINGS)

  const [isShowTooltip, setIsShowTooltip] = useState<boolean>(false)
  const showTooltip = useCallback(() => setIsShowTooltip(true), [setIsShowTooltip])
  const hideTooltip = useCallback(() => setIsShowTooltip(false), [setIsShowTooltip])

  const isShowLiveChart = useShowLiveChart()

  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowTokenInfo = useShowTokenInfo()

  const toggleLiveChart = useToggleLiveChart()

  const toggleTradeRoutes = useToggleTradeRoutes()
  const toggleTokenInfo = useToggleTokenInfo()

  const isShowTrendingSoonTokens = useShowTopTrendingSoonTokens()
  const toggleTopTrendingTokens = useToggleTopTrendingTokens()
  const { mixpanelHandler } = useMixpanel()

  const { data: topTrendingSoonTokens } = useTopTrendingSoonTokensInCurrentNetwork()
  const isShowTrendingSoonSetting = topTrendingSoonTokens.length > 0

  return (
    <>
      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
      {/* https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451 */}
      <StyledMenu>
        <MenuFlyout
          trigger={
            <Tooltip text={t`Advanced mode is on!`} show={expertMode && isShowTooltip}>
              <div onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                <StyledActionButtonSwapForm
                  hoverBg={hoverBg}
                  active={open}
                  onClick={toggle}
                  id="open-settings-dialog-button"
                  aria-label="Transaction Settings"
                >
                  <TransactionSettingsIcon fill={expertMode ? theme.warning : theme.subText} />
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
          <>
            <SlippageTabs
              rawSlippage={userSlippageTolerance}
              setRawSlippage={setUserSlippageTolerance}
              deadline={ttl}
              setDeadline={setTtl}
            />

            <RowBetween margin="14px 0">
              <RowFixed>
                <StyledLabel>
                  <Trans>Advanced Mode</Trans>
                </StyledLabel>
                <QuestionHelper text={t`Enables high slippage trades. Use at your own risk`} />
              </RowFixed>
              <LegacyToggle
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
                size={isMobile ? 'md' : 'sm'}
              />
            </RowBetween>
            {isShowDisplaySettings && (
              <>
                <StyledTitle style={{ borderTop: '1px solid ' + theme.border, padding: '16px 0' }}>
                  <Trans>Display Settings</Trans>
                </StyledTitle>
                <AutoColumn gap="md">
                  {isShowTrendingSoonSetting && (
                    <RowBetween>
                      <RowFixed>
                        <StyledLabel>Trending Soon</StyledLabel>
                        <QuestionHelper text={t`Turn on to display tokens that could be trending soon`} />
                      </RowFixed>
                      <LegacyToggle
                        isActive={isShowTrendingSoonTokens}
                        toggle={() => {
                          toggleTopTrendingTokens()
                        }}
                        size={isMobile ? 'md' : 'sm'}
                      />
                    </RowBetween>
                  )}
                  <RowBetween>
                    <RowFixed>
                      <StyledLabel>Live Chart</StyledLabel>
                      <QuestionHelper text={t`Turn on to display live chart`} />
                    </RowFixed>
                    <LegacyToggle
                      isActive={isShowLiveChart}
                      toggle={() => {
                        mixpanelHandler(MIXPANEL_TYPE.LIVE_CHART_ON_OFF, { live_chart_on_or_off: !isShowLiveChart })
                        toggleLiveChart()
                      }}
                      size={isMobile ? 'md' : 'sm'}
                    />
                  </RowBetween>
                  <RowBetween>
                    <RowFixed>
                      <StyledLabel>
                        <Trans>Trade Route</Trans>
                      </StyledLabel>
                      <QuestionHelper text={t`Turn on to display trade route`} />
                    </RowFixed>
                    <LegacyToggle
                      isActive={isShowTradeRoutes}
                      toggle={() => {
                        mixpanelHandler(MIXPANEL_TYPE.TRADING_ROUTE_ON_OFF, {
                          trading_route_on_or_off: !isShowTradeRoutes,
                        })
                        toggleTradeRoutes()
                      }}
                      size={isMobile ? 'md' : 'sm'}
                    />
                  </RowBetween>

                  <RowBetween>
                    <RowFixed>
                      <StyledLabel>
                        <Trans>Token Info</Trans>
                      </StyledLabel>
                      <QuestionHelper text={t`Turn on to display token info`} />
                    </RowFixed>
                    <LegacyToggle isActive={isShowTokenInfo} toggle={toggleTokenInfo} size={isMobile ? 'md' : 'sm'} />
                  </RowBetween>
                </AutoColumn>
              </>
            )}
          </>
        </MenuFlyout>
      </StyledMenu>
    </>
  )
}
