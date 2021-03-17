interface ITokenSchema {
  address: string
  chainId: number
  name: string
  symbol: string
  decimals: number
  logoURI: string
}

interface INotesSchema {
  message: string
  timestamp: number
}

interface IPredictionSchema {
  linkEtherscan: string
  linkEtherchain: string

  fromToken: ITokenSchema
  toToken: ITokenSchema

  entryValues: {
    amountInToken: string
    amountOutMinToken: string
    amountInTokenF: string
    amountOutMinTokenF: string
  }
  // TODO USDC Prices Logic
  estimatedUSDIn: string
  estimatedUSDOut: string

  slippage: number

  executionValues: {
    executionPrice: string
    nextMidPrice: string
    outputAmount: string
    priceImpact: string
    computedPriceImpact: string
  }

  executionPrice: {
    formattedPriceFrom: string
    formattedPriceTo: string
    formattedPriceFromInverted: string
    formattedPriceToInverted: string
    label: string
    labelInverted: string
  }

  nextMidPrice: {
    formattedPriceFrom: string
    formattedPriceTo: string
    formattedPriceFromInverted: string
    formattedPriceToInverted: string
    label: string
    labelInverted: string
  }
}

interface IParamsSchema {
  amountIn: string
  amountOutMin: string
  path: Array<string>
  to: string
  deadline: string
}

interface IContractCallSchema {
  contractAddress: string
  contractType: string
  methodName: string
  contractName: string
  contractDecimals: number
  decimalValue: string
  params: IParamsSchema
}

interface ITransaction {
  _id: string
  status: string // current status of the transaction
  hash: string
  to: string
  from: string
  gas: number
  gasPrice: string
  gasUsed: string // present on on-chain txns
  nonce: number
  value: string
  eventCode: string
  blockHash: string
  blocknumber: number
  input: string
  timeStamp: string // the UTC time of first detection of current status
  pendingTimeStamp: string // the UTC time of initial pending status detection
  pendingBlocknumber: number // the chain head block number at time of pending detection
  transactionIndex: number // optional, present if status confirmed, failed
  blockTimeStamp: string // optional, present if status confirmed, failed - UTC time of miner block creation
  counterParty: string // address of the counterparty of the transaction when watching an account
  direction: string // the direction of the transaction in relation to the account that is being watched ("incoming" or "outgoing")
  watchedAddress: string // the address of the account being watched
  timePending: string // optional, present if status confirmed, failed, speedup, cancel
  blocksPending: number // optional, present if status confirmed, failed, speedup, cancel
  originalHash: string // if a speedup or cancel status, this will be the hash of the original transaction
  asset: string // the asset that was transfered
  contractCall: IContractCallSchema
  // CUSTOM DATA
  prediction: IPredictionSchema
  notes: INotesSchema
  fromTokenAddress: string
  toTokenAddress: string
}

interface IDeletedTransaction {
  _id: string
  operationType: string
}
