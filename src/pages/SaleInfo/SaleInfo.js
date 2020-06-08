import React from 'react'

import './SaleInfo.css'
import DMMLogo from '../../assets/images/dmm-logo.svg'
import DAI_USDC_BONDING_CURVE from '../../assets/images/DAI_USDC_Bonding_Curve.png'
import ETH_BONDING_CURVE from '../../assets/images/ETH_Bonding_Curve.png'
import Button from '@material-ui/core/Button'

class SaleInfo extends React.Component {
  render() {
    return (
      <div className={'infoPage'}>
        <div className={'navbar'}>
          <div className={'leftSide'}>
            <div className={'logoWrapper'}>
              <div className={'logo'}>
                <img src={DMMLogo} alt={'DMM Logo'} />
              </div>
              <div className={'logoText'}>
                DMM <span className={'swapText'} />
              </div>
            </div>
          </div>
          <div className={'rightSide'}>
            <Button onClick={() => this.props.onClose()}>Close</Button>
          </div>
        </div>
        <div className={'infoContent'}>
          <div className={'infoTitle'}>DMG Token Sale</div>
          <div className={'infoBody'}>
            <p>
              The DeFi Money Market DAO will be composed of a total of 250,000,000 DMG Governance Tokens (“DMG”). This
              initial crowdsale (comprising private and public) is capped at 25,000,000 DMG accounting for 10% percent
              of the total supply. This is provided that the foundation shall have the right to modify this amount, in
              its sole discretion if needed.
            </p>
            <p>
              The private sale will begin at a starting price of <b>$0.16 per token</b> for a total diluted valuation of
              $40M. Limit sell orders will be placed in blocks of 83,333 DMG, increasing 1.5% in price each block to
              enable price discovery as DMG is purchased. The public sale will also occur a couple weeks afterwards with
              the starting price marked up by 25% from where the private sale ended. The below charts showcase the prior
              criteria as a bonding curve, assuming a starting price of $0.20 (due to the 25% mark up against the
              initial price of $0.16).
            </p>
            <div className={'bondingCurveImageWrapper'}>
              <img className={'bondingCurveImage'} src={ETH_BONDING_CURVE} alt={'ETH Bonding Curve'}/>
            </div>
            <div className={'bondingCurveImageWrapper'}>
              <img className={'bondingCurveImage'} src={DAI_USDC_BONDING_CURVE} alt={'DAI & USDC Bonding Curve'}/>
            </div>
            <p>
              The current expected distribution of tokens over time is as follows:
              <ul>
                <li>30% will be sold in multiple different Public Token Sale(s) over time.</li>
                <li>
                  30% will be reserved to incentivize ecosystem developers, partners, and integrations with other
                  protocols to assure DMME is a vibrant growing global protocol.
                </li>
                <li>
                  40% will go to the foundation for continued development and other general corporate purposes/expenses.
                </li>
              </ul>
            </p>
            <p>
              After the private sale period, the public token sale will begin and the password restriction will be
              removed. During this time, the DMG token will also be listed on{' '}
              <a href={'https://mesa.eth.link'} target={'_blank'}>
                mesa.eth.link
              </a>
              , a Decentralized Exchange powered on the backend by the Gnosis Protocol and the frontend governed by the
              DXdao.
            </p>
            <div className={'infoTitle'}>DMG Token Details</div>
            <p>
              Ownership of DMG represents the right to govern the DMM protocol (including both on-chain parameters and
              which off-chain assets are supported) and claim on the excess revenue generated from the DeFi Money Market
              Ecosystem (DMME). The DMME is currently generating revenue from $8.5M in real world assets with the
              ability to scale much higher
            </p>
            <p>
              The DMG token is hard capped at a total supply of 250M tokens with the{' '}
              <a
                href={
                  'https://github.com/defi-money-market-ecosystem/protocol/blob/master/contracts/governance/dmg/DMGToken.sol'
                }
                target={'_blank'}
              >
                contract code
              </a>{' '}
              based on Compound’s COMP token with some tweaks and new features such as gasless transaction support and a
              native burn function.
            </p>
            <p>
              The incentive model for DMG ownership is quite straightforward and is composed of three main areas:
              <ol>
                <li>
                  Represents a claim on the excess interest revenue generated from assets which is passed down to DMG
                  holders through a token burn.
                </li>
                <li>
                  Enables voting and delegation within the DMM DAO, which is in the process of being formalized and
                  decentralized.
                </li>
                <li>
                  Enables an individual or a group to reserve Principal or Affiliate membership to introduce assets into
                  the DMME through which they will also generate asset introduction or origination fees.
                </li>
              </ol>
            </p>
            <p>
              These parameters are subject to DMM DAO governance and can evolve over time as needed. More precise
              details on how the DMG token will be used with the DMM Ecosystem can be found{' '}
              <a
                href={
                  'https://docs.google.com/document/d/1HaR_twza6oxegvWSNNwzSfyK322U7SV1VNDWDV2k-aM/edit?usp=sharing'
                }
                target={'_blank'}
              >
                here
              </a>
              .
            </p>
            <div className={'infoTitle'}>DeFi Money Market Details</div>
            <p>
              The DeFi Money Market (DMM) provides a trust-minimized, transparent, and permissionless environment to
              empower all users across the world to once again earn a positive yield on their digital assets, backed by
              a basket of interest-generating real-world assets brought on-chain. In the DMM Ecosystem, both the
              off-chain assets backing mTokens and the interest revenue generated from these assets are
              overcollateralized protecting depositors. The DMM Ecosystem currently has had over $600k worth of mTokens
              purchased from our{' '}
              <a href={'https://app.defimoneymarket.com'} target={'_blank'}>
                app page
              </a>
              .
            </p>
            <p>
              Being backed by real-world assets also means mTokens can offer users a much more stable and reliable ROI
              on their deposited funds. This is in contrast to many other on-chain money markets which offer variable
              interest rates driven by leverage traders or other borrowing. Transparency into the off-chain assets
              backing mTokens and their valuations can be found on-chain or on the DMM Explorer. Additionally, our
              collaboration and usage of Chainlink’s decentralized oracles adds an extra layer of security and trust to
              the ecosystem by writing essential data on-chain that details the ecosystem’s valuation and total active
              collateralization.
            </p>
            <div className={'fullDocumentWrapper'}>
              <div className={'fullDocument'}>
                <div className={'fullDocumentText'}>Read the full document here:</div>
                <a
                  href={
                    'https://docs.google.com/document/d/1HaR_twza6oxegvWSNNwzSfyK322U7SV1VNDWDV2k-aM/edit?usp=sharing'
                  }
                  target={'_blank'}
                >
                  <Button>DMG Sale</Button>
                </a>
              </div>
            </div>
            <div className={'infoTitle'}>More Information</div>
            <p>For more information about the DMM DAO, please check out these resources below.</p>
            <p>
              Website:
              <br />
              <a href={'https://defimoneymarket.com'} target={'_blank'}>
                https://defimoneymarket.com
              </a>
            </p>
            <p>
              White Paper:
              <br />
              <a href={'https://defimoneymarket.com/DMM-Ecosystem.pdf'} target={'_blank'}>
                https://defimoneymarket.com/DMM-Ecosystem.pdf
              </a>
            </p>
            <p>
              Security Audit:
              <br />
              <a href={'https://defimoneymarket.com/DMM-SECBIT-Audit.pdf'} target={'_blank'}>
                https://defimoneymarket.com/DMM-SECBIT-Audit.pdf
              </a>
            </p>
            <p>
              Blog:
              <br />
              <a href={'https://medium.com/dmm-dao'} target={'_blank'}>
                https://medium.com/dmm-dao
              </a>
            </p>
            <p>
              mToken Swap App:
              <br />
              <a href={'https://app.defimoneymarket.com/'} target={'_blank'}>
                https://app.defimoneymarket.com/
              </a>
            </p>
            <p>
              Asset Explorer:
              <br />
              <a href={'https://explorer.defimoneymarket.com/'} target={'_blank'}>
                https://explorer.defimoneymarket.com/
              </a>
            </p>
            <p>
              Github:
              <br />
              <a href={'https://github.com/defi-money-market-ecosystem/protocol'} target={'_blank'}>
                https://github.com/defi-money-market-ecosystem/protocol/
              </a>
            </p>
            <p>
              Feel free to contact us on our social media channels such as{' '}
              <a href={'https://twitter.com/DMMDAO'} target={'_blank'}>
                Twitter
              </a>
              ,{' '}
              <a href={'https://discord.gg/nTSgC9h'} target={'_blank'}>
                Discord
              </a>
              , or{' '}
              <a href={'https://t.me/DmmOfficial'} target={'_blank'}>
                Telegram
              </a>
              . We hope for you to join us on this journey!
            </p>
          </div>
        </div>
      </div>
    )
  }
}

export default SaleInfo
