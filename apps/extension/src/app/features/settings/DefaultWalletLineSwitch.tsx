import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getIsDefaultProviderFromStorage, setIsDefaultProviderToStorage } from 'src/app/utils/provider'
import { Flex, Switch, Text } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'

export function DefaultWalletLineSwitch(): JSX.Element {
  const { t } = useTranslation()

  const [isDefaultProvider, setIsDefaultProvider] = useState(true)

  useEffect(() => {
    getIsDefaultProviderFromStorage()
      .then((newIsDefaultProvider) => setIsDefaultProvider(newIsDefaultProvider))
      .catch((e) =>
        logger.error(e, {
          tags: { file: 'DefaultWalletLineSwitch', function: 'fetchIsDefaultProvider' },
        }),
      )
  }, [])

  const handleDefaultBrowserToggle = async (isChecked: boolean): Promise<void> => {
    setIsDefaultProvider(!!isChecked)
    await setIsDefaultProviderToStorage(!!isChecked)
  }

  return (
    <Flex row gap="$spacing12" m="$spacing12">
      <Flex shrink gap="$spacing4">
        <Text variant="body2">{t('extension.settings.defaultWallet.title')}</Text>
        <Text color="$neutral2" variant="body4">
          {t('extension.settings.defaultWallet.message')}
        </Text>
      </Flex>
      <Switch checked={isDefaultProvider} variant="branded" onCheckedChange={handleDefaultBrowserToggle} />
    </Flex>
  )
}
