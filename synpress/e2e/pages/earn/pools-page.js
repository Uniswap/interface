import Page from "../page";
import Header from "../swap/header";
export default class PoolsPage extends Page {
  constructor() {
    super();
    this.header = new Header();
  }

  visit() {
    cy.visit("/pools");
  }
}
