import { Trans } from '@lingui/macro'
import { AlertTriangle } from 'react-feather'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const InstallBraveNote: React.FC = () => {
  const theme = useTheme()

  return (
    <Flex
      sx={{
        background: theme.buttonBlack,
        borderRadius: '16px',
        padding: '8px 12px',
        alignItems: 'center',
        columnGap: '8px',
        marginTop: '16px',
        minHeight: '48px',
      }}
    >
      <Flex
        sx={{
          flex: '0 0 24px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertTriangle color={theme.subText} width="16px" height="16px" />
      </Flex>

      <Text
        as="span"
        sx={{
          color: theme.subText,
          fontWeight: 400,
          fontSize: '12px',
          lineHeight: '16px',
        }}
      >
        <Trans>Brave wallet can only be used in Brave Browser. Download it</Trans>{' '}
        <ExternalLink href="https://brave.com/" style={{ color: theme.primary }}>
          <Trans>here</Trans>
        </ExternalLink>
      </Text>
    </Flex>
  )
}

export default InstallBraveNote
