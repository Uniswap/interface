import React from 'react'
import { Text, Flex } from 'rebass'
import { Trans } from '@lingui/macro'
import { ChevronDown } from 'react-feather'

import { ExternalLink } from 'theme'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Facebook from 'components/Icons/Facebook'
import Reddit from 'components/Icons/Reddit'
import ModalCommunity from 'components/ModalCommunity'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'

import { FieldName, FieldValue } from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import useTheme from 'hooks/useTheme'

type Props = {
  socialURLs: Record<string, string>
}

const CommunityRowOnMobile: React.FC<Props> = ({ socialURLs }) => {
  const theme = useTheme()
  const firstURLType = Object.keys(socialURLs)[0]
  const firstURL = socialURLs[firstURLType]

  const toggleCommunityModal = useToggleModal(ApplicationModal.COMMUNITY)

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <FieldName onClick={toggleCommunityModal}>
          <Trans>Community</Trans>
          <ChevronDown size={16} style={{ marginLeft: '4px' }} />
        </FieldName>
        <FieldValue as={ExternalLink} target="_blank" href={firstURL} style={{ textTransform: 'capitalize' }}>
          <Flex mr="4px" alignItems="center" width="fit-content">
            {firstURLType === 'twitter' ? (
              <TwitterIcon width={16} height={16} color={theme.text} />
            ) : firstURLType === 'facebook' ? (
              <Facebook size={16} color={theme.text} />
            ) : firstURLType === 'reddit' ? (
              <Reddit size={16} color={theme.text} />
            ) : null}
          </Flex>
          <Text>{firstURLType} ↗</Text>
        </FieldValue>
      </Flex>

      <ModalCommunity communities={socialURLs} />
    </>
  )
}

export default CommunityRowOnMobile
