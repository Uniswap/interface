import { GenericPasskeyMenuModal } from 'components/AccountDrawer/PasskeyMenu/PasskeyMenuModal'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function VerifyPasskeyMenu({
  show,
  onVerify,
  onClose,
}: {
  show: boolean
  onVerify: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <Trace logImpression modal={ModalName.VerifyPasskey}>
      <GenericPasskeyMenuModal show={show} onClose={onClose}>
        <Flex gap="$gap16" alignItems="center" px="$padding4">
          <Flex
            p="$spacing12"
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            alignItems="center"
            justifyContent="center"
          >
            <ShieldCheck size="$icon.24" color="$neutral1" />
          </Flex>

          <Flex gap="$gap8" alignItems="center">
            <Text variant="subheading1" textAlign="center">
              {t('account.passkey.verify.title')}
            </Text>
            <Text variant="body2" textAlign="center" color="$neutral2">
              {t('account.passkey.verify.description')}
            </Text>
          </Flex>
        </Flex>
        <Flex row alignSelf="stretch">
          <Trace logPress element={ElementName.Confirm}>
            <Button variant="default" size="medium" onPress={onVerify} mt="$spacing8">
              {t('account.passkey.verify.button')}
            </Button>
          </Trace>
        </Flex>
      </GenericPasskeyMenuModal>
    </Trace>
  )
}
