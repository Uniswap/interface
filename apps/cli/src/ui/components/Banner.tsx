import { Box, Text } from 'ink'
import Gradient from 'ink-gradient'

const BANNER_ART = `
 ██╗   ██╗███╗   ██╗██╗██╗   ██╗███████╗██████╗ ███████╗███████╗
 ██║   ██║████╗  ██║██║██║   ██║██╔════╝██╔══██╗██╔════╝██╔════╝
 ██║   ██║██╔██╗ ██║██║██║   ██║█████╗  ██████╔╝███████╗█████╗
 ██║   ██║██║╚██╗██║██║╚██╗ ██╔╝██╔══╝  ██╔══██╗╚════██║██╔══╝
 ╚██████╔╝██║ ╚████║██║ ╚████╔╝ ███████╗██║  ██║███████║███████╗ (cli)
  ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝
`

interface BannerProps {
  subtitle?: string
}

export function Banner({ subtitle }: BannerProps): JSX.Element {
  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Gradient colors={['#F50DB4', '#FC74FE', '#FDAFF0']}>{BANNER_ART}</Gradient>
      {subtitle && (
        <Box marginTop={1}>
          <Text italic color="#FC74FE">
            {subtitle}
          </Text>
        </Box>
      )}
    </Box>
  )
}
