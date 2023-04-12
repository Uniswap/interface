import { Trans, t } from '@lingui/macro'
import React, { useEffect, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { TYPE } from 'theme'
import { DetailedRouteSummary, FeeConfig } from 'types/route'
import { formattedNum } from 'utils'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'
import { getFormattedFeeAmountUsdV2 } from 'utils/fee'
import { checkPriceImpact, formatPriceImpact } from 'utils/prices'

const IconWrapper = styled.div<{ $flip: boolean }>`
  transform: rotate(${({ $flip }) => (!$flip ? '0deg' : '-180deg')});
  transition: transform 300ms;
`
const ContentWrapper = styled(AutoColumn)<{ $expanded: boolean }>`
  max-height: ${({ $expanded }) => ($expanded ? '500px' : 0)};
  margin-top: ${({ $expanded }) => ($expanded ? '12px' : 0)};
  transition: margin-top 300ms ease, height 300ms ease;
  overflow: hidden;
`

type WrapperProps = {
  $visible: boolean
  $disabled: boolean
}
const Wrapper = styled.div.attrs<WrapperProps>(props => ({
  'data-visible': props.$visible,
  'data-disabled': props.$disabled,
}))<WrapperProps>`
  display: none;
  padding: 0;
  width: 100%;
  max-width: 425px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  max-height: 0;
  transition: height 300ms ease-in-out, transform 300ms;
  border: 1px solid ${({ theme }) => theme.border};
  overflow: hidden;

  &[data-visible='true'] {
    display: block;
    padding: 12px 12px;
    max-height: max-content;
    color: ${({ theme }) => theme.text};
  }

  &[data-disabled='true'] {
    color: ${({ theme }) => theme.subText};
  }
`

type Props = {
  feeConfig: FeeConfig | undefined
  routeSummary: DetailedRouteSummary | undefined
  slippage: number
}
const TradeSummary: React.FC<Props> = ({ feeConfig, routeSummary, slippage }) => {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(true)
  const [alreadyVisible, setAlreadyVisible] = useState(false)
  const { amountInUsd, parsedAmountOut, priceImpact, gasUsd } = routeSummary || {}
  const hasTrade = !!routeSummary?.route

  const priceImpactResult = checkPriceImpact(priceImpact)

  const formattedFeeAmountUsd = amountInUsd ? getFormattedFeeAmountUsdV2(Number(amountInUsd), feeConfig?.feeAmount) : 0
  const minimumAmountOut = parsedAmountOut ? minimumAmountAfterSlippage(parsedAmountOut, slippage) : undefined
  const currencyOut = parsedAmountOut?.currency
  const minimumAmountOutStr =
    minimumAmountOut && currencyOut ? (
      <Text
        as="span"
        sx={{
          color: theme.text,
          fontWeight: '500',
          whiteSpace: 'nowrap',
        }}
      >
        {formattedNum(minimumAmountOut.toSignificant(10), false, 10)} {currencyOut.symbol}
      </Text>
    ) : (
      ''
    )

  const { mixpanelHandler } = useMixpanel()
  const handleClickExpand = () => {
    setExpanded(prev => !prev)
    mixpanelHandler(MIXPANEL_TYPE.SWAP_MORE_INFO_CLICK, { option: expanded ? 'Close' : 'Open' })
  }

  useEffect(() => {
    if (hasTrade) {
      setAlreadyVisible(true)
    }
  }, [hasTrade])

  return (
    <Wrapper $visible={alreadyVisible} $disabled={!hasTrade}>
      <AutoColumn>
        <RowBetween style={{ cursor: 'pointer' }} onClick={handleClickExpand} role="button">
          <Text fontSize={12} fontWeight={500} color={theme.text}>
            <Trans>MORE INFORMATION</Trans>
          </Text>
          <IconWrapper $flip={expanded}>
            <DropdownSVG color={theme.text} />
          </IconWrapper>
        </RowBetween>
        <ContentWrapper $expanded={expanded} gap="0.75rem">
          <Divider />
          <RowBetween>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                <MouseoverTooltip
                  width="200px"
                  text={<Trans>You will receive at least this amount or your transaction will revert</Trans>}
                  placement="right"
                >
                  <Trans>Minimum Received</Trans>
                </MouseoverTooltip>
              </TextDashed>
            </RowFixed>
            <RowFixed>
              <TYPE.black color={theme.text} fontSize={12}>
                {minimumAmountOutStr || '--'}
              </TYPE.black>
            </RowFixed>
          </RowBetween>

          <RowBetween>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                <MouseoverTooltip text={<Trans>Estimated network fee for your transaction.</Trans>} placement="right">
                  <Trans>Gas Fee</Trans>
                </MouseoverTooltip>
              </TextDashed>
            </RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {gasUsd ? formattedNum(gasUsd, true) : '--'}
            </TYPE.black>
          </RowBetween>

          <RowBetween>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                <MouseoverTooltip
                  text={
                    <div>
                      <Trans>Estimated change in price due to the size of your transaction.</Trans>
                      <Trans>
                        <Text fontSize={12}>
                          Read more{' '}
                          <a
                            href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <b>here ↗</b>
                          </a>
                        </Text>
                      </Trans>
                    </div>
                  }
                  placement="right"
                >
                  <Trans>Price Impact</Trans>
                </MouseoverTooltip>
              </TextDashed>
            </RowFixed>
            <TYPE.black
              fontSize={12}
              color={priceImpactResult.isVeryHigh ? theme.red : priceImpactResult.isHigh ? theme.warning : theme.text}
            >
              {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
            </TYPE.black>
          </RowBetween>

          {feeConfig && (
            <RowBetween>
              <RowFixed>
                <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                  <Trans>Referral Fee</Trans>
                </TYPE.black>
                <InfoHelper size={14} text={t`Commission fee to be paid directly to your referrer`} />
              </RowFixed>
              <TYPE.black color={theme.text} fontSize={12}>
                {formattedFeeAmountUsd}
              </TYPE.black>
            </RowBetween>
          )}
        </ContentWrapper>
      </AutoColumn>
    </Wrapper>
  )
}

export default TradeSummary
