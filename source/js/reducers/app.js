import { Map } from 'immutable';
import getWeb3 from 'utils/getWeb3'
import { default as contract } from 'truffle-contract'

import {
  TEST_ACTION,
  TEST_ASYNC_ACTION_START,
  TEST_ASYNC_ACTION_ERROR,
  TEST_ASYNC_ACTION_SUCCESS,
} from 'actions/app';

import insurance_artifacts from '../../../build/contracts/Insurance.json'

var Insurance = contract(insurance_artifacts);

const initialState = Map({
  counter: "no balance",
  asyncLoading: false,
  asyncError: null,
  asyncData: null,
});

const actionsMap = {
  [TEST_ACTION]: (state) => {
    var accounts;
    var account;
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];
    });

    Insurance.setProvider(web3.currentProvider);
    var ins;
    var counter;
    var balance;
    Insurance.deployed().then(function(instance) {
      ins = instance;
      return ins.balanceOf.call(account, {from: account});
    }).then(function(value) {
      counter = value.valueOf();
      alert(counter);
    }).catch(function(e) {
      console.log(e);
    });

    counter = "ass";
     return state.merge(Map({
         counter,
     }));
  },

  // Async action
  [TEST_ASYNC_ACTION_START]: (state) => {
    return state.merge(Map({
      asyncLoading: true,
      asyncError: null,
      asyncData: null,
    }));
  },
  [TEST_ASYNC_ACTION_ERROR]: (state, action) => {
    return state.merge(Map({
      asyncLoading: false,
      asyncError: action.data,
    }));
  },
  [TEST_ASYNC_ACTION_SUCCESS]: (state, action) => {
    return state.merge(Map({
      asyncLoading: false,
      asyncData: action.data,
    }));
  },
};

export default function reducer(state = initialState, action = {}) {
  const fn = actionsMap[action.type];
  return fn ? fn(state, action) : state;
}
