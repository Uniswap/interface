import { Box, Text } from 'ink'
import type { ReactNode } from 'react'

interface FormFieldProps {
  children: ReactNode
  focused?: boolean
  helpText?: string
  marginLeft?: number
}

/**
 * Wrapper component for form fields that provides consistent styling
 * and focus handling. Composable with Toggle, TextInput, NumberInput, etc.
 */
export function FormField({ children, focused, helpText, marginLeft = 0 }: FormFieldProps): JSX.Element {
  return (
    <Box flexDirection="column" marginLeft={marginLeft}>
      {children}
      {helpText && focused && (
        <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="gray">
          <Text color="gray">{helpText}</Text>
        </Box>
      )}
    </Box>
  )
}
