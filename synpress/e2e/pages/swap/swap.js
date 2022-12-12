import Page from "../page";

export default class Swap extends Page {
  getInputAmountTxt() {
    return cy.get("#swap-currency-input .token-amount-input");
  }

  getTokenInOption() {
    return cy.get("#swap-currency-input .token-symbol-container");
  }

  getTokenOutOption() {
    return cy.get("#swap-currency-output .token-symbol-container");
  }

  getTokenSearchBox() {
    return cy.get("#token-search-input");
  }

  getSwapButton() {
    return cy.get("#swap-button");
  }

  getTokenSearchByName(name) {
    cy.wait(700);
    return cy.get(`div[title='${name}']`).first();
  }

  getRoutePercentLabel() {
    return cy.xpath("//div[contains(@class,'StyledPercent')]");
  }

  getMoreInfoBtn() {
    return cy.contains("div", "MORE INFORMATION");
  }

  getPriceImpactLabel() {
    return cy.xpath(
      "//*[contains(@class,'AdvancedSwapDetailsDropdown')]//div[contains(text(),'%')]"
    );
  }

  getWaringMessage(content) {
    return cy.contains(content).should("be.visible");
  }
}
