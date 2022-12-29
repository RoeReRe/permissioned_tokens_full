const { types } = require("@algo-builder/web");
const { assert, expect } = require("chai");
const { Runtime, AccountStore, ERRORS } = require("@algo-builder/runtime");
const helper = require("./helper/helper.js");
const { getApplicationAddress } = require("algosdk");

const masterApproval = "master_approval.py"
const masterClearState = "master_clearstate.py";
const proposalApproval = "proposal_approval.py";
const proposalClearState = "proposal_clearstate.py";

const error = ERRORS["TEAL_ENCOUNTERED_ERR"];

describe("Negative tests", function() {
    let master;
    let user1;
    let user2;
    let user3;
    let illegal;
    let masterApp;
    let proposalApp;
    let runtime;

    this.beforeEach(async function() {
        master = new AccountStore(100e6);
        user1 = new AccountStore(100e6);
        user2 = new AccountStore(100e6);
        user3 = new AccountStore(100e6);
        illegal = new AccountStore(100e6);
        runtime = new Runtime([master, user1, user2, user3, illegal]);
    })

    function syncAccounts() {
        master = runtime.getAccount(master.address);
        user1 = runtime.getAccount(user1.address);
        user2 = runtime.getAccount(user2.address);
        user3 = runtime.getAccount(user3.address);
        illegal = runtime.getAccount(illegal.address);
    }

    const getAppAssetHolding = (appID, assetID) => runtime.getAccount(getApplicationAddress(appID)).getAssetHolding(assetID).amount;
    const getGlobal = (appID, key) => runtime.getGlobalState(appID, key);
    const initContracts = (runtime) => helper.initContracts(runtime, master.account, masterApproval, masterClearState, proposalApproval, proposalClearState);

    it('Double asset creation', () => {
        // Deploy contracts
        initContracts(runtime);
        const masterApp = runtime.getAppByName("MasterApp");

        // Double asset creation
        assert.throws(() => {
            runtime.executeTx([{
                type: types.TransactionType.CallApp,
                sign: types.SignType.SecretKey,
                fromAccount: master.account,
                appID: masterApp.appID,
                payFlags: { totalFee: 1000 },
                appArgs: [convert.stringToBytes("Mint"),
                        convert.uint64ToBigEndian(100),
                        convert.stringToBytes("voteToken"),
                        convert.stringToBytes("vote")],
            }]);
        }, error);
    })

    it('Issuing when user has not opted into asset', () => {
        // Deploy contracts
        initContracts(runtime);

        // Issue token
        assert.throws(() => {
            helper.issue(runtime, master.account, user1.account);
        }, error);
    })

    it('Issuing tokens when user already has 1', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        // Issue token
        helper.issue(runtime, master.account, user1.account);
        
        // Issue token again
        assert.throws(() => {
            helper.issue(runtime, master.account, user1.account);
        }, error);
    })

    it('Issuing token when supply is 0', () => {
        // Deploy contracts, SUPPLY IS SET TO 2
        initContracts(runtime);

        // Opt in users into asset
        helper.assetOptIn(runtime, user1.account);
        helper.assetOptIn(runtime, user2.account);
        helper.assetOptIn(runtime, user3.account);

        // Issue token 2 times
        helper.issue(runtime, master.account, user1.account);
        helper.issue(runtime, master.account, user2.account);
        
        // Issue token again
        assert.throws(() => {
            helper.issue(runtime, master.account, user3.account);
        }, error);
    })

    it('Revoking token when target has 0 tokens', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        // Issue token
        helper.issue(runtime, master.account, user1.account);

        // Revoke token
        helper.revoke(runtime, master.account, user1.account);

        // Revoke again
        assert.throws(() => {
            helper.revoke(runtime, master.account, user1.account);
        }, error);
    })

    it('Non-creator attempts to issue', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        // Issue token
        assert.throws(() => {
            helper.issue(runtime, user1.account, user1.account);
        }, error);
    })

    it('Non-creator attempts to revoke', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        // Issue token
        helper.issue(runtime, master.account, user1.account);

        // Revoke token
        assert.throws(() => {
            helper.revoke(runtime, user1.account, user1.account);
        }, error);
    })

    it('Voting before opting into contract', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        // Issue token
        helper.issue(runtime, master.account, user1.account);

        // Vote
        assert.throws(() => {
            helper.vote(runtime, user1.account, "For");
        }, error);
    })

    it('Voting without token', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        // Issue token
        helper.issue(runtime, master.account, user1.account);

        // Opt user1 into contract
        helper.contractOptIn(runtime, user1.account);

        // Revoke token
        helper.revoke(runtime, master.account, user1.account);

        // Vote
        assert.throws(() => {
            helper.vote(runtime, user1.account, "For");
        }, error);
    })

    it('Vote multiple times', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        // Issue token
        helper.issue(runtime, master.account, user1.account);

        // Opt user1 into contract
        helper.contractOptIn(runtime, user1.account);

        // Vote
        helper.vote(runtime, user1.account, "For");

        // Vote again
        assert.throws(() => {
            helper.vote(runtime, user1.account, "Against");
        }, error);
    })

    it('Unauthorised account votes', () => {
        // Deploy contracts
        initContracts(runtime);

        // Vote
        assert.throws(() => {
            helper.vote(runtime, illegal.account, "For");
        }, error);
    })
})