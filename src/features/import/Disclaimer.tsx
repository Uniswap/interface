import React from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'src/components/Text'

export default function Disclaimer() {
  const { t } = useTranslation()
  return (
    <Text color="accentText2" textAlign="center" variant="smallLabel">
      {t('By continuing, I agree to the Terms of Service and consent to the Privacy Policy.')}
    </Text>
  )
}
