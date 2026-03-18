import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { ModalWithOverlay } from 'src/components/Requests/ModalWithOverlay/ModalWithOverlay'
import { ClientDetails } from 'src/components/Requests/RequestModal/ClientDetails'
import { WalletConnectSigningRequest } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { AddressFooter } from 'wallet/src/features/transactions/TransactionRequest/AddressFooter'

export function ActionCannotBeCompletedContent({
  request,
  onReject,
}: {
  request: WalletConnectSigningRequest
  onReject: () => void
}): JSX.Element {
  const handleLearnMore = async (): Promise<void> => {
    await openUri({ uri: uniswapUrls.helpArticleUrls.mismatchedImports })
  }

  return (
    <ModalWithOverlay
      disableConfirm
      name={ModalName.ActionCannotBeCompletedModal}
      contentContainerStyle={{
        paddingHorizontal: spacing.none,
        paddingTop: spacing.spacing8,
      }}
      onClose={onReject}
      onReject={onReject}
    >
      <ActionCannotBeCompletedModalContent request={request} onLearnMore={handleLearnMore} />
    </ModalWithOverlay>
  )
}

function ActionCannotBeCompletedModalContent({
  request,
  onLearnMore,
}: {
  request: WalletConnectSigningRequest
  onLearnMore: () => Promise<void>
}): JSX.Element {
  const { t } = useTranslation()
  const { animatedFooterHeight } = useBottomSheetInternal()
  const bottomSpacerStyle = useAnimatedStyle(() => ({
    height: animatedFooterHeight.value - spacing.spacing12,
  }))

  return (
    <Flex flex={1} justifyContent="center" px="$spacing24" gap="$spacing16">
      <Flex px="$spacing12">
        <ClientDetails request={request} />
      </Flex>
      <Flex
        backgroundColor="$statusCritical2"
        borderRadius="$rounded16"
        flexDirection="column"
        gap="$spacing12"
        p="$spacing16"
        position="relative"
        width="100%"
      >
        <Flex flexDirection="row" gap="$gap12">
          <Flex>
            <AlertTriangleFilled color="$statusCritical" size="$icon.20" />
          </Flex>
          <Flex gap="$spacing8" flexShrink={1}>
            <Text color="$statusCritical" variant="buttonLabel3">
              {t('dapp.request.actionCannotBeCompleted.title')}
            </Text>
            <Text color="$neutral2" variant="body4">
              {t('dapp.request.actionCannotBeCompleted.description')}
            </Text>
            <TouchableOpacity onPress={onLearnMore}>
              <Text color="$neutral1" variant="buttonLabel4">
                {t('common.button.learn')}
              </Text>
            </TouchableOpacity>
          </Flex>
        </Flex>
      </Flex>
      <AddressFooter activeAccountAddress={request.account} px="$spacing8" />
      <Animated.View style={bottomSpacerStyle} />
    </Flex>
  )
}
