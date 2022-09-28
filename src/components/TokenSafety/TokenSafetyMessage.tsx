import { Trans } from '@lingui/macro'
import { getWarningCopy, TOKEN_SAFETY_ARTICLE, Warning } from 'constants/tokenSafety'
import { useTokenWarningColor } from 'hooks/useTokenWarningColor'
import { AlertOctagon, AlertTriangle } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'
import { Color } from 'theme/styled'

const Label = styled.div<{ color: Color }>`
  width: 100%;
  padding: 12px 20px;
  background-color: ${({ color }) => color + '1F'};
  border-radius: 16px;
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
  color: ${({ theme }) => theme.textSecondary};
`

type TokenWarningMessageProps = {
  warning: Warning
  tokenAddress: string
}

export default function TokenWarningMessage({ warning, tokenAddress }: TokenWarningMessageProps) {
  const color = useTokenWarningColor(warning.level)
  const { heading, description } = getWarningCopy(warning)

  return (
    <Label color={color}>
      <TitleRow>
        {warning.canProceed ? <AlertTriangle size={'16px'} /> : <AlertOctagon size={'16px'} />}
        <Title marginLeft="7px">{warning.message}</Title>
      </TitleRow>

      <DetailsRow>
        {heading}
        {Boolean(heading) && ' '}
        {description}
        {Boolean(description) && ' '}
        {tokenAddress && (
          <ExternalLink href={TOKEN_SAFETY_ARTICLE}>
            <Trans>Learn more</Trans>
          </ExternalLink>
        )}
      </DetailsRow>
    </Label>
  )
}
