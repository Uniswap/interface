import SwapPage from "../pages/swap/swap-page";
const data = require("../../fixtures/bsc.json");
const swapPage = new SwapPage();

let metamaskWalletAddress;

describe("Swap Test On With Connect MetaMask Wallet", () => {
  before(() => {
    cy.switchMetamaskAccount;
    cy.addMetamaskNetwork({
      networkName: "Binance Smart Chain Mainnet",
      rpcUrl: "https://bsc.kyberengineering.io",
      chainId: "56",
      symbol: "BNB",
      blockExplorer: "https://bscscan.com",
      isTestnet: false,
    });
    swapPage.getMetamaskWalletAddress().then((address) => {
      console.log(metamaskWalletAddress);
      metamaskWalletAddress = address;
    });
    swapPage.visit("/swap/bnb");
    swapPage.connectBrowserWallet();
    swapPage.acceptMetamaskAccessRequest();
    swapPage.waitUntilLoggedIn();
  });

  context("Connect metamask wallet", () => {
    it("should connect with success", () => {
      swapPage.getLoggedInWalletAddress().then((stakingWalletAddress) => {
        const formattedMetamaskWalletAddress =
          metamaskWalletAddress.slice(0, 6) +
          "..." +
          metamaskWalletAddress.slice(-4);
        expect(stakingWalletAddress.toLowerCase()).to.equal(
          formattedMetamaskWalletAddress.toLowerCase()
        );
        debugger;
      });
      // swapPage.getBalance().then((b) => {
      //   debugger;
      // });
    });
  });

  context("Check route", () => {
    data.forEach((dataSet) => {
      it(`should be displayed swap route : ${dataSet.amountIn} ${dataSet.tokenIn.symbol} to ${dataSet.tokenOut.symbol}`, () => {
        swapPage.selectTokenIn(dataSet.tokenIn);
        swapPage.selectTokenOut(dataSet.tokenOut);
        swapPage.setInputAmount(dataSet.amountIn);
        // home.clickSwapButton();
        const percent = swapPage.getRoute();
        expect(percent).not.to.be.equal("");
        const priceImpact = swapPage.getPriImpact();
        expect(priceImpact).to.be.true;
      });
    });
  });
});
