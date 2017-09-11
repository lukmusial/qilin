var Insurance = artifacts.require("./ManualAuthorizationInsurance.sol");


var multiplier = Math.pow(10,16)

contract('ManualAuthorizationInsurance', function(accounts) {

   //truffle will by default assign accounts[0] as an owner of the deployed contract
  const account_sponsor = accounts[0];
  const account_one = accounts[1];
  const account_authorizer = accounts[2];

  const amount = multiplier*88;

  function humanReadableBalance(account) {
     return Math.floor(web3.eth.getBalance(account).toNumber()/multiplier);
  }

  it("when an insurance claim is made on a seeded pool then insured amount can be withdrawn only when authorised", async function () {
    var insurance;

    var account_one_starting_balance = humanReadableBalance(account_one);
    var insureAmount = multiplier*23;
    var poolSize = multiplier*100;
    var premium = multiplier*15;
    var amountToVerify = (insureAmount - premium)/ multiplier;
    var timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp

    var insurance = await Insurance.deployed();
    await insurance.init.sendTransaction(poolSize, poolSize/2, timestamp, {from: account_sponsor});
    await insurance.contribute.sendTransaction({from: account_sponsor, value: insureAmount + 10});
    await insurance.insure.sendTransaction(insureAmount, {from:account_one, value: premium});
    await insurance.claim.sendTransaction({from:account_one});
    await insurance.assignAuthoriser.sendTransaction(account_authorizer, {from:account_sponsor});
    await insurance.authoriseClaim.sendTransaction(account_one, {from:account_authorizer});
    await insurance.withdraw.sendTransaction({from:account_one});
    var account_one_ending_balance = humanReadableBalance(account_one);
    assert.approximately(account_one_ending_balance, account_one_starting_balance + amountToVerify, 3, "claim not recorded properly");
  })

});
