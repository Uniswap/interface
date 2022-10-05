/**
 * @generated SignedSource<<20d41ef76d481fab4efa3ce0dffe6769>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type HomeScreenQuery$variables = {
  owner: string;
};
export type HomeScreenQuery$data = {
  readonly portfolios: ReadonlyArray<{
    readonly " $fragmentSpreads": FragmentRefs<"TotalBalance_portfolio">;
  } | null> | null;
};
export type HomeScreenQuery = {
  response: HomeScreenQuery$data;
  variables: HomeScreenQuery$variables;
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
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "HomeScreenQuery",
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
            "args": null,
            "kind": "FragmentSpread",
            "name": "TotalBalance_portfolio"
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
    "name": "HomeScreenQuery",
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
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "value",
                "storageKey": null
              },
              (v2/*: any*/)
            ],
            "storageKey": null
          },
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "bbb38bedadc5b937ede6ae7f56546a73",
    "id": null,
    "metadata": {},
    "name": "HomeScreenQuery",
    "operationKind": "query",
    "text": "query HomeScreenQuery(\n  $owner: String!\n) {\n  portfolios(ownerAddresses: [$owner]) {\n    ...TotalBalance_portfolio\n    id\n  }\n}\n\nfragment TotalBalance_portfolio on Portfolio {\n  tokensTotalDenominatedValue {\n    value\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "e2f0cb814a240dfbb4b5efb53482ff67";

export default node;
