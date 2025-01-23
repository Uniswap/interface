import { MouseoverTooltip } from 'components/Tooltip'
import { Trans } from 'i18n'
// eslint-disable-next-line no-restricted-imports
import { t } from 'i18n'
import { ReactNode } from 'react'
import { Info } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap } from 'theme/styles'
import { AutoColumn } from '../Column'
import { Input as NumericalInput } from '../NumericalInput'
import { RowBetween } from '../Row'

const InputPanel = styled.div`
  ${flexColumnNoWrap};
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.surface1};
  z-index: 1;
  width: 100%;
`

const ContainerRow = styled.div<{ error: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 1.25rem;
  border: 1px solid ${({ error, theme }) => (error ? theme.critical : theme.surface3)};
  transition: border-color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')},
    color 500ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  background-color: ${({ theme }) => theme.surface1};
`

const InputContainer = styled.div`
  flex: 1;
  padding: 1rem;
`

const ErrorMessage = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.critical};
  margin-top: 8px;
  margin-left: 4px;
`

const StyledInput = styled(NumericalInput)<{ hasPostfix?: boolean }>`
  background-color: ${({ theme }) => theme.surface1};
  transition: color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  color: ${({ error, theme }) => (error ? theme.critical : theme.neutral1)};
  font-size: 1.25rem;
  font-weight: 535;
  text-align: left;
  width: 100%;
  overflow: hidden;
  padding-right: ${({ hasPostfix }) => (hasPostfix ? '0.5rem' : '0')};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 16px;
  `};

  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
  }

  padding: 0px;
  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
`

const Postfix = styled.span`
  color: ${({ theme }) => theme.neutral2};
  font-size: 1.25rem;
  font-weight: 535;
  margin-left: 0.5rem;
  user-select: none;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 16px;
  `};
`

export default function NumericalInputPanel({
  id,
  className = '',
  label,
  placeholder,
  value,
  onChange,
  isError = false,
  errorMessage,
  postfix,
  showInfo = false,
  infoTooltip = '',
}: {
  id?: string
  className?: string
  label?: ReactNode
  placeholder?: string
  value: string
  onChange: (value: string) => void
  isError?: boolean
  errorMessage?: string
  postfix?: string
  showInfo?: boolean
  infoTooltip?: string
}) {
  const theme = useTheme()

  return (
    <InputPanel id={id}>
      <ContainerRow error={isError}>
        <InputContainer>
          <AutoColumn gap="md">
            <RowBetween>
              <ThemedText.DeprecatedBlack color={theme.neutral2} fontWeight={535} fontSize={14}>
                {label ?? <Trans>Input</Trans>}
                {showInfo && infoTooltip && (
                  <MouseoverTooltip text={infoTooltip} placement="top">
                    <Info
                      size={15}
                      style={{
                        marginLeft: '4px',
                        verticalAlign: 'middle',
                        cursor: 'pointer',
                      }}
                    />
                  </MouseoverTooltip>
                )}
              </ThemedText.DeprecatedBlack>
            </RowBetween>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <StyledInput
                className={className}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                placeholder={placeholder ?? t`Enter the value`}
                error={isError}
                onUserInput={onChange}
                value={value}
                hasPostfix={!!postfix}
              />
              {postfix && <Postfix>{postfix}</Postfix>}
            </div>
          </AutoColumn>
        </InputContainer>
      </ContainerRow>
      {isError && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </InputPanel>
  )
}
