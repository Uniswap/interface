import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css, keyframes } from 'styled-components'
import { amountFormatter } from '../../utils'
import { useDebounce } from '../../hooks'
import { HelpCircle } from 'react-feather'

import NewContextualInfo from '../../components/ContextualInfoNew'

const Flex = styled.div`
  display: flex;
  justify-content: center;
  button {
    max-width: 20rem;
  }
`

const SlippageRow = styled(Flex)`
  position: relative;
  width: 100%;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  font-size: 0.8rem;
  padding: 0;
  height: 24px;
  margin-bottom: 14px;
`

const QuestionWrapper = styled.div`
  margin-left: 0.2rem;
  margin-top: 0.6rem;
  height: 25px;

  &:hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

const HelpCircleStyled = styled(HelpCircle)`
  height: 18px;
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
  aligm-items: center;
  padding: 1rem;
  line-height: 183.52%;
  background: #404040;
  border-radius: 8px;

  animation: ${fadeIn} 0.15s linear;

  color: white;
  font-style: italic;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    left: -20px;
  `}
`

const Option = styled(Flex)`
  align-items: center;
  min-width: 55px;
  height: 24px;
  margin-right: 4px;
  border-radius: 36px;
  border: 1px solid #f2f2f2;

  ${({ active }) =>
    active &&
    `
    background-color: #2f80ed;
    color: white;
    border: 1px solid #2f80ed;
  `}

  &:hover {
    cursor: pointer;
  }
`

const Input = styled.input`
  width: 123.27px;
  background: #ffffff;
  height: 2rem;
  outline: none;
  margin-left: 20px;
  border: 1px solid #f2f2f2;
  box-sizing: border-box;
  border-radius: 36px;
  color: #aeaeae;

  &:focus {
  }

  text-align: left;
  padding-left: 0.9rem;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ${({ active }) =>
    active &&
    `
    border: 1px solid #2f80ed;
    text-align: right;
    padding-right 1.5rem;
    padding-left 0rem;
    color : inherit;
  `}

  ${({ warning }) =>
    warning === 'red' &&
    `
    color : #FF6871;
    border: 1px solid #FF6871;
  `}
`

const BottomError = styled.div`
  margin-top: 1rem;
  color: #aeaeae;

  ${({ color }) =>
    color === 'red' &&
    `
    color : #FF6871;
  `}
`

const Break = styled.div`
  border: 1px solid #f2f2f2;
  width: 100%;
  margin-top: 1rem;
`

const OptionLarge = styled(Option)`
  width: 120px;
`

const Bold = styled.span`
  font-weight: 500;
`

const LastSummaryText = styled.div`
  margin-top: 0.6rem;
`

const SlippageSelector = styled.div`
  margin-top: 1rem;
`

const InputGroup = styled.div`
  position: relative;
`

const Percent = styled.div`
  right: 14px;
  top: 9px;
  position: absolute;
  color: inherit;
  font-size: 0, 8rem;

  ${({ color }) =>
    (color === 'faded' &&
      `
    color : #AEAEAE
    `) ||
    (color === 'red' &&
      `
    color : #FF6871
    `)}
`

const Faded = styled.span`
  opacity: 0.7;
`

const ErrorEmoji = styled.span`
  left: 30px;
  top: 4px;
  position: absolute;
`

export default function TransactionDetails(props) {
  const { t } = useTranslation()

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
          !!(props.inputCurrency && props.outputCurrency && props.inputValueParsed && props.outputValueParsed)
        }
        isError={isError}
        slippageWarning={props.slippageWarning && !contextualInfo}
        highSlippageWarning={props.highSlippageWarning && !contextualInfo}
        renderTransactionDetails={renderTransactionDetails}
        dropDownContent={dropDownContent}
      />
    )
  }

  const [activeIndex, setActiveIndex] = useState(3)

  const [placeHolder, setplaceHolder] = useState('Custom')

  const [warningType, setWarningType] = useState('none')

  const [showPopup, setPopup] = useState(false)

  const dropDownContent = () => {
    return (
      <>
        {renderTransactionDetails()}
        <Break />
        <SlippageSelector>
          <SlippageRow>
            Limit additional price slippage
            <QuestionWrapper
              onMouseEnter={() => {
                setPopup(true)
              }}
              onMouseLeave={() => {
                setPopup(false)
              }}
            >
              <HelpCircleStyled />
            </QuestionWrapper>
            {showPopup ? (
              <Popup>
                Lowering this limit decreases your risk of frontrunning. This makes it more likely that your transaction
                will fail due to normal price movements.
              </Popup>
            ) : (
              ''
            )}
          </SlippageRow>
          <SlippageRow>
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
                setFromFixed(2, 1)
              }}
              active={activeIndex === 2}
            >
              1%
            </Option>
            <OptionLarge
              onClick={() => {
                setFromFixed(3, 2)
              }}
              active={activeIndex === 3}
            >
              2%
              <Faded>(suggested)</Faded>
            </OptionLarge>
            <InputGroup>
              {warningType !== 'none' ? <ErrorEmoji>⚠️</ErrorEmoji> : ''}
              <Input
                placeholder={placeHolder}
                value={userInput || ''}
                onChange={parseInput}
                onClick={e => {
                  setActiveIndex(4)
                  setplaceHolder('')
                  parseInput(e)
                }}
                active={activeIndex === 4}
                warning={
                  warningType === 'emptyInput'
                    ? ''
                    : warningType !== 'none' && warningType !== 'riskyEntryLow'
                    ? 'red'
                    : ''
                }
              />
              <Percent
                color={
                  warningType === 'emptyInput'
                    ? 'faded'
                    : warningType !== 'none' && warningType !== 'riskyEntryLow'
                    ? 'red'
                    : activeIndex !== 4
                    ? 'faded'
                    : ''
                }
              >
                %
              </Percent>
            </InputGroup>
          </SlippageRow>
          <SlippageRow>
            <BottomError
              color={
                warningType === 'emptyInput'
                  ? ''
                  : warningType !== 'none' && warningType !== 'riskyEntryLow'
                  ? 'red'
                  : ''
              }
            >
              {warningType === 'emptyInput' ? 'Enter a slippage percentage.' : ''}
              {warningType === 'invalidEntry' ? 'Please input a valid percentage.' : ''}
              {warningType === 'invalidEntryBound' ? 'Pleae select value less than 50%' : ''}
              {warningType === 'riskyEntryHigh' ? 'Your transaction may be frontrun.' : ''}
              {warningType === 'riskyEntryLow' ? 'Your transaction may fail.' : ''}
            </BottomError>
          </SlippageRow>
        </SlippageSelector>
      </>
    )
  }

  // used for slippage presets
  const setFromFixed = (index, slippage) => {
    // update slippage in parent, reset errors and input state
    updateSlippage(slippage)
    setWarningType('none')
    setActiveIndex(index)
    props.setcustomSlippageError('valid')
    setplaceHolder('Custom')
  }

  const [userInput, setUserInput] = useState()
  const debouncedInput = useDebounce(userInput, 150)

  /**
   * proposed debounce flow
   *
   * 1. onChange, check if theyve entered valid number
   *
   * 2. if valid, update the userInput state
   *
   * 3. trigger a side effect that montors debouncedInput
   *
   * 4. in that side effect, check if input is within bounds
   *
   * 5. if not, set errors - if so, update the parent slippage
   *
   */

  // check that the theyve entered number and correct decimal
  const parseInput = e => {
    let input = e.target.value

    //if blank, update warnings
    if (input === '') {
      setUserInput(input)
      props.setcustomSlippageError('invalid')
      return setWarningType('emptyInput')
    }

    //check for valid key entry
    let isValid = /^[+]?\d*\.?\d{1,2}$/.test(input) || /^[+]?\d*\.$/.test(input)

    // restrict to 2 decimal places
    let decimalLimit = /^\d+\.?\d{0,2}$/.test(input) || input === ''

    // if its within accepted decimal limit, update the input state
    if (decimalLimit) {
      setUserInput(input)
    } else {
      return
    }

    // now check within acceptable bounds
    if (isValid) {
      checkAcceptablePercentValue(input)
    } else {
      setWarningType('invalidEntry')
    }
  }

  const checkAcceptablePercentValue = input => {
    //reset errors (here in in parent)
    setWarningType('none')
    props.setcustomSlippageError('valid')

    // check bounds and set errors
    if (input < 0 || input > 50) {
      props.setcustomSlippageError('invalid')
      return setWarningType('invalidEntryBound')
    }
    if (input >= 0 && input < 0.1) {
      props.setcustomSlippageError('valid')
      setWarningType('riskyEntryLow')
    }
    if (input >= 5) {
      props.setcustomSlippageError('warning')
      setWarningType('riskyEntryHigh')
    }

    //update the actual slippage value in parent
    updateSlippage(input)
  }

  const updateSlippage = newSlippage => {
    // round to 2 decimals to prevent ethers error
    let numParsed = parseFloat((newSlippage * 100).toFixed(2))

    // set both slippage values in parents
    props.setRawSlippage(numParsed)
    props.setRawTokenSlippage(numParsed)
  }

  const b = text => <Bold>{text}</Bold>

  const renderTransactionDetails = () => {
    if (props.independentField === props.INPUT) {
      return (
        <div>
          <div>
            {t('youAreSelling')}{' '}
            {b(
              `${amountFormatter(
                props.independentValueParsed,
                props.independentDecimals,
                Math.min(4, props.independentDecimals)
              )} ${props.inputSymbol}`
            )}{' '}
            {t('forAtLeast')}
            {b(
              `${amountFormatter(
                props.dependentValueMinumum,
                props.dependentDecimals,
                Math.min(4, props.dependentDecimals)
              )} ${props.outputSymbol}`
            )}
            .
          </div>
          <LastSummaryText>
            {t('priceChange')} {b(`${props.percentSlippageFormatted}%`)}.
          </LastSummaryText>
        </div>
      )
    } else {
      return (
        <div>
          <div>
            {t('youAreBuying')}{' '}
            {b(
              `${amountFormatter(
                props.independentValueParsed,
                props.independentDecimals,
                Math.min(4, props.independentDecimals)
              )} ${props.outputSymbol}`
            )}
            .
          </div>
          <LastSummaryText>
            {t('itWillCost')}{' '}
            {b(
              `${amountFormatter(
                props.dependentValueMaximum,
                props.dependentDecimals,
                Math.min(4, props.dependentDecimals)
              )} ${props.inputSymbol}`
            )}{' '}
            {t('orTransFail')}
          </LastSummaryText>
          <LastSummaryText>
            {t('priceChange')} {b(`${props.percentSlippageFormatted}%`)}.
          </LastSummaryText>
        </div>
      )
    }
  }
  return <>{renderSummary()}</>
}
