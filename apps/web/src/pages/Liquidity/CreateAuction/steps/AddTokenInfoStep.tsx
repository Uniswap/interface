import { useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { CreateNewTokenForm } from '~/pages/Liquidity/CreateAuction/components/CreateNewTokenForm'
import { ExistingTokenForm } from '~/pages/Liquidity/CreateAuction/components/ExistingTokenForm'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

const HookTileContainer = styled(Flex, {
  flex: 1,
  p: '$spacing12',
  gap: '$spacing8',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
  ...ClickableTamaguiStyle,
})

function HookTile({
  selected,
  title,
  description,
  onPress,
}: {
  selected: boolean
  title: string
  description: string
  onPress: () => void
}) {
  return (
    <HookTileContainer onPress={onPress} background={selected ? '$surface3' : '$surface1'}>
      <Flex row gap="$spacing8" justifyContent="space-between" alignItems="center">
        <Text variant="buttonLabel3">{title}</Text>
        {selected && <CheckCircleFilled size="$icon.16" />}
      </Flex>
      <Text variant="body4" color="$neutral2">
        {description}
      </Text>
    </HookTileContainer>
  )
}

export function AddTokenInfoStep() {
  const { t } = useTranslation()
  const tokenForm = useCreateAuctionStore((state) => state.tokenForm)
  const { setTokenMode } = useCreateAuctionStoreActions()

  const isCreateNew = tokenForm.mode === TokenMode.CREATE_NEW

  const switchToCreateNew = () => setTokenMode(TokenMode.CREATE_NEW)
  const switchToExisting = () => setTokenMode(TokenMode.EXISTING)

  return (
    <Flex gap="$spacing16">
      <Flex row gap="$spacing12">
        <HookTile
          selected={isCreateNew}
          title={t('toucan.createAuction.step.tokenInfo.createNew')}
          description={t('toucan.createAuction.step.tokenInfo.createNew.description')}
          onPress={switchToCreateNew}
        />
        <HookTile
          selected={!isCreateNew}
          title={t('toucan.createAuction.step.tokenInfo.existing')}
          description={t('toucan.createAuction.step.tokenInfo.existing.description')}
          onPress={switchToExisting}
        />
      </Flex>
      <Flex
        backgroundColor="$surface1"
        borderWidth={1}
        borderColor="$surface3"
        borderRadius="$rounded20"
        p="$spacing24"
        gap="$spacing24"
      >
        {isCreateNew ? (
          <CreateNewTokenForm createNew={tokenForm.createNew} />
        ) : (
          <ExistingTokenForm existing={tokenForm.existing} />
        )}
      </Flex>
    </Flex>
  )
}
