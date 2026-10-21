import { Anchor, Flex, Text } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import React, { type ComponentPropsWithoutRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Trans } from 'ui/src'
import { ArrowUpRight } from 'ui/src/components/icons/ArrowUpRight'
import { BookOpen } from 'ui/src/components/icons/BookOpen'
import { GraduationCap } from 'ui/src/components/icons/GraduationCap'
import { PenLine } from 'ui/src/components/icons/PenLine'
import { SpeechBubbles } from 'ui/src/components/icons/SpeechBubbles'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

// Class universe parity-pinned against the legacy styled() config in
// packages/tailwind/src/parity/styled-factory (buildNewsletterSectionLayout).
const SectionLayout = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-stretch basis-auto box-border relative min-h-[0px] min-w-[0px] shrink-0 w-full max-w-[1360px] items-center gap-[40px] p-[40px] media-lg:p-[48px] media-sm:px-[24px] media-sm:py-0',
})

const RowContent = React.memo(function RowContent({
  icon,
  title,
  description,
  showArrow,
  isFirst,
}: {
  icon: React.ReactNode
  title: string
  description: string | React.ReactNode
  showArrow: boolean
  isFirst: boolean
}) {
  return (
    <Flex
      row
      py="$gap32"
      borderTopWidth={1}
      borderTopColor="$surface3"
      alignItems="center"
      width="100%"
      $lg={{ alignItems: 'flex-start' }}
      $sm={isFirst ? { borderTopWidth: 0, pt: '$spacing16' } : undefined}
    >
      <Flex row gap="$gap24" alignItems="center" flex={1} $lg={{ alignItems: 'flex-start', gap: '$gap16' }}>
        <Flex flexShrink={0}>{icon}</Flex>
        <Flex
          flex={1}
          gap="$gap16"
          alignItems="center"
          $platform-web={{ display: 'grid', gridTemplateColumns: '220px 1fr' }}
          $xl={{ '$platform-web': { gridTemplateColumns: '180px 1fr' } }}
          $lg={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
        >
          <Text variant="heading2" $md={{ variant: 'heading3', lineHeight: 36 }}>
            {title}
          </Text>
          {/* Apply left margin to match the description with the position of the icon */}
          <Text variant="heading3" $lg={{ ml: -48 }} $md={{ fontSize: 18, lineHeight: 24 }}>
            {description}
          </Text>
        </Flex>
      </Flex>
      {showArrow && (
        <Flex flexShrink={0}>
          <ArrowUpRight size="$icon.36" color="$neutral1" />
        </Flex>
      )}
    </Flex>
  )
})

RowContent.displayName = 'RowContent'

function UniverseRow({
  icon,
  title,
  description,
  href,
  isFirst = false,
}: {
  icon: React.ReactNode
  title: string
  description: string | React.ReactNode
  href?: string
  isFirst?: boolean
}) {
  const showArrow = Boolean(href)

  if (href) {
    return (
      <Anchor
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        textDecorationLine="none"
        {...ClickableTamaguiStyle}
      >
        <RowContent icon={icon} title={title} description={description} showArrow={showArrow} isFirst={isFirst} />
      </Anchor>
    )
  }

  return <RowContent icon={icon} title={title} description={description} showArrow={showArrow} isFirst={isFirst} />
}

// Parity-pinned as buildSocialLink. The legacy config's own `style:` key
// replaced the ClickableTamaguiStyle spread's `style: { transition: '100ms' }`
// (later object key), so the inline lane carries textDecoration only.
const SocialLinkBase = styled('a', {
  platform: 'web',
  base: '[display:inline] box-border m-0 [word-wrap:break-word] whitespace-pre-wrap [font-family:Basel,-apple-system,system-ui,BlinkMacSystemFont,"Segoe_UI",Roboto,Helvetica,Arial,sans-serif] [font-size:inherit] [line-height:inherit] [font-weight:inherit] text-neutral2 cursor-pointer [text-decoration-line:none] [text-decoration:none] duration-[0.2s] active:opacity-[0.6]',
  hover: [{ class: 'opacity-[0.8]' }],
  inlineStyle: () => ({ textDecoration: 'none' }),
})

function SocialLink(props: ComponentPropsWithoutRef<typeof SocialLinkBase>) {
  return <SocialLinkBase target="_blank" rel="noopener noreferrer" {...props} />
}

export function NewsletterEtc() {
  const { t } = useTranslation()

  return (
    <SectionLayout>
      <Text variant="heading1" width="100%" $md={{ variant: 'heading2' }}>
        {t('landing.exploreUniverse')}
      </Text>
      <Flex width="100%">
        <UniverseRow
          icon={<GraduationCap size="$icon.36" fill="$neutral1" />}
          title={t('common.helpCenter')}
          description={t('landing.helpCenter.body')}
          href={UniswapStaticUrls.helpCenterUrl}
          isFirst
        />
        <UniverseRow
          icon={
            <Flex p="$gap4">
              <PenLine size="$icon.28" color="$neutral1" />
            </Flex>
          }
          title={t('common.blog')}
          description={t('landing.blog.description')}
          href={UniswapStaticUrls.blogUrl}
        />
        <UniverseRow
          icon={<BookOpen size="$icon.36" fill="$neutral1" />}
          title={t('common.docs')}
          description={t('landing.docs.description')}
          href={UniswapStaticUrls.docsUrl}
        />
        <UniverseRow
          icon={<SpeechBubbles size="$icon.36" color="$neutral1" />}
          title={t('common.socials')}
          description={
            <Trans
              i18nKey="landing.socials"
              components={{
                LinkX: <SocialLink href={UniswapStaticUrls.social.x} />,
                LinkFarcaster: <SocialLink href={UniswapStaticUrls.social.farcaster} />,
                LinkLinkedIn: <SocialLink href={UniswapStaticUrls.social.linkedin} />,
                LinkTikTok: <SocialLink href={UniswapStaticUrls.social.tiktok} />,
              }}
            />
          }
        />
      </Flex>
    </SectionLayout>
  )
}
