# Insurance Blockchain project using Ethereum Solidity contract with React frontend
Smart contract representing insurance container (risk pool) using
ERC20 compatible token as collateral (smart contract being a trust fund for the insurance). 
Contract extends ERC20 token as well, allowing the owner to issue Insurance Linked Security.

# Blockchain Insurance Competition Zug 2017 top ten finalist http://www.blockchaincompetition.ch/

Boilerplate React/Webpack code based on Marvin:
https://github.com/workco/marvin

This is a proof of concept, do not use in production systems.

# TODO:
convert insurance contract to use ERC20 token as collateral

webpages representing interactions for client, insurer and reinsurer exchange

formal verification of the contract and contract hardening

contract maturity calculation

Concrete representation of several types of insurance in contract's data structures

Integration with SWARM to allow storage of contract documents


# Setup instructions

install truffle, node.js

npm install
npm install zeppelin-solidity
truffle compile
truffle develop 
test

