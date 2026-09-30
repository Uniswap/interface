import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { getIssuerTokenPrimaryName } from 'uniswap/src/features/rwa/getIssuerTokenPrimaryName'
import { useExpandRWASiblingHandler } from 'uniswap/src/features/rwa/hooks/useExpandRWASiblingHandler'
import { useMoreRwaTokens } from 'uniswap/src/features/rwa/hooks/useMoreRwaTokens'
import { IssuerTokenCard } from '~/pages/TokenDetails/components/rwa/IssuerTokenCard'
import { useTDPRWAMatch, useTDPRWASubject } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'

const COLLAPSED_VISIBLE_COUNT = 2

export function MoreWaysToTrade(): JSX.Element | null {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const rwaMatch = useTDPRWAMatch()
  const subject = useTDPRWASubject()
  const { otherIssuerTokens, getMarketData } = useMoreRwaTokens({ rwaMatch, subject })
  const plainTokenNames = useIsTokenCategoriesEnabled()
  const onToggleExpanded = useExpandRWASiblingHandler({
    rwaMatch,
    variantCount: otherIssuerTokens.length,
    isExpanded,
    setIsExpanded,
  })

  if (!rwaMatch || otherIssuerTokens.length === 0) {
    return null
  }

  const companyName = rwaMatch.asset.name || rwaMatch.asset.symbol
  const useExpando = otherIssuerTokens.length > COLLAPSED_VISIBLE_COUNT
  const visibleTokens =
    useExpando && !isExpanded ? otherIssuerTokens.slice(0, COLLAPSED_VISIBLE_COUNT) : otherIssuerTokens
  const hiddenCount = otherIssuerTokens.length - COLLAPSED_VISIBLE_COUNT

  return (
    <Flex gap="$gap16" testID={TestID.TokenDetailsRWAMoreWaysToTrade}>
      <Text variant="heading3">{t('tdp.rwa.moreTokens', { company: companyName })}</Text>
      <Flex row flexWrap="wrap" gap="$gap12" $md={{ flexDirection: 'column' }}>
        {visibleTokens.map((token) => (
          <Flex
            key={`${token.chainId}-${token.address}`}
            flexGrow={1}
            flexBasis="48%"
            minWidth={0}
            maxWidth="49%"
            $md={{ flexGrow: 0, flexBasis: 'auto', maxWidth: '100%' }}
          >
            <IssuerTokenCard
              token={token}
              primaryName={getIssuerTokenPrimaryName({
                tokenName: token.name,
                fallbackName: companyName,
                plainTokenNames,
              })}
              marketData={getMarketData(token)}
            />
          </Flex>
        ))}
      </Flex>
      {useExpando && (
        <ExpandoRow
          isExpanded={isExpanded}
          label={isExpanded ? t('common.button.showLess') : t('tdp.rwa.moreTokensCount', { count: hiddenCount })}
          onPress={onToggleExpanded}
        />
      )}
    </Flex>
  )
}
