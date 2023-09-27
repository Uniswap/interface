import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { TransferScreen, useTransferContext } from 'src/app/features/transfer/TransferContext'
import { AppRoutes } from 'src/app/navigation/constants'
import { Button, Flex } from 'ui/src'
import { AmountSelector } from './AmountSelector'
import { RecipientSelector } from './RecipientSelector'
import { TokenSelector } from './TokenSelector'

export function SendFormScreen(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Flex grow gap="$spacing24">
      <Flex centered row>
        <ScreenHeader title={t('Send')} onBackClick={(): void => navigate(`/${AppRoutes.Home}`)} />
      </Flex>

      <Flex row borderBottomColor="$neutral3" borderBottomWidth={1} pb="$spacing16">
        <RecipientSelector />
      </Flex>

      <Flex centered fill row>
        <AmountSelector />
      </Flex>

      <Flex centered row>
        <TokenSelector />
      </Flex>

      <Flex centered row>
        <ReviewButton />
      </Flex>
    </Flex>
  )
}

function ReviewButton(): JSX.Element {
  const { t } = useTranslation()
  const { setScreen } = useTransferContext()

  return (
    <Button theme="primary" width="100%" onPress={(): void => setScreen(TransferScreen.SendReview)}>
      {t('Review Send')}
    </Button>
  )
}
