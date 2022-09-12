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
            <div style={{justifyContent: justifyContent ?? 'flex-end', display:'flex', alignItems:'center', flexFlow: 'row wrap', gap: 15}}>
          <TYPE.small>
            Buy Tax
            <Badge style={{color: theme.text1, background: theme.backgroundInteractive}}>
              {buySellTax?.buy}
              </Badge>
          </TYPE.small>
          <TYPE.small>
            Sell Tax
            <Badge  style={{color: theme.text1, background: theme.backgroundInteractive}}>
              {buySellTax?.sell}
              </Badge>
          </TYPE.small>
        </div>
        )}
        </React.Fragment>

    )
}