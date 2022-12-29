const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    const title = "Proposal Title";
    const desc = "Description of the Proposal";

    const master = deployer.accountsByName.get("master");
    
    // Deploy Proposal Contract
    console.log("Deploying Proposal Contract...");
    const approvalFile = "proposal_approval.py";
    const clearStateFile = "proposal_clearstate.py";

    const masterApp = deployer.getApp("MasterApp");
    const masterState = await readAppGlobalState(deployer, master.addr, masterApp.appID);
    const assetID = masterState.get("assetID");

    await deployer.deployApp(
        master,
        {
            appName: "ProposalApp",
            metaType: types.MetaType.FILE,
            approvalProgramFilename: approvalFile,
            clearProgramFilename: clearStateFile,
            localInts: 1,
            localBytes: 0,
            globalInts: 4,
            globalBytes: 2,
            appArgs: [convert.stringToBytes(title),
                        convert.stringToBytes(desc),
                        convert.uint64ToBigEndian(assetID)],
        },
        { totalFee: 1000 },
    );

    const proposalApp = deployer.getApp("ProposalApp");

    // Test
    console.log(await readAppGlobalState(deployer, master.addr, proposalApp.appID));
}

module.exports = { default: run };