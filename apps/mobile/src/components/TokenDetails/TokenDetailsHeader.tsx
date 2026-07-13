import { FeatureFlags } from '@universe/gating'
import React, { memo } from 'react'
import { useSelector } from 'react-redux'
import { getRWAHeaderIdentity } from 'src/components/TokenDetails/getRWAHeaderIdentity'
import { RWAIssuerHeaderDetails } from 'src/components/TokenDetails/rwa/RWAIssuerHeaderDetails'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useFeatureFlaggedProjectTokens } from 'src/components/TokenDetails/useFeatureFlaggedProjectTokens'
import { useGatedTokenDetailsRWAMatch } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
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

  const rwaMatch = useGatedTokenDetailsRWAMatch(FeatureFlags.RWATdp)
  const token = useTokenBasicInfoPartsFragment({ currencyId }).data
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project
  const projectTokensLoaded = project?.tokens !== undefined
  // Gate out unlaunched chains (e.g. Arc/Robinhood) so they don't drive multichain UI on the header.
  const featureFlaggedProjectTokens = useFeatureFlaggedProjectTokens(project?.tokens)
  const projectIsMultichain = projectTokensLoaded && isMultichainProjectTokens(featureFlaggedProjectTokens)
  const isMultichainToken = initialIsMultichainAsset || projectIsMultichain
  // need to wait for the project tokens to load before we can open the multichain address sheet
  const canOpenMultichainAddressSheet = projectIsMultichain
  // when the caller hinted this is a multichain asset, defer rendering the per-deployment name/symbol
  // until the project fragment confirms — otherwise we briefly show the chain-specific name (e.g. "USDC.e")
  // before swapping to the canonical project name.
  const shouldWaitForProject = initialIsMultichainAsset && !projectTokensLoaded
  const { name: tokenName, logoUrl } = getRWAHeaderIdentity({
    rwaMatch,
    fallbackName: token.name ?? undefined,
    logoUrl: project?.logoUrl ?? undefined,
  })

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
    <Flex row alignItems="flex-start" gap="$spacing12" mx="$spacing16">
      <TokenLogo
        chainId={fromGraphQLChain(token.chain) ?? undefined}
        hideNetworkLogo={isMultichainToken || !!rwaMatch}
        name={tokenName ?? undefined}
        symbol={rwaMatch?.asset.symbol ?? token.symbol ?? undefined}
        url={logoUrl}
        size={iconSizes.icon48}
      />

      <Flex shrink flex={1}>
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
              numberOfLines={2}
              style={flexStyles.shrink}
              testID={TestID.TokenDetailsHeaderText}
              variant="subheading1"
            >
              {tokenName || EM_DASH}
            </Text>
            <Flex row shrink alignItems="center" gap="$spacing12">
              {rwaMatch ? (
                <>
                  <RWAIssuerHeaderDetails rwaMatch={rwaMatch} />
                  <Flex alignSelf="center" backgroundColor="$surface3" height={20} width={1} />
                </>
              ) : null}
              <TouchableArea
                disabled={!token.address}
                flexDirection="row"
                gap="$spacing4"
                style={flexStyles.shrink}
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
                  {token.symbol?.toUpperCase() || EM_DASH}
                </Text>
                {token.address && <CopyAlt color="$neutral3" size="$icon.16" alignSelf="center" />}
              </TouchableArea>
            </Flex>
          </>
        )}
      </Flex>
    </Flex>
  )
})
