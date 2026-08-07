import { isWebPlatform } from '@universe/environment'
import type { ComponentType } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, type IconProps, ModalCloseIcon, Text, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { Bolt } from 'ui/src/components/icons/Bolt'
import { ChartBar } from 'ui/src/components/icons/ChartBar'
import { EarnSparkle } from 'ui/src/components/icons/EarnSparkle'
import { MessageQuestion } from 'ui/src/components/icons/MessageQuestion'
import { MoneyHand } from 'ui/src/components/icons/MoneyHand'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { openUri } from 'uniswap/src/utils/linking'

const WEB_CONTENT_MIN_HEIGHT = 384

type EarnHowItWorksViewProps = {
  onBack?: () => void
  onClose?: () => void
  onContinue: () => void
}

export function EarnHowItWorksView({ onBack, onClose, onContinue }: EarnHowItWorksViewProps): JSX.Element {
  const { t } = useTranslation()
  const rows = [
    {
      Icon: Bolt,
      title: t('explore.earn.howItWorks.startEarning.title'),
      caption: t('explore.earn.howItWorks.startEarning.caption'),
    },
    {
      Icon: ChartBar,
      title: t('explore.earn.howItWorks.realTimeApy.title'),
      caption: t('explore.earn.howItWorks.realTimeApy.caption'),
    },
    {
      Icon: MoneyHand,
      title: t('explore.earn.howItWorks.noLockup.title'),
      caption: t('explore.earn.howItWorks.noLockup.caption'),
    },
  ]
  const onOpenHelp = useCallback(() => {
    openUri({ uri: UniswapHelpUrls.articles.earnHelp, isSafeUri: true }).catch(() => undefined)
  }, [])

  const content = (
    <>
      <Flex alignItems="center" gap="$spacing16">
        <Flex
          alignItems="center"
          justifyContent="center"
          backgroundColor="$accent2"
          borderRadius="$rounded12"
          height="$spacing48"
          width="$spacing48"
        >
          <EarnSparkle color="$accent1" size="$icon.24" />
        </Flex>
        <Text variant="subheading1" color="$neutral1" textAlign="center">
          {t('explore.earn.howItWorks.title')}
        </Text>
      </Flex>

      <Flex gap={isWebPlatform ? '$spacing16' : '$spacing24'} my="$spacing12">
        {rows.map(({ Icon, title, caption }) => (
          <HowItWorksRow key={title} Icon={Icon} title={title} caption={caption} />
        ))}
      </Flex>

      <Flex gap={isWebPlatform ? '$spacing12' : '$spacing8'} width="100%">
        <Button
          fill={false}
          width="100%"
          variant="default"
          emphasis="primary"
          size={isWebPlatform ? 'medium' : 'large'}
          onPress={onContinue}
        >
          {t('common.button.continue')}
        </Button>
        <Text variant="body4" color="$neutral3" textAlign="center">
          {t('explore.earn.howItWorks.acknowledgement')}
        </Text>
      </Flex>
    </>
  )

  if (isWebPlatform) {
    return (
      <Flex gap="$spacing12">
        <WebHeader helpLabel={t('common.help')} onBack={onBack} onClose={onClose} onOpenHelp={onOpenHelp} />
        <Flex
          justifyContent="space-between"
          gap="$spacing16"
          minHeight={WEB_CONTENT_MIN_HEIGHT}
          px="$spacing24"
          pb="$spacing24"
        >
          {content}
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex gap="$spacing24" pt="$spacing12" px="$spacing24" pb="$spacing24">
      {content}
    </Flex>
  )
}

function HowItWorksRow({
  Icon,
  title,
  caption,
}: {
  Icon: ComponentType<IconProps>
  title: string
  caption: string
}): JSX.Element {
  return (
    <Flex row alignItems="flex-start" gap="$spacing12">
      <Icon color="$accent1" size="$icon.20" />
      <Flex flex={1} gap="$spacing4">
        <Text variant="body3" color="$neutral1">
          {title}
        </Text>
        <Text variant="body3" color="$neutral2">
          {caption}
        </Text>
      </Flex>
    </Flex>
  )
}

function WebHeader({
  helpLabel,
  onBack,
  onClose,
  onOpenHelp,
}: {
  helpLabel: string
  onBack?: () => void
  onClose?: () => void
  onOpenHelp: () => void
}): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between" minHeight="$spacing32" pl="$spacing12" pr="$spacing16">
      <TouchableArea hoverable onPress={onBack}>
        <BackArrow color="$neutral2" size="$icon.20" />
      </TouchableArea>
      <Flex row alignItems="center" gap="$spacing12">
        <TouchableArea
          row
          alignItems="center"
          gap="$spacing4"
          borderWidth="$spacing1"
          borderColor="$surface3"
          borderRadius="$rounded12"
          backgroundColor="$surface1"
          px="$spacing8"
          py="$spacing6"
          hoverStyle={{ backgroundColor: '$surface2' }}
          onPress={onOpenHelp}
        >
          <MessageQuestion color="$neutral1" size="$icon.16" />
          <Text variant="buttonLabel4" color="$neutral1">
            {helpLabel}
          </Text>
        </TouchableArea>
        {onClose && <ModalCloseIcon size="$icon.20" onClose={onClose} />}
      </Flex>
    </Flex>
  )
}
