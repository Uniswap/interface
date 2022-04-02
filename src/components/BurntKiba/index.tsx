import Badge, { BadgeVariant } from 'components/Badge'

import React from 'react'
import {Zap} from 'react-feather'
import { useKiba } from 'pages/Vote/VotePage'

function abbreviateNumber(value: any) {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
      }).format(value / 10 ** 9)
}
export const BurntKiba = () => {
    const deadWalletKibaBalance = useKiba('0x000000000000000000000000000000000000dead')

    return (
        deadWalletKibaBalance ? <Badge style={{background: 'url(https://media.istockphoto.com/photos/fire-flame-on-white-picture-id157379217?b=1&k=20&m=157379217&s=170667a&w=0&h=foQWGUhPBK9pKldhiy_U5k3S6hdqRuZTMYQg9t5wWCY=)', backgroundPosition: 'center center',backgroundSize: 'contain'}} variant={BadgeVariant.PRIMARY}> <Zap /> {abbreviateNumber(+deadWalletKibaBalance.toFixed(2))}</Badge> : null
    )
}