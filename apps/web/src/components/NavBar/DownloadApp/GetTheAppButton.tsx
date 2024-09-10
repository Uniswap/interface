import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { Button, Flex, Text, styled } from 'ui/src'
import { Trans } from 'uniswap/src/i18n'

const StyledButton = styled(Button, {
  height: '40px',
  backgroundColor: '$surface1',
  borderRadius: '$rounded20',
  borderWidth: '$spacing1',
  borderStyle: 'solid',
  borderColor: '$surface3',
  cursor: 'pointer',
  alignItems: 'center',
  hoverStyle: {
    backgroundColor: '$surface2',
  },
  pressStyle: {
    backgroundColor: '$surface2',
  },
})

export function GetTheAppButton() {
  const openModal = useOpenModal(ApplicationModal.GET_THE_APP)

  return (
    <StyledButton onPress={openModal}>
      <Flex row gap="12px" alignItems="center">
        <Text variant="body2" lineHeight={0} whiteSpace="nowrap">
          <Trans i18nKey="common.getTheApp" />
        </Text>
      </Flex>
    </StyledButton>
  )
}
