import { useUpdateAtom } from 'jotai/utils'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Text } from 'ui/src'
import { Person } from 'ui/src/components/icons/Person'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { showEmbeddedLoginViewAtom } from '~/components/WalletModal/EmbeddedWalletModal'
import { useModalState } from '~/hooks/useModalState'
import { useOnCompleteEmbeddedWalletLogin } from '~/hooks/useOnCompleteEmbeddedWalletLogin'
import { setCloseModal, type UnitagRateLimitSpeedbumpModalParams } from '~/state/application/reducer'
import { useAppSelector } from '~/state/hooks'

/**
 * Shown when a unitag claim hits a rate limit during embedded wallet creation.
 * The wallet is already created on-chain but not yet signed in — the user picks
 * between continuing with the new wallet (no username) or logging in to an
 * existing account.
 */
export function UnitagRateLimitSpeedbumpModal(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isOpen } = useModalState(ModalName.UnitagRateLimitSpeedbump)
  const accountDrawer = useAccountDrawer()
  const setShowLoginView = useUpdateAtom(showEmbeddedLoginViewAtom)
  const onCompleteLogin = useOnCompleteEmbeddedWalletLogin()

  const initialState = useAppSelector(
    (state) => (state.application.openModal as UnitagRateLimitSpeedbumpModalParams | null)?.initialState,
  )

  const closeSpeedbump = useEvent(() => {
    dispatch(setCloseModal(ModalName.UnitagRateLimitSpeedbump))
  })

  const handleContinue = useEvent(async () => {
    closeSpeedbump()
    if (!initialState) {
      return
    }
    await onCompleteLogin({
      walletAddress: initialState.walletAddress,
      walletId: initialState.walletId,
      exported: initialState.exported,
      isCreate: true,
    })
  })

  const handleLogInToExisting = useEvent(() => {
    closeSpeedbump()
    setShowLoginView(true)
    accountDrawer.open()
  })

  return (
    <Dialog
      isOpen={isOpen}
      onClose={closeSpeedbump}
      icon={<Person color="$neutral1" size="$icon.24" />}
      iconBackgroundColor="$surface3"
      title={t('unitags.claim.error.rateLimit.title')}
      subtext={
        <Text variant="body3" color="$neutral2" textAlign="center">
          <Trans
            i18nKey="unitags.claim.error.rateLimit.body"
            components={{
              logInLink: (
                <Text
                  tag="span"
                  fontWeight="$medium"
                  color="$neutral1"
                  cursor="pointer"
                  hoverStyle={{ opacity: 0.7 }}
                  onPress={handleLogInToExisting}
                />
              ),
            }}
          />
        </Text>
      }
      modalName={ModalName.UnitagRateLimitSpeedbump}
      primaryButton={{
        text: t('common.button.continue'),
        onPress: handleContinue,
        emphasis: 'primary',
      }}
      secondaryButton={{
        text: t('common.button.close'),
        onPress: closeSpeedbump,
        emphasis: 'secondary',
      }}
      displayHelpCTA
    />
  )
}
