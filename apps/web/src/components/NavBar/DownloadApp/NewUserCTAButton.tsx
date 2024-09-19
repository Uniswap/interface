import {
  AccountCTAsExperimentGroup,
  useIsAccountCTAExperimentControl,
} from 'components/NavBar/accountCTAsExperimentUtils'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { Button, Text, styled } from 'ui/src'
import { Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupName } from 'uniswap/src/features/gating/hooks'
import { useTranslation } from 'uniswap/src/i18n'

const StyledButton = styled(Button, {
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

  const openModal = useOpenModal(ApplicationModal.GET_THE_APP)

  const { isControl: isSignInExperimentControl } = useIsAccountCTAExperimentControl()
  const isSignUp = useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.SignInSignUp
  const isCreateAccount =
    useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.LogInCreateAccount

  return (
    <StyledButton isSignInExperimentControl={isSignInExperimentControl} onPress={openModal}>
      <Text variant="buttonLabel3" color={isSignInExperimentControl ? '$neutral1' : 'white'} whiteSpace="nowrap">
        {isSignUp ? t('nav.signUp.button') : isCreateAccount ? t('nav.createAccount.button') : t('common.getTheApp')}
      </Text>
    </StyledButton>
  )
}
