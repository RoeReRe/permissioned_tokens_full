const getAssetHoldings = async (deployer, addr, assetId) => {
    const algodClient = deployer.algodClient;
    let accountInfo = await algodClient.accountInformation(addr).do();
  
    const asset = accountInfo["assets"].find((asset) => {
      return asset["asset-id"] === assetId;
    });
  
    return asset;
};

module.exports = {
    getAssetHoldings,
}