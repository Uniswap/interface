import { decodeSignature, getOrderHash } from './LoopringEIP712Schema'

const now = () => Math.round(new Date().getTime() / 1000)

const intToHex = i => {
  if (typeof i === 'string' && i.startsWith('0x')) return i
  else if (typeof i.toHexString === 'function') return i.toHexString()
  else return `0x${i.toString(16)}`
}
const hexToInt = h => parseInt(h, 16)

const strip0x = hex => hex.replace('0x', '')
const paddedLeft = (s, n) => s.padStart(n, '0')

const toOrderSignature = signature => {
  const algorithm = signature.algorithm
  const v = intToHex(signature.v)
  const { r, s } = signature
  return '0x' + algorithm + strip0x(v) + paddedLeft(strip0x(r), 64) + paddedLeft(strip0x(s), 64)
}

const addressToBytes32 = address => '0x' + paddedLeft(strip0x(address), 64)

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000000'
const FEE_COLLECTION_WALLET_ADDRESS = '0x52256ef863a713Ef349ae6E97A7E8f35785145dE'
const AUTH_ADDRESS = '0x8D7f03FdE1A626223364E592740a233b72395235'
const AUTH_PRIVATE_KEY = '1234567812345678123456781234567812345678123456781234567812345678'

export const constructLoopringOrder = (
  library,
  {
    primaryToken,
    owner,
    tokenB,
    tokenS,
    amountB,
    amountS,
    feeAmount,
    validUntil,
    transferDataS,
    broker,
    tokenRecipient
  }
) => {
  return {
    owner: owner,
    tokenRecipient: tokenRecipient || owner,
    tokenS: tokenS,
    tokenB: tokenB,
    amountS: intToHex(amountS),
    amountB: intToHex(amountB),
    validSince: intToHex(now() - 300), // 5 minutes earlier to guarantee no issues with instant-settlement
    validUntil: intToHex(validUntil || 0), // 0 = no expiration
    dualAuthAddr: AUTH_ADDRESS,
    dualAuthPrivKey: AUTH_PRIVATE_KEY,
    wallet: FEE_COLLECTION_WALLET_ADDRESS,
    feeToken: tokenB,
    feeAmount: intToHex(feeAmount),
    walletSplitPercentage: 0,
    transferDataS: transferDataS,
    trancheB: addressToBytes32(primaryToken), // denote primary token of market
    broker: broker || ZERO_ADDRESS,

    tokenTypeFee: 0, // ERC20
    tokenTypeS: 0, // ERC20
    tokenTypeB: 0, // ERC20
    allOrNone: false,
    tokenSFeePercentage: 0,
    tokenBFeePercentage: 0,
    orderInterceptor: ZERO_ADDRESS,
    trancheS: null
  }
}

export const toDolomiteOrder = (
  order,
  orderSignature,
  signatureType,
  {
    orderType,
    dependentTransaction,
    tokenB,
    tokenS,
    side,
    estimatedNumberOfFills,
    perMatchNetworkFee,
    constantNetworkFeePremium,
    position,
    isMargin,
    isOpen
  }
) => {
  const primaryToken = side.toLowerCase() === 'buy' ? tokenB : tokenS
  const primaryAmount = side.toLowerCase() === 'buy' ? order.amountB : order.amountS
  const secondaryToken = side.toLowerCase() === 'buy' ? tokenS : tokenB
  const secondaryAmount = side.toLowerCase() === 'buy' ? order.amountS : order.amountB

  const market = `${primaryToken}-${secondaryToken}`
  const orderHash = getOrderHash(order)

  const typedOrderSignature = !!orderSignature ? decodeSignature(orderSignature, signatureType) : undefined
  const signature = !!typedOrderSignature ? toOrderSignature(typedOrderSignature) : undefined

  return {
    order_hash: orderHash,
    fee_collecting_wallet_address: order.wallet,
    wallet_split_percentage: order.walletSplitPercentage,
    owner_address: order.owner,
    order_recipient_address: order.tokenRecipient,
    broker_address: order.broker === ZERO_ADDRESS ? null : order.broker,
    auth_address: order.dualAuthAddr,
    auth_private_key: order.dualAuthPrivKey,
    order_side: side.toUpperCase(),
    order_type: orderType,
    trade_type: 'SPOT',
    market: market,
    primary_padded_amount: primaryAmount,
    secondary_padded_amount: secondaryAmount,
    creation_timestamp: hexToInt(order.validSince) * 1000,
    expiration_timestamp: order.validUntil === '0x0' ? null : hexToInt(order.validUntil) * 1000,
    extra_data: order.transferDataS || null,
    ecdsa_multi_hash_signature: signature,
    fee_padded_amount: order.feeAmount,
    fee_token_address: order.feeToken,
    max_number_of_taker_matches: estimatedNumberOfFills,
    taker_gas_fee_premium_padded_amount: intToHex(constantNetworkFeePremium),
    base_taker_gas_fee_padded_amount: intToHex(perMatchNetworkFee),
    dependent_transaction_hash: dependentTransaction,
    position_id: isMargin && !isOpen ? position.id : undefined
  }
}
