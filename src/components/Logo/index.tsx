import { MouseoverTooltip } from 'components/Tooltip'
import { DEFAULT_LIST_OF_LISTS, UNI_LIST } from 'constants/lists'
import { Chain } from 'graphql/data/__generated__/TokenQuery.graphql'
import { chainIdToNetworkName } from 'lib/hooks/useCurrencyLogoURIs'
import uriToHttp from 'lib/utils/uriToHttp'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ImageProps } from 'rebass'
import store from 'state'
import styled from 'styled-components/macro'
import { isAddress } from 'utils'

const BAD_SRCS: { [tokenAddress: string]: true } = {}

interface LogoProps extends Pick<ImageProps, 'style' | 'alt' | 'className'> {
  srcs: string[]
  symbol?: string | null
  size?: string
}

const MissingImageLogo = styled.div<{ size?: string }>`
  --size: ${({ size }) => size};
  border-radius: 100px;
  color: ${({ theme }) => theme.textPrimary};
  background-color: ${({ theme }) => theme.backgroundInteractive};
  font-size: calc(var(--size) / 3);
  font-weight: 500;
  height: ${({ size }) => size ?? '24px'};
  line-height: ${({ size }) => size ?? '24px'};
  text-align: center;
  width: ${({ size }) => size ?? '24px'};
`

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
export default function Logo({ srcs, alt, style, size, symbol, ...rest }: LogoProps) {
  const [, refresh] = useState<number>(0)

  const src: string | undefined = srcs.find((src) => !BAD_SRCS[src])

  if (src) {
    return (
      <img
        {...rest}
        alt={alt}
        src={src}
        style={style}
        onError={() => {
          if (src) BAD_SRCS[src] = true
          refresh((i) => i + 1)
        }}
      />
    )
  }

  return (
    <MissingImageLogo size={size}>
      {/* use only first 3 characters of Symbol for design reasons */}
      {symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
    </MissingImageLogo>
  )
}

class TokenLogoLookupTable {
  dict: { [key: string]: string[] | undefined } | null = null
  selections: { [key: string]: string } = {}

  createMap() {
    const dict: { [key: string]: string[] | undefined } = {}

    console.log(store.getState().lists.byUrl[UNI_LIST].current)
    DEFAULT_LIST_OF_LISTS.forEach((list) =>
      store.getState().lists.byUrl[list].current?.tokens.forEach((token) => {
        if (token.logoURI) {
          const lowercaseAddress = token.address.toLowerCase()
          const currentEntry = dict[lowercaseAddress]
          if (currentEntry) {
            currentEntry.push(token.logoURI)
          } else {
            dict[lowercaseAddress] = [token.logoURI]
          }
        }
      })
    )
    return dict
  }
  getIcons(address?: string | null) {
    if (!address) return undefined

    if (!this.dict) {
      const start = Date.now()
      this.dict = this.createMap()
      console.log((Date.now() - start) / 1000)
    }
    return this.dict[address.toLowerCase()]
  }
  addSelection(address: string, logoUri: string) {
    this.selections[address.toLowerCase()] = logoUri
  }
  getList() {
    const changes: any[] = []
    store.getState().lists.byUrl[UNI_LIST].current?.tokens.forEach((t) => {
      const selection = this.selections[t.address.toLowerCase()]
      if (selection && selection !== t.logoURI) {
        changes.push({
          name: t.name,
          chainId: t.chainId,
          address: t.address,
          oldLogoURI: t.logoURI,
          newLogoURI: selection,
        })
      }
    })
    console.log(changes)
  }
}

const LogoTable = new TokenLogoLookupTable()

interface SmartLogoProps extends Pick<ImageProps, 'style' | 'alt' | 'className'> {
  token: {
    address?: string
    chain?: Chain | null
    chainId?: number | null
    symbol?: string | null
  }
  size?: string
}

const LogoWrapper = styled.div<{ selected: boolean }>`
  border-bottom: ${({ selected }) => (selected ? '2px solid green' : 'none')};
  margin-right: 4px;
`

interface IndividialLogoProps extends Pick<ImageProps, 'style' | 'alt' | 'className'> {
  selected: boolean
  setSelected: (s: string) => void
  src: string
  size?: string
}

function IndividialLogo({ selected, setSelected, src, alt, style, size, ...rest }: IndividialLogoProps) {
  const [display, setDisplay] = useState(true)
  return display ? (
    <LogoWrapper selected={selected} onClick={() => setSelected(src)}>
      <img {...rest} alt={alt} src={src} style={style} onError={() => setDisplay(false)} />
    </LogoWrapper>
  ) : null
}

function AddLogo({ addSrc }: { addSrc: (s: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <input
      placeholder="add new"
      value={value}
      onInput={(e) => setValue(e.currentTarget.value)}
      onKeyDown={(e) => {
        addSrc(value)
      }}
    ></input>
  )
}

/**
 * Renders an image by prioritizing a list of sources, and then eventually a fallback triangle alert
 */
export function SmartLogo({ token: { address, chain, chainId, symbol }, alt, style, size, ...rest }: SmartLogoProps) {
  const [, refresh] = useState<number>(0)
  const checksummedAddress = useMemo(() => isAddress(address), [address])
  const srcs = useMemo(() => {
    const networkName = chain?.toLowerCase() ?? (chainId ? chainIdToNetworkName(chainId) : 'ethereum')
    const assetsRepoIcon = `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/${networkName}/assets/${checksummedAddress}/logo.png`
    const tokenListIcons =
      LogoTable.getIcons(address)
        ?.map((t) => (t.startsWith('https://assets.coingecko') ? t.replace(/small|thumb/g, 'large') : t))
        .map((uri) => uriToHttp(uri))
        .flat(1) ?? []
    // Prioritize non-coingecko logos
    tokenListIcons.sort((a, b) => (a?.startsWith('https://assets.coingecko') ? -1 : 1))
    return [...new Set([assetsRepoIcon, ...tokenListIcons])]
  }, [address, chain, chainId, checksummedAddress])

  const [displaySrcs, setDisplaySrcs] = useState(srcs)
  const addSrc = useCallback((s: string) => {
    setDisplaySrcs([s, ...displaySrcs])
  }, [])

  const [selected, setSelected] = useState(srcs[0])

  useEffect(() => {
    address && LogoTable.addSelection(address, selected)
    LogoTable.getList()
  }, [address, selected])

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      {displaySrcs.map((src) => (
        <MouseoverTooltip key={src} text={src}>
          <IndividialLogo
            selected={selected === src}
            setSelected={setSelected}
            {...rest}
            alt={alt}
            src={src}
            style={style}
          />
        </MouseoverTooltip>
      ))}
      <AddLogo addSrc={addSrc} />
    </div>
  )
}
