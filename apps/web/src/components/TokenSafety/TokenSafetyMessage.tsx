import { displayWarningLabel, getWarningCopy, TOKEN_SAFETY_ARTICLE, Warning } from 'constants/deprecatedTokenSafety'
import { useTokenWarningColor, useTokenWarningTextColor } from 'hooks/useTokenWarningColor'
import styled from 'lib/styled-components'
import { AlertTriangle, Slash } from 'react-feather'
import { Text } from 'rebass'
import { ExternalLink } from 'theme/components'
import { Trans } from 'uniswap/src/i18n'

const Label = styled.div<{ color: string; backgroundColor: string }>`
  width: 100%;
  padding: 12px 20px 16px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.surface3};
  color: ${({ color }) => color};
`

const TitleRow = styled.div`
  align-items: center;
  font-weight: 535;
  display: inline-flex;
`

const Title = styled(Text)`
  font-weight: 535;
  font-size: 16px;
  line-height: 24px;
  margin-left: 7px;
`

const DetailsRow = styled.div`
  margin-top: 8px;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.neutral2};
`

const StyledLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.neutral1};
  font-weight: 535;
`

type TokenSafetyMessageProps = {
  warning: Warning
  tokenAddress: string
  plural?: boolean
  tokenSymbol?: string
}

export default function TokenSafetyMessage({
  warning,
  tokenAddress,
  plural = false,
  tokenSymbol,
}: TokenSafetyMessageProps) {
  const backgroundColor = useTokenWarningColor(warning.level)
  const textColor = useTokenWarningTextColor(warning.level)
  const { heading, description } = getWarningCopy(warning, plural, tokenSymbol)

  return (
    <Label color={textColor} backgroundColor={backgroundColor}>
      {displayWarningLabel(warning) && (
        <TitleRow data-cy="token-safety-message">
          {warning.canProceed ? <AlertTriangle size="16px" /> : <Slash size="16px" />}
          <Title marginLeft="7px">{warning.message}</Title>
        </TitleRow>
      )}

      <DetailsRow data-cy="token-safety-description">
        {heading}
        {Boolean(heading) && ' '}
        {description}
        {Boolean(description) && ' '}
        {tokenAddress && (
          <StyledLink href={TOKEN_SAFETY_ARTICLE}>
            <Trans i18nKey="common.button.learn" />
          </StyledLink>
        )}
      </DetailsRow>
    </Label>
  )
}
