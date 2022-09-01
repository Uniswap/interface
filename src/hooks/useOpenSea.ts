import React, { useEffect } from 'react'

import _ from 'lodash'
import axios from 'axios'

export const useRetrieveOffers = (asset_contract_address: string, limit: string, token_ids: string[]) => {
    const tokenidString = React.useMemo(() => {
        return token_ids.length == 1 ? `&token_ids=${token_ids[0]}` : `&token_ids=${_.min(token_ids.map(parseFloat))}&token_ids=${_.max(token_ids.map(parseFloat))}`
    }, token_ids)
    const [data, setData] = React.useState<any>()
    const options = {
        type: "GET",
        url: `https://api.opensea.io/v2/orders/ethereum/seaport/offers?asset_contract_address=${asset_contract_address}${tokenidString}`,
        headers: { Accept: 'application/json', 'X-API-KEY': 'null' }
    };

    useEffect(() => {
        axios(options.url, options)
            .then(function (response: any) {
                setData(response.data)
            })
            .catch(function (error: any) {
                console.error(error);
            })
    }, [])

    return data
}