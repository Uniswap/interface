import React, { useEffect, useState } from 'react'

import { AutoColumn } from 'components/Column'
import { DarkCard } from 'components/Card'
import Loader from 'components/Loader'
import { TYPE } from 'theme'
import styled from 'styled-components/macro'
import { useIsDarkMode } from 'state/user/hooks'
import useTheme from 'hooks/useTheme'
import  bridgeicon  from '../../../assets/images/bridgeicon.png'
import { isMobile } from 'react-device-detect'


/*tslint-disable*/
/*eslint-disable*/
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'stargate-widget': any; // The 'any' just for testing purposes
        }
    }
}

export const useScript = (url: string, name: string): any => {

    const [lib, setLib] = useState({})

    useEffect(() => {
        const script = document.createElement('script')

        script.src = url
        script.async = true
        script.onload = () => setLib({ [name]: window[name as any] })

        document.body.appendChild(script)

        return () => {
            document.body.removeChild(script)
        }
    }, [url])

    return lib

}

const Wrapper = styled.div`
    .MuiScopedCssBaseline-root {
        background:${prop => prop.theme.bg0} !important;
    }
`

export const Bridge = () => {
    const isDarkMode = useIsDarkMode()
    const themeVal = useTheme()

    const theme = React.useMemo(() => isDarkMode ? 'dark' : 'light', [isDarkMode])
    const { stargate } = useScript("https://unpkg.com/@layerzerolabs/stargate-ui@latest/element.js", "stargate")
    let content: JSX.Element;
    if (!stargate) {
        content = <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}> <Loader size={undefined} /> </div>
    } else {
        content = <stargate-widget
            // tenthBps={25}
            // partnerId={0}
            // feeCollector={'0xa2bDF890E70d3468dF5EFB50D1C1117CD937E6E5'}
            theme={theme} />
    }


    return <DarkCard style={{ maxWidth: 600, color: themeVal.text1 }}>
        <AutoColumn gap="lg">
            <AutoColumn gap="sm">
                <TYPE.small>
                <img
              width={isMobile ? '10px' : '20px'}
              src={bridgeicon}
              margin-right='10px'
              
            />
                      Kiba Crosschain Bridge
                </TYPE.small>
                <Wrapper>
                    {content}
                </Wrapper>
            </AutoColumn>
        </AutoColumn>
    </DarkCard>

}