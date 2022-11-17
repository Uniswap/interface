import { OpacityHoverState } from 'components/Common'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import Modal from '../Modal'

const Body = styled.div`
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 28px;
  padding-bottom: 20px;
`

const LinkWrap = styled(Link)`
  text-decoration: none;
  ${OpacityHoverState}
`

const AirdropModal = ({ isOpen }: { isOpen: boolean }) => {
  return (
    <Modal
      isOpen={isOpen}
      onDismiss={() => {
        console.log('hi')
      }}
      maxHeight={90}
    >
      <Body>
        <ThemedText.BodyBodySmall marginBottom="28px">
          As a long time supporter of Genie you’ve been awarded 300 USDC tokens. Read more about Uniswap NFT.
        </ThemedText.BodyBodySmall>
        <LinkWrap to="www.google.com">
          <ThemedText.Link>Read more about Uniswap NFT</ThemedText.Link>
        </LinkWrap>
      </Body>
    </Modal>
  )
}

export default AirdropModal
