import { Trans } from '@lingui/macro'
import { displayWarningLabel, getWarningCopy, TOKEN_SAFETY_ARTICLE, Warning } from 'constants/tokenSafety'
import { useTokenWarningColor, useTokenWarningTextColor } from 'hooks/useTokenWarningColor'
import { AlertTriangle, Slash } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'

const Label = styled.div<{ color: string; backgroundColor: string }>`
  width: 100%;
  padding: 12px 20px 16px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  color: ${({ color }) => color};
`

const TitleRow = styled.div`
  align-items: center;
  font-weight: 700;
  display: inline-flex;
`

const Title = styled(Text)`
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  margin-left: 7px;
`

const DetailsRow = styled.div`
  margin-top: 8px;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.textSecondary};
`

const StyledLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.accentAction};

  font-weight: 700;
`

type TokenSafetyMessageProps = {
  warning: Warning
  tokenAddress: string
}

export default function TokenSafetyMessage({ warning, tokenAddress }: TokenSafetyMessageProps) {
  const backgroundColor = useTokenWarningColor(warning.level)
  const textColor = useTokenWarningTextColor(warning.level)
  const { heading, description } = getWarningCopy(warning)

  return (
    <Label data-cy="token-safety-message" color={textColor} backgroundColor={backgroundColor}>
      {displayWarningLabel(warning) && (
        <TitleRow>
          {warning.canProceed ? <AlertTriangle size="16px" /> : <Slash size="16px" />}
          <Title marginLeft="7px">{warning.message}</Title>
        </TitleRow>
      )}

      <DetailsRow>
        {heading}
        {Boolean(heading) && ' '}
        {description}
        {Boolean(description) && ' '}
        {tokenAddress && (
          <StyledLink href={TOKEN_SAFETY_ARTICLE}>
            <Trans>Learn more</Trans>
          </StyledLink>
        )}
      </DetailsRow>
    </Label>
  )
}
