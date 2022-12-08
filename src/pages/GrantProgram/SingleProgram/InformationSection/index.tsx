import { Flex } from 'rebass'
import styled from 'styled-components'

import HourGlass from 'assets/images/hourglass.png'

import { HeaderText } from '../../styleds'
import Details from './Details'

const ImageWrapper = styled.div`
  ${({ theme }) => theme.mediaWidth.upToMedium`
      order: 1;
  `}
`

const StyledImage = styled.img`
  width: 100%;
  height: auto;
  margin-top: -150px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin-top: 0;
  `}
`

export type Props = {
  rules?: string
  terms?: string
  faq?: string
}

const InformationSection: React.FC<Props> = props => {
  return (
    <Flex
      width="100%"
      flexDirection="column"
      alignItems="center"
      marginTop="160px"
      sx={{
        gap: '48px',
      }}
    >
      <HeaderText>Information</HeaderText>

      <Flex
        sx={{
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
          minHeight: '540px',
        }}
      >
        <ImageWrapper>
          <StyledImage alt="reward" src={HourGlass} />
        </ImageWrapper>

        <Details {...props} />
      </Flex>
    </Flex>
  )
}

export default InformationSection
