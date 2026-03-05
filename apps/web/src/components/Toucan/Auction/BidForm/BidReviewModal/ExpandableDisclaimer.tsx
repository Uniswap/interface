import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'

interface ExpandableDisclaimerProps {
  className?: string
}

export function ExpandableDisclaimer({ className }: ExpandableDisclaimerProps): JSX.Element {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Flex gap="$spacing2" className={className}>
      <Text variant="body4" color="$neutral3" fontSize={10} lineHeight={12}>
        {t('toucan.helpModal.disclaimer.collapsed')}{' '}
        {isExpanded ? (
          <>{t('toucan.helpModal.disclaimer.expanded1')}</>
        ) : (
          <TouchableArea
            display="inline-flex"
            onPress={() => setIsExpanded(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text variant="body4" color="$neutral3" fontSize={10} lineHeight={12} textDecorationLine="underline">
              {t('toucan.helpModal.disclaimer.seeMore')}
            </Text>
          </TouchableArea>
        )}
      </Text>
    </Flex>
  )
}
