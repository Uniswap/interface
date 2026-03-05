import { GraphQLApi } from '@universe/api'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { capitalize } from 'tsafe'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Globe } from 'ui/src/components/icons/Globe'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme'
import { useShadowPropsShort } from 'ui/src/theme/shadows'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExternalLink } from '~/theme/components/Links'
import { getChainUrlParam } from '~/utils/chainParams'

function getLimitedDataBannerSessionStorageKey(tokenAddress: string): string {
  return `hideLimitedDataBanner-${tokenAddress}`
}

interface BannerWrapperProps {
  children: ReactNode
  onDismiss: () => void
  testId: string
}

function BannerWrapper({ children, onDismiss, testId }: BannerWrapperProps): JSX.Element {
  const shadowProps = useShadowPropsShort()

  return (
    <Flex
      width={360}
      maxWidth="95%"
      backgroundColor="$surface1"
      zIndex={zIndexes.sticky}
      borderRadius="$rounded20"
      borderStyle="solid"
      borderWidth={1.3}
      borderColor="$surface3"
      $platform-web={{
        position: 'fixed',
        bottom: 40,
        right: 20,
        ...(shadowProps['$platform-web'] || {}),
      }}
      $lg={{
        bottom: 62,
      }}
      $sm={{
        bottom: 80,
      }}
      $xs={{
        right: 10,
        left: 10,
      }}
    >
      <Flex row p="$spacing8" borderRadius="$rounded20" height="100%">
        <Flex
          centered
          m="$spacing12"
          mr="$spacing6"
          height={45}
          width={45}
          backgroundColor="$statusWarning2"
          borderRadius="$rounded12"
        >
          <Globe size="$icon.28" color="$statusWarning" />
        </Flex>
        <Flex gap="$spacing2" p={10} $xs={{ maxWidth: 270 }} flexShrink={1}>
          {children}
        </Flex>
        <TouchableArea data-testid={testId} onPress={onDismiss} p="$spacing8">
          <X color="$neutral2" size="$icon.24" />
        </TouchableArea>
      </Flex>
    </Flex>
  )
}

/**
 * Formats a list of protocol versions for display.
 * Note: This function only needs to handle 1 or 2 versions because when all 3 versions fail,
 * the full error state is shown instead of the LimitedDataBanner.
 */
function formatVersionsList(versions: GraphQLApi.ProtocolVersion[], t: ReturnType<typeof useTranslation>['t']): string {
  const versionLabels = versions.map((v) => v.toLowerCase())

  if (versionLabels.length === 1) {
    return versionLabels[0]
  }

  // 2 versions: "v2 and v3"
  return t('common.conjunction.and', {
    first: versionLabels[0],
    second: versionLabels[1],
  })
}

interface LimitedDataBannerProps {
  failedVersions: GraphQLApi.ProtocolVersion[]
  tokenAddress: string
  chainId: UniverseChainId
  onDismiss?: () => void
}

/**
 * Banner for partial transaction data failures on TDP.
 * Shows when some (but not all) protocol versions failed to load.
 */
export function LimitedDataBanner({
  failedVersions,
  tokenAddress,
  chainId,
  onDismiss,
}: LimitedDataBannerProps): JSX.Element | null {
  const [hidden, setHidden] = useState(false)
  const { t } = useTranslation()

  const sessionStorageKey = getLimitedDataBannerSessionStorageKey(tokenAddress)
  const wasDismissed = sessionStorage.getItem(sessionStorageKey) === 'true'

  if (hidden || wasDismissed || failedVersions.length === 0) {
    return null
  }

  const handleDismiss = (): void => {
    setHidden(true)
    sessionStorage.setItem(sessionStorageKey, 'true')
    onDismiss?.()
  }

  const isSingleVersionFailure = failedVersions.length === 1

  // Single version failure uses existing outage copy
  if (isSingleVersionFailure) {
    const version = failedVersions[0]
    const versionName = version.toLowerCase() + ' data'
    const chainName = capitalize(getChainUrlParam(chainId))
    const versionDescription = ' ' + version.toLowerCase()

    return (
      <BannerWrapper onDismiss={handleDismiss} testId="limited-data-banner-close">
        <Text variant="body2" color="$neutral1">
          {t('outageBanner.title', { versionName })}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('outageBanner.message', { chainName, versionDescription })}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('outageBanner.message.sub')}
        </Text>
        <ExternalLink href={uniswapUrls.helpArticleUrls.uniswapVersionsInfo}>
          <Text variant="body3" color="$accent1">
            {t('common.button.learn')}
          </Text>
        </ExternalLink>
      </BannerWrapper>
    )
  }

  // Multiple versions failure uses limited data copy
  const versionsText = formatVersionsList(failedVersions, t)

  return (
    <BannerWrapper onDismiss={handleDismiss} testId="limited-data-banner-close">
      <Text variant="body2" color="$neutral1">
        {t('limitedTransactionData.title')}
      </Text>
      <Text variant="body3" color="$neutral2">
        {t('limitedTransactionData.message', { versions: versionsText })}
      </Text>
      <Text variant="body3" color="$neutral2">
        {t('limitedTransactionData.sub')}
      </Text>
      <ExternalLink href={uniswapUrls.helpArticleUrls.uniswapVersionsInfo}>
        <Text variant="body3" color="$accent1">
          {t('common.button.learn')}
        </Text>
      </ExternalLink>
    </BannerWrapper>
  )
}
