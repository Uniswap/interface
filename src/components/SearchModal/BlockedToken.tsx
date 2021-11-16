import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import { AlertCircle, ArrowLeft } from 'react-feather'
import styled from 'styled-components/macro'
import { CloseIcon, TYPE } from 'theme'

import TokenImportCard from './TokenImportCard'

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  width: 100%;
`
const Button = styled(ButtonPrimary)`
  margin-top: 1em;
  padding: 10px 1em;
`
const Content = styled.div`
  padding: 1em;
`
const Copy = styled(TYPE.body)`
  text-align: center;
  margin: 0 2em 1em !important;
  font-weight: 400;
  font-size: 16px;
`
const Header = styled.div`
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 20px;
  width: 100%;
`
const Icon = styled(AlertCircle)`
  stroke: ${({ theme }) => theme.text2};
  width: 48px;
  height: 48px;
`
interface BlockedTokenProps {
  onBack: (() => void) | undefined
  onDismiss: (() => void) | undefined
  blockedTokens: Token[]
}

const BlockedToken = ({ onBack, onDismiss, blockedTokens }: BlockedTokenProps) => (
  <Wrapper>
    <Header>
      {onBack ? <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} /> : <div />}
      <TYPE.mediumHeader>
        <Trans>Token not supported</Trans>
      </TYPE.mediumHeader>
      {onDismiss ? <CloseIcon onClick={onDismiss} /> : <div />}
    </Header>
    <Icon />
    <Content>
      <Copy>
        <Trans>This token is not supported in the Uniswap Labs app</Trans>
      </Copy>
      <TokenImportCard token={blockedTokens[0]} />
      <Button disabled>
        <Trans>Import</Trans>
      </Button>
    </Content>
  </Wrapper>
)
export default BlockedToken
