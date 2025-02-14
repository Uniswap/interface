import { useIsAccountCTAExperimentControl } from 'components/NavBar/accountCTAsExperimentUtils'
import { PropsWithChildren, ReactNode } from 'react'
import { ThemedText } from 'theme/components'
import { Flex, Image, Text, useMedia } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function ModalContent({
  title,
  subtext,
  rightThumbnail,
  children,
  logo,
}: PropsWithChildren<{ title: string; subtext?: string; rightThumbnail?: ReactNode; logo?: ReactNode }>) {
  const { isControl: isAccountCTAExperimentControl } = useIsAccountCTAExperimentControl()
  const embeddedWalletIsEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const media = useMedia()
  const showRightThumbnail = !media.xl

  return isAccountCTAExperimentControl && !embeddedWalletIsEnabled ? (
    <Flex p={24} alignItems="center" gap="$spacing32">
      <Flex alignItems="center" gap="$spacing12">
        <Image height={iconSizes.icon64} source={UNISWAP_LOGO} width={iconSizes.icon64} />
        <Flex alignItems="center" gap="$spacing8">
          <ThemedText.H1Medium textAlign="center">{title}</ThemedText.H1Medium>
          <ThemedText.BodySecondary textAlign="center" maxWidth="400px">
            {subtext}
          </ThemedText.BodySecondary>
        </Flex>
      </Flex>
      {children}
    </Flex>
  ) : (
    <Flex row height="100%" width="100%">
      <Flex p={32} alignItems="center" justifyContent="center" gap="$spacing8" width="-webkit-fill-available" flex={1}>
        {logo ?? <Image height={56} source={UNISWAP_LOGO} width={56} />}
        <Flex alignItems="center" gap="$spacing24">
          <Flex gap="$spacing8">
            <Text variant="heading3" textAlign="center">
              {title}
            </Text>
            {subtext && (
              <Text variant="body2" $xxl={{ variant: 'body3' }} color="$neutral2" textAlign="center" maxWidth="400px">
                {subtext}
              </Text>
            )}
          </Flex>
          {children}
        </Flex>
      </Flex>
      {rightThumbnail && showRightThumbnail && <Flex width="45%">{rightThumbnail}</Flex>}
    </Flex>
  )
}
