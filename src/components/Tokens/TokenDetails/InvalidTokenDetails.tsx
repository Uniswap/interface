import { Trans } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'

import { ReactComponent as EyeIcon } from '../../../assets/svg/eye.svg'

const InvalidDetailsContainer = styled.div`
  padding-top: 128px;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const InvalidDetailsText = styled.span`
  margin-top: 28px;
  margin-bottom: 20px;

  text-align: center;

  color: ${({ theme }) => theme.textSecondary};
  font-size: 20px;
  font-weight: 500;
  line-height: 28px;
`

const TokenExploreButton = styled.button`
  border: none;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.accentAction};
  padding: 12px 16px;

  color: ${({ theme }) => theme.textPrimary};
  font-size: 16px;
  font-weight: 600;
`

export default function InvalidTokenDetails({ chainName }: { chainName?: string }) {
  const navigate = useNavigate()
  return (
    <InvalidDetailsContainer>
      <EyeIcon />
      <InvalidDetailsText>
        {chainName ? (
          <Trans>{`This token doesn't exist on ${chainName}`}</Trans>
        ) : (
          <Trans>This token doesn&apos;t exist</Trans>
        )}
      </InvalidDetailsText>
      <TokenExploreButton onClick={() => navigate('/tokens')}>
        <Trans>Explore tokens</Trans>
      </TokenExploreButton>
    </InvalidDetailsContainer>
  )
}
