import { chainIdToPlatform } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, FlexLoader, flexStyles, iconSizes, Shine, Text, TouchableArea } from '@universe/mycelium'
import { CopyAlt } from '@universe/mycelium/icons/CopyAlt'
import { Lock } from '@universe/mycelium/icons/Lock'
import { TestID } from '@universe/test'
import React, { memo } from 'react'
import { useSelector } from 'react-redux'
import { RWAIssuerHeaderDetails } from 'src/components/TokenDetails/rwa/RWAIssuerHeaderDetails'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import {
  useIsTokenDetailsRWAMatchLoading,
  useTokenDetailsRWAMatch,
} from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { EM_DASH } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { selectHasViewedContractAddressExplainer } from 'uniswap/src/features/behaviorHistory/selectors'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { getRWAHeaderIdentity } from 'uniswap/src/features/rwa/getRWAHeaderIdentity'
import { useRwaIssuer } from 'uniswap/src/features/rwa/hooks/useRwaIssuer'
import { isDefaultNativeAddress } from 'uniswap/src/utils/currencyId'

export const TokenDetailsHeader = memo(function TokenDetailsHeaderInner(): JSX.Element {
  const {
    currencyId,
    initialIsMultichainAsset,
    openContractAddressExplainerModal,
    openMultichainAddressSheet,
    copyAddressToClipboard,
    isPermissioned,
    isAllowlisted,
    address,
    chainId,
    hasMultichainAddresses,
  } = useTokenDetailsContext()
  // Lock next to the ticker is the allowlisted "you're verified" reward, mirroring web TDP.
  // Never shown to a non-allowlisted wallet.
  const showPermissionedLock = isPermissioned && isAllowlisted
  const hasViewedContractAddressExplainer = useSelector(selectHasViewedContractAddressExplainer)

  const rwaMatch = useTokenDetailsRWAMatch()
  const isRwaMatchLoading = useIsTokenDetailsRWAMatchLoading()
  const { issuer: rwaIssuer } = useRwaIssuer({ rwaMatch, currencyId })
  const plainTokenNames = useIsTokenCategoriesEnabled()
  const metadata = useTokenMetadata(currencyId)
  // The group match resolves after the token metadata; hold the title rather than paint the plain
  // token name and then flip it.
  const isIdentityLoading = metadata.isLoading || isRwaMatchLoading

  const isMultichainToken = initialIsMultichainAsset || hasMultichainAddresses
  const { name: tokenName, logoUrl } = getRWAHeaderIdentity({
    rwaMatch,
    fallbackName: metadata.name ?? undefined,
    logoUrl: metadata.logoUrl ?? undefined,
    plainTokenNames,
  })

  const hasNonNativeAddress = !!address && !isDefaultNativeAddress({ address, platform: chainIdToPlatform(chainId) })

  const handleCopyAddress = async (): Promise<void> => {
    if (!hasViewedContractAddressExplainer) {
      openContractAddressExplainerModal()
      return
    }

    if (hasMultichainAddresses) {
      openMultichainAddressSheet()
      return
    }

    await copyAddressToClipboard(address)
  }

  return (
    <Flex row alignItems="flex-start" gap="$spacing12" mx="$spacing16">
      <TokenLogo
        chainId={chainId}
        hideNetworkLogo={isMultichainToken || !!rwaMatch}
        name={tokenName ?? undefined}
        symbol={rwaMatch?.asset.symbol ?? metadata.symbol ?? undefined}
        url={logoUrl}
        size={iconSizes.icon48}
      />

      <Flex shrink flex={1}>
        {isIdentityLoading ? (
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
              {rwaIssuer ? (
                <>
                  <RWAIssuerHeaderDetails issuer={rwaIssuer} />
                  <Flex alignSelf="center" backgroundColor="$surface3" height={20} width={1} />
                </>
              ) : null}
              <TouchableArea
                disabled={!hasNonNativeAddress}
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
                  {metadata.symbol?.toUpperCase() || EM_DASH}
                </Text>
                {showPermissionedLock && <Lock color="$neutral2" size="$icon.16" alignSelf="center" flexShrink={0} />}
                {hasNonNativeAddress && <CopyAlt color="$neutral3" size="$icon.16" alignSelf="center" />}
              </TouchableArea>
            </Flex>
          </>
        )}
      </Flex>
    </Flex>
  )
})
