import React, { memo } from 'react'
import { useSelector } from 'react-redux'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { EM_DASH, Flex, flexStyles, Text, TouchableArea } from 'ui/src'
import { CopyAlt } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { selectHasViewedContractAddressExplainer } from 'uniswap/src/features/behaviorHistory/selectors'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export const TokenDetailsHeader = memo(function _TokenDetailsHeader(): JSX.Element {
  const { currencyId, openContractAddressExplainerModal, copyAddressToClipboard } = useTokenDetailsContext()
  const hasViewedContractAddressExplainer = useSelector(selectHasViewedContractAddressExplainer)

  const token = useTokenBasicInfoPartsFragment({ currencyId }).data
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project

  const handleCopyAddress = async (): Promise<void> => {
    if (!token.address) {
      return
    }

    if (!hasViewedContractAddressExplainer) {
      openContractAddressExplainerModal()
      return
    }

    await copyAddressToClipboard(token.address)
  }

  return (
    <Flex row gap="$spacing12" mx="$spacing16">
      <TokenLogo
        chainId={fromGraphQLChain(token.chain) ?? undefined}
        name={token.name ?? undefined}
        symbol={token.symbol ?? undefined}
        url={project?.logoUrl ?? undefined}
        size={iconSizes.icon48}
      />

      <Flex>
        <Text
          color="$neutral1"
          numberOfLines={1}
          style={flexStyles.shrink}
          testID={TestID.TokenDetailsHeaderText}
          variant="subheading1"
        >
          {token.name || EM_DASH}
        </Text>
        <TouchableArea
          disabled={!token.address}
          flexDirection="row"
          gap="$spacing4"
          testID={TestID.TokenDetailsCopyAddressButton}
          onPress={handleCopyAddress}
        >
          <Text
            color="$neutral2"
            numberOfLines={1}
            style={flexStyles.shrink}
            testID={TestID.TokenDetailsHeaderText}
            variant="body3"
          >
            {token.symbol || EM_DASH}
          </Text>
          {token.address && <CopyAlt color="$neutral3" size="$icon.16" alignSelf="center" />}
        </TouchableArea>
      </Flex>
    </Flex>
  )
})
