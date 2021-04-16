// import { Story } from '@storybook/react/types-6-0'
// import React from 'react'
// import { Position } from 'types/position'
// import { basisPointsToPercent } from 'utils'
// import { DAI, WBTC } from '../../constants'
// import Component, { PositionListProps } from './index'
// import { TokenAmount } from '@uniswap/sdk-core'
// import JSBI from 'jsbi'

// const FEE_BIPS = {
//   FIVE: basisPointsToPercent(5),
//   THIRTY: basisPointsToPercent(30),
//   ONE_HUNDRED: basisPointsToPercent(100),
// }
// const daiAmount = new TokenAmount(DAI, JSBI.BigInt(500 * 10 ** 18))
// const wbtcAmount = new TokenAmount(WBTC, JSBI.BigInt(10 ** 7))
// const positions = [
//   {
//     feesEarned: {
//       DAI: 1000,
//       WBTC: 0.005,
//     },
//     feeLevel: FEE_BIPS.FIVE,
//     tokenAmount0: daiAmount,
//     tokenAmount1: wbtcAmount,
//     tickLower: 40000,
//     tickUpper: 60000,
//   },
//   {
//     feesEarned: {
//       DAI: 1000,
//       WBTC: 0.005,
//     },
//     feeLevel: FEE_BIPS.THIRTY,
//     tokenAmount0: daiAmount,
//     tokenAmount1: wbtcAmount,
//     tickLower: 45000,
//     tickUpper: 55000,
//   },
// ]
// const positions: Position[] = []

export default {
  title: 'PositionList',
}

// const Template: Story<PositionListProps> = (args) => <Component {...args} />

// export const PositionList = Template.bind({})
// PositionList.args = {
//   positions,
//   showUnwrapped: true,
// }
