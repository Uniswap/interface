import React from 'react'

import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { Image, User } from 'react-feather'
import { TYPE } from 'theme'
import { CardSection } from 'components/earn/styled'
import { OutlineCard } from 'components/Card'
export const THEME_BG_KEY = 'themed_BG'

export const ThemedBg = ({ theme, setTheme }: { theme: any; setTheme: (theme: string) => void }) => {
  console.log(theme, setTheme)
  return (
    <GreyCard style={{ maxWidth: 600 }}>
      <OutlineCard>
      <span style={{textAlign: 'center', fontSize:22, color: "#fff"}}>Choose a custom background</span>
      <ul style={{background:'transparent', padding: 20, cursor: 'pointer'}}>
        {['./squeeze.mp4', './trumpspace.mp4', './video.mp4'].map((key) => (
          <li onClick={(e) => setTheme(key)} style={{ listStyle: 'none', padding: 15, margin: 10 }} key={key}>
            <video style={{ maxWidth: 400, border: theme === key ? '1px solid green' : '1px solid #eee' }}>
              <source src={key} type="video/mp4" />
            </video>
          </li>
        ))}
      </ul>
      </OutlineCard>
    </GreyCard>
  )
}
