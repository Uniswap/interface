import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button } from 'ui/src'
import { EmptyPoolsIcon } from 'ui/src/components/icons/EmptyPoolsIcon'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'

export function EmptyPools({
  onNavigateClick,
  hasSolanaAndEVMWalletsConnected,
}: {
  onNavigateClick?: () => void
  hasSolanaAndEVMWalletsConnected?: boolean
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const actionButtonClick = useCallback(() => {
    onNavigateClick?.()
    navigate('/positions')
  }, [navigate, onNavigateClick])

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      height="100%"
      width="100%"
      paddingLeft="$spacing32"
      paddingRight="$spacing32"
      $sm={{ paddingTop: '$spacing8' }}
    >
      <EmptyPoolsIcon size={115} />
      <Text variant="subheading1" textAlign="center" marginTop="$spacing12">
        {t('nft.noPools')}
      </Text>
      <Text
        variant="body2"
        textAlign="center"
        marginTop="$spacing8"
        color="$neutral2"
        $platform-web={{ textWrap: 'pretty' }}
      >
        {hasSolanaAndEVMWalletsConnected ? t('pool.openToStart.evmAndSolanaConnected') : t('pool.openToStart.evmOnly')}
      </Text>
      <Flex marginTop="$spacing20" row>
        <Button variant="branded" onPress={actionButtonClick} size="small">
          {t('pool.newPosition.plus')}
        </Button>
      </Flex>
    </Flex>
  )
}
