import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { AutoRow, RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`
const TextWrapper = styled(Text)`
  & b {
    font-weight: 500;
    color: ${({ theme }) => theme.text};
  }
`
export default function VoteConfirmModal({
  isShow,
  toggle,
  options,
  title,
  onVoteConfirm,
}: {
  isShow: boolean
  toggle: () => void
  options: string
  title: string
  onVoteConfirm: () => void
}) {
  const theme = useTheme()
  return (
    <Modal isOpen={isShow} onDismiss={toggle}>
      <Wrapper>
        <RowBetween>
          <AutoRow gap="2px">
            <Text fontSize={20}>
              <Trans>Vote</Trans>
            </Text>
          </AutoRow>
          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggle}>
            <X onClick={toggle} size={20} color={theme.subText} />
          </Flex>
        </RowBetween>
        <TextWrapper fontSize={16} lineHeight="24px" color={theme.subText}>
          <Trans>
            You are voting for <b>{options}</b> on <b>{title}</b> with your KIP voting power
          </Trans>
        </TextWrapper>
        <ButtonPrimary onClick={onVoteConfirm}>Vote</ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}
