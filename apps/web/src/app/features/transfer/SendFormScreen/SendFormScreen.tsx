import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TransferScreen, useTransferContext } from 'src/app/features/transfer/TransferContext'
import { AppRoutes } from 'src/app/navigation/constants'
import { Icons, Text } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { AmountSelector } from './AmountSelector'
import { RecipientSelector } from './RecipientSelector'
import { TokenSelector } from './TokenSelector'

export function SendFormScreen(): JSX.Element {
  return (
    <Flex grow gap="$spacing24">
      <Flex centered row>
        <Top />
      </Flex>

      <Flex row borderBottomColor="$neutral3" borderBottomWidth={1} paddingBottom="$spacing16">
        <RecipientSelector />
      </Flex>

      <Flex centered row flex={1}>
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

function Top(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Flex grow row alignItems="center">
      <Button padding="$none" onPress={(): void => navigate(`/${AppRoutes.Home}`)}>
        <Icons.BackArrow
          color="$neutral2"
          fillOpacity={1}
          height={iconSizes.icon24}
          width={iconSizes.icon24}
        />
      </Button>

      <Flex centered flex={1} marginRight={iconSizes.icon24}>
        <Text variant="bodyLarge">{t('Send')}</Text>
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
