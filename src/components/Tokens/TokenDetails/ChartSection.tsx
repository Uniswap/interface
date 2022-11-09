import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { ParentSize } from '@visx/responsive'
import { CurrencyLogo } from 'components/Logo'
import { getChainInfo } from 'constants/chainInfo'
import { PriceDurations } from 'graphql/data/TokenPrice'
import { useAtomValue } from 'jotai/utils'
import styled from 'styled-components/macro'
import { textFadeIn } from 'theme/animations'

import { filterTimeAtom } from '../state'
import { L2NetworkLogo, LogoContainer } from '../TokenTable/TokenRow'
import PriceChart from './PriceChart'
import ShareButton from './ShareButton'

export const ChartHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textPrimary};
  gap: 4px;
  margin-bottom: 24px;
`
export const TokenInfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`
export const ChartContainer = styled.div`
  display: flex;
  height: 436px;
  align-items: center;
`
export const TokenNameCell = styled.div`
  display: flex;
  gap: 8px;
  font-size: 20px;
  line-height: 28px;
  align-items: center;
  ${textFadeIn}
`
const TokenSymbol = styled.span`
  text-transform: uppercase;
  color: ${({ theme }) => theme.textSecondary};
`
const TokenActions = styled.div`
  display: flex;
  gap: 16px;
  color: ${({ theme }) => theme.textSecondary};
`

export default function ChartSection({
  currency,
  prices,
}: {
  currency: Currency | null | undefined
  prices?: PriceDurations
}) {
  const L2Icon = getChainInfo(currency?.chainId)?.circleLogoUrl
  const timePeriod = useAtomValue(filterTimeAtom)

  return (
    <ChartHeader>
      <TokenInfoContainer>
        <TokenNameCell>
          <LogoContainer>
            <CurrencyLogo currency={currency} size={'32px'} />
            <L2NetworkLogo networkUrl={L2Icon} size={'16px'} />
          </LogoContainer>
          {currency?.name ?? <Trans>Name not found</Trans>}
          <TokenSymbol>{currency?.symbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
        </TokenNameCell>
        <TokenActions>
          {currency?.name && currency?.symbol && currency?.wrapped.address && <ShareButton currency={currency} />}
        </TokenActions>
      </TokenInfoContainer>
      <ChartContainer>
        <ParentSize>
          {({ width }) => <PriceChart prices={prices ? prices?.[timePeriod] : null} width={width} height={436} />}
        </ParentSize>
      </ChartContainer>
    </ChartHeader>
  )
}
