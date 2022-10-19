/**
 * @generated SignedSource<<c278d958c2ceff911ff56c8b590230c1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type PortfolioBalanceQuery$variables = {
  owner: string;
};
export type PortfolioBalanceQuery$data = {
  readonly portfolios: ReadonlyArray<{
    readonly tokensTotalDenominatedValue: {
      readonly value: number;
    };
  } | null> | null;
};
export type PortfolioBalanceQuery = {
  response: PortfolioBalanceQuery$data;
  variables: PortfolioBalanceQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "owner"
  }
],
v1 = [
  {
    "items": [
      {
        "kind": "Variable",
        "name": "ownerAddresses.0",
        "variableName": "owner"
      }
    ],
    "kind": "ListValue",
    "name": "ownerAddresses"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "PortfolioBalanceQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          {
            "kind": "RequiredField",
            "field": {
              "alias": null,
              "args": null,
              "concreteType": "Amount",
              "kind": "LinkedField",
              "name": "tokensTotalDenominatedValue",
              "plural": false,
              "selections": [
                {
                  "kind": "RequiredField",
                  "field": (v2/*: any*/),
                  "action": "LOG",
                  "path": "portfolios.tokensTotalDenominatedValue.value"
                }
              ],
              "storageKey": null
            },
            "action": "LOG",
            "path": "portfolios.tokensTotalDenominatedValue"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "PortfolioBalanceQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "Amount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValue",
            "plural": false,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/)
            ],
            "storageKey": null
          },
          (v3/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "9e94ca76dbced5590eaa4b2fbcc91c4f",
    "id": null,
    "metadata": {},
    "name": "PortfolioBalanceQuery",
    "operationKind": "query",
    "text": "query PortfolioBalanceQuery(\n  $owner: String!\n) {\n  portfolios(ownerAddresses: [$owner]) {\n    tokensTotalDenominatedValue {\n      value\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "6b06c283b18a2715a77ecc4ca5e08182";

export default node;
