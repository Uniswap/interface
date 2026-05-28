import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CreateNewTokenForm } from '~/pages/Liquidity/CreateAuction/components/CreateNewTokenForm'
import { ExistingTokenForm } from '~/pages/Liquidity/CreateAuction/components/ExistingTokenForm'
import { HookTile } from '~/pages/Liquidity/CreateAuction/components/HookTile'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'

export function AddTokenInfoStep() {
  const { t } = useTranslation()
  const tokenForm = useCreateAuctionStore((state) => state.tokenForm)
  const { setTokenMode } = useCreateAuctionStoreActions()

  const switchToCreateNew = () => setTokenMode(TokenMode.CREATE_NEW)
  const switchToExisting = () => setTokenMode(TokenMode.EXISTING)

  return (
    <Flex gap="$spacing16">
      <Flex row gap="$spacing12">
        <HookTile
          selected={tokenForm.mode === TokenMode.CREATE_NEW}
          title={t('toucan.createAuction.step.tokenInfo.createNew')}
          description={t('toucan.createAuction.step.tokenInfo.createNew.description')}
          onPress={switchToCreateNew}
        />
        <HookTile
          selected={tokenForm.mode === TokenMode.EXISTING}
          title={t('toucan.createAuction.step.tokenInfo.existing')}
          description={t('toucan.createAuction.step.tokenInfo.existing.description')}
          onPress={switchToExisting}
        />
      </Flex>
      <Flex
        backgroundColor="$surface1"
        borderWidth="$spacing1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        p="$spacing24"
        gap="$spacing24"
      >
        {tokenForm.mode === TokenMode.CREATE_NEW ? (
          <CreateNewTokenForm createNew={tokenForm} />
        ) : (
          <ExistingTokenForm existing={tokenForm} />
        )}
      </Flex>
    </Flex>
  )
}
