import Page from "../page";
import Header from "./header";
import Swap from "./swap";

export default class SwapPage extends Page {
  constructor() {
    super();
    this.header = new Header();
    this.swap = new Swap();
  }

  connectBrowserWallet() {
    const tutorialPopup = this.header.getTutorialPopup();
    tutorialPopup.click();
    const connectWalletButton = this.header.getConnectWalletBtn();
    connectWalletButton.click();
    const acceptTermAndConditionCheckbox = this.header.getAcceptCheckbox();
    acceptTermAndConditionCheckbox.check();
    const metaMaskWallet = this.header.getMetaMaskWalletOption();
    metaMaskWallet.click();
  }

  waitUntilLoggedIn() {
    cy.waitUntil(() => {
      const walletAddress = this.header.getWalletAddress();
      return walletAddress.should("exist");
    });
  }

  getLoggedInWalletAddress() {
    const walletAddress = this.header.getWalletAddress();
    return walletAddress.invoke("text");
  }
  searchToken(token) {
    const tokenSearchTxt = this.swap.getTokenSearchBox();
    tokenSearchTxt.type(`${token.symbol}`);
    //todo: handle popup still appear after press enter
    const searchItem = this.swap.getTokenSearchByName(`${token.name}`);
    searchItem.click({ force: true });
  }

  selectTokenIn(token) {
    const tokenInMenu = this.swap.getTokenInOption();
    tokenInMenu.click();
    this.searchToken(token);
  }

  selectTokenOut(token) {
    const tokenOutMenu = this.swap.getTokenOutOption();
    tokenOutMenu.click();
    this.searchToken(token);
  }

  setInputAmount(amount) {
    const inputAmountTxt = this.swap.getInputAmountTxt();
    inputAmountTxt.clear();
    inputAmountTxt.type(amount);
  }

  clickSwapButton() {
    const swapBtn = this.swap.getSwapButton();
    swapBtn.click();
  }

  getRoute() {
    cy.waitUntil(() => {
      const routePercent = this.swap.getRoutePercentLabel();
      routePercent.should("exist");
    
      return routePercent.invoke("text");
    });
  }

  getPriImpact() {
    const moreInfoBtn = this.swap.getMoreInfoBtn();
    moreInfoBtn.click();
    const priceImpact = this.swap
      .getPriceImpactLabel()
      .invoke("text")
      .then((text) => text.replace("< ", "").split(/(?=%)/));

    if (priceImpact[0] > 5 && priceImpact[0] < 15) {
      return this.swap.getWaringMessage("Price Impact is High");
    } else if (priceImpact[0] > 5) {
      return this.swap.getWaringMessage("Price Impact is Very High");
    } else {
      return true;
    }
  }

  getBalance() {
    cy.waitUntil(() => {
      const balanceLbl = this.header.getWalletBalance();
      balanceLbl.should("exist");
      const balance = balanceLbl.invoke("text");
      return balance;
    });
  }
}
