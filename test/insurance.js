require('babel-polyfill');
var Insurance = artifacts.require("./Insurance.sol");


var multiplier = Math.pow(10,16)

contract('Insurance', function(accounts) {

   //truffle will by default assign accounts[0] as an owner of the deployed contract
  const account_sponsor = accounts[0];
  const account_one = accounts[1];
  const account_two = accounts[2];

  const timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp
  const poolSize = web3.toWei(1, "ether")

  function humanReadableBalance(account) {
     return Math.floor(web3.eth.getBalance(account).toNumber()/multiplier);
  }

  function szaboFromAccount(account) {
    return Number(web3.fromWei(web3.eth.getBalance(account).toNumber(), 'szabo'));
  }

  function szabo(number) {
      return Number(web3.fromWei(number, 'szabo'));
  }

  function gasPrice(estimate) {
    return Number(Insurance.web3.eth.gasPrice) * Number(estimate);
  }

  it("when an insurance claim is made on a seeded pool then insured amount can be withdrawn", async function () {
    var insureAmount = multiplier*23;
    var premium = multiplier*15;
    var amountToVerify = (insureAmount - premium)/ multiplier;

    var insurance = await Insurance.deployed()
    var account_one_starting_balance = humanReadableBalance(account_one);
    await insurance.init.sendTransaction(poolSize, timestamp, {from: account_sponsor});
    await insurance.contribute.sendTransaction({from: account_sponsor, value: insureAmount + 10});
    await insurance.insure.sendTransaction(insureAmount, {from:account_one, value: premium});
    await insurance.claim.sendTransaction({from:account_one});
    await insurance.withdraw.sendTransaction({from:account_one});

    var account_one_ending_balance = humanReadableBalance(account_one);
    assert.approximately(account_one_ending_balance, account_one_starting_balance + amountToVerify, 3, "claim not recorded properly");
  })

    it("when an insurance claim is not made then insured amount can not be withdrawn", async function () {
      var insureAmount = multiplier*23;
      var premium = multiplier*15;
      var amountToVerify = premium/ multiplier;

      var insurance =  await Insurance.new();
      var account_one_starting_balance = humanReadableBalance(account_one);
      await insurance.init.sendTransaction(poolSize, timestamp, {from: account_sponsor});
      await insurance.contribute.sendTransaction({from: account_sponsor, value: insureAmount + 10});
      await insurance.insure.sendTransaction(insureAmount, {from:account_one, value: premium});
      await insurance.withdraw.sendTransaction({from:account_one});
      var account_one_ending_balance = humanReadableBalance(account_one);
      assert.approximately(account_one_ending_balance, account_one_starting_balance - amountToVerify, 3, "only premium should be deducted");
    })

    it("when an insurance request is raised when pool is insufficient, request is denied", async function () {
      var insureAmount = multiplier*230;
      var premium = multiplier*150;

      var insurance = await Insurance.new();
      var account_one_starting_balance = humanReadableBalance(account_one);
      await insurance.init.sendTransaction(poolSize, timestamp, {from: account_sponsor});
      await insurance.contribute.sendTransaction({from: account_sponsor, value: 0});
      try {
        await insurance.insure.sendTransaction(insureAmount, {from:account_one, value: premium});
        assert.fail();
      }
      catch(error) {
          var account_one_ending_balance = humanReadableBalance(account_one);
          assert.approximately(account_one_ending_balance, account_one_starting_balance, 3, "account not affected");
      }
    })

  it('creation: should create an initial balance of 100 for the creator', async function () {
    var ins = await Insurance.deployed();
    var balance = await ins.balanceOf.call(accounts[0]);
    assert.strictEqual(balance.toNumber(), 100);
  })

  it("can participate if pool maxed and will issue tokens which allow withdrawal", async function () {
    var expectedWithdrawal = web3.fromWei(poolSize, 'szabo') * 0.24;
    var account_two_starting_balance = szaboFromAccount(account_two);

    var insurance =  await Insurance.new();
    await insurance.init.sendTransaction(poolSize, timestamp, {from: account_sponsor});
    await insurance.contribute.sendTransaction({from: account_sponsor, value: poolSize});
    await insurance.participate.sendTransaction(account_two, 24, {from: account_sponsor});
    var oneBalance = await insurance.balanceOf.call(account_two)
    assert.strictEqual(oneBalance.toNumber(), 24)
    var sponsorBalance = await insurance.balanceOf.call(account_sponsor)
    assert.strictEqual(sponsorBalance.toNumber(), 76)

    await insurance.withdrawAsParticipant.sendTransaction({from: account_two})
    var account_two_ending_balance = szaboFromAccount(account_two);
    assert.approximately(account_two_ending_balance, account_two_starting_balance + expectedWithdrawal, 100000, "not withdrawn expected amount");

    var finalOneBalance = await insurance.balanceOf.call(account_two)
    assert.strictEqual(finalOneBalance.toNumber(), 0)
    var finalSponsorBalance = await insurance.balanceOf.call(account_sponsor)
    assert.strictEqual(finalSponsorBalance.toNumber(), 76)
    }
  )

  it("should not allow further withdrawals if already withdrawn", async function () {
    var expectedWithdrawal = web3.fromWei(poolSize, 'szabo') * 0.24;
    var gasUsageEstimate = multiplier*45 / multiplier;

    var insurance =  await Insurance.new();
    var account_two_starting_balance = szaboFromAccount(account_two);
    await insurance.init.sendTransaction(poolSize, timestamp, {from: account_sponsor});
    await insurance.contribute.sendTransaction({from: account_sponsor, value: poolSize});
    await insurance.participate.sendTransaction(account_two, 24, {from: account_sponsor});
    await insurance.withdrawAsParticipant.sendTransaction({from: account_two})
    var account_two_ending_balance = szaboFromAccount(account_two);
    assert.approximately(account_two_ending_balance, account_two_starting_balance + expectedWithdrawal, 10000, "not withdrawn expected amount");

    try {
        await insurance.withdrawAsParticipant.sendTransaction({from: account_two});
        assert.fail();
    }
    catch(error) {
        var account_two_new_ending_balance = szaboFromAccount(account_two);
        assert.approximately(account_two_new_ending_balance, account_two_ending_balance - gasUsageEstimate, 5000, "should not allow to withdraw twice");
     }
  })

    it("should not allow participant withdrawals if claims were made but not yet claimed", async function () {
      var gasUsageEstimate = multiplier*45 / multiplier;
      var premium = multiplier*15;

      var insurance =  await Insurance.new();
      var account_two_starting_balance = szaboFromAccount(account_two);
      await insurance.init.sendTransaction(poolSize, timestamp, {from: account_sponsor});
      await insurance.contribute.sendTransaction({from: account_sponsor, value: poolSize});
      await insurance.insure.sendTransaction(1000, {from:account_one, value: premium});
      await insurance.participate.sendTransaction(account_two, 24, {from: account_sponsor});
      await insurance.claim.sendTransaction({from:account_one});
      try {
          await insurance.withdrawAsParticipant.sendTransaction({from: account_two});
          assert.fail();
      }
      catch(error) {}
    })

    it("if no other participants, owner is sole participants and can withdraw", async function() {
      var insurance = await Insurance.new();

      var account_sponsor_starting_balance = szaboFromAccount(account_sponsor);
      const cost1 = gasPrice(await insurance.init.estimateGas(poolSize, timestamp, {from: account_sponsor}));
      await insurance.init.sendTransaction(poolSize, timestamp, {from: account_sponsor});
      const cost2 = gasPrice(await insurance.contribute.estimateGas({from: account_sponsor, value: poolSize}));
      await insurance.contribute.sendTransaction({from: account_sponsor, value: poolSize});
      const cost3 = gasPrice(await insurance.withdrawAsParticipant.estimateGas({from: account_sponsor}));
      await insurance.withdrawAsParticipant.sendTransaction({from: account_sponsor});
      const expectedCost = szabo(cost1 + cost2 + cost3);
      var account_sponsor_ending_balance = szaboFromAccount(account_sponsor);
      assert.approximately(account_sponsor_ending_balance, account_sponsor_starting_balance - expectedCost, 100000, "not withdrawn expected amount");
      }
    )

    it("should not allow to contribute more than maximum pool size", async function() {
      var insurance = await Insurance.new();
      await insurance.init.sendTransaction(poolSize, timestamp, {from: account_sponsor});
      try {
          await insurance.contribute.sendTransaction({from: account_sponsor, value: poolSize +1 });
          assert.fail();
      }
      catch(error) {}
    })

    it("should not be initialised twice", async function() {
      var insurance = await Insurance.new();
      await insurance.init.sendTransaction(poolSize, timestamp, {from: account_sponsor});
      try {
       await insurance.init.sendTransaction(poolSize, timestamp, {from: account_sponsor});
       assert.fail();
      }
      catch(error) {}
    })



    //test timestamp preventing withdrawal from owner and participant
   //test init function
  //if not claimable do not allow to withdraw
  //if already claimed do not allow to withdraw
  //should not allow to insure if the premium is not paid
  //test that premiums are included in withdrawal


});
