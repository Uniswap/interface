import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { Fragment, ReactNode, forwardRef } from 'react'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as ArrowDown } from 'assets/svg/arrow_down.svg'
import { ReactComponent as NftIcon } from 'assets/svg/nft_icon.svg'
import SendIcon from 'components/Icons/SendIcon'
import { NetworkLogo } from 'components/Logo'
import Row from 'components/Row'
import ContractAddress from 'components/WalletPopup/Transactions/ContractAddress'
import DeltaTokenAmount, { TokenAmountWrapper } from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import Icon from 'components/WalletPopup/Transactions/Icon'
import PendingWarning from 'components/WalletPopup/Transactions/PendingWarning'
import PoolFarmLink from 'components/WalletPopup/Transactions/PoolFarmLink'
import Status from 'components/WalletPopup/Transactions/Status'
import { isTxsPendingTooLong } from 'components/WalletPopup/Transactions/helper'
import { CancellingOrderInfo } from 'components/swapv2/LimitOrder/useCancellingOrders'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import {
  TRANSACTION_TYPE,
  TransactionDetails,
  TransactionExtraBaseInfo,
  TransactionExtraInfo1Token,
  TransactionExtraInfo2Token,
  TransactionExtraInfoHarvestFarm,
  TransactionExtraInfoStakeFarm,
} from 'state/transactions/type'
import { ExternalLink, ExternalLinkIcon } from 'theme'
import { getEtherscanLink } from 'utils'

const ItemWrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 14px 0px;
  width: 100%;
  gap: 10px;
  height: 100%;
  justify-content: space-between;
  display: flex;
  flex-direction: column;
  :last-child {
    border-bottom: none;
  }
`

const ColumGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
`

export const PrimaryText = styled(Text)`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

const DescriptionBasic = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { summary = '' } = extraInfo as TransactionExtraBaseInfo
  return <PrimaryText>{summary}</PrimaryText>
}

// ex: claim 3knc
const Description1Token = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
  // +10KNC or -10KNC
  const plus = [TRANSACTION_TYPE.KYBERDAO_CLAIM].includes(type)
  return <DeltaTokenAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={plus} />
}

//ex: +3knc -2usdt
const Description2Token = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut, tokenAddressIn, tokenAddressOut } =
    extraInfo as TransactionExtraInfo2Token

  const signTokenOut = ![
    TRANSACTION_TYPE.CLASSIC_ADD_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
    TRANSACTION_TYPE.CLASSIC_CREATE_POOL,
    TRANSACTION_TYPE.ELASTIC_CREATE_POOL,
    TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY,
  ].includes(type)

  const signTokenIn = [
    TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_COLLECT_FEE,
  ].includes(type)

  return (
    <>
      <DeltaTokenAmount
        tokenAddress={tokenAddressOut}
        symbol={tokenSymbolOut}
        amount={tokenAmountOut}
        plus={signTokenOut}
      />
      <DeltaTokenAmount
        tokenAddress={tokenAddressIn}
        symbol={tokenSymbolIn}
        amount={tokenAmountIn}
        plus={signTokenIn}
      />
    </>
  )
}

// ex: stake -3knc
const DescriptionKyberDaoStake = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
  const votingPower = extraInfo?.arbitrary?.votingPower
  const isUnstake = type === TRANSACTION_TYPE.KYBERDAO_UNSTAKE
  return (
    <>
      {isUnstake ? null : <DeltaTokenAmount symbol={t`voting power`} amount={votingPower + '%'} plus={!isUnstake} />}
      <DeltaTokenAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={isUnstake} />
    </>
  )
}

const StyledLink = styled(ExternalLink)`
  &:hover {
    text-decoration: none;
  }
`
const NftLink = ({
  nftId,
  canNavigate = true,
  type,
}: {
  nftId: string
  canNavigate?: boolean
  type: TRANSACTION_TYPE
}) => {
  const theme = useTheme()
  const plus = [TRANSACTION_TYPE.ELASTIC_WITHDRAW_LIQUIDITY, TRANSACTION_TYPE.UNSTAKE].includes(type)
  const icon = (
    <Flex alignItems={'center'} color={theme.subText} height={14}>
      <NftIcon />
      <PrimaryText>
        &nbsp;{plus ? '+' : '-'} #{nftId}
      </PrimaryText>
      &nbsp;{canNavigate && <SendIcon size={10} />}
    </Flex>
  )
  if (!canNavigate) return icon
  return (
    <StyledLink key={nftId} href={`${APP_PATHS.MY_POOLS}?nftId=${nftId}`}>
      {icon}
    </StyledLink>
  )
}

const DescriptionLiquidity = (transaction: TransactionDetails) => {
  const { nftId } = (transaction.extraInfo ?? {}) as TransactionExtraInfo2Token
  return {
    leftComponent: Description2Token(transaction),
    rightComponent: nftId ? (
      <NftLink type={transaction.type} nftId={nftId} canNavigate={false} />
    ) : (
      <PoolFarmLink transaction={transaction} />
    ),
  }
}

const DescriptionHarvestFarmReward = (transaction: TransactionDetails) => {
  const { rewards = [] } = (transaction.extraInfo ?? {}) as TransactionExtraInfoHarvestFarm
  return (
    <>
      {rewards.map(item => (
        <DeltaTokenAmount
          plus
          amount={item.tokenAmount}
          symbol={item.tokenSymbol}
          tokenAddress={item.tokenAddress}
          key={item.tokenAddress}
        />
      ))}
    </>
  )
}

const DescriptionBridge = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const {
    tokenAmountIn,
    tokenSymbolIn,
    chainIdIn = ChainId.MAINNET,
    chainIdOut = ChainId.MAINNET,
    tokenAddressIn,
  } = extraInfo as TransactionExtraInfo2Token
  const theme = useTheme()

  return {
    leftComponent: (
      <>
        <div style={{ position: 'relative' }}>
          <TokenAmountWrapper>
            <NetworkLogo chainId={chainIdIn} style={{ width: 12, height: 12 }} />
            <PrimaryText>{NETWORKS_INFO[chainIdIn].name}</PrimaryText>
          </TokenAmountWrapper>
          <ArrowDown style={{ position: 'absolute', left: 4, height: 10 }} />
        </div>
        <TokenAmountWrapper>
          <NetworkLogo chainId={chainIdOut} style={{ width: 12, height: 12 }} />
          <PrimaryText>{NETWORKS_INFO[chainIdOut].name}</PrimaryText>
        </TokenAmountWrapper>
      </>
    ),
    rightComponent: (
      <DeltaTokenAmount
        color={theme.text}
        symbol={tokenSymbolIn}
        amount={tokenAmountIn}
        tokenAddress={tokenAddressIn}
      />
    ),
  }
}

// ex: approve elastic farm, approve knc, claim 3knc
const DescriptionApproveClaim = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
  const { summary = '' } = extraInfo as TransactionExtraBaseInfo
  const plus = [TRANSACTION_TYPE.CLAIM_REWARD].includes(type)

  return summary ? (
    <PrimaryText>{summary}</PrimaryText>
  ) : (
    <DeltaTokenAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={plus} />
  )
}

const DescriptionLimitOrder = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut } = extraInfo as TransactionExtraInfo2Token
  if (!tokenAmountIn)
    return (
      <PrimaryText>
        <Trans>Cancel all orders</Trans>
      </PrimaryText>
    )
  return (
    <Row gap="4px">
      <DeltaTokenAmount symbol={tokenSymbolIn} amount={tokenAmountIn} />
      <PrimaryText>
        <Trans>to</Trans>
      </PrimaryText>
      <DeltaTokenAmount symbol={tokenSymbolOut} amount={tokenAmountOut} />
    </Row>
  )
}

const DescriptionStakeFarm = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { pairs = [] } = extraInfo as TransactionExtraInfoStakeFarm
  if (pairs?.length)
    return (
      <>
        {pairs.map(({ nftId }) => (
          <NftLink key={nftId} nftId={nftId} type={type} />
        ))}
      </>
    )
  const { tokenAmount, tokenSymbol } = extraInfo as TransactionExtraInfo1Token
  return <DeltaTokenAmount plus={type === TRANSACTION_TYPE.UNSTAKE} amount={tokenAmount} symbol={tokenSymbol} />
}

const DESCRIPTION_MAP: {
  [type in TRANSACTION_TYPE]: (
    txs: TransactionDetails,
  ) => null | JSX.Element | { leftComponent: ReactNode; rightComponent: ReactNode }
} = {
  [TRANSACTION_TYPE.ELASTIC_FORCE_WITHDRAW_LIQUIDITY]: DescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_VOTE]: DescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_DELEGATE]: DescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_UNDELEGATE]: DescriptionBasic,

  [TRANSACTION_TYPE.UNSTAKE]: DescriptionStakeFarm,
  [TRANSACTION_TYPE.STAKE]: DescriptionStakeFarm,
  [TRANSACTION_TYPE.ELASTIC_DEPOSIT_LIQUIDITY]: DescriptionStakeFarm,
  [TRANSACTION_TYPE.ELASTIC_WITHDRAW_LIQUIDITY]: DescriptionStakeFarm,

  [TRANSACTION_TYPE.KYBERDAO_CLAIM]: Description1Token,

  [TRANSACTION_TYPE.APPROVE]: DescriptionApproveClaim,
  [TRANSACTION_TYPE.CLAIM_REWARD]: DescriptionApproveClaim,

  [TRANSACTION_TYPE.KYBERDAO_STAKE]: DescriptionKyberDaoStake,
  [TRANSACTION_TYPE.KYBERDAO_UNSTAKE]: DescriptionKyberDaoStake,
  [TRANSACTION_TYPE.TRANSFER_TOKEN]: Description1Token,

  [TRANSACTION_TYPE.UNWRAP_TOKEN]: Description2Token,
  [TRANSACTION_TYPE.WRAP_TOKEN]: Description2Token,
  [TRANSACTION_TYPE.SWAP]: Description2Token,
  [TRANSACTION_TYPE.KYBERDAO_MIGRATE]: Description2Token,

  [TRANSACTION_TYPE.BRIDGE]: DescriptionBridge,
  [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER]: DescriptionLimitOrder,

  [TRANSACTION_TYPE.CLASSIC_CREATE_POOL]: DescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_CREATE_POOL]: DescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY]: DescriptionLiquidity,
  [TRANSACTION_TYPE.CLASSIC_ADD_LIQUIDITY]: DescriptionLiquidity,
  [TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY]: DescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY]: DescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY]: DescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_COLLECT_FEE]: DescriptionLiquidity,

  [TRANSACTION_TYPE.HARVEST]: DescriptionHarvestFarmReward,

  // to make sure you don't forgot setup
  [TRANSACTION_TYPE.SETUP_SOLANA_SWAP]: () => null,
}

type Prop = {
  transaction: TransactionDetails
  style: CSSProperties
  isMinimal: boolean
  cancellingOrderInfo: CancellingOrderInfo
}

export default forwardRef<HTMLDivElement, Prop>(function TransactionItem(
  { transaction, style, isMinimal, cancellingOrderInfo }: Prop,
  ref,
) {
  const { type, addedTime, hash, chainId } = transaction
  const theme = useTheme()

  const info: any = DESCRIPTION_MAP?.[type]?.(transaction)
  const leftComponent: ReactNode = info?.leftComponent !== undefined ? info?.leftComponent : info
  const rightComponent: ReactNode = info?.rightComponent
  const isStalled = isTxsPendingTooLong(transaction)

  return (
    <ItemWrapper style={style} ref={ref} data-stalled={isStalled}>
      {isStalled && <PendingWarning />}

      <Flex justifyContent="space-between" alignItems="flex-end">
        <Row gap="6px">
          {!isMinimal && (
            <Flex alignItems="center" color={theme.text}>
              <Icon txs={transaction} />
            </Flex>
          )}
          <Text color={theme.text} fontSize="14px">
            {type}
          </Text>
          <ExternalLinkIcon color={theme.subText} href={getEtherscanLink(chainId, hash, 'transaction')} />
        </Row>
        <Status transaction={transaction} cancellingOrderInfo={cancellingOrderInfo} />
      </Flex>

      <Flex justifyContent="space-between">
        <ColumGroup className="left-column">{leftComponent}</ColumGroup>
        <ColumGroup className="right-column" style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
          {rightComponent || <ContractAddress transaction={transaction} />}
          <PrimaryText>{dayjs(addedTime).format('DD/MM/YYYY HH:mm:ss')}</PrimaryText>
        </ColumGroup>
      </Flex>
    </ItemWrapper>
  )
})
