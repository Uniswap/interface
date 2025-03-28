import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  
  interface PoolData {
    id: number
    pair: string
    version: string
    fee: string
    tvl: string
    apr: string
    volume1d: string
    volume30d: string
    ratio: string
  }
  
  export function PoolsTable() {
    const data: PoolData[] = [
      {
        id: 1,
        pair: "USDC/ETH",
        version: "v3",
        fee: "0.05%",
        tvl: "$148.0 M",
        apr: "23.139%",
        volume1d: "$187.6 M",
        volume30d: "$9587.3 M",
        ratio: "1.27",
      },
      {
        id: 2,
        pair: "WBTC/USDC",
        version: "v3",
        fee: "0.3%",
        tvl: "$132.6 M",
        apr: "17.746%",
        volume1d: "$21.5 M",
        volume30d: "$1096.7 M",
        ratio: "0.16",
      },
      {
        id: 3,
        pair: "WISE/ETH",
        version: "v3",
        fee: "0.3%",
        tvl: "$132.6 M",
        apr: "17.746%",
        volume1d: "$21.5 M",
        volume30d: "$1096.7 M",
        ratio: "0.16",
      },
      {
        id: 4,
        pair: "ETH/USDT",
        version: "v3",
        fee: "0.3%",
        tvl: "$132.6 M",
        apr: "17.746%",
        volume1d: "$21.5 M",
        volume30d: "$1096.7 M",
        ratio: "0.16",
      },
      {
        id: 5,
        pair: "WBTC/ETH",
        version: "v3",
        fee: "0.3%",
        tvl: "$132.6 M",
        apr: "17.746%",
        volume1d: "$21.5 M",
        volume30d: "$1096.7 M",
        ratio: "0.16",
      },
      {
        id: 6,
        pair: "beraSTONE/ETH",
        version: "v3",
        fee: "0.3%",
        tvl: "$132.6 M",
        apr: "17.746%",
        volume1d: "$21.5 M",
        volume30d: "$1096.7 M",
        ratio: "0.16",
      },
      {
        id: 7,
        pair: "DAI/USDC",
        version: "v3",
        fee: "0.3%",
        tvl: "$132.6 M",
        apr: "17.746%",
        volume1d: "$21.5 M",
        volume30d: "$1096.7 M",
        ratio: "0.16",
      },
      {
        id: 8,
        pair: "WBTC/USDT",
        version: "v3",
        fee: "0.3%",
        tvl: "$132.6 M",
        apr: "17.746%",
        volume1d: "$21.5 M",
        volume30d: "$1096.7 M",
        ratio: "0.16",
      },
      {
        id: 9,
        pair: "WBTC/cbBTC",
        version: "v3",
        fee: "0.3%",
        tvl: "$132.6 M",
        apr: "17.746%",
        volume1d: "$21.5 M",
        volume30d: "$1096.7 M",
        ratio: "0.16",
      },
      {
        id: 10,
        pair: "ETH/USDC",
        version: "v3",
        fee: "0.3%",
        tvl: "$132.6 M",
        apr: "17.746%",
        volume1d: "$21.5 M",
        volume30d: "$1096.7 M",
        ratio: "0.16",
      },
      // 
    ]
  
    return (
      <div className="rounded-md border overflow-x-auto">
        <Table className="[&_th]:bg-gray-100 [&_th]:dark:bg-gray-800 [&_tr:hover]:bg-gray-50 [&_tr:hover]:dark:bg-gray-800">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Pool</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Comition</TableHead>
              <TableHead>TVL</TableHead>
              <TableHead>APR</TableHead>
              <TableHead>Vol. 1d</TableHead>
              <TableHead>Vol. 30d</TableHead>
              <TableHead>Vol 1 day/TVL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((pool) => (
              <TableRow key={pool.id} className="">
                <TableCell className="font-medium">{pool.id}</TableCell>
                <TableCell className="font-medium">{pool.pair}</TableCell>
                <TableCell>{pool.version}</TableCell>
                <TableCell>{pool.fee}</TableCell>
                <TableCell>{pool.tvl}</TableCell>
                <TableCell>{pool.apr}</TableCell>
                <TableCell>{pool.volume1d}</TableCell>
                <TableCell>{pool.volume30d}</TableCell>
                <TableCell className="items-center justify-center flex">{pool.ratio}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }