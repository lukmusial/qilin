Ethereum Solidity project with React frontend

Smart contract representing insurance container (risk pool) using
ERC20 compatible token as collateral.
Contract allows

Boilerplate React/Webpack code based on Marvin:
https://github.com/workco/marvin

This is a proof of concept, do not use in production systems.

TODO:
convert insurance contract to use ERC20 token as collateral

webpages representing interactions for client, insurer and reinsurer exchange

formal verification of the contract and contract hardening

contract maturity calculation

Concrete representation of several types of insurance in contract's data structures

Integration with SWARM to allow storage of contract documents



Known issues:
Tested with truffle 3 and 4. Tests pass when using testRPC, some failures on truffle 4 internal blockchain.

