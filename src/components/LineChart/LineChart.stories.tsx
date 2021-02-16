import { Story } from '@storybook/react/types-6-0'
import React from 'react'
// import Row, { RowFixed } from 'components/Row'
import styled from 'styled-components'
import Component, { LineChartProps } from './'
import { dummyData } from './data'
// import { AutoColumn } from 'components/Column'
// import { TYPE } from 'theme'
// import DoubleCurrencyLogo from 'components/DoubleLogo'
// import { MKR } from 'constants'
// import { ETHER } from '@uniswap/sdk'
// import LineChart from '.'

const Wrapper = styled.div`
  margin: 1em 2em;
  max-width: 500px;
  & > * {
    font-size: 1em;
  }
`

export default {
  title: 'Charts',
  argTypes: {
    disabled: { control: { type: 'boolean' } },
    onClick: { action: 'clicked' },
  },
  decorators: [
    (Component: Story) => (
      <Wrapper>
        <Component />
      </Wrapper>
    ),
  ],
}

const Template: Story<LineChartProps> = (args) => <Component {...args}>{args.children}</Component>

export const Basic = Template.bind({})
Basic.args = { data: dummyData }

// const Full = () => {
//   const [value, setValue] = useState<number | undefined>(dummyData[dummyData.length - 1].value)

//   const dummyUSDPrice = 410 // used for conversion

//   const TopLeftContent = () => (
//     <AutoColumn gap="md">
//       <RowFixed align="center">
//         <DoubleCurrencyLogo currency0={MKR} currency1={ETHER} size={20} />{' '}
//         <TYPE.main fontSize="20px" color="white" ml="10px">
//           ETH / MKR
//         </TYPE.main>
//       </RowFixed>
//       <Row>
//         <TYPE.main fontSize="20px" color="white">
//           {value} MKR
//         </TYPE.main>
//         <TYPE.main color="#565A69" fontSize="20px" ml="10px">
//           ($
//           {value
//             ? (value * dummyUSDPrice).toLocaleString('USD', {
//                 currency: 'USD',
//                 minimumFractionDigits: 2
//               })
//             : null}{' '}
//           )
//         </TYPE.main>
//       </Row>
//     </AutoColumn>
//   )

//   return (
//     <Wrapper>
//       <LineChart data={dummyData} setValue={setValue} topLeft={<TopLeftContent />} />
//     </Wrapper>
//   )
// }

// export const FullVersion = Template.bind(() => <LineChart data={dummyData} />)
// Full.args = { data: dummyData }
// Full.decorators = [
//   (Story: any) => {
//     return (
//       <Wrapper>
//         <LineChart data={dummyData} />
//       </Wrapper>
//     )
//   }
// ]
