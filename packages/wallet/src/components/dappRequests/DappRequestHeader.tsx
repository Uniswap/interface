import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { GlobeFilled, Verified } from 'ui/src/components/icons'
import { formatDappURL } from 'utilities/src/format/urls'
import { LinkButton } from 'wallet/src/components/buttons/LinkButton'
import { DappHeaderIcon } from 'wallet/src/components/dappRequests/DappHeaderIcon'
import { type DappConnectionInfo, DappVerificationStatus } from 'wallet/src/features/dappRequests/types'

interface DappRequestHeaderProps {
  dappInfo: DappConnectionInfo
  title: string | { element: JSX.Element }
  verificationStatus?: DappVerificationStatus
  /** First-party Uniswap sites get pink (accent1) URL + badge styling. Must be derived from a trusted URL. */
  isFirstParty?: boolean
  headerIcon?: JSX.Element
}

export function DappRequestHeader({
  dappInfo,
  title,
  verificationStatus,
  isFirstParty = false,
  headerIcon,
}: DappRequestHeaderProps): JSX.Element {
  const colors = useSporeColors()

  const isVerified = verificationStatus === DappVerificationStatus.Verified

  const urlColor =
    verificationStatus === DappVerificationStatus.Threat
      ? colors.statusCritical.val
      : isVerified && isFirstParty
        ? colors.accent1.val
        : verificationStatus === DappVerificationStatus.Unverified
          ? colors.neutral2.val
          : colors.neutral1.val

  const urlLabel = useRequestUrlLabel(dappInfo.url, dappInfo.frameUrl)

  return (
    <Flex gap="$spacing8">
      {headerIcon || <DappHeaderIcon dappInfo={dappInfo} />}
      {typeof title === 'string' ? <Text variant="subheading1">{title}</Text> : title.element}
      <Flex gap="$spacing2">
        <Flex row gap="$spacing4" alignItems="center">
          <GlobeFilled color={urlColor} size="$icon.16" mr="$spacing4" />
          <LinkButton
            justifyContent="flex-start"
            color={urlColor}
            label={urlLabel}
            showIcon={false}
            textVariant="buttonLabel4"
            url={dappInfo.url}
          />
          {isVerified && <Verified color={isFirstParty ? '$accent1' : '$neutral1'} size="$icon.12" ml="$spacing4" />}
        </Flex>
      </Flex>
    </Flex>
  )
}

/**
 * Formats the request url for display, showing iframe context when applicable
 * @param dappUrl - The top-level page URL
 * @param frameUrl - The actual frame URL (if in iframe)
 */
function useRequestUrlLabel(dappUrl: string, frameUrl?: string): string {
  const { t } = useTranslation()

  if (!frameUrl) {
    return formatDappURL(dappUrl)
  }

  return t('dapp.request.url.viaFormat', {
    frameUrl: formatDappURL(frameUrl),
    parentUrl: formatDappURL(dappUrl),
  })
}
