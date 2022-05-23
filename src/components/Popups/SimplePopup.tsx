import React, { useContext } from 'react'
import { Box, Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import IconSuccess from 'assets/svg/notification_icon_success.svg'
import IconFailure from 'assets/svg/notification_icon_failure.svg'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

export default function SimplePopup({
  title,
  success = true,
  summary,
}: {
  title: string
  success?: boolean
  summary?: string
}) {
  const theme = useContext(ThemeContext)

  return (
    <Box>
      <RowNoFlex>
        <div style={{ paddingRight: 16 }}>
          {success ? (
            <img src={IconSuccess} alt="IconSuccess" style={{ display: 'block' }} />
          ) : (
            <img src={IconFailure} alt="IconFailure" style={{ display: 'block' }} />
          )}
        </div>
        <AutoColumn gap="8px">
          <Text fontSize="16px" fontWeight={500} color={success ? theme.primary : theme.red}>
            {title}
          </Text>
          <Text fontSize="14px" fontWeight={400} color={theme.text}>
            {summary}
          </Text>
        </AutoColumn>
      </RowNoFlex>
    </Box>
  )
}
