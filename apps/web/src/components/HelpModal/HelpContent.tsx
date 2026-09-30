import { Anchor, Flex, Text, TouchableArea } from '@universe/mycelium'
import { BookOpen } from '@universe/mycelium/icons/BookOpen'
import { ExternalLink } from '@universe/mycelium/icons/ExternalLink'
import { GraduationCap } from '@universe/mycelium/icons/GraduationCap'
import { SpeechBubbles } from '@universe/mycelium/icons/SpeechBubbles'
import { X } from '@universe/mycelium/icons/X'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { UniswapHelpUrls, UniswapStaticUrls } from 'uniswap/src/constants/urls'

interface HelpContentProps {
  onClose?: () => void
}

function HelpItem({ icon, title, href }: { icon: React.ReactNode; title: string; href: string }) {
  return (
    <Anchor href={href} target="_blank" textDecorationLine="none" width="min-content">
      <Flex row gap="$gap4" alignItems="center">
        {icon}
        <Text variant="body3" whiteSpace="nowrap">
          {title}
        </Text>
        <ExternalLink size="$icon.12" color="$neutral2" />
      </Flex>
    </Anchor>
  )
}

export function HelpContent({ onClose }: HelpContentProps) {
  const { t } = useTranslation()

  return (
    <Flex
      py="$padding12"
      pr="$padding8"
      pl="$padding12"
      gap="$gap12"
      width={240}
      zIndex="$tooltip"
      borderRadius="$rounded12"
      borderWidth="$spacing1"
      borderColor="$surface3"
      backgroundColor="$surface2"
      userSelect="none"
      data-testid={TestID.HelpModal}
    >
      <Flex row justifyContent="space-between" alignItems="center">
        <Text variant="body4" color="$neutral2">
          {t('common.help')}
        </Text>
        <TouchableArea onPress={onClose}>
          <X size="$icon.20" color="$neutral2" />
        </TouchableArea>
      </Flex>
      <HelpItem
        icon={<GraduationCap size="$icon.20" color="$neutral2" />}
        title={t('settings.action.help')}
        href={UniswapHelpUrls.baseUrl}
      />
      <HelpItem
        icon={<BookOpen size="$icon.20" color="$neutral2" />}
        title={t('common.docs')}
        href={UniswapStaticUrls.docsUrl}
      />
      <HelpItem
        icon={<SpeechBubbles size="$icon.20" color="$neutral2" />}
        title={t('common.contactUs.button')}
        href={UniswapHelpUrls.requestUrl}
      />
    </Flex>
  )
}
