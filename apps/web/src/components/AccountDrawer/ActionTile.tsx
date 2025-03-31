import { ButtonEmphasis, ThemeButton } from 'components/Button/DeprecatedWebButtons'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'lib/styled-components'
import { ReactNode, useReducer } from 'react'
import { Info } from 'react-feather'
import { Text } from 'rebass'
import { ExternalLink } from 'theme/components/Links'
import { ThemedText } from 'theme/components/text'
import { uniswapUrls } from 'uniswap/src/constants/urls'

import { SpinnerSVG } from 'theme/components'

const LoadingButtonSpinner = (props: React.ComponentPropsWithoutRef<'svg'>) => (
  <SpinnerSVG width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      opacity="0.1"
      d="M18.8334 10.0003C18.8334 14.6027 15.1025 18.3337 10.5001 18.3337C5.89771 18.3337 2.16675 14.6027 2.16675 10.0003C2.16675 5.39795 5.89771 1.66699 10.5001 1.66699C15.1025 1.66699 18.8334 5.39795 18.8334 10.0003ZM4.66675 10.0003C4.66675 13.222 7.27842 15.8337 10.5001 15.8337C13.7217 15.8337 16.3334 13.222 16.3334 10.0003C16.3334 6.77867 13.7217 4.16699 10.5001 4.16699C7.27842 4.16699 4.66675 6.77867 4.66675 10.0003Z"
    />
    <path d="M17.5834 10.0003C18.2738 10.0003 18.843 9.4376 18.7398 8.755C18.6392 8.0891 18.458 7.43633 18.1991 6.8113C17.7803 5.80025 17.1665 4.88159 16.3926 4.10777C15.6188 3.33395 14.7002 2.72012 13.6891 2.30133C13.0641 2.04243 12.4113 1.86121 11.7454 1.76057C11.0628 1.6574 10.5001 2.22664 10.5001 2.91699C10.5001 3.60735 11.066 4.15361 11.7405 4.30041C12.0789 4.37406 12.4109 4.47786 12.7324 4.61103C13.4401 4.90418 14.0832 5.33386 14.6249 5.87554C15.1665 6.41721 15.5962 7.06027 15.8894 7.76801C16.0225 8.08949 16.1264 8.42147 16.2 8.75986C16.3468 9.43443 16.8931 10.0003 17.5834 10.0003Z" />
  </SpinnerSVG>
)

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
      <Tile data-testid={dataTestId} emphasis={ButtonEmphasis.highSoft} onClick={onClick} disabled={disabled}>
        <Column gap="12px">
          {loading ? <StyledLoadingButtonSpinner /> : Icon}
          <ActionName>{name}</ActionName>
        </Column>
      </Tile>
      {error && (
        <ErrorContainer>
          <ErrorText>{errorMessage}</ErrorText>
          <MouseoverTooltip forceShow={showTooltip} text={errorTooltip} disabled>
            <ErrorLink
              onMouseEnter={toggleTooltip}
              onMouseLeave={toggleTooltip}
              style={{ color: 'inherit' }}
              href={uniswapUrls.helpArticleUrls.moonpayRegionalAvailability}
            >
              <StyledInfoIcon />
            </ErrorLink>
          </MouseoverTooltip>
        </ErrorContainer>
      )}
    </Container>
  )
}
