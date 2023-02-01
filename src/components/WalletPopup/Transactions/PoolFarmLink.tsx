import { Flex, Text } from 'rebass'

import { DoubleCurrencyLogoV2 } from 'components/DoubleLogo'
import SendIcon from 'components/Icons/SendIcon'
import { getTokenLogo } from 'components/WalletPopup/Transactions/helper'
import { APP_PATHS } from 'constants/index'
import { TRANSACTION_TYPE, TransactionDetails, TransactionExtraInfo2Token } from 'state/transactions/type'
import { ExternalLink } from 'theme'

const PoolFarmLink = ({ transaction }: { transaction: TransactionDetails }) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbolIn, tokenSymbolOut, tokenAddressIn, tokenAddressOut, contract } =
    extraInfo as TransactionExtraInfo2Token

  if (!contract || !(tokenSymbolIn && tokenSymbolOut)) return null

  const isFarm = [TRANSACTION_TYPE.HARVEST].includes(type)
  const isElastic = [
    TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_CREATE_POOL,
    TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_COLLECT_FEE,
    TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY,
    TRANSACTION_TYPE.HARVEST,
  ].includes(type)

  const logoUrlIn = getTokenLogo(tokenAddressIn)
  const logoUrlOut = getTokenLogo(tokenAddressOut)
  return (
    <ExternalLink
      href={`${window.location.origin}${isFarm ? APP_PATHS.FARMS : APP_PATHS.MY_POOLS}?search=${contract}&tab=${
        isElastic ? 'elastic' : 'classic'
      }`}
    >
      <Flex alignItems="center" style={{ gap: 4 }}>
        <DoubleCurrencyLogoV2 style={{ marginRight: 12 }} logoUrl1={logoUrlIn} logoUrl2={logoUrlOut} size={16} />
        <Text fontSize={12}>
          {tokenSymbolIn}/{tokenSymbolOut}
        </Text>
        <SendIcon size={10} />
      </Flex>
    </ExternalLink>
  )
}
export default PoolFarmLink
