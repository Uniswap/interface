import React, { useState, useCallback, useEffect } from 'react'
import styled, { css } from 'styled-components'

import QuestionHelper from '../QuestionHelper'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'

import border8pxRadius from '../../assets/images/border-8px-radius.png'
import { Text } from 'rebass'
import { Option } from '../Option'
import Toggle from '../Toggle'
import { useMainnetGasPrices } from '../../state/application/hooks'
import { MainnetGasPrice } from '../../state/application/actions'
import { formatUnits } from 'ethers/lib/utils'
import { GreenGasPriceOption, OrangeGasPriceOption, PurpleGasPriceOption } from '../GasBadges'
import { BigNumber } from 'ethers'
import Decimal from 'decimal.js-light'
import { ChainId } from 'dxswap-sdk'
import { useActiveWeb3React } from '../../hooks'

enum SlippageError {
  InvalidInput = 'InvalidInput',
  RiskyLow = 'RiskyLow',
  RiskyHigh = 'RiskyHigh'
}

enum PreferredGasPriceError {
  InvalidInput = 'InvalidInput',
  RiskyLow = 'RiskyLow'
}

enum DeadlineError {
  InvalidInput = 'InvalidInput'
}

const Input = styled.input`
  background: ${({ theme }) => theme.bg2};
  font-size: 15px;
  line-height: 18px;
  width: auto;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  color: ${({ theme, color }) => (color === 'red' ? theme.red1 : theme.text1)};
  text-align: right;
  display: flex;
`

const OptionCustom = styled(Option)<{ active?: boolean; warning?: boolean; focused?: boolean }>`
  position: relative;
  flex: 1;
  display: flex;
  border: 8px solid;
  border-radius: 8px;
  ${({ focused }) =>
    focused
      ? css`
          border: solid 1px ${({ theme }) => theme.bg5};
          padding: 7px 11px;
        `
      : css`
          border: 8px solid transparent;
          border-image: url(${border8pxRadius}) 8;
          padding: 0px 4px;
        `};

  input {
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: 8px;
  }
`

const SlippageEmojiContainer = styled.span`
  color: #f3841e;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;  
  `}
`

export interface SlippageTabsProps {
  rawSlippage: number
  setRawSlippage: (rawSlippage: number) => void
  rawPreferredGasPrice: MainnetGasPrice | string | null
  setRawPreferredGasPrice: (rawPreferredGasPrice: MainnetGasPrice | string | null) => void
  deadline: number
  setDeadline: (deadline: number) => void
  multihop: boolean
  onMultihopChange: () => void
}

export default function SlippageTabs({
  rawSlippage,
  setRawSlippage,
  rawPreferredGasPrice,
  setRawPreferredGasPrice,
  deadline,
  setDeadline,
  multihop,
  onMultihopChange
}: SlippageTabsProps) {
  const { chainId } = useActiveWeb3React()
  const mainnetGasPrices = useMainnetGasPrices()

  const [slippageInput, setSlippageInput] = useState('')
  const [slippageFocused, setSlippageFocused] = useState(false)
  const [preferredGasPriceInput, setPreferredGasPriceInput] = useState('')
  const [preferredGasPriceFocused, setPreferredGasPriceFocused] = useState(false)
  const [preferredGasPricePlaceholder, setPreferredGasPricePalceholder] = useState('')
  const [deadlineInput, setDeadlineInput] = useState('')
  const [deadlineFocused, setDeadlineFocused] = useState(false)

  const slippageInputIsValid =
    slippageInput === '' || (rawSlippage / 100).toFixed(2) === Number.parseFloat(slippageInput).toFixed(2)
  const preferredGasPriceInputIsValid =
    preferredGasPriceInput === '' ||
    (!Number.isNaN(preferredGasPriceInput) &&
      rawPreferredGasPrice ===
        new Decimal(Number.parseFloat(preferredGasPriceInput).toFixed(10)).times('1000000000').toString())
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

  let preferredGasPriceError: PreferredGasPriceError | undefined
  if (preferredGasPriceInput !== '' && !preferredGasPriceInputIsValid) {
    preferredGasPriceError = PreferredGasPriceError.InvalidInput
  } else if (
    mainnetGasPrices &&
    preferredGasPriceInput !== '' &&
    preferredGasPriceInputIsValid &&
    !Number.isNaN(rawPreferredGasPrice) &&
    BigNumber.from(rawPreferredGasPrice).lte(mainnetGasPrices[MainnetGasPrice.NORMAL])
  ) {
    preferredGasPriceError = PreferredGasPriceError.RiskyLow
  } else {
    preferredGasPriceError = undefined
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

  function parseCustomPreferredGasPrice(value: string) {
    setPreferredGasPriceInput(value)

    try {
      const valueAsFloat = Number.parseFloat(value)
      if (!Number.isNaN(valueAsFloat) && valueAsFloat > 0) {
        // converting to wei
        setRawPreferredGasPrice(new Decimal(valueAsFloat.toFixed(10)).times('1000000000').toString())
      }
    } catch {}
  }

  function parseCustomDeadline(value: string) {
    setDeadlineInput(value)

    try {
      const valueAsInt: number = Number.parseInt(value) * 60
      if (!Number.isNaN(valueAsInt) && valueAsInt > 0) {
        setDeadline(valueAsInt)
      }
    } catch {}
  }

  useEffect(() => {
    // if user switches network, going away from mainnet, but gas price is set to be one of the
    // mainnet gas values fetched from the gas price API, delete the preferred mainnet gas price in the state
    if (chainId !== ChainId.MAINNET && rawPreferredGasPrice && rawPreferredGasPrice in MainnetGasPrice) {
      setRawPreferredGasPrice(null)
    }
  }, [chainId, rawPreferredGasPrice, setRawPreferredGasPrice])

  useEffect(() => {
    if (rawPreferredGasPrice) {
      if (chainId !== ChainId.MAINNET && rawPreferredGasPrice in MainnetGasPrice) {
        setPreferredGasPricePalceholder('')
      } else if (!(rawPreferredGasPrice in MainnetGasPrice)) {
        setPreferredGasPricePalceholder(
          Number.parseFloat(
            formatUnits(
              mainnetGasPrices && mainnetGasPrices[rawPreferredGasPrice as MainnetGasPrice]
                ? mainnetGasPrices[rawPreferredGasPrice as MainnetGasPrice]
                : rawPreferredGasPrice,
              'gwei'
            )
          ).toFixed(0)
        )
      }
    } else {
      setPreferredGasPricePalceholder('')
    }
    if (chainId !== ChainId.MAINNET && rawPreferredGasPrice && rawPreferredGasPrice in MainnetGasPrice) {
      setRawPreferredGasPrice(null)
    }
  }, [chainId, mainnetGasPrices, rawPreferredGasPrice, setRawPreferredGasPrice])

  const handleSlippageFocus = useCallback(() => {
    setSlippageFocused(true)
  }, [])

  const handlePreferredGasPriceFocus = useCallback(() => {
    setPreferredGasPriceFocused(true)
  }, [])

  const handleDeadlineFocus = useCallback(() => {
    setDeadlineFocused(true)
  }, [])

  return (
    <AutoColumn gap="16px">
      <AutoColumn gap="12px">
        <RowBetween>
          <RowFixed>
            <TYPE.body color="text4" fontWeight={500} fontSize="12px" lineHeight="15px">
              Multihop
            </TYPE.body>
            <QuestionHelper text="If off, forces trades to be performed without routing, considerably reducing gas fees (might result in a worse execution price)." />
          </RowFixed>
          <Toggle isActive={multihop} toggle={onMultihopChange} />
        </RowBetween>
        <RowFixed>
          <TYPE.body color="text4" fontWeight={500} fontSize="12px" lineHeight="15px">
            Slippage tolerance
          </TYPE.body>
          <QuestionHelper text="Your transaction will revert if the price changes unfavorably by more than this percentage." />
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
            1%
          </Option>
          <OptionCustom focused={slippageFocused} warning={!slippageInputIsValid} tabIndex={-1}>
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
                placeholder={(rawSlippage / 100).toFixed(2)}
                value={slippageInput}
                onFocus={handleSlippageFocus}
                onBlur={() => {
                  setSlippageFocused(false)
                  parseCustomSlippage((rawSlippage / 100).toFixed(2))
                }}
                onChange={e => parseCustomSlippage(e.target.value)}
                color={!slippageInputIsValid ? 'red' : ''}
              />
              %
            </RowBetween>
          </OptionCustom>
        </RowBetween>

        {chainId === ChainId.MAINNET && (
          <>
            <RowFixed>
              <TYPE.body color="text4" fontWeight={500} fontSize="12px" lineHeight="15px">
                Preferred gas price
              </TYPE.body>
              <QuestionHelper text="The gas price used to show gas fees and to submit transactions on Ethereum mainnet." />
            </RowFixed>
            <RowFixed>
              {mainnetGasPrices && (
                <>
                  <PurpleGasPriceOption
                    onClick={() => {
                      setPreferredGasPriceInput('')
                      setRawPreferredGasPrice(MainnetGasPrice.INSTANT)
                    }}
                    onDoubleClick={() => {
                      if (rawPreferredGasPrice === MainnetGasPrice.INSTANT) {
                        setPreferredGasPriceInput('')
                        setRawPreferredGasPrice(null)
                      }
                    }}
                    active={rawPreferredGasPrice === MainnetGasPrice.INSTANT}
                  >
                    INSTANT
                    <br />
                    {Number.parseFloat(formatUnits(mainnetGasPrices[MainnetGasPrice.INSTANT], 'gwei')).toFixed(0)} gwei
                  </PurpleGasPriceOption>
                  <OrangeGasPriceOption
                    onClick={() => {
                      setPreferredGasPriceInput('')
                      setRawPreferredGasPrice(MainnetGasPrice.FAST)
                    }}
                    onDoubleClick={() => {
                      if (rawPreferredGasPrice === MainnetGasPrice.FAST) {
                        setPreferredGasPriceInput('')
                        setRawPreferredGasPrice(null)
                      }
                    }}
                    active={rawPreferredGasPrice === MainnetGasPrice.FAST}
                  >
                    FAST
                    <br />
                    {Number.parseFloat(formatUnits(mainnetGasPrices[MainnetGasPrice.FAST], 'gwei')).toFixed(0)} gwei
                  </OrangeGasPriceOption>
                  <GreenGasPriceOption
                    onClick={() => {
                      setPreferredGasPriceInput('')
                      setRawPreferredGasPrice(MainnetGasPrice.NORMAL)
                    }}
                    onDoubleClick={() => {
                      if (rawPreferredGasPrice === MainnetGasPrice.NORMAL) {
                        setPreferredGasPriceInput('')
                        setRawPreferredGasPrice(null)
                      }
                    }}
                    active={rawPreferredGasPrice === MainnetGasPrice.NORMAL}
                  >
                    NORMAL
                    <br />
                    {Number.parseFloat(formatUnits(mainnetGasPrices[MainnetGasPrice.NORMAL], 'gwei')).toFixed(0)} gwei
                  </GreenGasPriceOption>
                </>
              )}
              <OptionCustom
                focused={preferredGasPriceFocused}
                style={{ width: '52px', minWidth: '52px' }}
                tabIndex={-1}
              >
                <Input
                  color={!!!preferredGasPriceInputIsValid ? 'red' : undefined}
                  onFocus={handlePreferredGasPriceFocus}
                  onBlur={() => {
                    setPreferredGasPriceFocused(false)
                    if (typeof rawPreferredGasPrice === 'string') {
                      parseCustomPreferredGasPrice(
                        Number.parseFloat(formatUnits(rawPreferredGasPrice, 'gwei')).toFixed(0)
                      )
                    }
                  }}
                  placeholder={preferredGasPricePlaceholder}
                  value={preferredGasPriceInput}
                  onChange={e => parseCustomPreferredGasPrice(e.target.value)}
                />
              </OptionCustom>
              <TYPE.body color="text4" fontSize={14}>
                gwei
              </TYPE.body>
            </RowFixed>
          </>
        )}
        <RowBetween mt="2px">
          <RowFixed>
            <TYPE.body color="text4" fontWeight={500} fontSize="12px" lineHeight="15px">
              Transaction deadline
            </TYPE.body>
            <QuestionHelper text="Your transaction will revert if it is pending for more than this long." />
          </RowFixed>
          <RowFixed>
            <OptionCustom focused={deadlineFocused} style={{ width: '52px', minWidth: '52px' }} tabIndex={-1}>
              <Input
                color={!!deadlineError ? 'red' : undefined}
                onFocus={handleDeadlineFocus}
                onBlur={() => {
                  setDeadlineFocused(false)
                  parseCustomDeadline((deadline / 60).toString())
                }}
                placeholder={(deadline / 60).toString()}
                value={deadlineInput}
                onChange={e => parseCustomDeadline(e.target.value)}
              />
            </OptionCustom>
            <TYPE.body color="text4" fontSize={14}>
              minutes
            </TYPE.body>
          </RowFixed>
        </RowBetween>
        {!!slippageError ||
          (!!preferredGasPriceError && (
            <Text
              fontWeight={500}
              fontSize="12px"
              lineHeight="15px"
              color={slippageError === SlippageError.InvalidInput ? 'red' : '#F3841E'}
            >
              {slippageError === SlippageError.InvalidInput ||
              preferredGasPriceError === PreferredGasPriceError.InvalidInput
                ? `Enter a valid ${slippageError === SlippageError.InvalidInput ? 'slippage percentage' : 'gas price'}`
                : slippageError === SlippageError.RiskyLow || preferredGasPriceError === PreferredGasPriceError.RiskyLow
                ? 'Your transaction may fail'
                : 'Your transaction may be frontrun'}
            </Text>
          ))}
      </AutoColumn>
    </AutoColumn>
  )
}
