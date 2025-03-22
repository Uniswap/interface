import { Page } from 'components/NavBar/DownloadApp/Modal'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import { useConnectorWithId } from 'components/WalletModal/useOrderedConnections'
import { Dispatch, SetStateAction, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCloseModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { TamaguiClickableStyle } from 'theme/components'
import { Button, Flex, Text } from 'ui/src'
import { MultiDevice } from 'ui/src/components/icons/MultiDevice'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { PasskeyFingerprint } from 'ui/src/components/icons/PasskeyFingerprint'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { createNewEmbeddedWallet } from 'uniswap/src/data/rest/embeddedWallet'
import { useConnect } from 'wagmi'

export function PasskeyGenerationModal({ setPage }: { setPage: Dispatch<SetStateAction<Page>> }) {
  const { t } = useTranslation()
  const closeModal = useCloseModal(ApplicationModal.GET_THE_APP)
  const { connect } = useConnect()
  const connector = useConnectorWithId(CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID, {
    shouldThrow: true,
  })
  const handleCreatePasskey = useCallback(async () => {
    const newWalletAddress = await createNewEmbeddedWallet()
    if (newWalletAddress) {
      // TODO[EW]: move from localstorage to context layer
      localStorage.setItem('embeddedUniswapWallet.address', newWalletAddress)
      connect({ connector })
      closeModal()
      setPage(Page.GetStarted)
    } else {
      // TODO[EW]: surface wallet creation error to user
    }
  }, [closeModal, connect, connector, setPage])
  return (
    <ModalContent title={t('onboarding.passkey.create')} logo={<Passkey size={56} pt="$spacing12" />}>
      <Flex gap="$gap16" alignItems="center">
        <Flex
          flexDirection="row"
          background="$surface2"
          borderColor="$accent2"
          py="$padding20"
          px="$spacing4"
          gap="$gap12"
          borderWidth="$spacing1"
          borderStyle="solid"
          borderRadius="$rounded20"
        >
          <Flex width="172px" gap={10}>
            <Flex flexDirection="row" gap="$gap8" alignItems="center" mx="auto">
              <PasskeyFingerprint size="$icon.16" />
              <Text variant="subheading2">{t('common.selfCustodial')}</Text>
            </Flex>
            <Text variant="body3" textAlign="center" color="$neutral2">
              {t('onboarding.passkey.account.protection')}
            </Text>
          </Flex>
          <Flex alignSelf="stretch" width={1} minWidth={1} background="$surface3" />
          <Flex width="172px" gap={10}>
            <Flex flexDirection="row" gap="$gap8" alignItems="center" mx="auto">
              <MultiDevice size="$icon.16" />
              <Text variant="subheading2">{t('common.multiDevice')}</Text>
            </Flex>
            <Text variant="body3" textAlign="center" color="$neutral2" textWrap="wrap">
              {t('onboarding.passkey.biometric.scan')}
            </Text>
          </Flex>
        </Flex>
        <Text
          mt="$spacing24"
          variant="buttonLabel3"
          color="$neutral2"
          {...TamaguiClickableStyle}
          onPress={() => setPage(Page.GetApp)}
        >
          {t('onboarding.passkey.use.recovery.phrase')}
        </Text>
        <Button variant="branded" py="$spacing16" width="100%" onPress={handleCreatePasskey}>
          <Text color="white" variant="buttonLabel1">
            {t('common.create')}
          </Text>
        </Button>
      </Flex>
    </ModalContent>
  )
}
