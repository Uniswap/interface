import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Facebook from 'components/Icons/Facebook'
import Reddit from 'components/Icons/Reddit'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'

const ModalCommunity = ({ communities }: { communities: { [p: string]: string } }) => {
  const isCommunityModalOpen = useModalOpen(ApplicationModal.COMMUNITY)
  const toggleCommunityModal = useToggleModal(ApplicationModal.COMMUNITY)

  const communityNames = Object.keys(communities)
  const communityUrls = Object.values(communities)

  const theme = useTheme()

  return (
    <Modal isOpen={isCommunityModalOpen} onDismiss={toggleCommunityModal}>
      <Container>
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontWeight={500}>
            <Trans>Community</Trans>
          </Text>
          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleCommunityModal}>
            <X size={20} color={theme.subText} />
          </Flex>
        </Flex>
        <CommunityContainer>
          {communityNames.map((name, index) => (
            <Flex key={name} alignItems="center" as={ExternalLink} target="_blank" href={communityUrls[index]}>
              {name === 'twitter' ? (
                <TwitterIcon width={16} height={16} color={theme.text} />
              ) : name === 'facebook' ? (
                <Facebook size={16} color={theme.text} />
              ) : name === 'reddit' ? (
                <Reddit size={16} color={theme.text} />
              ) : null}
              <Text
                fontSize="14px"
                fontWeight={500}
                style={{ textTransform: 'capitalize', marginLeft: '4px' }}
                color={theme.text}
              >
                {name} ↗
              </Text>
            </Flex>
          ))}
        </CommunityContainer>
      </Container>
    </Modal>
  )
}

export default ModalCommunity

const Container = styled.div`
  width: 100%;
  padding: 24px 16px 40px;
`

const CommunityContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 28px;
  row-gap: 24px;
`
