import { Flex, Text, useSporeColors } from 'ui/src'
import { Verified } from 'ui/src/components/icons'
import { formatDappURL } from 'utilities/src/format/urls'
import { LinkButton } from 'wallet/src/components/buttons/LinkButton'
import { DappHeaderIcon } from 'wallet/src/components/dappRequests/DappHeaderIcon'
import { DappConnectionInfo, DappVerificationStatus } from 'wallet/src/features/dappRequests/types'

interface DappRequestHeaderProps {
  dappInfo: DappConnectionInfo
  title: string | { element: JSX.Element }
  verificationStatus?: DappVerificationStatus
  headerIcon?: JSX.Element
}

export function DappRequestHeader({
  dappInfo,
  title,
  verificationStatus,
  headerIcon,
}: DappRequestHeaderProps): JSX.Element {
  const colors = useSporeColors()

  const urlColor =
    verificationStatus === DappVerificationStatus.Threat
      ? colors.statusCritical.val
      : verificationStatus === DappVerificationStatus.Unverified
        ? colors.neutral2.val
        : colors.accent1.val

  return (
    <Flex gap="$spacing8">
      {headerIcon || <DappHeaderIcon dappInfo={dappInfo} />}
      {typeof title === 'string' ? <Text variant="subheading1">{title}</Text> : title.element}
      <Flex row gap="$spacing4" alignItems="center">
        <LinkButton
          justifyContent="flex-start"
          color={urlColor}
          label={formatDappURL(dappInfo.url)}
          showIcon={false}
          textVariant="buttonLabel4"
          url={dappInfo.url}
        />
        {verificationStatus === DappVerificationStatus.Verified && <Verified color="$accent1" size="$icon.16" />}
      </Flex>
    </Flex>
  )
}
