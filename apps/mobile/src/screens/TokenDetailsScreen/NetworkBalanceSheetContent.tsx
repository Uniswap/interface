import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
import { NetworkBalanceList } from 'src/components/TokenDetails/NetworkBalanceList'
import { Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'

const STICKY_HEADER_INDICES = [0]
const NETWORK_SHEET_CONTENT_STYLE = { paddingBottom: spacing.spacing48 }

interface NetworkBalanceSheetContentProps {
  allChainBalances: PortfolioBalance[]
  onSelectBalance: (balance: PortfolioBalance) => void
}

export function NetworkBalanceSheetContent({
  allChainBalances,
  onSelectBalance,
}: NetworkBalanceSheetContentProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <BottomSheetScrollView
      stickyHeaderIndices={STICKY_HEADER_INDICES}
      contentContainerStyle={NETWORK_SHEET_CONTENT_STYLE}
      showsVerticalScrollIndicator={false}
    >
      <Flex backgroundColor="$surface1" px="$spacing24" py="$spacing12">
        <Text variant="body1" color="$neutral1">
          {t('token.balances.chooseNetwork')}
        </Text>
      </Flex>
      <Flex px="$spacing24">
        <NetworkBalanceList balances={allChainBalances} onSelectBalance={onSelectBalance} />
      </Flex>
    </BottomSheetScrollView>
  )
}
