import React, { memo } from 'react'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { Flex, flexStyles, Text } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export const TokenDetailsHeader = memo(function _TokenDetailsHeader(): JSX.Element {
  const { currencyId } = useTokenDetailsContext()

  const token = useTokenBasicInfoPartsFragment({ currencyId }).data
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project
  return (
    <Flex gap="$spacing12" mx="$spacing16">
      <TokenLogo
        chainId={fromGraphQLChain(token?.chain) ?? undefined}
        name={token?.name ?? undefined}
        symbol={token?.symbol ?? undefined}
        url={project?.logoUrl ?? undefined}
      />

      <Flex row alignItems="center" gap="$spacing8">
        <Text
          color="$neutral1"
          numberOfLines={1}
          style={flexStyles.shrink}
          testID={TestID.TokenDetailsHeaderText}
          variant="subheading1"
        >
          {token?.name ?? '—'}
        </Text>
      </Flex>
    </Flex>
  )
})
