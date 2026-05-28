import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { memo } from 'react'
import { useSelector } from 'react-redux'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { EM_DASH, Flex, FlexLoader, flexStyles, Shine, Text, TouchableArea } from 'ui/src'
import { CopyAlt } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { selectHasViewedContractAddressExplainer } from 'uniswap/src/features/behaviorHistory/selectors'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { isMultichainProjectTokens } from 'uniswap/src/features/dataApi/tokenProjects/utils/isMultichainProjectTokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export const TokenDetailsHeader = memo(function TokenDetailsHeaderInner(): JSX.Element {
  const {
    currencyId,
    initialIsMultichainAsset,
    openContractAddressExplainerModal,
    openMultichainAddressSheet,
    copyAddressToClipboard,
  } = useTokenDetailsContext()
  const hasViewedContractAddressExplainer = useSelector(selectHasViewedContractAddressExplainer)

  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const token = useTokenBasicInfoPartsFragment({ currencyId }).data
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project
  const projectTokensLoaded = project?.tokens !== undefined
  const projectIsMultichain = projectTokensLoaded && isMultichainProjectTokens(project.tokens)
  const isMultichainToken = multichainTokenUxEnabled && (initialIsMultichainAsset || projectIsMultichain)
  // need to wait for the project tokens to load before we can open the multichain address sheet
  const canOpenMultichainAddressSheet = multichainTokenUxEnabled && projectIsMultichain
  // when the caller hinted this is a multichain asset, defer rendering the per-deployment name/symbol
  // until the project fragment confirms — otherwise we briefly show the chain-specific name (e.g. "USDC.e")
  // before swapping to the canonical project name.
  const shouldWaitForProject = multichainTokenUxEnabled && initialIsMultichainAsset && !projectTokensLoaded

  const handleCopyAddress = async (): Promise<void> => {
    if (!token.address) {
      return
    }

    if (!hasViewedContractAddressExplainer) {
      openContractAddressExplainerModal()
      return
    }

    if (canOpenMultichainAddressSheet) {
      openMultichainAddressSheet()
      return
    }

    await copyAddressToClipboard(token.address)
  }

  return (
    <Flex row gap="$spacing12" mx="$spacing16">
      <TokenLogo
        chainId={fromGraphQLChain(token.chain) ?? undefined}
        hideNetworkLogo={isMultichainToken}
        name={token.name ?? undefined}
        symbol={token.symbol ?? undefined}
        url={project?.logoUrl ?? undefined}
        size={iconSizes.icon48}
      />

      <Flex>
        {shouldWaitForProject ? (
          <Shine>
            <Flex gap="$spacing8" py="$spacing4">
              <FlexLoader height={20} width={120} borderRadius="$rounded4" />
              <FlexLoader height={14} width={56} borderRadius="$rounded4" />
            </Flex>
          </Shine>
        ) : (
          <>
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
          </>
        )}
      </Flex>
    </Flex>
  )
})
