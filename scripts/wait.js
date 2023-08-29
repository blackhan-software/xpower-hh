const { network } = require("hardhat");

async function wait(tx) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(tx), ms(network));
  });
}
function ms({ name }) {
  if (name === "mainnet" || name === "fuji") {
    return 200;
  }
  return 0;
}
module.exports = {
  wait,
};
