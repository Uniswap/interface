import { Warning } from 'constants/deprecatedTokenSafety'
import { AlertTriangle, Slash } from 'react-feather'
import { Flex, styled, useSporeColors } from 'ui/src'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

const WarningContainer = styled(Flex, {
  ml: '$spacing4',
  justifyContent: 'center',
})

export default function TokenSafetyIcon({ warning }: { warning?: Warning }) {
  const colors = useSporeColors()
  switch (warning?.level) {
    case SafetyLevel.Blocked:
      return (
        <WarningContainer>
          <Slash data-cy="blocked-icon" size={16} strokeWidth={2.5} color={colors.neutral2.val} />
        </WarningContainer>
      )
    case SafetyLevel.StrongWarning:
      return (
        <WarningContainer>
          <AlertTriangle size={16} color={colors.neutral3.val} />
        </WarningContainer>
      )
    default:
      return null
  }
}
