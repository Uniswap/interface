import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'

interface ClosedPositionsCTAProps {
  show: boolean
}

export function ClosedPositionsCTA({ show }: ClosedPositionsCTAProps) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)

  if (!show || dismissed) {
    return null
  }

  return (
    <Flex
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded12"
      mb="$spacing24"
      p="$padding12"
      gap="$gap12"
      row
      centered
    >
      <Flex height="100%">
        <InfoCircleFilled color="$neutral2" size="$icon.20" />
      </Flex>
      <Flex grow flexBasis={0}>
        <Text variant="body3" color="$neutral1">
          {t('pool.closedCTA.title')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('pool.closedCTA.description')}
        </Text>
      </Flex>
      <CloseIconWithHover onClose={() => setDismissed(true)} size="$icon.20" />
    </Flex>
  )
}
