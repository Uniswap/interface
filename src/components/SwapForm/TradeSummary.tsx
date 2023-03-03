import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { TYPE } from 'theme'
import { DetailedRouteSummary, FeeConfig } from 'types/route'
import { formattedNum } from 'utils'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'
import { getFormattedFeeAmountUsdV2 } from 'utils/fee'

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
  background-color: ${({ theme }) => theme.background};
  max-height: 0;
  transition: height 300ms ease-in-out, transform 300ms;
  border: 1px solid ${({ theme }) => theme.border};
  overflow: hidden;

  &[data-visible='true'] {
    display: block;
    padding: 12px 16px;
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
  const [alreadyVisible, setAlreadyVisible] = useState(false)
  const { amountInUsd, parsedAmountOut, priceImpact, gasUsd } = routeSummary || {}
  const hasTrade = !!routeSummary?.route

  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)

  const formattedFeeAmountUsd = amountInUsd ? getFormattedFeeAmountUsdV2(Number(amountInUsd), feeConfig?.feeAmount) : 0
  const minimumAmountOut = parsedAmountOut ? minimumAmountAfterSlippage(parsedAmountOut, slippage) : undefined

  const handleClickExpand = () => {
    setExpanded(prev => !prev)
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
          <Text fontSize={12} fontWeight={500}>
            <Trans>MORE INFORMATION</Trans>
          </Text>
          <IconWrapper $flip={expanded}>
            <DropdownSVG />
          </IconWrapper>
        </RowBetween>
        <ContentWrapper $expanded={expanded} gap="0.75rem">
          <Divider />
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                <Trans>Minimum Received</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Minimum amount you will receive or your transaction will revert`} />
            </RowFixed>
            <RowFixed>
              <TYPE.black color={theme.text} fontSize={12}>
                {minimumAmountOut
                  ? `${formattedNum(minimumAmountOut.toSignificant(10) || '0')} ${minimumAmountOut.currency.symbol}`
                  : '--'}
              </TYPE.black>
            </RowFixed>
          </RowBetween>

          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                <Trans>Gas Fee</Trans>
              </TYPE.black>

              <InfoHelper size={14} text={t`Estimated network fee for your transaction`} />
            </RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {gasUsd ? formattedNum(gasUsd, true) : '--'}
            </TYPE.black>
          </RowBetween>

          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                <Trans>Price Impact</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Estimated change in price due to the size of your transaction`} />
            </RowFixed>
            <TYPE.black
              fontSize={12}
              color={
                priceImpact ? (priceImpact > 15 ? theme.red : priceImpact > 5 ? theme.warning : theme.text) : theme.text
              }
            >
              {priceImpact === -1 || !priceImpact
                ? '--'
                : priceImpact > 0.01
                ? priceImpact.toFixed(2) + '%'
                : '< 0.01%'}
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
