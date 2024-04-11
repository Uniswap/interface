import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Fraction, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useContext, useState } from 'react'
import { AlertTriangle, ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { useIsGaslessMode } from 'state/user/hooks'
import styled, { ThemeContext } from 'styled-components/macro'

import { useUSDCValue } from '../../hooks/useUSDCPrice'
import { TYPE } from '../../theme'
import { isAddress, shortenAddress } from '../../utils'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { ButtonPrimary } from '../Button'
import { DarkCard, LightCard } from '../Card'
import { AutoColumn } from '../Column'
import { FiatValue } from '../CurrencyInputPanel/FiatValue'
import CurrencyLogo from '../CurrencyLogo'
import { RowBetween, RowFixed } from '../Row'
import TradePrice from '../swap/TradePrice'
import { AdvancedMarketDetails } from './AdvancedMarketDetails'
import { SwapShowAcceptChanges, TruncatedText } from './styleds'

const ArrowWrapper = styled.div`
  padding: 4px;
  border-radius: 20px;
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
  border-color: ${({ theme }) => theme.bg1};
  z-index: 2;
`

const ImpactWarning = styled.div`
  border: 1px solid red;
  border-radius: 10px;
  background-color: #ff4343;
  margin-bottom: 3px;
  padding: 10px;
  display: flex;
  font-size: 14px;
  width: 100%;
  justify-content: center;
`

export default function MarketModalHeader({
  trade,
  allowedSlippage,
  recipient,
  showAcceptChanges,
  onAcceptChanges,
  referer,
  paymentToken,
  paymentFees,
  priceImpactHigh,
  feeImpactHigh,
  updateFeeImpact,
  updatePriceImpact,
  priceImpactAccepted,
  feeImpactAccepted,
}: {
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  recipient: string | null
  showAcceptChanges: boolean
  onAcceptChanges: () => void
  referer: string | null
  paymentToken: Token | undefined | null
  paymentFees: CurrencyAmount<Currency> | undefined
  priceImpactHigh: boolean
  feeImpactHigh: boolean
  updateFeeImpact: () => void
  updatePriceImpact: () => void
  priceImpactAccepted: boolean
  feeImpactAccepted: boolean
}) {
  const theme = useContext(ThemeContext)

  const [showInverted, setShowInverted] = useState<boolean>(true)

  const fiatValueInput = useUSDCValue(trade.inputAmount)
  const fiatValueOutput = useUSDCValue(trade.outputAmount)

  const { chainId } = useActiveWeb3React()

  const calculateMinimumReceived = (
    slippage: Percent,
    fees: CurrencyAmount<Currency>,
    receive: CurrencyAmount<Currency>
  ) => {
    const received = receive.subtract(fees)

    return received.subtract(received.multiply(slippage as Fraction)).toSignificant(4)
  }

  // build fee token with the same currency as output amount, if their currencies differ
  const fee = paymentFees
    ? paymentFees.currency !== trade.outputAmount.currency
      ? CurrencyAmount.fromRawAmount(trade.outputAmount.currency, paymentFees.numerator)
      : paymentFees
    : undefined

  const minimumReceived = fee
    ? Number(calculateMinimumReceived(allowedSlippage, fee, trade.outputAmount))
    : +trade.minimumAmountOut(allowedSlippage).toSignificant(6)

  const isGaslessMode =
    useIsGaslessMode() &&
    chainId !== SupportedChainId.OPTIMISM &&
    chainId !== SupportedChainId.BASE &&
    chainId !== SupportedChainId.MAINNET

  return (
    <AutoColumn gap={'6px'} style={{ marginTop: '1rem' }}>
      <LightCard padding="0.75rem 1rem">
        <AutoColumn gap={'8px'}>
          <RowBetween>
            <TYPE.body color={theme.text3} fontWeight={400} fontSize={16}>
              <Trans>From</Trans>
            </TYPE.body>
            <FiatValue fiatValue={fiatValueInput} />
          </RowBetween>
          <RowBetween align="center">
            <RowFixed gap={'0px'}>
              <CurrencyLogo currency={trade.inputAmount.currency} size={'20px'} style={{ marginRight: '12px' }} />
              <Text fontSize={16} fontWeight={400}>
                {trade.inputAmount.currency.symbol}
              </Text>
            </RowFixed>
            <RowFixed gap={'0px'}>
              <TruncatedText
                fontSize={[16, 18, 24]}
                fontWeight={400}
                color={showAcceptChanges && trade.tradeType === TradeType.EXACT_OUTPUT ? theme.primary1 : ''}
              >
                {trade.inputAmount.toSignificant(6)}
              </TruncatedText>
            </RowFixed>
          </RowBetween>
        </AutoColumn>
      </LightCard>
      <ArrowWrapper>
        <ArrowDown size="16" color={theme.text2} />
      </ArrowWrapper>
      <LightCard padding="0.75rem 1rem" style={{ marginBottom: '0', borderRadius: '20px' }}>
        <AutoColumn gap={'8px'}>
          <RowBetween>
            <TYPE.body color={theme.text3} fontWeight={400} fontSize={16}>
              <Trans>To</Trans>
            </TYPE.body>
            <TYPE.body fontSize={16} color={theme.text3}>
              <FiatValue
                fiatValue={fiatValueOutput}
                priceImpact={computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput)}
              />
            </TYPE.body>
          </RowBetween>
          <RowBetween align="flex-end">
            <RowFixed gap={'0px'}>
              <CurrencyLogo currency={trade.outputAmount.currency} size={'20px'} style={{ marginRight: '12px' }} />
              <Text fontSize={16} fontWeight={400}>
                {trade.outputAmount.currency.symbol}
              </Text>
            </RowFixed>
            <RowFixed gap={'0px'}>
              <TruncatedText fontSize={[16, 18, 24]} fontWeight={400}>
                {trade.outputAmount.toSignificant(6)}
              </TruncatedText>
            </RowFixed>
          </RowBetween>
        </AutoColumn>
      </LightCard>
      {isGaslessMode && (
        <DarkCard
          padding="0.75rem 1rem"
          style={{
            marginBottom: '0.25rem',
            borderRadius: '0px 0px 10px 10px',
            border: '1px solid #2C2F36',
            marginTop: '0px',
            position: 'relative',
            top: '-5px',
          }}
        >
          <AutoColumn gap={'8px'}>
            <RowBetween align="flex-end">
              <TYPE.body fontSize={14} color={'white'}>
                <RowFixed gap={'0px'}>Received (including fees)</RowFixed>
              </TYPE.body>
              <RowFixed gap={'0px'}>
                <TruncatedText fontSize={14} fontWeight={500}>
                  {fee ? trade.outputAmount.subtract(fee).toSignificant(6) : 'undefined'} {paymentToken?.symbol}
                </TruncatedText>
              </RowFixed>
            </RowBetween>
          </AutoColumn>
        </DarkCard>
      )}

      <RowBetween style={{ marginTop: '0.25rem', padding: '0 1rem' }}>
        <TYPE.body color={theme.text2} fontWeight={400} fontSize={16}>
          <Trans>Price</Trans>
        </TYPE.body>
        <TradePrice price={trade.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
      </RowBetween>

      <LightCard style={{ padding: '.75rem', marginTop: '0.5rem' }}>
        <AdvancedMarketDetails
          trade={trade}
          allowedSlippage={allowedSlippage}
          referer={referer}
          paymentToken={paymentToken}
          paymentFees={fee}
          minimumReceived={minimumReceived}
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
              style={{ padding: '.5rem', width: 'fit-content', fontSize: '0.825rem', borderRadius: '20px' }}
              onClick={onAcceptChanges}
            >
              <Trans>Accept</Trans>
            </ButtonPrimary>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : null}

      <AutoColumn justify="flex-start" gap="sm" style={{ padding: '.75rem 1rem' }}>
        {trade.tradeType === TradeType.EXACT_INPUT ? (
          <TYPE.italic fontSize={14} fontWeight={400} textAlign="left" style={{ width: '100%' }}>
            <Trans>
              Output is estimated. You will receive at least{' '}
              <b>
                {isGaslessMode ? (
                  <span>
                    {' '}
                    {fee && calculateMinimumReceived(allowedSlippage, fee, trade.outputAmount)}{' '}
                    {trade.outputAmount.currency.symbol}{' '}
                  </span>
                ) : (
                  <span>
                    {' '}
                    {trade.minimumAmountOut(allowedSlippage).toSignificant(6)} {trade.outputAmount.currency.symbol}
                  </span>
                )}{' '}
              </b>{' '}
              or the transaction will revert.
            </Trans>
          </TYPE.italic>
        ) : (
          <TYPE.italic fontSize={14} fontWeight={400} textAlign="left" style={{ width: '100%' }}>
            <Trans>
              Input is estimated. You will sell at most{' '}
              <b>
                {trade.maximumAmountIn(allowedSlippage).toSignificant(6)} {trade.inputAmount.currency.symbol}
              </b>{' '}
              or the transaction will revert.
            </Trans>
          </TYPE.italic>
        )}
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
      {priceImpactHigh ? (
        <AutoColumn justify="flex-start" gap="sm" style={{ padding: '0px 0 0 0px' }}>
          <ImpactWarning>
            <span>
              Price impact is greater than 20%. Swap anyway?{' '}
              <input type="checkbox" onChange={updatePriceImpact} defaultChecked={priceImpactAccepted} />{' '}
            </span>
          </ImpactWarning>
        </AutoColumn>
      ) : null}
      {feeImpactHigh ? (
        <AutoColumn justify="flex-start" gap="sm" style={{ padding: '0px 0 0 0px' }}>
          <ImpactWarning>
            <span>
              Fee impact is greater than 20%. Swap anyway?{' '}
              <input type="checkbox" onChange={updateFeeImpact} defaultChecked={feeImpactAccepted} />{' '}
            </span>
          </ImpactWarning>{' '}
        </AutoColumn>
      ) : null}
    </AutoColumn>
  )
}
