import DocumentMeta from 'react-document-meta'
const defaultMetadata = {
    title: 'KibaSwap | Swap Tokens, View Charts, New Pairs, and much more',
    description: '',
    canonical: 'https://kibaswap.io',
    meta: {
        charset: 'utf-8',
        name: {
            keywords: 'react,meta,document,html,tags'
        }
    }
}

type Metadata = {
    title:string
    description: string
    canonical: string
    meta?:{ 
        charset: string
        name:{
            keywords: string
        }
    }
}

type PageMetaProps = {
    metadata: Metadata
}
export const PageMeta = (props: PageMetaProps) => {
    const {metadata}=props
    return <DocumentMeta {...metadata} />
}