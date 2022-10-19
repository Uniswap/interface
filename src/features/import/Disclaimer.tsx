import React from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'src/components/Text'

export default function Disclaimer() {
  const { t } = useTranslation()
  return (
    <Text color="textSecondary" textAlign="center" variant="buttonLabelSmall">
      {t('By continuing, I agree to the Terms of Service and consent to the Privacy Policy.')}
    </Text>
  )
}
