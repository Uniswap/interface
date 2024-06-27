import { ButtonEmphasis, ButtonSize, LoadingButtonSpinner, ThemeButton } from 'components/Button'
import Column from 'components/Column'
import Row from 'components/Row'
import Tooltip from 'components/Tooltip'
import { SupportArticleURL } from 'constants/supportArticles'
import { ReactNode, useReducer } from 'react'
import { Info } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'
import { ExternalLink } from 'theme/components'
import { ThemedText } from 'theme/components/text'

const Container = styled(Column)`
  position: relative;
  height: 100%;
  width: 100%;
`
const Tile = styled(ThemeButton)`
  height: 100%;
  width: 100%;

  display: flex;
  justify-content: flex-start;
  padding: 12px;

  border-color: transparent;
  border-radius: 16px;
  border-style: solid;
  border-width: 1px;
`
const StyledLoadingButtonSpinner = styled(LoadingButtonSpinner)`
  height: 28px;
  width: 28px;
  fill: ${({ theme }) => theme.accent1};
`
const ActionName = styled(Text)`
  font-size: 16px;
  font-style: normal;
  font-weight: 535;
  line-height: 24px;
`
const ErrorContainer = styled(Row)`
  width: 100%;
  position: absolute;
  bottom: -24px;
  display: flex;
  justify-content: center;
  align-items: center;
`
const ErrorText = styled(ThemedText.LabelMicro)`
  color: ${({ theme }) => theme.neutral2};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`
const ErrorLink = styled(ExternalLink)`
  align-items: center;
  display: flex;
  height: 14px;
  justify-content: center;
  margin-left: 6px;
  width: 14px;
`
const StyledInfoIcon = styled(Info)`
  height: 12px;
  width: 12px;
  flex: 1 1 auto;
  stroke: ${({ theme }) => theme.neutral2};
`
export function ActionTile({
  dataTestId,
  Icon,
  name,
  onClick,
  loading,
  disabled,
  error,
  errorMessage,
  errorTooltip,
}: {
  dataTestId: string
  Icon: ReactNode
  name: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  errorTooltip?: string
}) {
  const [showTooltip, toggleTooltip] = useReducer((isOpen) => !isOpen, false)

  return (
    <Container>
      <Tile
        data-testid={dataTestId}
        size={ButtonSize.medium}
        emphasis={ButtonEmphasis.highSoft}
        onClick={onClick}
        disabled={disabled}
      >
        <Column gap="12px">
          {loading ? <StyledLoadingButtonSpinner /> : Icon}
          <ActionName>{name}</ActionName>
        </Column>
      </Tile>
      {error && (
        <ErrorContainer>
          <ErrorText>{errorMessage}</ErrorText>
          <Tooltip show={showTooltip} text={errorTooltip}>
            <ErrorLink
              onMouseEnter={toggleTooltip}
              onMouseLeave={toggleTooltip}
              style={{ color: 'inherit' }}
              href={SupportArticleURL.MOONPAY_REGIONAL_AVAILABILITY}
            >
              <StyledInfoIcon />
            </ErrorLink>
          </Tooltip>
        </ErrorContainer>
      )}
    </Container>
  )
}
