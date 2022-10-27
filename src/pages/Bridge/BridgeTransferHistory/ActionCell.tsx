import { rgba } from 'polished'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import useTheme from 'hooks/useTheme'

const ExternalLinkWrapper = styled.a<{ disabled: boolean }>`
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;

  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 999px;
  color: ${({ theme }) => theme.subText};
  transition: color 150ms;

  &:hover,
  &:active,
  &:focus {
    color: ${({ theme }) => theme.text};
  }

  ${({ disabled }) =>
    disabled &&
    css`
      pointer-events: none;
    `}
`

type Props = {
  url: string | undefined
}

const ActionCell: React.FC<Props> = ({ url }) => {
  const theme = useTheme()

  return (
    <WrapperActionCell>
      <ExternalLinkWrapper href={url} target="_blank" rel="noreferrer" disabled={!url}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10.0802 1.68689L10.9338 0.833333H9.72667H8C7.90948 0.833333 7.83333 0.757191 7.83333 0.666667C7.83333 0.576142 7.90948 0.5 8 0.5H11.3333C11.4239 0.5 11.5 0.576142 11.5 0.666667V4C11.5 4.09053 11.4239 4.16667 11.3333 4.16667C11.2428 4.16667 11.1667 4.09052 11.1667 4V2.27333V1.06623L10.3131 1.91978L4.22645 8.00645C4.16171 8.07118 4.05829 8.07118 3.99355 8.00645C3.92882 7.94171 3.92882 7.83829 3.99355 7.77355L10.0802 1.68689ZM2 11.1667H10C10.6428 11.1667 11.1667 10.6428 11.1667 10V6.66667C11.1667 6.57614 11.2428 6.5 11.3333 6.5C11.4239 6.5 11.5 6.57614 11.5 6.66667V10.6667C11.5 11.1239 11.1239 11.5 10.6667 11.5H1.33333C0.876142 11.5 0.5 11.1239 0.5 10.6667V1.33333C0.5 0.874513 0.871103 0.5 1.33333 0.5H5.33333C5.42386 0.5 5.5 0.576142 5.5 0.666667C5.5 0.757191 5.42386 0.833333 5.33333 0.833333H2C1.35719 0.833333 0.833333 1.35719 0.833333 2V10C0.833333 10.6428 1.35719 11.1667 2 11.1667Z"
            stroke={url ? theme.text : theme.subText}
          />
        </svg>
      </ExternalLinkWrapper>
    </WrapperActionCell>
  )
}

const WrapperActionCell = styled(Flex)`
  align-items: center;
`

export default ActionCell
