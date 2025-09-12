import flowerImage from 'assets/images/flower.png'
import { downloadAppModalPageAtom, Page } from 'components/NavBar/DownloadApp/Modal'
import { useAccount } from 'hooks/useAccount'
import { useModalState } from 'hooks/useModalState'
import { useUpdateAtom } from 'jotai/utils'
import { BaseSyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useAppSelector } from 'state/hooks'
import { Flex, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { setEmbeddedWalletGraduateCardDismissed } from 'uniswap/src/features/behaviorHistory/slice'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_DAY_MS } from 'utilities/src/time/time'

// The logic for displaying the card is as follows:
// 1. Only if the user is connected to a funded embedded wallet,
// 2. Only if the user has not exported their seed phrase for the embedded wallet,
// 3. Only if the user has not explicitly dismissed the card (hit X) in the past 30 days,
// 4. Only if the user has not clicked one of the download cards in the download modal in this session
//
export function DownloadGraduatedWalletCard(): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { openModal } = useModalState(ModalName.GetTheApp)
  const setPage = useUpdateAtom(downloadAppModalPageAtom)

  const account = useAccount()
  const isEmbeddedWallet = account.connector?.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID
  const isEWBackedUp = useAppSelector((state) => state.user.isEmbeddedWalletBackedUp)
  const dismissedTimestamp = useAppSelector(
    (state) => state.uniswapBehaviorHistory.embeddedWalletGraduateCardDismissed?.[account.address ?? ''],
  )

  const isSessionDismissed = useAppSelector((state) =>
    state.application.downloadGraduatedWalletCardsDismissed.includes(account.address ?? ''),
  )

  const onPressCard = useEvent(() => {
    setPage(Page.GetApp)
    openModal()
  })

  const handleDismiss = useEvent((e: BaseSyntheticEvent) => {
    e.stopPropagation()
    dispatch(setEmbeddedWalletGraduateCardDismissed({ walletAddress: account.address ?? '' }))
  })

  // check if the dismissed timestamp is newer than 30 days
  const isPersistedDismissed = (dismissedTimestamp ?? 0) > new Date().getTime() - 30 * ONE_DAY_MS
  const showCard = isEmbeddedWallet && !isEWBackedUp && !isPersistedDismissed && !isSessionDismissed

  if (!showCard) {
    return null
  }

  return (
    <Trace logPress element={ElementName.DownloadButton}>
      <TouchableArea onPress={onPressCard}>
        <Flex
          row
          borderRadius="$rounded20"
          overflow="hidden"
          my="$spacing8"
          backgroundColor="$surface1"
          borderWidth={1}
          borderColor="$surface3"
          style={{
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.02), 0px 4px 16px -2px rgba(255, 158, 209, 0.14)',
          }}
        >
          <Flex width={60} height="100%">
            <img
              src={flowerImage}
              width="100%"
              height="100%"
              alt="flower background image"
              style={{ objectFit: 'fill', position: 'absolute' }}
            />
            <Flex
              position="absolute"
              right={0}
              height="100%"
              width={30}
              background="linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 100%)"
            />
          </Flex>
          <Flex row flex={1} py="$spacing16" px="$spacing12">
            <Flex flex={0} gap="$spacing4" pl="$spacing12">
              <Text variant="buttonLabel3" color="$neutral1">
                {t('common.downloadUniswapWallet')}
              </Text>
              <Text variant="body3" color="$neutral2">
                {t('account.downloadWallet.subtitle')}
              </Text>
            </Flex>
            <TouchableArea onPress={handleDismiss}>
              <X size="$icon.16" color="$neutral2" />
            </TouchableArea>
          </Flex>
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
