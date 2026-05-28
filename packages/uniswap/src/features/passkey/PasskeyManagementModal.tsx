import { isWebPlatform } from '@universe/environment'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { AppleLogo } from 'ui/src/components/icons/AppleLogo'
import { Envelope } from 'ui/src/components/icons/Envelope'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { openUri } from 'uniswap/src/utils/linking'

type PasskeyManagementModalProps = {
  isOpen: boolean
  onClose: () => void
  address?: Address
}

export type PasskeyManagementModalState = Omit<PasskeyManagementModalProps, 'onClose' | 'isOpen'>

function IconCard({
  rotate,
  zIndex,
  children,
}: {
  rotate?: string
  zIndex?: number
  children: React.ReactNode
}): JSX.Element {
  return (
    <Flex
      centered
      width={48}
      height={48}
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded12"
      borderWidth={1}
      rotate={rotate}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 6 }}
      shadowOpacity={0.08}
      shadowRadius={12}
      zIndex={zIndex}
    >
      {children}
    </Flex>
  )
}

function IconTrio(): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="center" mb="$spacing4">
      <Flex mr={-10}>
        <IconCard rotate="-8.92deg">
          <Envelope size="$icon.24" />
        </IconCard>
      </Flex>
      <IconCard zIndex={1}>
        <Passkey color="$accent1" size="$icon.24" />
      </IconCard>
      <Flex ml={-10}>
        <IconCard rotate="12.41deg">
          <AppleLogo color="$neutral1" size="$icon.24" />
        </IconCard>
      </Flex>
    </Flex>
  )
}

export function PasskeyManagementModal({ isOpen, onClose, address }: PasskeyManagementModalProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const passkeyManagementUrl = new URL(uniswapUrls.passkeysManagementUrl)

  const launchPasskeyManagement = async (): Promise<void> => {
    await openUri({ uri: passkeyManagementUrl.toString() + (address ? `/${address}` : '') })
    onClose()
  }

  return (
    <Modal
      backgroundColor={colors.surface1.val}
      isDismissible={true}
      isModalOpen={isOpen}
      name={ModalName.PasskeyManagement}
      onClose={onClose}
    >
      <Flex
        centered
        gap="$spacing16"
        pb={isWebPlatform ? '$none' : '$spacing24'}
        pt={isWebPlatform ? '$spacing20' : '$spacing12'}
        px={isWebPlatform ? '$none' : '$spacing24'}
      >
        <IconTrio />

        <Flex gap="$spacing8">
          <Text textAlign="center" variant="subheading1">
            {t('passkeys.manage.modal.title')}
          </Text>

          <Text color="$neutral2" textAlign="center" variant="body3">
            <Trans
              components={{
                highlightLink: <Text color="$accent1" variant="buttonLabel3" onPress={launchPasskeyManagement} />,
              }}
              i18nKey="passkeys.manage.modal.subtitle"
              values={{
                passkeyManagementUrl: passkeyManagementUrl.hostname + passkeyManagementUrl.pathname,
              }}
            />
          </Text>
        </Flex>

        <Flex row alignSelf="stretch" pt="$spacing8">
          <Trace logPress element={ElementName.Continue} modal={ModalName.PasskeyManagement}>
            <Button
              fill
              icon={<ExternalLink color="$neutral1" size="$icon.20" />}
              iconPosition="after"
              testID={ElementName.Continue}
              emphasis="secondary"
              onPress={launchPasskeyManagement}
            >
              {t('common.button.continue')}
            </Button>
          </Trace>
        </Flex>
      </Flex>
    </Modal>
  )
}
