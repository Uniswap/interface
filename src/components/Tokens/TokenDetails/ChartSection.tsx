import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { ParentSize } from '@visx/responsive'
import { useWeb3React } from '@web3-react/core'
import CurrencyLogo from 'components/CurrencyLogo'
import { VerifiedIcon } from 'components/TokenSafety/TokenSafetyIcon'
import { getChainInfo } from 'constants/chainInfo'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { SingleTokenData } from 'graphql/data/Token'
import { useCurrency } from 'hooks/Tokens'
import styled from 'styled-components/macro'

import { useIsFavorited, useToggleFavorite } from '../state'
import { ClickFavorited, FavoriteIcon } from '../TokenTable/TokenRow'
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
const NetworkBadge = styled.div<{ networkColor?: string; backgroundColor?: string }>`
  border-radius: 5px;
  padding: 4px 8px;
  font-weight: 600;
  font-size: 12px;
  line-height: 12px;
  color: ${({ theme, networkColor }) => networkColor ?? theme.textPrimary};
  background-color: ${({ theme, backgroundColor }) => backgroundColor ?? theme.backgroundSurface};
`

export default function ChartSection({ token, tokenData }: { token: Token; tokenData: SingleTokenData | undefined }) {
  const { chainId: connectedChainId } = useWeb3React()
  const isFavorited = useIsFavorited(token.address)
  const toggleFavorite = useToggleFavorite(token.address)
  const chainInfo = getChainInfo(token?.chainId)
  const networkLabel = chainInfo?.label
  const networkBadgebackgroundColor = chainInfo?.backgroundColor
  const warning = checkWarning(token.address)

  let currency = useCurrency(token.address)

  if (connectedChainId) {
    const wrappedNativeCurrency = WRAPPED_NATIVE_CURRENCY[connectedChainId]
    const isWrappedNativeToken = wrappedNativeCurrency?.address === token?.address
    if (isWrappedNativeToken) {
      currency = nativeOnChain(connectedChainId)
    }
  }

  const tokenName = tokenData?.name ?? token?.name
  const tokenSymbol = tokenData?.tokens?.[0]?.symbol ?? token?.symbol

  return (
    <ChartHeader>
      <TokenInfoContainer>
        <TokenNameCell>
          <CurrencyLogo currency={currency} size={'32px'} symbol={tokenSymbol} />
          {tokenName ?? <Trans>Name not found</Trans>}
          <TokenSymbol>{tokenSymbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
          {!warning && <VerifiedIcon size="20px" />}
          {networkBadgebackgroundColor && (
            <NetworkBadge networkColor={chainInfo?.color} backgroundColor={networkBadgebackgroundColor}>
              {networkLabel}
            </NetworkBadge>
          )}
        </TokenNameCell>
        <TokenActions>
          {tokenName && tokenSymbol && (
            <ShareButton tokenName={tokenName} tokenSymbol={tokenSymbol} tokenAddress={token.address} />
          )}
          <ClickFavorited onClick={toggleFavorite}>
            <FavoriteIcon isFavorited={isFavorited} />
          </ClickFavorited>
        </TokenActions>
      </TokenInfoContainer>
      <ChartContainer>
        <ParentSize>
          {({ width, height }) => (
            <PriceChart tokenAddress={token.address} width={width} height={height} priceData={tokenData?.prices?.[0]} />
          )}
        </ParentSize>
      </ChartContainer>
    </ChartHeader>
  )
}
