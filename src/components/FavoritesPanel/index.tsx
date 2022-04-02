import { Currency } from '@uniswap/sdk-core';
import Badge, { BadgeVariant } from 'components/Badge';
import { DarkCard ,DarkGreyCard,GreyCard} from 'components/Card';
import { AutoColumn } from 'components/Column';
import CurrencyInputPanel from 'components/CurrencyInputPanel';
import { CardSection } from 'components/earn/styled';
import Modal from 'components/Modal';
import Row from 'components/Row';
import { Wrapper } from 'components/swap/styleds';
import { cpuUsage } from 'process';
import React, {useState} from 'react';
import { ChevronDown, ChevronUp, Percent, PlusCircle} from 'react-feather'
import { Button } from 'rebass/styled-components';
import { getTokenData, useEthPrice } from 'state/logs/utils';
import styled from 'styled-components/macro'
const FAVORITES_STORAGE_KEY = 'favorites';
const Styledheader = styled.div`

font-size:18px;
font-family:"Bangers", cursive; `
type Favorite = {
    name: string;
    symbol: string;
    address: string;
    price: any;
    priceChangeUSD: any;
}

// Hook
function useLocalStorage<T>(key: string, initialValue: T | undefined) {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState(() => {
      try {
        // Get from local storage by key
        const item = window.localStorage.getItem(key);
        // Parse stored json or if none return initialValue
        return item ? JSON.parse(item) as T : initialValue;
      } catch (error) {
        // If error also return initialValue
        console.log(error);
        return initialValue;
      }
    });
    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value:any) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        // Save state
        setStoredValue(valueToStore);
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.log(error);
      }
    };

    const favorite = React.useMemo(() => {
        if (localStorage.getItem(FAVORITES_STORAGE_KEY) !== null) 
        return (JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY as string) as string));
    return storedValue
    }, [localStorage.getItem(FAVORITES_STORAGE_KEY), storedValue]);
    return [favorite, setValue] as [T, (val: any) => void];
  }

  const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 0 0;
  max-height: 240px;
  width: auto;
  overflow-y: scroll;
  box-sizing: content-box;
  user-select: none
  > li {
    width: 100%;
    position: relative;
    background-color: #fafafa;
    margin: 10px 0;
    padding: 15px;
    i {
      padding: 0 15px 0 0;
      color: green;
    }
  };`

export const FavoritesPanel = () => {
    const [favorites, setFavorites] = useLocalStorage<Favorite[]>(FAVORITES_STORAGE_KEY, [])
    const [ethPrice, ethPriceOld, ethPriceOlder] = useEthPrice()
    const [isOpen, setIsOpen] = React.useState(false)
    const openModal = () => setIsOpen(true)
    const closeModal = () => setIsOpen(false)

    React.useEffect(() => {
        if (favorites.every((fav) => !!fav.price)) return;

        Promise.all(favorites.map(async (fav) => ({
            ...await getTokenData(fav.address, ethPrice, ethPriceOld),
            ...fav
        }))).then((items) => setFavorites(items))
    }, [favorites])
    return (
        <DarkCard>
            <SelectFavoritesModal ethPrice={ethPrice} ethPriceOld={ethPriceOld} isOpen={isOpen} onDismiss={closeModal} />
            <Styledheader>Favorites</Styledheader>
            <CardSection>
                <Row>
                    <AutoColumn><Button backgroundColor={'#222'} onClick={openModal}>Add favorites <PlusCircle /> </Button></AutoColumn>
                </Row>

                <div style={{
                    listStyle: 'none',
                    width: 'auto'
                }}>
                {!!favorites?.length && favorites.map((favorite:any) => (
                    <GreyCard padding="3px" key={favorite.address} style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
                        <Styledheader>{favorite.name} ({favorite.symbol}) <Badge>{favorite.price}</Badge></Styledheader>
                        
                        <Badge variant={favorite?.priceChangeUSD <= 0 ? BadgeVariant.NEGATIVE_OUTLINE : BadgeVariant.POSITIVE_OUTLINE} style={{ width: 'fit-content', display: 'flex', justifyContent: 'flex-end' }}>
                                    {favorite?.priceChangeUSD && favorite?.priceChangeUSD <= 0 ? <ChevronDown /> : <ChevronUp />}
                                    {favorite?.priceChangeUSD?.toFixed(2)}  <Percent />
                                </Badge>
                    </GreyCard>   
                ))}
                </div>
            </CardSection>
        </DarkCard>
    )
}

export const SelectFavoritesModal = ({isOpen, onDismiss, ethPrice, ethPriceOld}: {isOpen:boolean, onDismiss:() => void, ethPrice: any, ethPriceOld: any}) => {
    const [selected, setSelected] = React.useState<Currency>()
    const [favorites, setFavorites] = useLocalStorage<Favorite[]>(FAVORITES_STORAGE_KEY, [])

    const setSelectedCb = async (currency: any) => {
            const favoriteData = await getTokenData(currency.address, ethPrice, ethPriceOld)
            const newFavorites: Favorite[] = [{address: currency.address, price: favoriteData.priceUSD, name: currency.name, symbol: currency.symbol, priceChangeUSD: favoriteData.priceChangeUSD}, ...favorites.filter(item => item.address !== currency.address)];
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites))
            setFavorites(newFavorites)
        setSelected(currency)
    }
    return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
        <DarkCard>
        <CardSection>
            <h1>Select Tokens to add to your favorites</h1>
            <CurrencyInputPanel id="favoritePanel"
                showMaxButton={false}
                showOnlyTrumpCoins={false}
                currency={selected}
                hideBalance={true}
                showCurrencyAmount={false}
                onCurrencySelect={(currency) => setSelectedCb(currency)}
                onUserInput={console.log} value={''} />
        </CardSection>
    </DarkCard>
    </Modal>
    )
}