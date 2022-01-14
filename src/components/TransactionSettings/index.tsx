import React, { useState, useRef, useContext, useCallback } from 'react'
import styled, { css, ThemeContext } from 'styled-components'
import { t, Trans } from '@lingui/macro'
import { Text, Flex } from 'rebass'
import { X } from 'react-feather'
import QuestionHelper from '../QuestionHelper'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { darken } from 'polished'
import {
  useExpertModeManager,
  useUserSlippageTolerance,
  useUserTransactionTTL,
  useShowLiveChart,
  useShowTradeRoutes,
  useToggleLiveChart,
  useToggleTradeRoutes
} from 'state/user/hooks'
import useTheme from 'hooks/useTheme'
import { useModalOpen, useToggleTransactionSettingsMenu, useToggleModal } from 'state/application/hooks'
import Toggle from 'components/Toggle'
import Modal from 'components/Modal'
import { ButtonPrimary, ButtonOutlined } from 'components/Button'
import { ApplicationModal } from 'state/application/actions'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Tooltip from 'components/Tooltip'
import MenuFlyout from 'components/MenuFlyout'
import { isMobile } from 'react-device-detect'
enum SlippageError {
  InvalidInput = 'InvalidInput',
  RiskyLow = 'RiskyLow',
  RiskyHigh = 'RiskyHigh'
}

enum DeadlineError {
  InvalidInput = 'InvalidInput'
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

const StyledCloseIcon = styled(X)`
  height: 28px;
  width: 28px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text};
  }
`

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 24px 28px;
  background-color: ${({ theme }) => theme.background};
`

const StyledMenuButton = styled.button<{ active?: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;

  padding: 0.15rem 0.5rem;
  border-radius: 4px;

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
  }

  ${({ active }) =>
    active
      ? css`
          cursor: pointer;
          outline: none;
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}

  svg {
    margin-top: 2px;
  }
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

const StyledInput = styled.input`
  margin-top: 24px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 16px;
  outline: none;
  color: ${({ theme }) => theme.text};
  border: none;
  &:placeholder {
    color: ${({ theme }) => theme.disableText};
  }
`
const StyledTitle = styled.div`
  font-size: ${isMobile ? '16px' : '16px'};
  font-weight: 500;
`
const StyledLabel = styled.div`
  font-size: ${isMobile ? '14px' : '12px'};
  color: ${({ theme }) => theme.text};
  font-weigh: 400;
  line-height: 20px;
`

export interface SlippageTabsProps {
  rawSlippage: number
  setRawSlippage: (rawSlippage: number) => void
  deadline: number
  setDeadline: (deadline: number) => void
}

export function SlippageTabs({ rawSlippage, setRawSlippage, deadline, setDeadline }: SlippageTabsProps) {
  const theme = useContext(ThemeContext)

  const inputRef = useRef<HTMLInputElement>()

  const [slippageInput, setSlippageInput] = useState('')
  const [deadlineInput, setDeadlineInput] = useState('')

  const slippageInputIsValid =
    slippageInput === '' || (rawSlippage / 100).toFixed(2) === Number.parseFloat(slippageInput).toFixed(2)
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
      const valueAsIntFromRoundedFloat = Number.parseInt((Number.parseFloat(value) * 100).toString())
      if (!Number.isNaN(valueAsIntFromRoundedFloat) && valueAsIntFromRoundedFloat < 5000) {
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
              color: slippageError === SlippageError.InvalidInput ? 'red' : '#F3841E'
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
  tradeValid = false,
  isSwapPage = false
}: {
  tradeValid?: boolean
  isSwapPage?: boolean
}) {
  const theme = useTheme()
  const [userSlippageTolerance, setUserslippageTolerance] = useUserSlippageTolerance()
  const [ttl, setTtl] = useUserTransactionTTL()
  const [expertMode, toggleExpertMode] = useExpertModeManager()
  const toggle = useToggleTransactionSettingsMenu()
  // show confirmation view before turning on
  const [showConfirmation, setShowConfirmation] = useState(false)
  const open = useModalOpen(ApplicationModal.TRANSACTION_SETTINGS)
  const node = useRef<HTMLDivElement>()

  const [isShowTooltip, setIsShowTooltip] = useState<boolean>(false)
  const showTooltip = useCallback(() => setIsShowTooltip(true), [setIsShowTooltip])
  const hideTooltip = useCallback(() => setIsShowTooltip(false), [setIsShowTooltip])

  const [confirmText, setConfirmText] = useState('')

  const isShowLiveChart = useShowLiveChart()
  const isShowMobileLiveChart = useModalOpen(ApplicationModal.MOBILE_LIVE_CHART)
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowMobileTradeRoutes = useModalOpen(ApplicationModal.MOBILE_TRADE_ROUTES)
  const toggleLiveChart = useToggleLiveChart()
  const toggleMobileLiveChart = useToggleModal(ApplicationModal.MOBILE_LIVE_CHART)
  const toggleTradeRoutes = useToggleTradeRoutes()
  const toggleMobileTradeRoutes = useToggleModal(ApplicationModal.MOBILE_TRADE_ROUTES)
  return (
    <>
      <Modal
        isOpen={showConfirmation}
        onDismiss={() => {
          setConfirmText('')
          setShowConfirmation(false)
        }}
        maxHeight={100}
      >
        <ModalContentWrapper>
          <Flex alignItems="center" justifyContent="space-between">
            <Text fontSize="20px" fontWeight={500}>
              <Trans>Are you sure?</Trans>
            </Text>

            <StyledCloseIcon onClick={() => setShowConfirmation(false)} />
          </Flex>

          <Text marginTop="28px">
            <Trans>
              <Text color={theme.warning} as="span" fontWeight="500">
                Advanced Mode
              </Text>{' '}
              turns off the 'Confirm' transaction prompt and allows high slippage trades that can result in bad rates
              and lost funds.
            </Trans>
          </Text>

          <Text marginTop="24px">
            <Trans>Please type the word 'confirm' below to enable Advanced Mode</Trans>
          </Text>

          <StyledInput placeholder="Confirm" value={confirmText} onChange={e => setConfirmText(e.target.value)} />

          <Text color={theme.disableText} marginTop="8px" fontSize="10px">
            <Trans>Use this mode if you are aware of the risks</Trans>
          </Text>

          <Flex sx={{ gap: '12px' }} marginTop="28px">
            <ButtonPrimary
              style={{
                border: 'none',
                background: theme.warning,
                fontSize: '18px'
              }}
              onClick={() => {
                if (confirmText.trim().toLowerCase() === 'confirm') {
                  toggleExpertMode()
                  setConfirmText('')
                  setShowConfirmation(false)
                }
              }}
            >
              <Trans>Confirm</Trans>
            </ButtonPrimary>
            <ButtonOutlined
              onClick={() => {
                setConfirmText('')
                setShowConfirmation(false)
              }}
              style={{ fontSize: '18px' }}
            >
              <Trans>Cancel</Trans>
            </ButtonOutlined>
          </Flex>
        </ModalContentWrapper>
      </Modal>

      {/* https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451 */}
      <StyledMenu ref={node as any}>
        <Tooltip text={t`Advanced mode is on!`} show={expertMode && isShowTooltip}>
          <div onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
            <StyledMenuButton
              active={open}
              onClick={toggle}
              id="open-settings-dialog-button"
              aria-label="Transaction Settings"
            >
              <TransactionSettingsIcon fill={expertMode ? theme.warning : theme.text} />
            </StyledMenuButton>
          </div>
        </Tooltip>

        <MenuFlyout
          node={node}
          browserCustomStyle={MenuFlyoutBrowserStyle}
          isOpen={open}
          toggle={toggle}
          translatedTitle={t`Advanced Settings`}
          mobileCustomStyle={{ paddingBottom: '40px' }}
          hasArrow
        >
          <>
            <SlippageTabs
              rawSlippage={userSlippageTolerance}
              setRawSlippage={setUserslippageTolerance}
              deadline={ttl}
              setDeadline={setTtl}
            />

            <RowBetween margin="14px 0">
              <RowFixed>
                <StyledLabel>
                  <Trans>Advanced Mode</Trans>
                </StyledLabel>
                <QuestionHelper text={t`Enables high slippage trades. Use at your own risk.`} />
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
                size={isMobile ? 'md' : 'sm'}
              />
            </RowBetween>
            {isSwapPage && (
              <>
                <StyledTitle style={{ borderTop: '1px solid ' + theme.border, padding: '16px 0' }}>
                  <Trans>Display Settings</Trans>
                </StyledTitle>
                <AutoColumn gap="md">
                  <RowBetween>
                    <RowFixed>
                      <StyledLabel>Live Chart</StyledLabel>
                      <QuestionHelper text={t`Turn on to display live chart.`} />
                    </RowFixed>
                    <Toggle
                      isActive={isMobile ? isShowMobileLiveChart : isShowLiveChart}
                      toggle={() => {
                        if (isMobile) {
                          toggleMobileLiveChart()
                        } else {
                          toggleLiveChart()
                        }
                      }}
                      size={isMobile ? 'md' : 'sm'}
                    />
                  </RowBetween>
                  <RowBetween>
                    <RowFixed>
                      <StyledLabel>
                        <Trans>Trade Route</Trans>
                      </StyledLabel>
                      <QuestionHelper text={t`Turn on to display trade route.`} />
                    </RowFixed>
                    <Toggle
                      isActive={(isMobile ? isShowMobileTradeRoutes : isShowTradeRoutes) && tradeValid}
                      toggle={() => {
                        if (isMobile) {
                          toggleMobileTradeRoutes()
                        } else {
                          toggleTradeRoutes()
                        }
                      }}
                      size={isMobile ? 'md' : 'sm'}
                    />
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
