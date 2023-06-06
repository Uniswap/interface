import { USDC_MAINNET } from '../../../src/constants/tokens'
import { getTestSelector } from '../../utils'

describe('mini-portfolio activity history', () => {
  beforeEach(() => {
    cy.hardhat()
      .then((hardhat) => hardhat.wallet.getTransactionCount())
      .then((nonce) => {
        // Mock graphql response to include specific nonces.
        cy.intercept(
          {
            method: 'POST',
            url: 'https://beta.api.uniswap.org/v1/graphql',
          },
          {
            body: {
              data: {
                portfolios: [
                  {
                    id: 'UG9ydGZvbGlvOjB4NUNlYUI3NGU0NDZkQmQzYkY2OUUyNzcyMDBGMTI5ZDJiQzdBMzdhMQ==',
                    assetActivities: [
                      {
                        id: 'QXNzZXRBY3Rpdml0eTpWSEpoYm5OaFkzUnBiMjQ2TUhnME5tUm1PVGs0T0RrNVl6UmtNR1kzWTJNNE9HRTVNVFEzTURBME9EWmtOVGhrTURnNFpqbG1NelkxTnpRM1l6WXdZek15WVRFNE4yWXlaRFEwWVdVNFh6QjRZV1EyWXpCa05XTmlOVEZsWWpjMU5qUTFaRGszT1RneE4yRTJZVEkxTmpreU1UbG1ZbVE1Wmw4d2VEQXpOR0UwTURjMk5EUTROV1kzWlRBNFkyRXhOak0yTm1VMU1ETTBPVEZoTm1GbU56ZzFNR1E9',
                        timestamp: 1681150079,
                        type: 'UNKNOWN',
                        chain: 'ETHEREUM',
                        transaction: {
                          id: 'VHJhbnNhY3Rpb246MHg0NmRmOTk4ODk5YzRkMGY3Y2M4OGE5MTQ3MDA0ODZkNThkMDg4ZjlmMzY1NzQ3YzYwYzMyYTE4N2YyZDQ0YWU4XzB4YWQ2YzBkNWNiNTFlYjc1NjQ1ZDk3OTgxN2E2YTI1NjkyMTlmYmQ5Zl8weDAzNGE0MDc2NDQ4NWY3ZTA4Y2ExNjM2NmU1MDM0OTFhNmFmNzg1MGQ=',
                          blockNumber: 17019453,
                          hash: '0x46df998899c4d0f7cc88a914700486d58d088f9f365747c60c32a187f2d44ae8',
                          status: 'CONFIRMED',
                          to: '0x034a40764485f7e08ca16366e503491a6af7850d',
                          from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                          nonce,
                          __typename: 'Transaction',
                        },
                        assetChanges: [],
                        __typename: 'AssetActivity',
                      },
                      {
                        id: 'QXNzZXRBY3Rpdml0eTpWSEpoYm5OaFkzUnBiMjQ2TUhneE16UXpaR1ppTlROaE9XRmpNR00yWW1aaVpqUTNNRFEyWWpObFkyRXhORGN3TUdZd00yWXhOMkV3WWpnM1pqWXpPRFpsWVRnNU16QTRNVFZtWmpoaFh6QjRZMkUzTXpOalkySm1OelZoTXpnME1ERXhPR1ZpT1RjNU9EVTJOemRpTkdRMk56TTBZemMwWmw4d2VERmlOVEUxTkdGaE5HSTRaakF5TjJJNVptUXhPVE0wTVRFek1tWmpPV1JoWlRFd1pqY3pOVGs9',
                        timestamp: 1681149995,
                        type: 'SEND',
                        chain: 'ETHEREUM',
                        transaction: {
                          id: 'VHJhbnNhY3Rpb246MHgxMzQzZGZiNTNhOWFjMGM2YmZiZjQ3MDQ2YjNlY2ExNDcwMGYwM2YxN2EwYjg3ZjYzODZlYTg5MzA4MTVmZjhhXzB4Y2E3MzNjY2JmNzVhMzg0MDExOGViOTc5ODU2NzdiNGQ2NzM0Yzc0Zl8weDFiNTE1NGFhNGI4ZjAyN2I5ZmQxOTM0MTEzMmZjOWRhZTEwZjczNTk=',
                          blockNumber: 17019446,
                          hash: '0x1343dfb53a9ac0c6bfbf47046b3eca14700f03f17a0b87f6386ea8930815ff8a',
                          status: 'CONFIRMED',
                          to: '0x1b5154aa4b8f027b9fd19341132fc9dae10f7359',
                          from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                          nonce: nonce + 1,
                          __typename: 'Transaction',
                        },
                        assetChanges: [
                          {
                            __typename: 'TokenTransfer',
                            id: 'VG9rZW5UcmFuc2ZlcjoweDVjZWFiNzRlNDQ2ZGJkM2JmNjllMjc3MjAwZjEyOWQyYmM3YTM3YTFfMHhiMWRjNDlmMDY1N2FkNTA1YjUzNzUyN2RkOWE1MDk0YTM2NTkzMWMxXzB4MTM0M2RmYjUzYTlhYzBjNmJmYmY0NzA0NmIzZWNhMTQ3MDBmMDNmMTdhMGI4N2Y2Mzg2ZWE4OTMwODE1ZmY4YQ==',
                            asset: {
                              id: 'VG9rZW46RVRIRVJFVU1fMHgxY2MyYjA3MGNhZjAxNmE3ZGRjMzA0N2Y5MzI3MmU4Yzc3YzlkZGU5',
                              name: 'USD Coin (USDC)',
                              symbol: 'USDC',
                              address: '0x1cc2b070caf016a7ddc3047f93272e8c77c9dde9',
                              decimals: 6,
                              chain: 'ETHEREUM',
                              standard: null,
                              project: {
                                id: 'VG9rZW5Qcm9qZWN0OkVUSEVSRVVNXzB4MWNjMmIwNzBjYWYwMTZhN2RkYzMwNDdmOTMyNzJlOGM3N2M5ZGRlOQ==',
                                isSpam: true,
                                logo: null,
                                __typename: 'TokenProject',
                              },
                              __typename: 'Token',
                            },
                            tokenStandard: 'ERC20',
                            quantity: '18011.212084',
                            sender: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                            recipient: '0xb1dc49f0657ad505b537527dd9a5094a365931c1',
                            direction: 'OUT',
                            transactedValue: null,
                          },
                        ],
                        __typename: 'AssetActivity',
                      },
                    ],
                    __typename: 'Portfolio',
                  },
                ],
              },
            },
          }
        ).as('graphql')
      })
  })

  it('should deduplicate activity history by nonce', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`, { ethereum: 'hardhat' }).hardhat({
      automine: false,
    })

    // Input swap info.
    cy.get('#swap-currency-input .token-amount-input').clear().type('1').should('have.value', '1')
    cy.get('#swap-currency-output .token-amount-input').should('not.have.value', '')

    cy.get('#swap-button').click()
    cy.get('#confirm-swap-or-send').click()
    cy.get(getTestSelector('confirmation-close-icon')).click()

    // Check activity history tab.
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('mini-portfolio-navbar')).contains('Activity').click()

    // Assert that the local pending transaction is replaced by a remote transaction with the same nonce.
    cy.contains('Swapping').should('not.exist')
  })
})
