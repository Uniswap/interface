import React, { useState, useEffect, useRef } from 'react'
import ReactGA from 'react-ga'
import { useTranslation } from 'react-i18next'
import styled, { css, keyframes } from 'styled-components'
import { darken, lighten } from 'polished'
import { isAddress, amountFormatter } from '../../utils'
import { useDebounce } from '../../hooks'

import question from '../../assets/images/question.svg'

import NewContextualInfo from '../../components/ContextualInfoNew'

const WARNING_TYPE = Object.freeze({
  none: 'none',
  emptyInput: 'emptyInput',
  invalidEntryBound: 'invalidEntryBound',
  riskyEntryHigh: 'riskyEntryHigh',
  riskyEntryLow: 'riskyEntryLow'
})

const Flex = styled.div`
  display: flex;
  justify-content: center;
`

const FlexBetween = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
`

const WrappedSlippageRow = ({ wrap, ...rest }) => <Flex {...rest} />
const SlippageRow = styled(WrappedSlippageRow)`
  position: relative;
  flex-wrap: ${({ wrap }) => wrap && 'wrap'};
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  padding: 0;
  padding-top: ${({ wrap }) => wrap && '0.25rem'};
`

const QuestionWrapper = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  margin-left: 0.4rem;
  padding: 0.2rem;
  border: none;
  background: none;
  outline: none;
  cursor: default;
  border-radius: 36px;

  :hover,
  :focus {
    opacity: 0.7;
  }
`

const HelpCircleStyled = styled.img`
  height: 18px;
  width: 18px;
`

const fadeIn = keyframes`
  from {
    opacity : 0;
  }

  to {
    opacity : 1;
  }
`

const Popup = styled(Flex)`
  position: absolute;
  width: 228px;
  left: -78px;
  top: -124px;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 1rem;
  line-height: 150%;
  background: ${({ theme }) => theme.inputBackground};
  border: 1px solid ${({ theme }) => theme.mercuryGray};

  border-radius: 8px;

  animation: ${fadeIn} 0.15s linear;

  color: ${({ theme }) => theme.textColor};
  font-style: italic;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    left: -20px;
  `}
`

const FancyButton = styled.button`
  color: ${({ theme }) => theme.textColor};
  align-items: center;
  min-width: 55px;
  height: 2rem;
  border-radius: 36px;
  font-size: 12px;
  border: 1px solid ${({ theme }) => theme.mercuryGray};
  outline: none;
  background: ${({ theme }) => theme.inputBackground};

  :hover {
    cursor: inherit;
    border: 1px solid ${({ theme }) => theme.chaliceGray};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.royalBlue};
  }
`

const Option = styled(FancyButton)`
  margin-right: 8px;
  margin-top: 6px;

  :hover {
    cursor: pointer;
  }

  ${({ active, theme }) =>
    active &&
    css`
      background-color: ${({ theme }) => theme.royalBlue};
      color: ${({ theme }) => theme.white};
      border: none;

      :hover {
        border: none;
        box-shadow: none;
        background-color: ${({ theme }) => darken(0.05, theme.royalBlue)};
      }

      :focus {
        border: none;
        box-shadow: none;
        background-color: ${({ theme }) => lighten(0.05, theme.royalBlue)};
      }

      :active {
        background-color: ${({ theme }) => darken(0.05, theme.royalBlue)};
      }

      :hover:focus {
        background-color: ${({ theme }) => theme.royalBlue};
      }
      :hover:focus:active {
        background-color: ${({ theme }) => darken(0.05, theme.royalBlue)};
      }
    `}
`

const OptionLarge = styled(Option)`
  width: 120px;
`

const Input = styled.input`
  background: ${({ theme }) => theme.inputBackground};
  flex-grow: 1;
  font-size: 12px;

  outline: none;
  box-sizing: border-box;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  cursor: inherit;

  color: ${({ theme }) => theme.doveGray};
  text-align: left;
  ${({ active }) =>
    active &&
    css`
      color: initial;
      cursor: initial;
      text-align: right;
    `}

  ${({ placeholder }) =>
    placeholder !== 'Custom' &&
    css`
      text-align: right;
      color: ${({ theme }) => theme.textColor};
    `}

  ${({ color }) =>
    color === 'red' &&
    css`
      color: ${({ theme }) => theme.salmonRed};
    `}
`

const BottomError = styled.div`
  ${({ show }) =>
    show &&
    css`
      padding-top: 12px;
    `}
  color: ${({ theme }) => theme.doveGray};
  ${({ color }) =>
    color === 'red' &&
    css`
      color: ${({ theme }) => theme.salmonRed};
    `}
`

const OptionCustom = styled(FancyButton)`
  height: 2rem;
  position: relative;
  width: 120px;
  margin-top: 6px;
  padding: 0 0.75rem;

  ${({ active }) =>
    active &&
    css`
      border: 1px solid ${({ theme }) => theme.royalBlue};
      :hover {
        border: 1px solid ${({ theme }) => darken(0.1, theme.royalBlue)};
      }
    `}

  ${({ color }) =>
    color === 'red' &&
    css`
      border: 1px solid ${({ theme }) => theme.salmonRed};
    `}

  input {
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: 2rem;
  }
`

const Bold = styled.span`
  font-weight: 500;
`

const LastSummaryText = styled.div`
  padding-top: 0.5rem;
`

const SlippageSelector = styled.div`
  background-color: ${({ theme }) => darken(0.04, theme.concreteGray)};
  padding: 1rem 1.25rem 1rem 1.25rem;
  border-radius: 12px;
`

const Percent = styled.div`
  color: inherit;
  font-size: 0, 8rem;
  flex-grow: 0;

  ${({ color, theme }) =>
    (color === 'faded' &&
      css`
        color: ${theme.doveGray};
      `) ||
    (color === 'red' &&
      css`
        color: ${theme.salmonRed};
      `)};
`

const Faded = styled.span`
  opacity: 0.7;
`

const TransactionInfo = styled.div`
  padding: 1.25rem 1.25rem 1rem 1.25rem;
`

const ValueWrapper = styled.span`
  padding: 0.125rem 0.3rem 0.1rem 0.3rem;
  background-color: ${({ theme }) => darken(0.04, theme.concreteGray)};
  border-radius: 12px;
  font-variant: tabular-nums;
`

export default function TransactionDetails(props) {
  const { t } = useTranslation()

  const [activeIndex, setActiveIndex] = useState(3)

  const [warningType, setWarningType] = useState(WARNING_TYPE.none)

  const inputRef = useRef()

  const [showPopup, setPopup] = useState(false)

  const [userInput, setUserInput] = useState('')
  const debouncedInput = useDebounce(userInput, 150)

  useEffect(() => {
    if (activeIndex === 4) {
      checkBounds(debouncedInput)
    }
  })

  function renderSummary() {
    let contextualInfo = ''
    let isError = false

    if (props.inputError || props.independentError) {
      contextualInfo = props.inputError || props.independentError
      isError = true
    } else if (!props.inputCurrency || !props.outputCurrency) {
      contextualInfo = t('selectTokenCont')
    } else if (!props.independentValue) {
      contextualInfo = t('enterValueCont')
    } else if (props.sending && !props.recipientAddress) {
      contextualInfo = t('noRecipient')
    } else if (props.sending && !isAddress(props.recipientAddress)) {
      contextualInfo = t('invalidRecipient')
    } else if (!props.account) {
      contextualInfo = t('noWallet')
      isError = true
    }

    const slippageWarningText = props.highSlippageWarning
      ? t('highSlippageWarning')
      : props.slippageWarning
      ? t('slippageWarning')
      : ''

    return (
      <NewContextualInfo
        openDetailsText={t('transactionDetails')}
        closeDetailsText={t('hideDetails')}
        contextualInfo={contextualInfo ? contextualInfo : slippageWarningText}
        allowExpand={
          !!(
            props.inputCurrency &&
            props.outputCurrency &&
            props.inputValueParsed &&
            props.outputValueParsed &&
            (props.sending ? props.recipientAddress : true)
          )
        }
        isError={isError}
        slippageWarning={props.slippageWarning && !contextualInfo}
        highSlippageWarning={props.highSlippageWarning && !contextualInfo}
        renderTransactionDetails={renderTransactionDetails}
        dropDownContent={dropDownContent}
      />
    )
  }

  const dropDownContent = () => {
    return (
      <>
        {renderTransactionDetails()}
        <SlippageSelector>
          <SlippageRow>
            Limit additional price slippage
            <QuestionWrapper
              onClick={() => {
                setPopup(!showPopup)
              }}
              onMouseEnter={() => {
                setPopup(true)
              }}
              onMouseLeave={() => {
                setPopup(false)
              }}
            >
              <HelpCircleStyled src={question} alt="popup" />
            </QuestionWrapper>
            {showPopup ? (
              <Popup>
                Lowering this limit decreases your risk of frontrunning. However, this makes it more likely that your
                transaction will fail due to normal price movements.
              </Popup>
            ) : (
              ''
            )}
          </SlippageRow>
          <SlippageRow wrap>
            <Option
              onClick={() => {
                setFromFixed(1, 0.1)
              }}
              active={activeIndex === 1}
            >
              0.1%
            </Option>
            <Option
              onClick={() => {
                setFromFixed(2, 0.5)
              }}
              active={activeIndex === 2}
            >
              0.5%
            </Option>
            <OptionLarge
              onClick={() => {
                setFromFixed(3, 1)
              }}
              active={activeIndex === 3}
            >
              1% <Faded>(suggested)</Faded>
            </OptionLarge>
            <OptionCustom
              active={activeIndex === 4}
              color={
                warningType === WARNING_TYPE.emptyInput
                  ? ''
                  : warningType !== WARNING_TYPE.none && warningType !== WARNING_TYPE.riskyEntryLow
                  ? 'red'
                  : ''
              }
              onClick={() => {
                setFromCustom()
              }}
            >
              <FlexBetween>
                {!(warningType === WARNING_TYPE.none || warningType === WARNING_TYPE.emptyInput) && (
                  <span role="img" aria-label="warning">
                    ⚠️
                  </span>
                )}
                <Input
                  tabIndex={-1}
                  ref={inputRef}
                  active={activeIndex === 4}
                  placeholder={
                    activeIndex === 4
                      ? !!userInput
                        ? ''
                        : '0'
                      : activeIndex !== 4 && userInput !== ''
                      ? userInput
                      : 'Custom'
                  }
                  value={activeIndex === 4 ? userInput : ''}
                  onChange={parseInput}
                  color={
                    warningType === WARNING_TYPE.emptyInput
                      ? ''
                      : warningType !== WARNING_TYPE.none && warningType !== WARNING_TYPE.riskyEntryLow
                      ? 'red'
                      : ''
                  }
                />
                <Percent
                  color={
                    activeIndex !== 4
                      ? 'faded'
                      : warningType === WARNING_TYPE.riskyEntryHigh || warningType === WARNING_TYPE.invalidEntryBound
                      ? 'red'
                      : ''
                  }
                >
                  %
                </Percent>
              </FlexBetween>
            </OptionCustom>
          </SlippageRow>
          <SlippageRow>
            <BottomError
              show={activeIndex === 4}
              color={
                warningType === WARNING_TYPE.emptyInput
                  ? ''
                  : warningType !== WARNING_TYPE.none && warningType !== WARNING_TYPE.riskyEntryLow
                  ? 'red'
                  : ''
              }
            >
              {activeIndex === 4 && warningType.toString() === 'none' && 'Custom slippage value'}
              {warningType === WARNING_TYPE.emptyInput && 'Enter a slippage percentage'}
              {warningType === WARNING_TYPE.invalidEntryBound && 'Please select a value no greater than 50%'}
              {warningType === WARNING_TYPE.riskyEntryHigh && 'Your transaction may be frontrun'}
              {warningType === WARNING_TYPE.riskyEntryLow && 'Your transaction may fail'}
            </BottomError>
          </SlippageRow>
        </SlippageSelector>
      </>
    )
  }

  const setFromCustom = () => {
    setActiveIndex(4)
    inputRef.current.focus()
    // if there's a value, evaluate the bounds
    checkBounds(debouncedInput)
  }

  // used for slippage presets
  const setFromFixed = (index, slippage) => {
    // update slippage in parent, reset errors and input state
    updateSlippage(slippage)
    setWarningType(WARNING_TYPE.none)
    setActiveIndex(index)
    props.setcustomSlippageError('valid`')
  }

  const checkBounds = slippageValue => {
    setWarningType(WARNING_TYPE.none)
    props.setcustomSlippageError('valid')

    if (slippageValue === '' || slippageValue === '.') {
      props.setcustomSlippageError('invalid')
      return setWarningType(WARNING_TYPE.emptyInput)
    }

    // check bounds and set errors
    if (Number(slippageValue) < 0 || Number(slippageValue) > 50) {
      props.setcustomSlippageError('invalid')
      return setWarningType(WARNING_TYPE.invalidEntryBound)
    }
    if (Number(slippageValue) >= 0 && Number(slippageValue) < 0.1) {
      props.setcustomSlippageError('valid')
      setWarningType(WARNING_TYPE.riskyEntryLow)
    }
    if (Number(slippageValue) > 5) {
      props.setcustomSlippageError('warning')
      setWarningType(WARNING_TYPE.riskyEntryHigh)
    }
    //update the actual slippage value in parent
    updateSlippage(Number(slippageValue))
  }

  // check that the theyve entered number and correct decimal
  const parseInput = e => {
    let input = e.target.value

    // restrict to 2 decimal places
    let acceptableValues = [/^$/, /^\d{1,2}$/, /^\d{0,2}\.\d{0,2}$/]
    // if its within accepted decimal limit, update the input state
    if (acceptableValues.some(a => a.test(input))) {
      setUserInput(input)
    }
  }

  const updateSlippage = newSlippage => {
    // round to 2 decimals to prevent ethers error
    let numParsed = parseInt(newSlippage * 100)

    // set both slippage values in parents
    props.setRawSlippage(numParsed)
    props.setRawTokenSlippage(numParsed)
  }

  const b = text => <Bold>{text}</Bold>

  const renderTransactionDetails = () => {
    ReactGA.event({
      category: 'TransactionDetail',
      action: 'Open'
    })

    if (props.independentField === props.INPUT) {
      return props.sending ? (
        <TransactionInfo>
          <div>
            {t('youAreSelling')}{' '}
            <ValueWrapper>
              {b(
                `${amountFormatter(
                  props.independentValueParsed,
                  props.independentDecimals,
                  Math.min(4, props.independentDecimals)
                )} ${props.inputSymbol}`
              )}
            </ValueWrapper>
            .
          </div>
          <LastSummaryText>
            {b(props.recipientAddress)} {t('willReceive')}{' '}
            <ValueWrapper>
              {b(
                `${amountFormatter(
                  props.dependentValueMinumum,
                  props.dependentDecimals,
                  Math.min(4, props.dependentDecimals)
                )} ${props.outputSymbol}`
              )}
            </ValueWrapper>{' '}
          </LastSummaryText>
          <LastSummaryText>
            {t('priceChange')} <ValueWrapper>{b(`${props.percentSlippageFormatted}%`)}</ValueWrapper>.
          </LastSummaryText>
        </TransactionInfo>
      ) : (
        <TransactionInfo>
          <div>
            {t('youAreSelling')}{' '}
            <ValueWrapper>
              {b(
                `${amountFormatter(
                  props.independentValueParsed,
                  props.independentDecimals,
                  Math.min(4, props.independentDecimals)
                )} ${props.inputSymbol}`
              )}
            </ValueWrapper>{' '}
            {t('forAtLeast')}
            <ValueWrapper>
              {b(
                `${amountFormatter(
                  props.dependentValueMinumum,
                  props.dependentDecimals,
                  Math.min(4, props.dependentDecimals)
                )} ${props.outputSymbol}`
              )}
            </ValueWrapper>
          </div>
          <LastSummaryText>
            {t('priceChange')} <ValueWrapper>{b(`${props.percentSlippageFormatted}%`)}</ValueWrapper>.
          </LastSummaryText>
        </TransactionInfo>
      )
    } else {
      return props.sending ? (
        <TransactionInfo>
          <div>
            {t('youAreSending')}{' '}
            <ValueWrapper>
              {b(
                `${amountFormatter(
                  props.independentValueParsed,
                  props.independentDecimals,
                  Math.min(4, props.independentDecimals)
                )} ${props.outputSymbol}`
              )}
            </ValueWrapper>{' '}
            {t('to')} {b(props.recipientAddress)}
          </div>
          <LastSummaryText>
            {t('itWillCost')}{' '}
            <ValueWrapper>
              {b(
                `${amountFormatter(
                  props.dependentValueMaximum,
                  props.dependentDecimals,
                  Math.min(4, props.dependentDecimals)
                )} ${props.inputSymbol}`
              )}
            </ValueWrapper>{' '}
          </LastSummaryText>
          <LastSummaryText>
            {t('priceChange')} <ValueWrapper>{b(`${props.percentSlippageFormatted}%`)}</ValueWrapper>.
          </LastSummaryText>
        </TransactionInfo>
      ) : (
        <TransactionInfo>
          <div>
            {t('youAreBuying')}{' '}
            <ValueWrapper>
              {b(
                `${amountFormatter(
                  props.independentValueParsed,
                  props.independentDecimals,
                  Math.min(4, props.independentDecimals)
                )} ${props.outputSymbol}`
              )}
            </ValueWrapper>
          </div>
          <LastSummaryText>
            {t('itWillCost')}{' '}
            <ValueWrapper>
              {b(
                `${amountFormatter(
                  props.dependentValueMaximum,
                  props.dependentDecimals,
                  Math.min(4, props.dependentDecimals)
                )} ${props.inputSymbol}`
              )}
            </ValueWrapper>{' '}
          </LastSummaryText>
          <LastSummaryText>
            {t('priceChange')} <ValueWrapper>{b(`${props.percentSlippageFormatted}%`)}</ValueWrapper>.
          </LastSummaryText>
        </TransactionInfo>
      )
    }
  }
  return <>{renderSummary()}</>
}
