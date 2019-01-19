import { thorify } from 'thorify'
import { extend } from 'thorify/dist/extend';
import { isEmpty } from 'lodash';
import * as Arkane from '@arkane-network/arkane-connect';

import { watchBalance } from './web3connect';

import {
  INITIALIZE,
  UPDATE_ACCOUNT,
  UPDATE_NETWORK_ID,
} from './creators'

const Web3 = require("web3");

const arkane = async (dispatch, getState) => {
  const { web3connect } = getState();

  return new Promise(async (resolve, reject) => {
    if (web3connect.web3) {
      resolve(web3connect.web3);
      return;
    }

    window.arkaneConnect = new Arkane.ArkaneConnect('Vexchange');
    const web3 = thorify(new Web3(), "https://vechain-api.monti.finance");

    extend(web3);

    window.arkaneConnect.checkAuthenticated()
      .then(result => {
        result.authenticated(auth => {
          dispatch({
            type: INITIALIZE,
            payload: web3,
            meta: {
              arkaneConnect: window.arkaneConnect,
              provider: 'arkane'
            },
          });

          resolve(web3);
          return;

        }).notAuthenticated(auth => {
          dispatch({ type: INITIALIZE });
          reject();
          return;
        });
      })
      .catch(reason => {
        dispatch({ type: INITIALIZE });
        reject();
        return;
      });

    dispatch({ type: INITIALIZE });
    reject();
  });
};

export default arkane;
