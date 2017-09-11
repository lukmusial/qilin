var Insurance = artifacts.require("./Insurance.sol");
var ManualAuthorizationInsurance = artifacts.require("./ManualAuthorizationInsurance.sol");
var WeatherOracleAuthorizationInsurance = artifacts.require("./WeatherOracleAuthorizationInsurance.sol");

module.exports = function(deployer) {
  deployer.deploy(Insurance);
  deployer.link(Insurance, ManualAuthorizationInsurance);
  deployer.link(Insurance, WeatherOracleAuthorizationInsurance);
  deployer.deploy(ManualAuthorizationInsurance);
  deployer.deploy(WeatherOracleAuthorizationInsurance);
};
