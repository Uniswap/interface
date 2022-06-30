import { ChainId } from '@kyberswap/ks-sdk-core'

// https://docs.google.com/spreadsheets/d/13TQu-5SqnCLK04diXCSm7kUrXh0PLfhcccG6kP_5VFY/edit#gid=514791511
export const TOKEN_INFO_DESCRIPTION: { [key: string]: string } = {
  usdt: `<h3>What is Tether (USDT)?</h3>
    <p>Launched in 2014, Tether, a stablecoin called USDT, is one of the most popular and frequently used in the crypto market. </p>
  
    <p>Being a blockchain-enabled platform designed for the digital use of traditional currencies, Tether allows traders to transact fiat currencies across the blockchain, without any third-party intermediates.</p>
  
    <h3>Who Are the Founders of Tether?</h3>
    <p>USDT was founded by Brock Pierce, Reeve Collins and Craig Sellars. </p>
  
    ​​<p>Brock Pierce is a well-known entrepreneur who has co-founded a number of high-profile projects in the crypto and entertainment industries. </p>
  
    <p>Reeve Collins was the CEO of Tether for the first two years of its existence.</p>
  
    <p>In addition to Craig Sellars’s work on Tether, he has also worked in other cryptocurrency companies and organizations, such as Omni Foundation, Bitfinex, and so on.</p>`,

  trx: `<h3>What is TRON (TRX)?</h3>
    <p>TRON (TRX) is a decentralized operating system on the blockchain and its native coin is called Tronix (TRX). Tron's permissionless protocols aims to democratize the content distribution industry. </p>
    
    <p>The platform was initially designed to establish a decentralized Internet and operate as a framework for developers to create dApps as an alternative to Ethereum. Anyone on the TRON network can create dApps, offer content, and get digital assets in exchange for their efforts. The ability to develop and spread content widely without concern of transaction fees is an obvious value of TRON.</p>
    
    <h3>Who Are the Founders of TRON (TRX)?</h3>
    <p>As the founder and CEO of TRON, Justin Sun has been honored by Forbes Asia in its 30 Under 30 series for entrepreneurs.</p>`,
  gmt: `<h3>What is STEPN (GMT)?</h3>
      <p>STEPN is a Solana blockchain-based ""Web3 lifestyle app"" with GameFi elements. It incorporates features of a Play-to-Earn game in a fitness app to develop a solid category, known as ""move-to-earn."" Users purchase NFT sneakers to earn in-game currency while walking, running, or jogging.</p>
      
      <p>STEPN's main goal is to disrupt the industry of fitness app by motivating users to live a better lifestyle. The app overcomes numerous issues, including a working GPS system, and ""proof of movement"", showing that users actually exercised.</p>
      
      <p>The application is available on both Android and iOS and has progressed from the conceptual stage to the open beta version in just five months. Following the success of its IDO in March 2022, STEPN aims to refine its in-game features and debut on a number of other chains in the future.</p>
      
      <p>Who Are the Founders of STEPN (GMT)?
      Yawn Rong, an Australian blockchain entrepreneur, founded STEPN in August 2021. He founded STEPN with his neighbor and partner Jerry Huang, a game developer and former founder of Falafel Games.</p>
      
      <p>STEPN raised a $5 million seed round from the most prominent crypto venture capital firms, including Sequoia Capital, Folius Ventures, Solana Capital, Alameda Research, 6th Man Ventures, DeFi Alliance, and others. Particularly,  Santiago R Santos and Republic Asia Partner Zhen Cao are two noteworthy angel investors.</p>
      `,
  axs: `<h3>What is Axie Infinity (AXS)?</h3>
      <p>Axie Infinity is a trading and battling game powered by a blockchain that is partially run and owned by its players. Based on successful games, such as Pokémon and Tamagotchi, it allows players to collect, breed, raise, battle and trade token-based creatures, known as Axies.</p>
  
      <p>Thanks to its open-ended, and incredibly flexible gameplay, players can gather various digital pets known as Axies, which can be raised, battled, and traded across the ever increasing Axie ecosystem.</p> 
  
      <p>In 2021, Axie Infinity has become one of the top gaming DApps on Ethereum. It also ranked the 3rd in the most popular gaming DApps, with over 100,000 unique users every week.</p>
  
      <h3>Who Are the Founders of Axie Infinity (AXS)?</h3>
      ​​<p>The game developer Sky Mavis, who focuses on technology and has a crew that is mostly headquartered in Vietnam, launched Axie Infinity in 2018.</p>
  
      <p>Trung Nguyen is the current CEO of the platform.</p>
  
      <p>Aleksander Larsen, a former competitive gamer, is also credited as a co-founder and COO of the platform.</p> 
      `,
  dot: `<h3>What is Polkadot (DOT)?</h3>
      <p>Polkadot is an open-source sharded multichain protocol that allows blockchains to connect with each other to share data and form a decentralized network.</p> 
      
      <p>Because Polkadot supports and explains the structure of a network of layer 1 blockchains known as parachains (parallel chains), it is known as a layer-0 metaprotocol. As a metaprotocol, Polkadot has the ability to forklessly and autonomously update its own codebase, which is in line with the will of its token holder community.</p>
      
      <p>Creating a ""Decentralized Web - Decentralized Network"" is Polkadot's vision. Specifically, Interoperability and Scalability are two primary issues concerning blockchain that Polkadot focuses on tackling.</p> 
      
      <h3>What is the Polkadot (DOT) token?
      The DOT token, which can be purchased or sold on Coinbase and other exchanges, is used for governance and staking.</h3>
      
      <p>The native DOT token of Polkadot includes 3 separate purposes: bonding tokens to connect parachains; staking for operations and security, referring to the way that the Polkadot network verifies transactions and issues new DOT; as well as facilitating network governance, which allows holders to have a say in the future of the protocol.</p>`,
  tlm: `<h3>What is Alien Worlds (TLM)?</h3>
      <p>Alien Worlds (TLM) is a decentralized, non-fungible token (NFT) metaverse, where players compete for scarce resources, Trilium (TLM), in a stimulated economy centered around planetary worlds. Since players advance by staking TLM and using TLM to cast votes in Planet Decentralized Autonomous Organizations (DAOs), Alien Worlds also incorporates a decentralized finance (DeFi) component in the game.</p>
      
      <p>Based in a decentralized metaverse, Alien Worlds (TLM) now operates on several blockchains, such as Ethereum, WAX, and the Binance Smart Chain (BSC).</p>
      
      <p>The native utility token of the Alien Worlds metaverse is called Trilium (TLM), and it stimulates users to engage in competition, complete in-game tasks, and stake their TLM in governance activities.</p>
      
      <h3>Who Are the Founders of Alien Worlds (TLM)?</h3>
      <p>Alien Worlds was built in 2020 by German developers, specifically, Dacoco GmbH.</p> 
      
      <p>Based in Zug, Switzerland, Dacoco claims his company as experts on decentralized autonomous community organizations and works as WAX guild validators.</p>
      `,
  pgx: `<h3>What is Pegaxy (PGX)?</h3>
    <p>Governed through the PGX governance token, Pegaxy is a play-to-earn PvP (Player versus Player) horse racing game where players compete for top 3 placement to earn the platform's utility token, VIS (Vigorus).</p>
    
    <p>Since its launch, Pegaxy has been the most popular game on Polygon, with over $200M moving through the platform in its first five months.</p>
    
    <h3>Who Are the Founders of Pegaxy?</h3>
    <p>As a CEO and co-founder of Pegaxy (PGX), Ken Pham has extensive experience in business consulting and blockchain technology.</p>
    
    <p>Steve Nguyen, a chief technical officer (CTO) and co-founder, masters at building gaming platforms and mobile apps. </p>
    
    <p>Corey Wilton, Pegaxy's chief marketing officer (CMO) and co-founder, is responsible for the strategy, development, and execution of marketing and advertising activities. He has extensive experience in digital marketing, blockchain, and gaming.</p>`,
  knc: `<h3>What is Kyber Network Crystal (KNC)?</h3>
      <p>The Kyber Network is a multi-chain crypto trading and liquidity hub that connects liquidity from different sources to provide secure and instant transactions on any decentralized application (DApp). The primary objective of Kyber Network is to provide an easy access to liquidity pools at the best rates for DeFi DApps, decentralized exchanges (DEXs), and other users.</p>
      
      <p>The utility token, known as Kyber Network Crystal (KNC), serves as the glue that binds various stakeholders in Kyber's ecosystem. Holders of KNC tokens can vote on significant proposals and participate in platform governance by staking their tokens in the KyberDAO, and earning staking rewards in Ethereum (ETH) earning from trading fees.</p>
      
      <p>KyberSwap powers 100+ integrated projects and has facilitated over US$7 billion worth of transactions for thousands of users since its inception. Currently deployed across 11 chains including Ethereum, BNB Chain, Polygon, Avalanche, Fantom, Cronos, Arbitrum, Velas, Aurora, Oasis and BitTorrent.</p>
      
      <h3>Who Are the Founders of Kyber Network Crystal (KNC)?</h3>
      <p>This project was founded by Loi Luu, Victor Tran and Yaron Velner, and currently has its headquarters in Singapore. </p>
      
      <p>Loi Luu, a Founder and Chairman of Kyber Network, is an on-chain decentralized trading protocol for cryptocurrencies.</p>
      
      <p>Victor Tran, a new CEO and Co-founder of Kyber Network, as well as a Forbes 30 under 30 Asia alumni. He was the CTO at Clixy and 24/7 Digital Group as well as a developer for several projects in Vietnam.</p>
      
      <p>Yaron Velner, is now the CEO of B.Protocol, was a decentralized backup liquidity protocol. In October 2019, Velner left his position as CTO of Kyber, but he still remains as an advisor.</p>
      `,
  btt: `<h3>What is BitTorrent (BTT)?</h3>
      <p>BitTorrent is a popular peer-to-peer (P2P) file sharing and torrent platform that has recently become more decentralized. </p>
      
      <p>As the “largest decentralized P2P communications protocol” in the world, BitTorrent allows users to transfer data and electronic files over the Internet in a decentralized manner.</p>
      
      <h3>What is the BitTorrent (BTT) token?</h3>
      <p>BTT is a TRC-20 utility token that drives features of the world's most popular decentralized protocols and applications. BitTorrent Speed, BitTorrent File System, DLive, and others in the pipeline are parts of DApps powered by BTT.</p>`,
  slp: `<h3>What is Smooth Love Potion (SLP)?</h3>
      <p>By taking part in the Axie Infinity game, players can earn Smooth Love Potion (SLP) tokens. Experience points are replaced by this digital asset.</p>
      
      <p>SLP are ERC-20 tokens that may be used to breed new Axies, meaning digital pe  ts. Axies can be bred a maximum of seven times, and the seventh breed costs 2,100 SLP. This cap is in place to guard against market hyperinflation. </p>
      
      <p>It takes some time to earn SLP through the game; for example, it might take 15 wins before a player has enough tokens to execute their first breed. Gamers can get a headstart by acquiring SLP on the open market.</p>
      
      <p>Who Are the Founders of Smooth Love Potion (SLP)?
      Trung Nguyen is the CEO of the company, who left his role as a software developer in the U.S. in order to focus on the project. </p>
      
      <p>Nguyen was inspired to investigate blockchain's potential in gaming because he was dissatisfied with a huge number of players does not genuinely own valuable assets in popular titles.</p>
      `,
  avax: `<h3>What is Avalanche (AVAX)?</h3>
    <p>Avalanche is a blockchain that is likely to combine the capabilities of scaling and quickly confirming times through its Avalanche Consensus Protocol. It can process 4,500 TPS (transactions per second).</p>
    
    <p>Launched on mainnet in 2020, Avalanche has been one of the largest blockchains. According to Defi Llama, it has over $11 billion TVL in its protocol, making it the third-largest DeFi-supporting blockchain after Terra and Binance Smart Chain.</p>
    
    <p>Some of the Ethereum-based protocols, such as the decentralized exchange protocol SushiSwap and the lending protocol Aave, are outstanding elements in the thriving DeFi ecosystem of Avalanche. However, Avalanche isn't only for DeFi. The premise underlying Ava Labs' financial support of metaverse investments is a fast and affordable network that could easily support blockchain-based games and virtual worlds.</p>
    
    <h3>What is the Avalanche (AVAX) token?</h3>
    <p>The native token of Avalanche is AVAX. It is a hard-capped, scarce asset that operates as a fundamental unit of account between various Avalanche subnets as well as a means of fee payment and platform security through staking.</p>
   `,
}

// pairs in white list desc will be hardcode for now, the other will get data from api
export const WHITE_LIST_TOKEN_INFO_PAIR: { [chain in ChainId]?: { [key: string]: boolean } } = {
  [ChainId.BSCMAINNET]: {
    'trx,usdt': true,
    'gmt,usdt': true,
    'axs,usdt': true,
    'dot,usdt': true,
    'tlm,usdt': true,
  },
  [ChainId.MATIC]: {
    'pgx,usdt': true,
    'knc,usdt': true,
  },
  [ChainId.BTTC]: {
    'btt,usdt_e': true,
    'btt,usdt_b': true,
    'btt,usdt_t': true,
  },
  [ChainId.MAINNET]: {
    'slp,usdt': true,
  },
  [ChainId.AVAXMAINNET]: {
    'avax,usdt.e': true,
    'avax,usdt': true,
  },
}
