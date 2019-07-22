import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { amountFormatter } from '../../utils'

import NewContextualInfo from '../../components/ContextualInfoNew'

const Flex = styled.div`
  display: flex;
  justify-content: center;
  padding: 14px 0;
  button {
    max-width: 20rem;
  }
`

const SlippageRow = styled(Flex)`
  flex-direction: row;
  width: 100%;
  justify-content: flex-start;
  font-size: 0.8rem;
  padding: 0;
  height: 24px;
  margin-bottom: 14px;
`

const Option = styled(Flex)`
  align-items: center;
  min-width: 55px;
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
    warning &&
    `
    color : #FF6871;
    border: 1px solid #FF6871;
  `}
`

const BottomError = styled.div`
  margin-top: 1rem;
  color: #aeaeae;

  ${({ warning }) =>
    warning &&
    `
  color : #FF6871;
`}
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
  margin-top: 28px;
`

const InputGroup = styled.div`
  position: relative;
`

const Percent = styled.div`
  right: 14px;
  top: 8px;
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

  const dropDownContent = () => {
    return (
      <>
        {renderTransactionDetails()}
        <SlippageSelector>
          <SlippageRow>Limit addtional price slippage</SlippageRow>
          <SlippageRow>
            <Option
              onClick={() => {
                checkAcceptablePercentValue(0.1)
                setActiveIndex(1)
                setplaceHolder('Custom')
              }}
              active={activeIndex === 1 ? true : false}
            >
              0.1%
            </Option>
            <Option
              onClick={() => {
                checkAcceptablePercentValue(1)
                setActiveIndex(2)
                setplaceHolder('Custom')
              }}
              active={activeIndex === 2 ? true : false}
            >
              1%
            </Option>
            <OptionLarge
              onClick={() => {
                checkAcceptablePercentValue(2)
                setActiveIndex(3)
                setplaceHolder('Custom')
              }}
              active={activeIndex === 3 ? true : false}
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
                active={activeIndex === 4 ? true : false}
                warning={warningType !== 'none'}
              />
              <Percent color={warningType !== 'none' ? 'red' : activeIndex !== 4 ? 'faded' : ''}>%</Percent>
            </InputGroup>
          </SlippageRow>
          <SlippageRow>
            <BottomError warning={warningType !== 'none'}>
              {warningType === 'invalidEntry' ? 'Please input a valid percentage' : ''}
              {warningType === 'invalidEntryBound' ? 'Only choose between 0% and 50%' : ''}
              {warningType === 'riskyEntry' ? 'Youre at risk of being front-run ' : ''}
            </BottomError>
          </SlippageRow>
        </SlippageSelector>
      </>
    )
  }

  const [userInput, setUserInput] = useState()

  const parseInput = e => {
    let input = e.target.value
    //check for decimal
    var isValid = /^[+]?\d*\.?\d{1,2}$/.test(input) || /^[+]?\d*\.$/.test(input)
    var decimalLimit = /^\d+\.?\d{0,2}$/.test(input) || input === ''
    if (decimalLimit) {
      setUserInput(input)
    } else {
      return
    }
    if (isValid) {
      checkAcceptablePercentValue(input)
    } else {
      setWarningType('invalidEntry')
    }
  }

  const checkAcceptablePercentValue = input => {
    setWarningType('none')
    if (input < 0 || input > 50) {
      return setWarningType('invalidEntryBound')
    }
    if (input >= 0 && input < 0.1) {
      setWarningType('riskyEntry')
    }
    let num = parseFloat((input * 100).toFixed(2))
    props.setRawSlippage(num)
    props.setRawTokenSlippage(num)
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
