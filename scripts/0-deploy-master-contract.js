const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    const totalTokens = 100;
    const tokenName = "voteToken"
    const unitName = "vote"

    const master = deployer.accountsByName.get("master");
    
    // Deploy Master Contract
    console.log("Deploying Master Contract...");
    const approvalFile = "master_approval.py";
    const clearStateFile = "master_clearstate.py";

    await deployer.deployApp(
        master,
        {
            appName: "MasterApp",
            metaType: types.MetaType.FILE,
            approvalProgramFilename: approvalFile,
            clearProgramFilename: clearStateFile,
            localInts: 0,
            localBytes: 0,
            globalInts: 1,
            globalBytes: 0,
        },
        { totalFee: 1000 },
    );

    const masterApp = deployer.getApp("MasterApp");

    // Fund Master Contract
    console.log("Funding Master Contract...");
    await deployer.executeTx({
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        toAccountAddr: masterApp.applicationAccount,
        amountMicroAlgos: 10e6,
        payFlags: { totalFee: 1000 },
    });

    // Create tokens
    console.log("Creating tokens...")
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: masterApp.appID,
        payFlags: { totalFee: 1000 },
        appArgs: [convert.stringToBytes("Mint"),
                convert.uint64ToBigEndian(totalTokens),
                convert.stringToBytes(tokenName),
                convert.stringToBytes(unitName)],
    });

    // Test
    console.log(await readAppGlobalState(deployer, master.addr, masterApp.appID));
}

module.exports = { default: run };