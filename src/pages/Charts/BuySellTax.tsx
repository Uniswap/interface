import Badge from 'components/Badge'
import React from 'react'
import { TYPE } from 'theme'
import useTheme from 'hooks/useTheme'
type Maybe<T> = T | undefined | null 

type BuySellTax = {
  honeypot: Maybe<boolean>
  buy: Maybe<number>
  sell: Maybe<number>
}

type Props = {
    buySellTax?: BuySellTax
    justifyContent?: "center" | "flex-end" | "end" | "stretch" | "start" | "flex-start" | "space-around" | "space-between" | "space-evenly"
}

export const BuySellTax = (props: Props) => {
    const {buySellTax,justifyContent}=props
    const theme = useTheme()
    return (
        <React.Fragment>
        {Boolean(buySellTax) && !Boolean(buySellTax?.honeypot) && (
        <div style={{padding: 2,display:'flex', flexFlow:'column wrap', justifyContent:'end'}}>
            <div style={{justifyContent: justifyContent ?? 'flex-end', display:'flex', alignItems:'center', flexFlow: 'row wrap', gap: 15}}>
          <TYPE.small>
            <TYPE.italic display="inline-block" fontSize={10}>Buy tax</TYPE.italic>
            <Badge style={{color: theme.text1, background: theme.backgroundInteractive}}>
              {buySellTax?.buy}%
              </Badge>
          </TYPE.small>
          <TYPE.small>
          <TYPE.italic  display="inline-block" fontSize={10}>Sell tax</TYPE.italic>
            <Badge  style={{color: theme.text1, background: theme.backgroundInteractive}}>
              {buySellTax?.sell}%
              </Badge>
          </TYPE.small>
        </div>
        </div>
        )}
        </React.Fragment>

    )
}