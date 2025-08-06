import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { ModalWithOverlay } from 'src/components/Requests/ModalWithOverlay/ModalWithOverlay'
import { RequestDetailsContent } from 'src/components/Requests/RequestModal/RequestDetails'
import { useUwuLinkContractAllowlist } from 'src/components/Requests/Uwulink/utils'
import { SignRequest } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, useIsDarkMode } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { RemoteImage } from 'uniswap/src/components/nfts/images/RemoteImage'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

type Props = {
  onClose: () => void
  onConfirm: () => void
  onReject: () => void
  request: SignRequest
}

export function KidSuperCheckinModal({ onClose, onConfirm, onReject, request }: Props): JSX.Element {
  const { t } = useTranslation()

  return (
    <ModalWithOverlay
      confirmationButtonText={t('common.button.checkin')}
      contentContainerStyle={{
        paddingHorizontal: spacing.spacing24,
        paddingTop: spacing.spacing8,
      }}
      name={ModalName.UwULinkErc20SendModal}
      scrollDownButtonText={t('walletConnect.request.button.scrollDown')}
      onClose={onClose}
      onConfirm={onConfirm}
      onReject={onReject}
    >
      <KidSuperCheckinModalContent request={request} />
    </ModalWithOverlay>
  )
}

function useUniswapCafeLogo(): string | undefined {
  const isDarkMode = useIsDarkMode()
  const uwuLinkContractAllowlist = useUwuLinkContractAllowlist()
  const logos = uwuLinkContractAllowlist.tokenRecipients.find((recipient) => recipient.name === 'Uniswap Cafe')?.logo

  if (!logos) {
    return undefined
  }

  return isDarkMode ? logos.dark : logos.light
}

function KidSuperCheckinModalContent({ request }: { request: SignRequest }): JSX.Element {
  const { animatedFooterHeight } = useBottomSheetInternal()
  const bottomSpacerStyle = useAnimatedStyle(() => ({
    height: animatedFooterHeight.value,
  }))

  const logo = useUniswapCafeLogo()

  return (
    <Flex centered gap="$spacing12" justifyContent="space-between" pb="$spacing12">
      <Flex centered gap="$spacing20">
        {logo && <RemoteImage height={50} uri={logo} width={200} />}
        <Flex
          centered
          borderColor="$surface3"
          borderRadius="$rounded20"
          borderWidth="$spacing1"
          gap="$spacing12"
          px="$spacing24"
          py="$spacing24"
        >
          <RequestDetailsContent request={request} />
        </Flex>
      </Flex>
      <Animated.View style={bottomSpacerStyle} />
    </Flex>
  )
}
