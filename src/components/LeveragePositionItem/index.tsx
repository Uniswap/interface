import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { Percent, Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import RangeBadge from 'components/Badge/RangeBadge'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import Loader from 'components/Icons/LoadingSpinner'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import { useMemo , useState, useCallback} from 'react'
import { Link } from 'react-router-dom'
import { Bound } from 'state/mint/v3/actions'
import styled from 'styled-components/macro'
import { HideSmall, MEDIA_WIDTHS, SmallOnly, ThemedText } from 'theme'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/unwrappedToken'
import { hasURL } from 'utils/urlChecks'
import { SmallButtonPrimary,ButtonPrimary } from 'components/Button'
import ConfirmLeverageSwapModal from 'components/swap/confirmLeverageSwapModal'
import ConfirmAddPremiumModal from 'components/swap/ConfirmAddPremiumModal'
import { DAI, USDC_MAINNET, USDT, WBTC, WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import Column, { AutoColumn } from 'components/Column'

const ResponsiveButtonPrimary = styled(SmallButtonPrimary)`
  border-radius: 12px;
  font-size: 13px;
  padding: 3px 4px;
  width: fit-content;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex: 1 1 auto;
    width: 100%;
  `};
`

const ItemWrapper = styled.div`
  align-items: center;
  display: flex;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: ${({ theme }) => theme.textPrimary};
  padding: 16px;
  text-decoration: none;
  font-weight: 500;

  & > div:not(:first-child) {
    text-align: center;
  }
  :hover {
    background-color: ${({ theme }) => theme.hoverDefault};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    row-gap: 8px;
  `};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.background};
  margin: 4px;
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
  width: 100%;
`

const DoubleArrow = styled.span`
  font-size: 12px;
  margin: 0 2px;
  color: ${({ theme }) => theme.textTertiary};
`

const RangeText = styled(ThemedText.Caption)`
  font-size: 12px !important;
  word-break: break-word;
  padding: 0.25rem 0.25rem;
  border-radius: 8px;
`

const ValueLabel = styled.div`

`

const FeeTierText = styled(ThemedText.UtilityBadge)`
  font-size: 10px !important;
  margin-left: 14px !important;
`
const ExtentsText = styled(ThemedText.Caption)`
  color: ${({ theme }) => theme.textTertiary};
  display: inline-block;
  line-height: 16px;
  margin-right: 4px !important;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};
`

const PrimaryPositionIdData = styled(AutoColumn)`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  > * {
    margin-right: 8px;
  }
  margin-bottom: 8px;
`

const ItemValueLabel = ({label, value}: { label: string, value: string}) => (
  <Column gap="sm" style={{width: "100px"}}>
    <ThemedText.Caption style={{whiteSpace: "nowrap"}}>
      {label}
    </ThemedText.Caption>
    <ThemedText.SubHeader>
      {value}
    </ThemedText.SubHeader>
  </Column>
)

// interface PositionListItemProps {
//   token0: string
//   token1: string
//   tokenId: BigNumber
//   fee: number
//   liquidity: BigNumber
//   tickLower: number
//   tickUpper: number
// }

interface LeveragePositionListItemProps {
  token0: string
  token1: string
  tokenId: BigNumber
  totalLiquidity: BigNumber // totalPosition
  totalDebt: BigNumber // total debt in output token
  totalDebtInput: BigNumber // total debt in input token
  borrowedLiquidity: BigNumber
  isToken0: boolean
  openBlock: number
  tickStart: number // borrowStartTick
  tickFinish: number // borrowFinishTick
  timeUntilFinish: number // 24hr - timeElapsedSinceInterestPaid
}


export function getPriceOrderingFromPositionForUI(position?: Position): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} {
  if (!position) {
    return {}
  }

  const token0 = position.amount0.currency
  const token1 = position.amount1.currency

  // if token0 is a dollar-stable asset, set it as the quote token
  const stables = [DAI, USDC_MAINNET, USDT]
  if (stables.some((stable) => stable.equals(token0))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if token1 is an ETH-/BTC-stable asset, set it as the base token
  const bases = [...Object.values(WRAPPED_NATIVE_CURRENCY), WBTC]
  if (bases.some((base) => base && base.equals(token1))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if both prices are below 1, invert
  if (position.token0PriceUpper.lessThan(1)) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // otherwise, just return the default
  return {
    priceLower: position.token0PriceLower,
    priceUpper: position.token0PriceUpper,
    quote: token1,
    base: token0,
  }
}

export default function LeveragePositionItem({
  token0: token0Address,
  token1: token1Address,
  tokenId,
  tickFinish,
  tickStart,
  totalLiquidity,
  borrowedLiquidity,
  totalDebtInput,
  openBlock,
  isToken0
}: LeveragePositionListItemProps) {
  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const [showConfirm, setshowConfirm] = useState(false); 
  const [showPremiumConfirm, setshowPremiumConfirm] = useState(false); 
  const shouldHidePosition = hasURL(token0?.symbol) || hasURL(token1?.symbol)

  if (shouldHidePosition) {
    return null
  }
  const handleConfirmDismiss = ()=>{
    setshowConfirm(false); 
  } 
  const handlePremiumConfirmDismiss = ()=>{
    setshowPremiumConfirm(false); 
  }

  const txHash = ""
  const recipient = ""
  const attemptingTxn = true;
  return (
    <ItemWrapper>
      <RowBetween>
        <PrimaryPositionIdData>
          <AutoColumn>
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={18} margin />
            <ThemedText.SubHeader>
              &nbsp;{currency0?.symbol}&nbsp;/&nbsp;{currency1?.symbol}
            </ThemedText.SubHeader>
            {true ? (
              <RangeLineItem>
                <RangeText>
                  <ExtentsText>
                    <Trans>Start: </Trans>
                  </ExtentsText>
                  <Trans>
                    <span>
                      {"1.00"}{' '}
                    </span>
                    <HoverInlineText text={currency0?.symbol} /> per <HoverInlineText text={currency1?.symbol ?? ''} />
                  </Trans>
                </RangeText>{' '}
                <HideSmall>
                  <DoubleArrow>↔</DoubleArrow>{' '}
                </HideSmall>
                <SmallOnly>
                  <DoubleArrow>↔</DoubleArrow>{' '}
                </SmallOnly>
                <RangeText>
                  <ExtentsText>
                    <Trans>End:</Trans>
                  </ExtentsText>
                  <Trans>
                    <span>
                      {"2.00"}{' '}
                    </span>
                    <HoverInlineText text={currency0?.symbol} /> per{' '}
                    <HoverInlineText maxCharacters={10} text={currency1?.symbol} />
                  </Trans>
                </RangeText>
              </RangeLineItem>
            ) : (
              <Loader />
            )}
          </AutoColumn>
        </PrimaryPositionIdData>
        <AutoRow gap="4px" width="100%">
        <ItemValueLabel label={"Total Position"} value={"1000k"}/>
        <ItemValueLabel label={"Debt"} value={"1000k"}/>
        <ItemValueLabel label={"Time of Creation"} value={"1000k"}/>
        <ItemValueLabel label={"Time until repayment "} value={"1000k"}/>
        </AutoRow>
      </RowBetween>
      <RowBetween>
        <AutoRow>
          <RangeText>
            <ExtentsText>
              <Trans>Enter Price:</Trans>
            </ExtentsText>
            <Trans>
              <span>
                {"2.00"}{' '}
              </span>
            </Trans>
          </RangeText>
          <RangeText>
            <ExtentsText>
              <Trans>Current Price:</Trans>
            </ExtentsText>
            <Trans>
              <span>
                {"2.00"}{' '}
              </span>
            </Trans>
          </RangeText>
        </AutoRow>
        <AutoRow gap="8px">
          <ResponsiveButtonPrimary 
          //data-cy="join-pool-button" id="join-pool-button"
           onClick={() => setshowConfirm(!showConfirm)} 
           //as={Link} to="/add/ETH"
           >
            <Trans>Close Position</Trans>
          </ResponsiveButtonPrimary>

          { <ConfirmLeverageSwapModal
            isOpen={showConfirm}
            // trade={trade}
            // originalTrade={tradeToConfirm}
            // onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            // allowedSlippage={allowedSlippage}
            // onConfirm={handleSwap}
            // swapErrorMessage={swapErrorMessage}
            onDismiss={handleConfirmDismiss}
            // swapQuoteReceivedDate={swapQuoteReceivedDate}
            // fiatValueInput={fiatValueTradeInput}
            // fiatValueOutput={fiatValueTradeOutput}
          /> }
          { <ConfirmAddPremiumModal
            isOpen={showPremiumConfirm}
            // trade={trade}
            // originalTrade={tradeToConfirm}
            // onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            // allowedSlippage={allowedSlippage}
            // onConfirm={handleSwap}
            // swapErrorMessage={swapErrorMessage}
            onDismiss={handlePremiumConfirmDismiss}
            // swapQuoteReceivedDate={swapQuoteReceivedDate}
            // fiatValueInput={fiatValueTradeInput}
            // fiatValueOutput={fiatValueTradeOutput}
          /> }

          <ResponsiveButtonPrimary onClick={() => setshowConfirm(!showPremiumConfirm)} >
            <Trans>Add Premium</Trans>
          </ResponsiveButtonPrimary>
        </AutoRow>
      </RowBetween>
    </ItemWrapper>
  )
}
