import { GraphQLApi } from '@universe/api'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Flex, styled } from 'ui/src/index'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId as toCurrencyId } from 'uniswap/src/utils/currencyId'
import { getTokenDetailsURL, gqlToCurrency, unwrapToken } from '~/appGraphql/data/util'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import { getChainUrlParam } from '~/utils/params/chainParams'

const StyledInternalLink = styled(Link, {
  ...ClickableTamaguiStyle,
  color: '$neutral1',
  '$platform-web': {
    textDecoration: 'none',
  },
})

/**
 * Given a token displays the Token's Logo and Symbol with a link to its TDP
 * @param token
 * @returns JSX.Element showing the Token's Logo, Chain logo if non-mainnet, and Token Symbol
 */
export const TokenLinkCell = ({ token, hideLogo }: { token: GraphQLApi.Token; hideLogo?: boolean }) => {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const chainId = fromGraphQLChain(token.chain) ?? defaultChainId
  const unwrappedToken = unwrapToken(chainId, token)
  const currency = gqlToCurrency(unwrappedToken)
  const currencyInfo = useCurrencyInfo(currency ? toCurrencyId(currency) : undefined)

  return (
    <StyledInternalLink
      to={getTokenDetailsURL({
        address: unwrappedToken.address,
        chain: token.chain,
        chainQueryParam: getChainUrlParam(chainId),
      })}
    >
      <Flex row gap="$gap8" maxWidth="100px" alignItems="center">
        <EllipsisText>{unwrappedToken.symbol ?? t('common.unknown').toUpperCase()}</EllipsisText>
        {!hideLogo && (
          <TokenLogo
            chainId={chainId}
            size={22}
            url={currencyInfo?.logoUrl ?? token.project?.logo?.url}
            symbol={currencyInfo?.currency.symbol ?? token.symbol}
            name={currencyInfo?.currency.name}
          />
        )}
      </Flex>
    </StyledInternalLink>
  )
}
