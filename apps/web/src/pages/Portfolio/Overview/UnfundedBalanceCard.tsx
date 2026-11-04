import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'
import { AddFundsOptionCards } from '~/components/emptyWallet/AddFundsOptionCards'

const ADD_FUNDS_COLUMN_WIDTH = 520

const PORTFOLIO_ELEMENT_NAMES = {
  buy: ElementName.EmptyStateBuy,
  receive: ElementName.EmptyStateReceive,
  cexTransfer: ElementName.EmptyStateCEXTransfer,
}

export function UnfundedBalanceCard(): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <Flex
      row
      gap="$spacing16"
      p="$spacing32"
      borderRadius="$rounded32"
      backgroundColor="$surface2"
      $md={{ flexDirection: 'column', gap: '$spacing24' }}
      $sm={{ p: '$spacing16', borderRadius: '$rounded24' }}
      testID={TestID.PortfolioUnfundedBalanceCard}
    >
      <Flex fill justifyContent="center" gap="$spacing16">
        <Text variant="heading1" color="$neutral3">
          {convertFiatAmountFormatted(0, NumberType.PortfolioBalance)}
        </Text>
        <Text variant="body2" color="$neutral3">
          {t('addFunds.modal.title')}
        </Text>
      </Flex>
      <Flex fill maxWidth={ADD_FUNDS_COLUMN_WIDTH} $md={{ maxWidth: '100%' }}>
        <AddFundsOptionCards elementNames={PORTFOLIO_ELEMENT_NAMES} />
      </Flex>
    </Flex>
  )
}
