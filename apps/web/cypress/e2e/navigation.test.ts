import { getTestSelector } from '../utils'

const companyMenu = [{
  label: 'Company',
  items: [{
    label: 'Careers',
    href: 'https://boards.greenhouse.io/uniswaplabs'
  }, {
    label: 'Blog',
    href: 'https://blog.uniswap.org/'
  }]
}, {
  label: 'Protocol',
  items: [{
    label: 'Governance',
    href: 'https://uniswap.org/governance'
  }, {
    label: 'Developers',
    href: 'https://uniswap.org/developers'
  }]
}, {
  label: 'Need help?',
  items: [{
    label: 'Help center',
    href: 'https://support.uniswap.org/hc/en-us'
  }, {
    label: 'Contact us',
    href: 'https://support.uniswap.org/hc/en-us/requests/new'
  }]
}]

const tabs = [{
  label: 'Trade',
  path: '/swap',
  dropdown: [{
    label: 'Swap',
    path: '/swap'
  }, {
    label: 'Limit',
    path: '/limit'
  }, {
    label: 'Send',
    path: '/send'
  }]
}, {
  label: 'Explore',
  path: '/explore',
  dropdown: [{
    label: 'Tokens',
    path: '/explore/tokens'
  }, {
    label: 'Pools',
    path: '/explore/pools'
  }, {
    label: 'Transactions',
    path: '/explore/transactions'
  }]
}, {
  label: 'Pool',
  path: '/pool',
  dropdown: [{
    label: 'View position',
    path: '/pool'
  }, {
    label: 'Create position',
    path: '/add'
  }]
}]

const socialMediaLinks = [
  'https://github.com/Uniswap',
  'https://x.com/Uniswap',
  'https://discord.com/invite/uniswap'
]

describe('Navigation', () => {
  beforeEach(() => {
    cy.viewport(1400, 900)
    cy.visit('/?intro=true')
  })

  it('clicking nav icon redirects to home page', () => {
    cy.get('nav').within(() => {
      cy.visit('/swap')
      cy.get(getTestSelector('nav-uniswap-logo')).click()
      cy.url().should('include', '/?intro=true')
    })
  })

  describe('company menu', () => {
    it('contains appropriate sections and links', () => {
      cy.get(getTestSelector('nav-company-menu')).should('be.visible').trigger('mouseenter')
      cy.get(getTestSelector('nav-company-dropdown')).within(() => {
        companyMenu.forEach((section) => {
          cy.contains(section.label).should('be.visible')
          section.items.forEach((item) => {
            cy.contains('a', item.label).invoke('attr','href').should('equal', item.href)
          })
        })
      })
    })
    it('Download Uniswap opens the app modal', () => {
      cy.get(getTestSelector('nav-company-menu')).should('be.visible').trigger('mouseenter')
      cy.get(getTestSelector('nav-dropdown-download-app')).should('be.visible').click()
      cy.get(getTestSelector('download-uniswap-modal')).should('be.visible')
    })
  })

  tabs.forEach((tab) => {
    describe(`${tab.label} tab`, () => {
      it(`displays tab`, () => {
        cy.get('nav').within(() => {
          cy.contains(tab.label).should('be.visible').click()
        })
        cy.url().should('include', tab.path)
      })
      it('expands tab with appropriate links', () => {
        tab.dropdown.forEach((item) => {
          cy.get(getTestSelector(`${tab.label}-tab`)).should('be.visible').trigger('mouseenter')
          cy.get(getTestSelector(`${tab.label}-menu`)).should('be.visible').within(() => {
            cy.contains(item.label).should('be.visible').click()
            cy.url().should('include', item.path)
          })
        })
      })
    })
  })

  it('includes social media links', () => {
    socialMediaLinks.forEach((link) => {
      cy.get(`a[href='${link}']`).should('be.visible')
    })
  })
})

describe('Mobile navigation', () => {
  beforeEach(() => {
    cy.viewport(449, 900)
    cy.visit('/?intro=true')
  })

  it('tabs are accessible in mobile drawer', () => {
    tabs.forEach((tab) => {
      cy.get(getTestSelector('nav-company-menu')).should('be.visible').click()
      cy.get(getTestSelector('company-menu-mobile-drawer')).should('be.visible').within(() => {
        cy.contains(tab.label).should('be.visible').click()
        cy.url().should('include', tab.path)
      })
    })
  })

  it('display settings are visible in mobile menu', () => {
    cy.get(getTestSelector('nav-company-menu')).should('be.visible').click()
    cy.contains('Display settings').should('be.visible').click()
    const settings = ['Language', 'Currency']
    settings.forEach((label) => {
      cy.contains(label).should('be.visible')
    })
  })

  it('contains appropriate sections and links', () => {
    cy.get(getTestSelector('nav-company-menu')).should('be.visible').click()
    cy.get(getTestSelector('company-menu-mobile-drawer')).should('be.visible').within(() => {
      companyMenu.forEach((section) => {
        cy.contains(section.label).should('be.visible').click()
        section.items.forEach((item) => {
          cy.contains('a', item.label).invoke('attr','href').should('equal', item.href)
        })
      })
    })
  })

  it('Download Uniswap is visible', () => {
    cy.get(getTestSelector('nav-company-menu')).should('be.visible').click()
    cy.get(getTestSelector('nav-dropdown-download-app')).should('be.visible')
  })

  it('includes social media links', () => {
    socialMediaLinks.forEach((link) => {
      cy.get(`a[href="${link}"]`).should('be.visible')
    })
  })

  it('shows bottom bar on token details page on mobile', () => {
    cy.visit('/explore/tokens/ethereum/NATIVE')
    cy.get(getTestSelector('tdp-mobile-bottom-bar')).should('be.visible').within(() => {
      cy.contains('Buy').should('be.visible')
      cy.contains('Sell').should('be.visible')
      cy.contains('Send').should('be.visible')
    })
  })
})
