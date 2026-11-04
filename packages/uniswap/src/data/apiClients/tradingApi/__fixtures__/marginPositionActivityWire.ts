import type { MarginPositionActivityWireResponse } from 'uniswap/src/data/apiClients/tradingApi/marginPositionsView'

// Whole GET /v1/margin/positions/activity responses recorded from the dev trading API for the
// lifecycles of two MARGIN_POSITIONS_WIRE_PNL_ACTIVE rows, both since closed. Each is a single, last
// page, so neither carries a nextCursor.

// The MORPHO long (subId 0), since closed: open, increase, an equity top-up, then the close.
export const MARGIN_POSITION_ACTIVITY_WIRE_CLOSED: MarginPositionActivityWireResponse = {
  requestId: 'd1a217b44d10e5f6c8fc770a99fef937',
  activity: [
    {
      kind: 'MARGIN_ACTIVITY_KIND_OPEN',
      txHash: '0x2b5941ac21842bb3b0ceaf544ece4aeb30d666aa86f9a3da883fd6e51c17f9f2',
      at: '1791907955000',
      collateralBought: '1000000000000000',
      debtDrawn: '2519312',
      equityDeposited: '1000000000000000',
      price: '2519312000000000000000',
      collateralAfter: '2000000000000000',
      debtAfter: '2519312',
      entryPrice: '2519312000000000000000',
    },
    {
      kind: 'MARGIN_ACTIVITY_KIND_INCREASE',
      txHash: '0x6b7fc920f431288235f8875f6972082e1b47f671faa9203f73349d55eb44cd77',
      at: '1792513367000',
      collateralBought: '77690746961184',
      debtDrawn: '188922',
      price: '2431718156000000000000',
      collateralAfter: '2077690746961184',
      debtAfter: '2710659',
      entryPrice: '2512997358000000000000',
    },
    {
      kind: 'MARGIN_ACTIVITY_KIND_ADD_EQUITY',
      txHash: '0x31c60be3abb6c726bd99e193213643f007593e7dd06a112e5711789253aebd3d',
      at: '1792513511000',
      equityDeposited: '1000000000000000',
      collateralAfter: '3077690746961184',
      debtAfter: '2710660',
      entryPrice: '2512997358000000000000',
    },
    {
      kind: 'MARGIN_ACTIVITY_KIND_CLOSE',
      txHash: '0x3be9e214f9cd82ad93b327fe11c8dea141150bdf5868192135e284813cc320f4',
      at: '1792513559000',
      collateralSold: '1116244859241097',
      debtRepaid: '2710660',
      equityWithdrawn: '1961559120732432',
      price: '2428620367000000000000',
      collateralAfter: '0',
      debtAfter: '0',
      entryPrice: '2512997358000000000000',
    },
  ],
}

// The AAVE_V3 long (subId 1), recorded 2026-10-26: open, two increases, a partial decrease, then the close.
export const MARGIN_POSITION_ACTIVITY_WIRE_DECREASED: MarginPositionActivityWireResponse = {
  requestId: '222ac09874ba69e005482d46ddca15d5',
  activity: [
    {
      kind: 'MARGIN_ACTIVITY_KIND_OPEN',
      txHash: '0xfded381e551f6a9c64cc8845f2bdd093c690750654b6434e3ef601b5a62308ae',
      at: '1791993071000',
      collateralBought: '100000000000000',
      debtDrawn: '243625',
      equityDeposited: '1000000000000000',
      price: '2436250000000000000000',
      collateralAfter: '1099999999999999',
      debtAfter: '243625',
      entryPrice: '2436250000000000000000',
    },
    {
      kind: 'MARGIN_ACTIVITY_KIND_INCREASE',
      txHash: '0x21409b4b5884809a6d07d8e6c37169196496a419812c88e045d5b7b2afe713d8',
      at: '1792519091000',
      collateralBought: '901409891190352',
      debtDrawn: '2204603',
      price: '2445727544000000000000',
      collateralAfter: '2001651152282941',
      debtAfter: '2448420',
      entryPrice: '2444781124000000000000',
    },
    {
      kind: 'MARGIN_ACTIVITY_KIND_INCREASE',
      txHash: '0x7d5bbb39d6429036eedec17acc1d431a6e4f92f2f23b00f3f069aabecdca649d',
      at: '1792519343000',
      collateralBought: '1008292920924697',
      debtDrawn: '2466249',
      price: '2445964807000000000000',
      collateralAfter: '3009944282847004',
      debtAfter: '4914670',
      entryPrice: '2445374992000000000000',
    },
    {
      kind: 'MARGIN_ACTIVITY_KIND_DECREASE',
      txHash: '0x863de943617c231dde902478606c3729a076086edcb653a7f588d0fef4398254',
      at: '1792688567000',
      collateralSold: '1139280838071296',
      debtRepaid: '2707905',
      price: '2376854687000000000000',
      collateralAfter: '1870873567206122',
      debtAfter: '2208006',
      entryPrice: '2445374992000000000000',
    },
    {
      kind: 'MARGIN_ACTIVITY_KIND_CLOSE',
      txHash: '0x45d55714f17b0514a389cb015a2b97e884eaeeb2f210ce02bdc464828610beb8',
      at: '1792689047000',
      collateralSold: '929580095010347',
      debtRepaid: '2208007',
      equityWithdrawn: '941387712684981',
      price: '2375513430000000000000',
      collateralAfter: '0',
      debtAfter: '0',
      entryPrice: '2445374992000000000000',
    },
  ],
}
