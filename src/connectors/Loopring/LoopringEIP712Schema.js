import { TypedDataUtils } from 'eth-sig-util'

export const DOMAIN_SCHEMA = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' }
]

export const ORDER_SCHEMA = [
  { name: 'amountS', type: 'uint' },
  { name: 'amountB', type: 'uint' },
  { name: 'feeAmount', type: 'uint' },
  { name: 'validSince', type: 'uint' },
  { name: 'validUntil', type: 'uint' },
  { name: 'owner', type: 'address' },
  { name: 'tokenS', type: 'address' },
  { name: 'tokenB', type: 'address' },
  { name: 'dualAuthAddr', type: 'address' },
  { name: 'broker', type: 'address' },
  { name: 'orderInterceptor', type: 'address' },
  { name: 'wallet', type: 'address' },
  { name: 'tokenRecipient', type: 'address' },
  { name: 'feeToken', type: 'address' },
  { name: 'walletSplitPercentage', type: 'uint16' },
  { name: 'tokenSFeePercentage', type: 'uint16' },
  { name: 'tokenBFeePercentage', type: 'uint16' },
  { name: 'allOrNone', type: 'bool' },
  { name: 'tokenTypeS', type: 'uint8' },
  { name: 'tokenTypeB', type: 'uint8' },
  { name: 'tokenTypeFee', type: 'uint8' },
  { name: 'trancheS', type: 'bytes32' },
  { name: 'trancheB', type: 'bytes32' },
  { name: 'transferDataS', type: 'bytes' }
]

export const DOMAIN = {
  name: 'Loopring Protocol',
  version: '2'
}

export const getEip712SignableData = order => {
  return {
    types: {
      EIP712Domain: DOMAIN_SCHEMA,
      Order: ORDER_SCHEMA
    },
    primaryType: 'Order',
    domain: DOMAIN,
    message: {
      amountS: order.amountS,
      amountB: order.amountB,
      feeAmount: order.feeAmount,
      validSince: order.validSince,
      validUntil: order.validUntil || 0,
      owner: order.owner,
      tokenS: order.tokenS,
      tokenB: order.tokenB,
      dualAuthAddr: order.dualAuthAddr || '',
      broker: order.broker || '',
      orderInterceptor: order.orderInterceptor || '',
      wallet: order.wallet || '',
      tokenRecipient: order.tokenRecipient || '',
      feeToken: order.feeToken,
      walletSplitPercentage: order.walletSplitPercentage || 0,
      tokenSFeePercentage: order.tokenSFeePercentage || 0,
      tokenBFeePercentage: order.tokenBFeePercentage || 0,
      allOrNone: order.allOrNone,
      tokenTypeS: order.tokenTypeS || 0,
      tokenTypeB: order.tokenTypeB || 0,
      tokenTypeFee: order.tokenTypeFee || 0,
      trancheS: order.trancheS || '',
      trancheB: order.trancheB || '',
      transferDataS: order.transferDataS || ''
    }
  }
}

export const AccountSignatureAlgorithm = {
  PERSONAL_SIGN: '0041',
  EIP_712: '0141'
}

export const decodeSignature = (signature, algorithm) => {
  const toHex = str => '0x' + str
  const hexToInt = hex => parseInt(hex, 16)

  const r = signature.slice(0, 66)
  const s = toHex(signature.slice(66, 130))
  const v = hexToInt(toHex(signature.slice(130, 132)))

  return { r, s, v, signature, algorithm }
}

export const getOrderHash = order => {
  const typedData = getEip712SignableData(order)
  console.log('typedData ', typedData)
  const hash = TypedDataUtils.sign(typedData, false)
  return '0x' + hash.toString('hex')
}
