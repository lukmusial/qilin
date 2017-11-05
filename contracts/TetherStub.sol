pragma solidity ^0.4.2;

import 'zeppelin-solidity/contracts/token/StandardToken.sol';

contract TetherStub is StandardToken {

	string public constant name = "GBPT";
	string public constant symbol = "GBPT";
	uint256 public constant decimals = 18;
	uint256 public constant INITIAL_SUPPLY = 10000;

  function TetherStub() {
    balances[msg.sender] = INITIAL_SUPPLY;
  }

}
