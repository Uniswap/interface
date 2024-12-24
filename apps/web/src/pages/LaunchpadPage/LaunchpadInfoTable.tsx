import { HideScrollBarStyles } from 'components/Common'
import { LoadingBubble } from 'components/Tokens/loading'
import { ReactNode } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

const Table = styled.table`
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  width: 100%;
  overflow: hidden;
`

export const Thead = styled.thead`
  overflow: auto;
  width: unset;
  background: ${({ theme }) => theme.surface2};
  ${HideScrollBarStyles}
  overscroll-behavior: none;
`

const TR = styled.tr`
  width: 100%;

  &:last-child {
    border-bottom: none;
  }
`

const TD = styled.td`
  border: ${({ theme }) => `1px solid ${theme.surface3}`};
  color: ${({ theme }) => theme.neutral2};
  padding: 10px 16px;
  text-align: left;
  vertical-align: middle;
  font-weight: 485;
  font-size: 16px;
`

const LoadingCell = styled(LoadingBubble)`
  height: 20px;
  width: 80px;
`

const SimpleTable = ({ children }: { children: ReactNode }) => {
  return (
    <Table>
      <tbody>{children}</tbody>
    </Table>
  )
}

const LoadingSimpleTableRow = ({ cellCount }: { cellCount: number }) => {
  return (
    <TR>
      {Array(cellCount)
        .fill(null)
        .map((_, index) => {
          return (
            <TD key={index}>
              <LoadingCell />
            </TD>
          )
        })}
    </TR>
  )
}

const LaunchpadInfoTable = ({ data, loadingRowCount = 3 }: { data?: ReactNode[][]; loadingRowCount?: number }) => {
  return data ? (
    <SimpleTable>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Tokens Offered</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">10 000 000 ACME</ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Initial Circulating Supply</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">20 000 000 ACME</ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Total Token Supply</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">100 000 000 ACME</ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Launchpad Price</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">1 ACME = 0.01 CELO</ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Listing Price</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">1 ACME = 0.015 CELO</ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Target (Hard Cap)</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">100 000 CELO</ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Soft Cap</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">10 000 CELO</ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Liquidity Action</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">Liquidty will be locked for 3 months</ThemedText.BodyPrimary>
        </TD>
      </TR>
    </SimpleTable>
  ) : (
    <SimpleTable>
      {Array(loadingRowCount)
        .fill(null)
        .map((_, index) => {
          return <LoadingSimpleTableRow key={index} cellCount={2} />
        })}
    </SimpleTable>
  )
}

export default LaunchpadInfoTable
