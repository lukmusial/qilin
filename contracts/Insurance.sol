pragma solidity 0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Insurance is StandardToken, Ownable {

	string public constant name = "Insurance Pool Token";
	string public constant symbol = "IPT";
	uint256 public constant decimals = 18;
	uint256 public constant INITIAL_SUPPLY = 100;

	uint MAXIMUM_POOL_SIZE = 0;
  uint LAPSE_BLOCK = 0;

	struct Insured {
		bool withdrawable;
		bool claimed;
		uint claimSize;
		bool exists;
		uint premium;
    uint policyStartTime;
    uint policyEndTime;
		//underlying
	}

  enum Stages {
    New,
    Initialized
  }

  Stages public stage = Stages.New;

	mapping(address => Insured) insurances;
	uint public insurancesCount = 0;
  uint public poolSize = 0;
	uint public insurancesToClaim = 0;
  uint public totalInsured = 0;
  uint public premiums = 0;

	function Insurance() public {
		balances[msg.sender] = INITIAL_SUPPLY;
	}

  modifier atStage(Stages _stage) {
    require(stage == _stage);
    _;
  }

  modifier hasMatured {
    require(block.timestamp >= LAPSE_BLOCK);
    _;
  }

	function init(uint _maxPoolSize, uint _lapseBlock) public onlyOwner atStage(Stages.New) {
    require(this.balance == 0);
		MAXIMUM_POOL_SIZE = _maxPoolSize;
    LAPSE_BLOCK = _lapseBlock;
    approve(msg.sender, INITIAL_SUPPLY);
    stage = Stages.Initialized;
	}

	//fallback function
	function() public {
		//if ether is sent to this address, send it back.
		revert();
	}

	function contribute() public payable onlyOwner atStage(Stages.Initialized) {
    require(poolSize + msg.value <= MAXIMUM_POOL_SIZE);
		poolSize = poolSize + msg.value;
	}

	function participate(address _to, uint _tokens) public payable onlyOwner atStage(Stages.Initialized) {
		transferFrom(msg.sender, _to, _tokens);
	}

	function insure(uint _insuranceAmount) public payable atStage(Stages.Initialized) {
    require(poolSize >= totalInsured + _insuranceAmount);
		var insured = Insured(false, false, _insuranceAmount, true, msg.value, now, now);
		insurances[msg.sender] = insured;
    //TODO: convert to use SafeMath
    totalInsured = totalInsured + _insuranceAmount;
    premiums = premiums + msg.value;
	}

// this function should be overriden in non-demo versions of the contract to allow injection of claim procedures
//this version of the contract allows automatically authorises claims
	function claim() public payable {
		if (insurances[msg.sender].exists) {
			insurances[msg.sender].withdrawable = true;
      insurancesToClaim += 1;
		}
	}

	function withdraw() public payable {
		if (insurances[msg.sender].withdrawable) {
      require(poolSize >= insurances[msg.sender].claimSize);
      insurances[msg.sender].claimed = true;
      insurances[msg.sender].withdrawable = false;
      poolSize -= insurances[msg.sender].claimSize;
      insurancesToClaim -= 1;
      msg.sender.transfer(insurances[msg.sender].claimSize);
		}
  }

  function withdrawAsParticipant() public payable hasMatured {
    require(balances[msg.sender] > 0);
    require(insurancesToClaim == 0);
    var toTransfer = this.balance * balances[msg.sender] / INITIAL_SUPPLY;
    var premiumsToTransfer = premiums * balances[msg.sender] / INITIAL_SUPPLY;
    require(this.balance >= toTransfer);
    require(premiums >= premiumsToTransfer);
    //TODO: convert to use SafeMath
    premiums -= premiumsToTransfer;
    if (msg.sender != owner) {approve(msg.sender, balanceOf(msg.sender));}
    //forfeit the tokens to prevent further withdrawals
    transferFrom(msg.sender, this, balanceOf(msg.sender));
    msg.sender.transfer(toTransfer);
  }
}
