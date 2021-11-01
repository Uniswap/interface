import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Price, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { useContext, useState } from 'react'
import { AlertTriangle, ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components/macro'

import { useUSDCValue } from '../../hooks/useUSDCPrice'
import { TYPE } from '../../theme'
import { isAddress, shortenAddress } from '../../utils'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { ButtonPrimary } from '../Button'
import { LightCard } from '../Card'
import { AutoColumn } from '../Column'
import { FiatValue } from '../CurrencyInputPanel/FiatValue'
import CurrencyLogo from '../CurrencyLogo'
import { RowBetween, RowFixed } from '../Row'
import TradePrice from '../swap/TradePrice'
import { AdvancedSwapDetails } from './AdvancedSwapDetails'
import { SwapShowAcceptChanges, TruncatedText } from './styleds'

const ArrowWrapper = styled.div`
  padding: 4px;
  border-radius: 12px;
  height: 32px;
  width: 32px;
  position: relative;
  margin-top: -18px;
  margin-bottom: -18px;
  left: calc(50% - 16px);
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.bg1};
  border: 4px solid;
  border-color: ${({ theme }) => theme.bg0};
  z-index: 2;
`

export default function SwapModalHeader({
  trade,
  serviceFee,
  priceAmount,
  recipient,
  showAcceptChanges,
  onAcceptChanges,
  inputAmount,
  outputAmount,
}: {
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
  serviceFee: CurrencyAmount<Currency> | undefined
  priceAmount: Price<Currency, Currency> | undefined
  recipient: string | null
  showAcceptChanges: boolean
  onAcceptChanges: () => void
  inputAmount: CurrencyAmount<Currency> | undefined
  outputAmount: CurrencyAmount<Currency> | undefined
}) {
  const theme = useContext(ThemeContext)

  const [showInverted, setShowInverted] = useState<boolean>(true)

  const fiatValueInput = useUSDCValue(inputAmount)
  const allowedSlippage = new Percent(0, 1)

  return (
    <AutoColumn gap={'4px'} style={{ marginTop: '1rem' }}>
      <LightCard padding="0.75rem 1rem">
        <AutoColumn gap={'8px'}>
          <RowBetween>
            <TYPE.body color={theme.text3} fontWeight={500} fontSize={14}>
              <Trans>From</Trans>
            </TYPE.body>
            <FiatValue fiatValue={fiatValueInput} />
          </RowBetween>
          <RowBetween align="center">
            <RowFixed gap={'0px'}>
              <CurrencyLogo currency={inputAmount?.currency} size={'20px'} style={{ marginRight: '12px' }} />
              <Text fontSize={20} fontWeight={500}>
                {inputAmount?.currency.symbol}
              </Text>
            </RowFixed>
            <RowFixed gap={'0px'}>
              <TruncatedText
                fontSize={24}
                fontWeight={500}
                color={showAcceptChanges && trade.tradeType === TradeType.EXACT_OUTPUT ? theme.primary1 : ''}
              >
                {inputAmount?.toSignificant(6)}
              </TruncatedText>
            </RowFixed>
          </RowBetween>
        </AutoColumn>
      </LightCard>
      {priceAmount ? (
        <RowBetween style={{ marginTop: '0.25rem', padding: '0 1rem' }}>
          <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
            <Trans>Target Price</Trans>
          </TYPE.body>
          <TradePrice price={priceAmount} showInverted={showInverted} setShowInverted={setShowInverted} />
        </RowBetween>
      ) : null}

      <RowBetween style={{ marginTop: '0.25rem', padding: '0 1rem' }}>
        <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
          <Trans>Current Price</Trans>
        </TYPE.body>
        <TradePrice price={trade.route.midPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
      </RowBetween>

      <LightCard style={{ padding: '.75rem', marginTop: '0.5rem' }}>
        <AdvancedSwapDetails
          trade={trade}
          priceAmount={priceAmount}
          outputAmount={outputAmount}
          serviceFee={serviceFee}
        />
      </LightCard>

      {showAcceptChanges ? (
        <SwapShowAcceptChanges justify="flex-start" gap={'0px'}>
          <RowBetween>
            <RowFixed>
              <AlertTriangle size={20} style={{ marginRight: '8px', minWidth: 24 }} />
              <TYPE.main color={theme.primary1}>
                <Trans>Price Updated</Trans>
              </TYPE.main>
            </RowFixed>
            <ButtonPrimary
              style={{ padding: '.5rem', width: 'fit-content', fontSize: '0.825rem', borderRadius: '12px' }}
              onClick={onAcceptChanges}
            >
              <Trans>Accept</Trans>
            </ButtonPrimary>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : null}

      <AutoColumn justify="flex-start" gap="sm" style={{ padding: '.75rem 1rem' }}>
        <TYPE.italic fontWeight={400} textAlign="left" style={{ width: '100%' }}>
          <Trans>
            Output is estimated. You will receive at least{' '}
            <b>
              {outputAmount ? outputAmount.toSignificant(6) : 0} {outputAmount?.currency.symbol}
            </b>{' '}
            when the current market price reaches your target price.
          </Trans>
        </TYPE.italic>
      </AutoColumn>
      {recipient !== null ? (
        <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 0 0 0px' }}>
          <TYPE.main>
            <Trans>
              Output will be sent to{' '}
              <b title={recipient}>{isAddress(recipient) ? shortenAddress(recipient) : recipient}</b>
            </Trans>
          </TYPE.main>
        </AutoColumn>
      ) : null}
    </AutoColumn>
  )
}
