import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { UnitagClaimRoutes } from 'src/app/navigation/constants'
import { focusOrCreateUnitagTab } from 'src/app/navigation/utils'
import { Button, Flex, Text } from 'ui/src'
import { Person } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { OnboardingCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { shortenAddress } from 'utilities/src/addresses'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { CardType, IntroCard, IntroCardGraphicType } from 'wallet/src/components/introCards/IntroCard'
import { UNITAG_SUFFIX_NO_LEADING_DOT } from 'wallet/src/features/unitags/constants'
import { useCanActiveAddressClaimUnitag } from 'wallet/src/features/unitags/hooks'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

type EditLabelModalProps = {
  isOpen: boolean
  address: Address
  onClose: () => void
}

export function EditLabelModal({ isOpen, address, onClose }: EditLabelModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const displayName = useDisplayName(address)
  const defaultText = displayName?.type === DisplayNameType.Local ? displayName.name : ''

  const [inputText, setInputText] = useState<string>(defaultText)
  const [isfocused, setIsFocused] = useState(false)

  const { canClaimUnitag } = useCanActiveAddressClaimUnitag(address)
  const unitagsClaimEnabled = useFeatureFlag(FeatureFlags.ExtensionClaimUnitag)

  const onConfirm = useCallback(async () => {
    await dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Rename,
        address,
        newName: inputText,
      }),
    )
    onClose()
  }, [address, dispatch, inputText, onClose])

  const navigateToUnitagClaim = useCallback(async () => {
    await focusOrCreateUnitagTab(address, UnitagClaimRoutes.ClaimIntro)
  }, [address])

  const unitagClaimCard = (
    <IntroCard
      loggingName={OnboardingCardLoggingName.ClaimUnitag}
      graphic={{ type: IntroCardGraphicType.Icon, Icon: Person }}
      title={t('onboarding.home.intro.unitag.title', {
        unitagDomain: UNITAG_SUFFIX_NO_LEADING_DOT,
      })}
      description={t('onboarding.home.intro.unitag.description')}
      cardType={CardType.Default}
      containerProps={{
        borderWidth: 0,
        backgroundColor: '$surface1',
      }}
      onPress={navigateToUnitagClaim}
    />
  )

  return (
    <Modal
      isModalOpen={isOpen}
      name={ModalName.AccountEditLabel}
      bottomAttachment={canClaimUnitag && unitagsClaimEnabled ? unitagClaimCard : undefined}
      onClose={onClose}
    >
      <Flex centered fill borderRadius="$rounded16" gap="$spacing24" mt="$spacing16">
        <Flex centered gap="$spacing12" width="100%">
          <AccountIcon address={address} size={iconSizes.icon48} />
          <Flex borderColor="$surface3" borderRadius="$rounded16" borderWidth="$spacing1" width="100%">
            <TextInput
              autoFocus
              borderRadius="$rounded16"
              placeholder={isfocused ? '' : t('account.wallet.edit.label.input.placeholder')}
              textAlign="center"
              value={inputText}
              width="100%"
              onBlur={() => setIsFocused(false)}
              onChangeText={setInputText}
              onFocus={() => setIsFocused(true)}
            />
          </Flex>
          <Text color="$neutral3" variant="body2">
            {shortenAddress(address)}
          </Text>
        </Flex>
        <Flex centered fill row gap="$spacing12" justifyContent="space-between" width="100%">
          <Button color="$neutral1" flex={1} flexBasis={1} size="small" theme="secondary" onPress={onClose}>
            {t('common.button.cancel')}
          </Button>
          <Button flex={1} flexBasis={1} size="small" theme="accentSecondary" onPress={onConfirm}>
            {t('common.button.save')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
