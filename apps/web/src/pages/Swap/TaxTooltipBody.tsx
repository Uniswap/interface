import { Trans } from '@lingui/macro'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

const Divider = styled.div`
  width: 100%;
  height: 1px;
  border-width: 0;
  margin: 12px 0;
  background-color: ${({ theme }) => theme.surface3};
`

export function OutputTaxTooltipBody({ currencySymbol }: { currencySymbol?: string }) {
  return (
    <>
      <ThemedText.SubHeaderSmall color="textPrimary">
        <Trans>Exact input only</Trans>
      </ThemedText.SubHeaderSmall>
      <Divider />
      <ThemedText.LabelMicro color="textPrimary">
        {currencySymbol ? (
          <Trans>
            {currencySymbol} fees don&apos;t allow for accurate exact outputs. Use the `You pay` field instead.
          </Trans>
        ) : (
          <Trans>
            Fees on the selected output token don&apos;t allow for accurate exact outputs. Use the `You pay` field
            instead.
          </Trans>
        )}
      </ThemedText.LabelMicro>
    </>
  )
}
