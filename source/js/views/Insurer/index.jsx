import React from 'react';
import getWeb3 from 'utils/getWeb3'
import { default as contract } from 'truffle-contract'

import tether_artifacts from '../../../../build/contracts/TetherStub.json'
import insurance_artifacts from '../../../../build/contracts/Insurance.json'

var accounts;
var account;
const Insurance = contract(insurance_artifacts);
const Tether = contract(tether_artifacts);

export default class App extends React.Component{


  constructor(props){
    super(props);
    this.state = {
      ownerBalance: "unknown",
      tetherBalance: "unknown",
      fundAmount: 0
    }
    this.getAccounts();
    this.updateBalances = this.updateBalances.bind(this);
    this.fundInsurance = this.fundInsurance.bind(this);
  }

  getAccounts() {
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
  }

  async getTetherBalance(enquired) {
    const balance = await this.tether.balanceOf.call(enquired, {from: account});
    return balance.valueOf()
  }

  async getInsuranceBalance(enquired) {
      const balance = await this.insurance.balanceOf.call(enquired, {from: account});
      return balance.valueOf()
  }

  async componentDidMount(){
    Insurance.setProvider(web3.currentProvider);
    Tether.setProvider(web3.currentProvider);
    this.insurance = await Insurance.deployed();
    this.tether = await Tether.deployed();
  }

  async updateBalances(e) {
    e.preventDefault();

    try {
      const ownerBalance = await this.getInsuranceBalance(account);
      const tetherBal = await this.getTetherBalance(account);
      console.log("insurance owner balance " + ownerBalance);
      console.log("tether balance " + tetherBal);
      this.setState({
        ownerBalance: ownerBalance,
        tetherBalance: tetherBal,
      })
    } catch(error) {
      console.log(error)
    }
  }

  async fundInsurance(e) {
    e.preventDefault();

    try {
      await this.tether.approve.sendTransaction(this.insurance.address, 100, {from:account});
      await this.insurance.init.sendTransaction(100, 100, 100, {from: account});
      await this.insurance.contribute.sendTransaction({from: account, value: this.state.fundAmount});
    } catch(error) {
      console.log(error)
    }
  }

  updateFundAmount(evt) {
    this.setState({
      fundAmount: evt.target.value
    });
  }

render(){
    return (
      <div>
      <form onSubmit={this.updateBalances}>
        <button>IPT & Tether Balance</button>
      </form>
      Current Account Owner IPT Balance: <span id="iptBalance">{this.state.ownerBalance}</span><br/>
      Current Account Tether Balance: <span id="tetherBalance">{this.state.tetherBalance}</span><br/>
      <form onSubmit={this.fundInsurance}>
        <input value = {this.state.fundAmount} onChange={evt => this.updateFundAmount(evt)}/>
        <button>Fund Insurance</button>
      </form>
      </div>
    );
  }
}
