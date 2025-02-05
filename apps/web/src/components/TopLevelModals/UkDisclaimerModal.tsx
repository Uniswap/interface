import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button/buttons'
import Column from 'components/deprecated/Column'
import styled from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ThemedText } from 'theme/components'
import { Flex, ModalCloseIcon } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const Wrapper = styled(Column)`
  padding: 8px;
`

const ButtonContainer = styled(Column)`
  padding: 8px 12px 4px;
`

const StyledThemeButton = styled(ThemeButton)`
  width: 100%;
`

export function UkDisclaimerModal() {
  const { t } = useTranslation()
  const isOpen = useModalIsOpen(ApplicationModal.UK_DISCLAIMER)
  const closeModal = useCloseModal()

  return (
    <Modal name={ModalName.UkDisclaimer} isModalOpen={isOpen} onClose={closeModal} padding={0}>
      <Wrapper gap="md">
        <Flex alignItems="flex-end" pt="$spacing8" pb="$spacing4">
          <ModalCloseIcon onClose={closeModal} />
        </Flex>
        <Column gap="sm">
          <ThemedText.HeadlineLarge padding="0px 8px" fontSize="24px" lineHeight="32px">
            {t('search.ukDisclaimer')}
          </ThemedText.HeadlineLarge>
          <ThemedText.BodyPrimary padding="8px 8px 12px" lineHeight="24px">
            {t('notice.uk')}
          </ThemedText.BodyPrimary>
        </Column>
        <ButtonContainer gap="md">
          <StyledThemeButton size={ButtonSize.large} emphasis={ButtonEmphasis.medium} onClick={() => closeModal()}>
            {t('common.dismiss')}
          </StyledThemeButton>
        </ButtonContainer>
      </Wrapper>
    </Modal>
  )
}
