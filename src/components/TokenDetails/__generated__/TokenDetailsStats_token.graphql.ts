/**
 * @generated SignedSource<<f5f1cd0be4ace59e346ddf6509acef42>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
export type Chain = "ARBITRUM" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type TokenDetailsStats_token$data = {
  readonly address: string | null;
  readonly chain: Chain;
  readonly " $fragmentType": "TokenDetailsStats_token";
};
export type TokenDetailsStats_token$key = {
  readonly " $data"?: TokenDetailsStats_token$data;
  readonly " $fragmentSpreads": FragmentRefs<"TokenDetailsStats_token">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TokenDetailsStats_token",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "chain",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "address",
      "storageKey": null
    }
  ],
  "type": "Token",
  "abstractKey": null
};

(node as any).hash = "ebc6c00ba56cff9e203cb36a24d1cedc";

export default node;
