pragma solidity ^0.4.2;

import './Insurance.sol';

contract ManualAuthorizationInsurance is Insurance {

    address authoriser;

    event RequestAuthorisation(address claimant);

    function ManualAuthorizationInsurance() {
    }

    function assignAuthoriser(address _auth) onlyOwner {
        authoriser = _auth;
    }

    function claim() payable {
        RequestAuthorisation(msg.sender);
    }

    function authoriseClaim(address _claimant) {
        if (msg.sender == authoriser && insurances[_claimant].exists) {
            insurances[_claimant].withdrawable = true;
        }
    }


}
