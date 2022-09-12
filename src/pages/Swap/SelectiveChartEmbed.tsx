import { CFormLabel, CFormSwitch } from "@coreui/react"

import { AutoColumn } from "components/Column"
import { BlueCard } from "components/Card"
import { ButtonOutlined } from "components/Button"
import CopyHelper from "components/AccountDetails/Copy"
import { EmbedModel } from "components/Header"
import Modal from "components/Modal"
import React from "react"
import { RowBetween } from "components/Row"
import { TYPE } from "theme"
import { X } from "react-feather"
import styled from "styled-components/macro"

type EmbedProps = {
    chartLink: string
    title: string;
    isOpen: boolean
    onDismiss: () => void
}

const Wrapper = styled.div`
position:relative;
width:100%;
padding-bottom:125%;
@media(min-width:1400px){padding-bottom:65%;}
iframe{ scale:0.8; position:absolute;width:100%;height:100%;top:0;left:0;border:0;}
`

export const SelectiveChartEmbedModal = (props: EmbedProps) => {
    const { isOpen, onDismiss, chartLink, title } = props

    const [options, setOptions] = React.useState<EmbedModel>({
        theme: 'dark',
        embedMode: true,
        showChartInfo: true,
        showChartTrades: true,
        showTrending: true
    })

    const boolToQueryParam = (value?: boolean) => value == true ? '1' : '0'

    const generateLinkFromOpts = () => {
        const baseLink = chartLink
        const info = options.showChartInfo ? '1' : '0'
        const trending = options.showTrending ? '1' : '0'
        const trades = options.showChartTrades ? '1' : '0'
        const link = baseLink?.includes('?') ? baseLink.split('?')[0] : baseLink
        const updatedLink = `${link}?embed=true&info=${info}&trades=${trades}&trending=${trending}&theme=${options.theme}`
        return updatedLink
    }

    const copyEmbedCodeToClipboard = () => {
        const code = `<style>#kibaswap-embed{position:relative;width:100%;padding-bottom:125%;}@media(min-width:1400px){#kibaswap-embed{padding-bottom:65%;}}#kibaswap-embed iframe{position:absolute;width:100%;height:100%;top:0;left:0;border:0;}</style><div id="kibaswap-embed"><iframe src="${generateLinkFromOpts()}"></iframe></div>`
        return code
    }


    return (
        <Modal size={1025} maxHeight={975} isOpen={isOpen} onDismiss={onDismiss}>
            <BlueCard style={{padding:'0.2rem'}}>
            <AutoColumn style={{ paddingTop:'0.75rem', paddingBottom: '0.25rem', paddingLeft:"0.75rem", paddingRight:'0.75rem' }} gap="sm">
                <div style={{ paddingTop: 0, paddingRight:'0.5rem', paddingBottom:0, paddingLeft: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TYPE.subHeader>Embed {title}</TYPE.subHeader>
                    <X style={{ cursor: 'pointer' }} onClick={onDismiss} />
                </div>
                <hr style={{color:"#444"}} />
                <div style={{ display: 'flex', marginTop:-12,  gap:3, flexFlow: 'column wrap', alignItems: 'center', marginBottom:15, paddingTop: 0, paddingLeft: '1rem', paddingRight:'1rem',paddingBottom:'1rem' }}>
                    <div style={{ marginBottom:10, fontSize: 12, display: 'flex', alignItems: 'center', gap:50, flexFlow: 'row wrap', justifyContent: 'space-between'}}>
                        <div style={{display:'flex', flexFlow: 'column wrap', alignItems:"center"}}>
                        <TYPE.subHeader>Embed Settings</TYPE.subHeader>
                        <div style={{display:'flex', zIndex:999,  gap:10,flexFlow:'row wrap', alignItems:'center'}}>
                            <CFormSwitch checked={options.showChartTrades} label={<CFormLabel>Show Trades</CFormLabel>} onChange={value => setOptions({ ...options, showChartTrades: value.currentTarget.checked })} />
                            <CFormSwitch checked={options.showChartInfo} label={<CFormLabel>Show Info</CFormLabel>} onChange={value => setOptions({ ...options, showChartInfo: value.currentTarget.checked })} />
                            <CFormSwitch checked={options.showTrending} label={<CFormLabel>Show Trending</CFormLabel>} onChange={value => setOptions({ ...options, showTrending: value.currentTarget.checked })} />
                            <CFormSwitch checked={options.theme == 'dark'} label={<CFormLabel>Darkmode</CFormLabel>} onChange={value => setOptions({ ...options, theme: value.currentTarget.checked ? 'dark' : 'light'})} />
                        </div>
                        </div>
                        <div style={{display:'flex', marginLeft:10, alignItems:'center', justifyContent:'flex-end'}}>
                            <ButtonOutlined padding={'3px'}>
                                <CopyHelper toCopy={copyEmbedCodeToClipboard()}>
                                    Copy Embed Code
                                </CopyHelper>
                            </ButtonOutlined>
                        </div>
                    </div>
                </div>
                <RowBetween style={{ maxWidth: 1000, width: 1000, height: 450 }}>
                    <Wrapper>
                        <iframe style={{ border: '1px solid #444' }} src={generateLinkFromOpts()} ></iframe>
                    </Wrapper>
                </RowBetween>
            </AutoColumn>
            </BlueCard>
        </Modal>
    )
}