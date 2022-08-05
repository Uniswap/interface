import React, { useContext } from 'react'
import { Box, Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import IconSuccess from 'assets/svg/notification_icon_success.svg'
import IconFailure from 'assets/svg/notification_icon_failure.svg'
import IconWarning from 'assets/svg/notification_icon_warning.svg'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { NotificationType } from 'state/application/hooks'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`
const mapIcon = {
  [NotificationType.SUCCESS]: IconSuccess,
  [NotificationType.WARNING]: IconWarning,
  [NotificationType.ERROR]: IconFailure,
}
export default function SimplePopup({
  title,
  summary,
  type = NotificationType.ERROR,
}: {
  title: string
  type?: NotificationType
  summary?: string
}) {
  const theme = useContext(ThemeContext)
  const mapColor = {
    [NotificationType.SUCCESS]: theme.primary,
    [NotificationType.WARNING]: theme.text,
    [NotificationType.ERROR]: theme.red,
  }
  return (
    <Box>
      <RowNoFlex>
        <div style={{ paddingRight: 10 }}>
          <img src={mapIcon[type]} alt="Icon" style={{ display: 'block' }} />
        </div>
        <AutoColumn gap="8px">
          <Text fontSize="16px" fontWeight={500} color={mapColor[type]}>
            {title}
          </Text>
          {summary && (
            <Text fontSize="14px" fontWeight={400} color={theme.text}>
              {summary}
            </Text>
          )}
        </AutoColumn>
      </RowNoFlex>
    </Box>
  )
}
