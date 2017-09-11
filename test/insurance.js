require('babel-polyfill');
var Insurance = artifacts.require("./Insurance.sol");


var multiplier = Math.pow(10,16)

contract('Insurance', function(accounts) {

   //truffle will by default assign accounts[0] as an owner of the deployed contract
  const account_sponsor = accounts[0];
  const account_one = accounts[1];
  const account_two = accounts[2];

  const amount = multiplier*88;

  function humanReadableBalance(account) {
     return Math.floor(web3.eth.getBalance(account).toNumber()/multiplier);
  }

  it("when an insurance claim is made on a seeded pool then insured amount can be withdrawn", async function () {
    var account_one_starting_balance = humanReadableBalance(account_one);
    var insureAmount = multiplier*23;
    var poolSize = multiplier*100;
    var premium = multiplier*15;
    var amountToVerify = (insureAmount - premium)/ multiplier;
    var timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp

    var insurance = await Insurance.deployed()
    await insurance.init.sendTransaction(poolSize, poolSize/2, timestamp, {from: account_sponsor});
    await insurance.contribute.sendTransaction({from: account_sponsor, value: insureAmount + 10});
    await insurance.insure.sendTransaction(insureAmount, {from:account_one, value: premium});
    await insurance.claim.sendTransaction({from:account_one});
    await insurance.withdraw.sendTransaction({from:account_one});

    var account_one_ending_balance = humanReadableBalance(account_one);
    assert.approximately(account_one_ending_balance, account_one_starting_balance + amountToVerify, 3, "claim not recorded properly");
  })

    it("when an insurance claim is not made then insured amount can not be withdrawn", async function () {
      var account_one_starting_balance = humanReadableBalance(account_one);
      var insureAmount = multiplier*23;
      var poolSize = multiplier*100;
      var premium = multiplier*15;
      var amountToVerify = premium/ multiplier;
      var timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp

      var insurance =  await Insurance.deployed();
      await insurance.init.sendTransaction(poolSize, poolSize/2, timestamp, {from: account_sponsor});
      await insurance.contribute.sendTransaction({from: account_sponsor, value: insureAmount + 10});
      await insurance.insure.sendTransaction(insureAmount, {from:account_one, value: premium});
      await insurance.withdraw.sendTransaction({from:account_one});
      var account_one_ending_balance = humanReadableBalance(account_one);
      assert.approximately(account_one_ending_balance, account_one_starting_balance - amountToVerify, 3, "only premium should be deducted");
    })

    //according to documentation, throw will refund the caller with ether supplied minus the gas used
    //in this case however the gas used appears to be more than the provided premium in other tests
    //so for the purpose of this test we increase premium and other amounts to make the demonstration clearer
    it("when an insurance request is raised when pool is insufficient, request is denied", async function () {
      var account_one_starting_balance = humanReadableBalance(account_one);
      var insureAmount = multiplier*230;
      var poolSize = multiplier*1000;
      var premium = multiplier*150;
      var gasUsageEstimate = multiplier*45; //heuristic, as insurance.insure.estimateGas() returns NaN
      var amountToVerify = gasUsageEstimate/ multiplier;
      var timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp

      var insurance = await Insurance.new();
      await insurance.init.sendTransaction(poolSize, poolSize/2, timestamp, {from: account_sponsor});
      await insurance.contribute.sendTransaction({from: account_sponsor, value: 0});
      try {
        await insurance.insure.sendTransaction(insureAmount, {from:account_one, value: premium});
        assert.fail();
      }
      catch(error) {
          var account_one_ending_balance = humanReadableBalance(account_one);
          assert.approximately(account_one_ending_balance, account_one_starting_balance - amountToVerify, 3, "account not affected");
      }
    })

  it('creation: should create an initial balance of 100 for the creator', async function () {
    var ins = await Insurance.deployed();
    var balance = await ins.balanceOf.call(accounts[0]);
    assert.strictEqual(balance.toNumber(), 100);
  })

  it("can participate if pool maxed and will issue tokens which allow withdrawal", async function () {
    var poolSize = multiplier*100;
    var insureAmount = multiplier*23;
    var expectedWithdrawal = poolSize * 0.24 / multiplier
    var account_two_starting_balance = humanReadableBalance(account_two);
    var account_two_ending_balance = 0;
    var timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp

    var insurance =  await Insurance.new();
    await insurance.init.sendTransaction(poolSize, poolSize/2, timestamp, {from: account_sponsor});
    await insurance.contribute.sendTransaction({from: account_sponsor, value: poolSize +1});
    await insurance.participate.sendTransaction(account_two, 24, {from: account_sponsor});
    var oneBalance = await insurance.balanceOf.call(account_two)
    assert.strictEqual(oneBalance.toNumber(), 24)
    var sponsorBalance = await insurance.balanceOf.call(account_sponsor)
    assert.strictEqual(sponsorBalance.toNumber(), 76)

    await insurance.withdrawAsParticipant.sendTransaction({from: account_two})

    account_two_ending_balance = humanReadableBalance(account_two);
    assert.approximately(account_two_ending_balance, account_two_starting_balance + expectedWithdrawal, 2, "not withdrawn expected amount");
    var finalOneBalance = await insurance.balanceOf.call(account_two)
    assert.strictEqual(finalOneBalance.toNumber(), 0)
    var finalSponsorBalance = await insurance.balanceOf.call(account_sponsor)
    assert.strictEqual(finalSponsorBalance.toNumber(), 76)
    }
  )

  it("should not allow further withdrawals if already withdrawn", async function () {
    var poolSize = multiplier*100;
    var insureAmount = multiplier*23;
    var expectedWithdrawal = poolSize * 0.24 / multiplier
    var gasUsageEstimate = multiplier*45 / multiplier;
    var account_two_starting_balance = humanReadableBalance(account_two);
    var timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp

    var insurance =  await Insurance.new();
    await insurance.init.sendTransaction(poolSize, poolSize/2, timestamp, {from: account_sponsor});
    await insurance.contribute.sendTransaction({from: account_sponsor, value: poolSize +1});
    await insurance.participate.sendTransaction(account_two, 24, {from: account_sponsor});
    await insurance.withdrawAsParticipant.sendTransaction({from: account_two})
    var account_two_ending_balance = humanReadableBalance(account_two);
    assert.approximately(account_two_ending_balance, account_two_starting_balance + expectedWithdrawal, 2, "not withdrawn expected amount");
    try {
        await insurance.withdrawAsParticipant.sendTransaction({from: account_two});
        assert.fail();
    }
    catch(error) {
        var account_two_new_ending_balance = humanReadableBalance(account_two);
        assert.approximately(account_two_new_ending_balance, account_two_ending_balance - gasUsageEstimate, 2, "should not allow to withdraw twice");
     }
  })

    it("if no other participants, owner is sole participants and can withdraw", async function () {
      var insurance;

      var poolSize = multiplier*1000;
      var gasConsumption = multiplier*12;
      var expectedWithdrawal = (gasConsumption)/ multiplier
      var account_sponsor_starting_balance = humanReadableBalance(account_sponsor);
      var timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp

      var insurance = await Insurance.new();
      await insurance.init.sendTransaction(poolSize, poolSize/2, timestamp, {from: account_sponsor});
      await insurance.contribute.sendTransaction({from: account_sponsor, value: poolSize +1});
      await insurance.withdrawAsParticipant.sendTransaction({from: account_sponsor});
      var account_sponsor_ending_balance = humanReadableBalance(account_sponsor);
      assert.approximately(account_sponsor_ending_balance, account_sponsor_starting_balance - expectedWithdrawal, 2, "not withdrawn expected amount");
      }
    )



    //test timestamp preventing withdrawal from owner and participant
   //test init function
   //add checks that the max and ratio are used
  //if not claimable do not allow to withdraw
  //if already claimed do not allow to withdraw
  //should not allow to insure if the premium is not paid
  //test that premiums are included in withdrawal


});
