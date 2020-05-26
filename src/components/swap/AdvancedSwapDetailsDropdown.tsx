import React, { useContext } from 'react'
import { ChevronDown } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { CursorPointer } from '../../theme'
import { RowBetween } from '../Row'
import { AdvancedSwapDetails, AdvancedSwapDetailsProps } from './AdvancedSwapDetails'
import { AdvancedDropdown } from './styleds'

export default function AdvancedSwapDetailsDropdown({
  showAdvanced,
  setShowAdvanced,
  ...rest
}: Omit<AdvancedSwapDetailsProps, 'onDismiss'> & {
  showAdvanced: boolean
  setShowAdvanced: (showAdvanced: boolean) => void
}) {
  const theme = useContext(ThemeContext)
  return (
    <AdvancedDropdown>
      {showAdvanced ? (
        <AdvancedSwapDetails {...rest} onDismiss={() => setShowAdvanced(false)} />
      ) : (
        <CursorPointer>
          <RowBetween onClick={() => setShowAdvanced(true)} padding={'8px 20px'} id="show-advanced">
            <Text fontSize={16} fontWeight={500} style={{ userSelect: 'none' }}>
              Show Advanced
            </Text>
            <ChevronDown color={theme.text2} />
          </RowBetween>
        </CursorPointer>
      )}
    </AdvancedDropdown>
  )
}
