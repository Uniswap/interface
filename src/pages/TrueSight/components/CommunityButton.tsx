import React, { useRef, useState } from 'react'
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'
import { StyledAddressButton } from 'pages/TrueSight/components/AddressButton'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { OptionsContainer } from 'pages/TrueSight/styled'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const CommunityButton = ({ communityOption }: { communityOption: { [p: string]: string } }) => {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleShowOptions = () => setIsShowOptions(prev => !prev)

  const theme = useTheme()

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <StyledCommunityButton onClick={toggleShowOptions}>
        <div>
          <Trans>Community</Trans>
        </div>
        <ChevronDown size="14px" />
      </StyledCommunityButton>
      {isShowOptions && (
        <OptionsContainer>
          {Object.keys(communityOption).map(cName => (
            <Text
              key={cName}
              fontSize="12px"
              lineHeight="14px"
              fontWeight={400}
              color={theme.subText}
              as={ExternalLink}
              href={communityOption[cName]}
              target="_blank"
              style={{ textTransform: 'capitalize' }}
            >
              {cName} ↗
            </Text>
          ))}
        </OptionsContainer>
      )}
    </div>
  )
}

export default CommunityButton

export const StyledCommunityButton = styled(StyledAddressButton)`
  padding: 7px 12px;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.disableText};
  }
`
