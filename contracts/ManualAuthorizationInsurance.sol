pragma solidity ^0.4.2;

import './Insurance.sol';

contract ManualAuthorizationInsurance is Insurance {

    address authoriser;

    event RequestAuthorisation(address claimant);

    function ManualAuthorizationInsurance() {
    }

    function assignAuthoriser(address auth) onlyOwner {
        authoriser = auth;
    }

    function claim() payable {
        RequestAuthorisation(msg.sender);
    }

    function authoriseClaim(address claimant) {
        if (msg.sender == authoriser && insurances[claimant].exists) {
            insurances[claimant].withdrawable = true;
        }
    }


}