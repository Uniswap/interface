import React, { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Flex, Text, styled } from 'ui/src'
import { ArrowUpRight } from 'ui/src/components/icons/ArrowUpRight'
import { BookOpen } from 'ui/src/components/icons/BookOpen'
import { HelpCenter } from 'ui/src/components/icons/HelpCenter'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { SpeechBubbles } from 'ui/src/components/icons/SpeechBubbles'
import { uniswapUrls } from 'uniswap/src/constants/urls'

const SectionLayout = styled(Flex, {
  width: '100%',
  maxWidth: 1360,
  alignItems: 'center',
  gap: 40,
  p: 40,

  $lg: {
    p: 48,
  },

  $sm: {
    p: 24,
  },
})

const RowContent = React.memo(function RowContent({
  icon,
  title,
  description,
  showArrow,
}: {
  icon: React.ReactNode
  title: string
  description: string | React.ReactNode
  showArrow: boolean
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
    >
      <Flex row gap="$gap24" alignItems="center" flex={1} $lg={{ alignItems: 'flex-start', gap: '$gap16' }}>
        <Flex flexShrink={0}>{icon}</Flex>
        <Flex row alignItems="center" flex={1} gap="$gap16" $lg={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <Text
            variant="heading2"
            minWidth={220}
            $xl={{ minWidth: 180 }}
            $lg={{ flexBasis: 0 }}
            $md={{ variant: 'heading3', lineHeight: 36 }}
          >
            {title}
          </Text>
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
}: {
  icon: React.ReactNode
  title: string
  description: string | React.ReactNode
  href?: string
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
        <RowContent icon={icon} title={title} description={description} showArrow={showArrow} />
      </Anchor>
    )
  }

  return <RowContent icon={icon} title={title} description={description} showArrow={showArrow} />
}

const SocialLink = styled(Anchor, {
  fontSize: 'inherit',
  lineHeight: 'inherit',
  fontWeight: 'inherit',
  color: '$neutral2',
  target: '_blank',
  rel: 'noopener noreferrer',
  ...ClickableTamaguiStyle,
  style: {
    textDecoration: 'none',
  },
})

interface FAQItemProps {
  question: string
  answer: string | React.ReactNode
  id: string
}

function CollapsibleFAQItem({ question, answer, id }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Simple hash-based opening on initial load
    if (window.location.hash === `#${id}`) {
      setIsOpen(true)
      // Simple scroll after render
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [id])

  return (
    <Flex id={id}>
      <Anchor
        href={`#${id}`}
        textDecorationLine="none"
        onPress={(e) => {
          e.preventDefault() // Prevent navigation
          setIsOpen(!isOpen)
        }}
        {...ClickableTamaguiStyle}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        role="button"
      >
        <Flex row alignItems="center" gap="$gap8" userSelect="none">
          <RotatableChevron direction={isOpen ? 'down' : 'end'} color="$neutral1" width={20} height={20} />
          <Text variant="heading3" $md={{ fontSize: 18, lineHeight: 24 }}>
            {question}
          </Text>
        </Flex>
      </Anchor>
      {isOpen && (
        <Flex id={`${id}-content`} pt="$gap8" pl="$gap28">
          <Text variant="heading3" $md={{ fontSize: 18, lineHeight: 24 }} color="$neutral2">
            {answer}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

function FAQList() {
  const { t } = useTranslation()

  const faqs = [
    {
      id: 'faq-juice-token',
      question: t('faq.juiceToken.question'),
      answer: t('faq.juiceToken.answer'),
    },
    {
      id: 'faq-new-questions',
      question: t('faq.newQuestions.question'),
      answer: t('faq.newQuestions.answer'),
    },
  ]

  return (
    <Flex role="list">
      {faqs.map((faq, index) => (
        <Flex key={faq.id} role="listitem">
          <CollapsibleFAQItem id={faq.id} question={faq.question} answer={faq.answer} />
          {index < faqs.length - 1 && <Flex borderTopWidth={1} borderTopColor="$surface3" my="$gap12" />}
        </Flex>
      ))}
    </Flex>
  )
}

export function NewsletterEtc() {
  const { t } = useTranslation()

  return (
    <SectionLayout>
      <Text variant="heading1" width="100%" $md={{ variant: 'heading2' }}>
        {t('landing.exploreUniverse')}
      </Text>
      <Flex width="100%">
        {/* <UniverseRow
          icon={<GraduationCap size="$icon.36" fill="$neutral1" />}
          title={t('common.helpCenter')}
          description={t('landing.helpCenter.body')}
          href={uniswapUrls.helpCenterUrl}
        /> */}
        <UniverseRow
          icon={<BookOpen size="$icon.36" fill="$neutral1" />}
          title={t('common.docs')}
          description={t('landing.docs.description')}
          href={uniswapUrls.docsUrl}
        />
        <UniverseRow
          icon={<SpeechBubbles size="$icon.36" color="$neutral1" />}
          title={t('common.socials')}
          description={
            <Trans
              i18nKey="landing.socials"
              components={{
                LinkX: <SocialLink href={uniswapUrls.social.x} />,
                LinkTelegram: <SocialLink href={uniswapUrls.social.telegram} />,
              }}
            />
          }
        />
        <UniverseRow
          icon={<HelpCenter size="$icon.36" fill="$neutral1" />}
          title={t('common.faq')}
          description={<FAQList />}
        />
      </Flex>
    </SectionLayout>
  )
}
