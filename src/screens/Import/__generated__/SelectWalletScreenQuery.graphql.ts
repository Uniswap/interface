/**
 * @generated SignedSource<<a4585945a46d77b68946c1604b3666e6>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type SelectWalletScreenQuery$variables = {
  ownerAddresses: ReadonlyArray<string>;
};
export type SelectWalletScreenQuery$data = {
  readonly portfolios: ReadonlyArray<{
    readonly ownerAddress: string;
    readonly tokensTotalDenominatedValue: {
      readonly value: number;
    } | null;
  } | null> | null;
};
export type SelectWalletScreenQuery = {
  response: SelectWalletScreenQuery$data;
  variables: SelectWalletScreenQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "ownerAddresses"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "ownerAddresses",
    "variableName": "ownerAddresses"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "ownerAddress",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v4 = {
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
    "name": "SelectWalletScreenQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Amount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValue",
            "plural": false,
            "selections": [
              (v3/*: any*/)
            ],
            "storageKey": null
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
    "name": "SelectWalletScreenQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Amount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValue",
            "plural": false,
            "selections": [
              (v3/*: any*/),
              (v4/*: any*/)
            ],
            "storageKey": null
          },
          (v4/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "e6e4bff700734cd72850beb858cea476",
    "id": null,
    "metadata": {},
    "name": "SelectWalletScreenQuery",
    "operationKind": "query",
    "text": "query SelectWalletScreenQuery(\n  $ownerAddresses: [String!]!\n) {\n  portfolios(ownerAddresses: $ownerAddresses) {\n    ownerAddress\n    tokensTotalDenominatedValue {\n      value\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "aab6e95e9b6bdcab6a92a9042fa3909d";

export default node;
