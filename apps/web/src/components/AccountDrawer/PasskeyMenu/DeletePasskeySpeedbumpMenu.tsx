import { GenericPasskeyMenuModal, PasskeyMenuModalState } from 'components/AccountDrawer/PasskeyMenu/PasskeyMenuModal'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'

export function DeletePasskeySpeedbumpMenu({
  show,
  setPasskeyMenuModalState,
}: {
  show: boolean
  setPasskeyMenuModalState: Dispatch<SetStateAction<PasskeyMenuModalState | undefined>>
}) {
  const { t } = useTranslation()

  return (
    <GenericPasskeyMenuModal show={show}>
      <Flex p="$gap12" borderRadius="$rounded12" backgroundColor="$statusCritical2">
        <WarningIcon color="$statusCritical" size={24} />
      </Flex>
      <Flex gap="$gap8" alignItems="center">
        <Text variant="subheading2">{t('account.passkey.delete.speedbump.title')}</Text>
        <Flex display="inline">
          <Text variant="body3" color="$neutral2">
            {t('account.passkey.delete.speedbump.description')}
          </Text>
        </Flex>
      </Flex>
      <Flex
        backgroundColor="$surface2"
        borderRadius="$rounded20"
        p="$spacing12"
        borderColor="$surface3"
        borderWidth={1}
        gap="$gap4"
      >
        <Flex row gap="$gap12">
          <Text variant="body3" color="$neutral2">
            1
          </Text>
          <Text variant="body3" color="$neutral1">
            {t('account.passkey.delete.speedbump.step1')}
          </Text>
        </Flex>
        <Flex row gap="$gap12">
          <Text variant="body3" color="$neutral2">
            2
          </Text>
          <Text variant="body3" color="$neutral1">
            {t('account.passkey.delete.speedbump.step2')}
          </Text>
        </Flex>
      </Flex>
      <Flex row alignSelf="stretch">
        <Button
          py="$padding12"
          variant="critical"
          emphasis="secondary"
          onPress={async () => {
            setPasskeyMenuModalState(PasskeyMenuModalState.DELETE_PASSKEY)
          }}
        >
          <Text variant="body3" color="$statusCritical">
            {t('common.button.continue')}
          </Text>
        </Button>
      </Flex>
    </GenericPasskeyMenuModal>
  )
}
