import { ChevronDown, ChevronUp } from 'react-feather'

import Badge from 'components/Badge'
import { DarkCard } from 'components/Card'
import { OpenSeaLink } from './mint'
import React from 'react'
import { TYPE } from 'theme'
import axios from 'axios'
import styled from 'styled-components/macro'

const Wrapper = styled.div`
    padding: 20px;
    width: 100%;
    display:grid;
    grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
    grid-gap: 18px;
    align-items:center;
`

const NftImage = styled.img`
    max-width:250px;
    border-radius:12px;
    border: 1px solid transparent;
    height:auto;
    width: 100%;
    height: 100%;
    object-fit: cover;
`

const NftCardDiv = styled(DarkCard)`
z-index: 9999; 
padding: 12px; 
border: 1px solid lightgreen;
&:hover {
    border:1px solid #222;
    transition: ease all 0.05s;
}
`


type Trait = {
    max_value?: any;
    display_type: string
    order?: any
    trait_type: string
    value: any
}

const TraitsGrid = ({ traits, isOpen }: { traits: Array<Trait>, isOpen?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexFlow: 'wrap', maxWidth: 250 }}>
        {isOpen && traits.map((trait) => (
            <Badge style={{ border: '1px solid #222' }} key={trait.value}>{trait.trait_type}: {trait.value}</Badge>
        ))}
    </div>
)

const NftCard = (props: { img: string, name?: string, nft?: any, floor?: number }) => {
    const [traitsOpen, setTraitsOpen] = React.useState(false)
    const toggleTraits = () => setTraitsOpen(!traitsOpen)
    return (
        <NftCardDiv>
            <a href={props?.nft?.external_link}>
                <NftImage src={props.img} />
            </a>
            <div style={{ marginBottom: 5, width: '100%', padding: 3, borderRadius: 5, border: '1px solid #222', color: '#fff' }}>
                <TYPE.small style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{props.name}</span> 
                    <div style={{display:'flex', alignItems:'center', gap: 8}}>
                    {Boolean(props?.floor) &&  <><Badge style={{color:'#fff'}}>{props?.floor} Ξ </Badge></>}
                    <OpenSeaLink size={30} link={props.nft?.permalink} />
                    </div>
                </TYPE.small>
            </div>
            <div>
                <TYPE.mediumHeader style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={toggleTraits}>Traits {traitsOpen ? <ChevronDown style={{ cursor: 'pointer' }} /> : <ChevronUp style={{ cursor: 'pointer' }} />}</TYPE.mediumHeader>
                <hr />
                <TraitsGrid isOpen={traitsOpen} traits={props?.nft?.traits} />
            </div>
        </NftCardDiv>
    )
}
type NftGridProps = {
    account?: string | null
    floorPrice?:number 
}

export const NftGrid = (props: NftGridProps) => {
    const { account , floorPrice} = props

    const [nftCollection, setNftCollection] = React.useState<any[]>()

    const getAccountNfts = React.useCallback(async () => {
        const url = `https://api.opensea.io/api/v1/assets?owner=${account}`
        const response = await axios.get(url)
        const nftAssets = response.data.assets
        const kibaAssets = nftAssets.filter((asset: any) => asset?.collection?.name?.toLowerCase()?.includes('kiba'))
        console.log(`kiba.assets`, kibaAssets)
        return kibaAssets
    }, [account])

    React.useEffect(() => {
        if (account) {
            getAccountNfts().then(setNftCollection)
        }
    }, [getAccountNfts])

    if (!account) {
        return (
            <Badge>Connect your wallet to view your owned nfts</Badge>
        )
    }

    const nftCollectionToMap = nftCollection ? nftCollection : []

    return (
        <Wrapper>
            {nftCollectionToMap?.map((item, i) => (
                <NftCard floor={floorPrice} img={item?.image_url} name={item?.name} nft={item} key={i} />
            ))}

            {!Boolean(nftCollectionToMap?.length) && <TYPE.small>The connected account has no Kiba Inu NFTs.</TYPE.small>}
        </Wrapper>
    )

}