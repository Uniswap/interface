import { StarIcon } from 'pages/Referral/Components/OverviewIcon'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text } from 'ui/src'
import { getInternalLinkHref } from 'utils/routing'

export function Rules() {
  const { t } = useTranslation()
  const bigTitle = t('referral.rules.title')
  const explorePoolsPath = '/explore/pools'

  const earnItem1 = (
    <Flex row gap="$spacing4" alignItems="center" flexWrap="wrap">
      <Text variant="body2" color="$neutral2">
        {t('referral.rules.section.earn.item1')}
      </Text>
      <StarIcon size={18} />
      <Anchor href={getInternalLinkHref(explorePoolsPath)} textDecorationLine="none">
        <Text variant="body2" color="$accent1">
          {t('common.button.view')}
        </Text>
      </Anchor>
    </Flex>
  )

  const rules = [
    {
      title: t('referral.rules.section.earn.title'),
      items: [earnItem1, t('referral.rules.section.earn.item2'), t('referral.rules.section.earn.item3')],
    },
    {
      title: t('referral.rules.section.invite.title'),
      items: [
        t('referral.rules.section.invite.item1'),
        t('referral.rules.section.invite.item2'),
        t('referral.rules.section.invite.item3'),
        t('referral.rules.section.invite.item4'),
      ],
    },
    {
      title: t('referral.rules.section.claim.title'),
      items: [
        t('referral.rules.section.claim.item1'),
        t('referral.rules.section.claim.item2'),
        t('referral.rules.section.claim.item3'),
        t('referral.rules.section.claim.item4'),
      ],
    },
  ]

  return (
    <Flex flexDirection="column" gap="$spacing32" p="$spacing16">
      <Text variant="subheading1" color="$neutral1">
        {bigTitle}
      </Text>
      {rules.map((rule) => (
        <Flex key={rule.title} flexDirection="column" gap="$spacing8">
          <Text variant="subheading1" color="$neutral1">
            {rule.title}
          </Text>
          <Flex flexDirection="column" gap="$spacing4" pl="$spacing12">
            {rule.items.map((item, index) => (
              <Flex key={`${rule.title}-${index}`} row gap="$spacing8">
                <Text variant="body2" color="$neutral1">
                  •
                </Text>
                {typeof item === 'string' ? (
                  <Text variant="body2" color="$neutral2">
                    {item}
                  </Text>
                ) : (
                  item
                )}
              </Flex>
            ))}
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}
