import { useIsAccountCTAExperimentControl } from 'components/NavBar/accountCTAsExperimentUtils'
import { useTranslation } from 'react-i18next'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { DeprecatedButton, Text, styled } from 'ui/src'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useExperimentGroupName, useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const StyledButton = styled(DeprecatedButton, {
  height: '40px',
  borderRadius: '$rounded20',
  borderWidth: '$spacing1',
  borderStyle: 'solid',
  alignItems: 'center',

  variants: {
    isSignInExperimentControl: {
      true: {
        backgroundColor: '$surface1',
        borderColor: '$surface3',
        hoverStyle: {
          backgroundColor: '$surface2',
        },
        pressStyle: {
          backgroundColor: '$surface2',
        },
      },
      false: {
        backgroundColor: '$accent1',
      },
    },
  },
})

export function NewUserCTAButton() {
  const { t } = useTranslation()

  const openModal = useOpenModal({ name: ApplicationModal.GET_THE_APP })

  const { isControl: isSignInExperimentControl } = useIsAccountCTAExperimentControl()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const isSignUp =
    useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.SignInSignUp ||
    isEmbeddedWalletEnabled
  const isCreateAccount =
    useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.LogInCreateAccount &&
    !isEmbeddedWalletEnabled

  return (
    <StyledButton isSignInExperimentControl={isSignInExperimentControl} onPress={openModal}>
      <Text variant="buttonLabel3" color={isSignInExperimentControl ? '$neutral1' : 'white'} whiteSpace="nowrap">
        {isSignUp ? t('nav.signUp.button') : isCreateAccount ? t('nav.createAccount.button') : t('common.getTheApp')}
      </Text>
    </StyledButton>
  )
}
