import { useWeb3React } from '@web3-react/core';
import { LoadingRows } from 'pages/Pool/styleds';
import React from 'react';
import { ExternalLinkIcon } from 'theme';
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink';

type Props = {
    contractAddress: string;
}

type Holder = {
    address: string;
    balance: number;
    share: number;
}

export const TopHolders = (props: Props) => {
    const { contractAddress } = props;
    const { chainId } = useWeb3React()
    const [holders, setHolders] = React.useState<Holder[]>()
    const [loading, setLoading] = React.useState(false)

    const api = React.useMemo(() => {
        if (!chainId || chainId === 1) return `https://api.ethplorer.io/getTopTokenHolders/${contractAddress}?apiKey=EK-htz4u-dfTvjqu-7YmJq&limit=100`
        return ``
    }, [chainId, contractAddress])

    React.useEffect(() => {
        if (api) {
            setLoading(true)
            fetch(api, { method: "GET" })
                .then((res) => res.json())
                .then((data) => setHolders(data.holders))
                .catch(err => console.error(err))
                .finally(() => setLoading(false))
        }
    }, [contractAddress])

    return (
        <section>
            {loading && <LoadingRows>
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
            </LoadingRows>}

            {!loading && <div>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                            <p>Address</p>
                            <small>Balance</small>
                        </div>
                {!!holders && !!holders.length && holders.map((holder) => (
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}} key={holder.address}>
                            <p>{holder.address}</p>
                            <small style={{display:'flex'}}>{parseFloat((holder.balance / 10 ** 9).toFixed(0)).toLocaleString()} ({holder.share}%) &nbsp;                             <ExternalLinkIcon href={`${getExplorerLink(chainId as number, holder.address, ExplorerDataType.ADDRESS)}`} />
</small>
                        </div>
                ))}


            </div>}
        </section>
    )
}