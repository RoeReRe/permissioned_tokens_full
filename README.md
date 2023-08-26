# Assessment on Algorand Smart Contracts
A permissioned voting application is a voting application that only allows authorised users to vote. A central authority creates a vote token and assigns voters one token each. The voter then registers for a proposal by opting into the contract and votes with an application call.

As only accounts possessing the token can vote, permissioned voting prevents unauthorised users from voting.

## Application Details

#### Permissioned token details
- total amount: 100
- decimals: 0
- asset name: VoteToken
- asset unit name: VOTES
- manager: creator
- clawback: creator
- freeze: creator
- reserve: -

#### Basic checks for all smart contracts
1. `rekey to`, `close remainder to`, `asset close to` addresses are not found in the transactions.

### Master Contract
Complete the stateful smart contract `assets/master_approval.py` which allows only the creator mint, issue and revoke the permissioned token.

#### Minting
1. Prevent double asset creation.
2. Create token via app call.
3. Tokens are frozen by default so that users cannot transfer themselves.

#### Issue
1. Enough supply to conduct asset transfer.
2. Asset must be created before calling this function.
3. Users can only hold one token at most.
4. Transfer 1 token to user.

#### Revoke
1. User must have a token.
2. Asset must be created before calling this function.
3. Clawback 1 token from user.

### Proposal Contract
Complete the stateful smart contract `assets/proposal_approval.py` which allows the creator to create a proposal. Users can then vote by making application calls to this contract.

#### Init
1. Save proposal title, description, vote count ("For / Against") and assetID in global state.

#### Vote
1. Vote either "For" or "Against" the proposal.
2. User must have the permissioned token to be allowed to vote.
3. User can only vote once.
4. User cannot change their vote.

## Contract deployment flow
1. Deploy the master contract to create the token.
2. Fund master contract with algos to perform asset transfer.
3. Deploy the proposal contract with the proposal information.

Complete the server side scripts to allow the creator to issue and revoke tokens.

## Frontend interaction
This repository contains a VueJS frontend with some basic wallet integration. It displays a form which allows connected accounts to vote in a simple HTML form. Feel free to replace this with ReactJS (or any other JS frontend frameworks) if you wish. However, the completed app should do the following,

1. Allow authorised user to successfully vote.
2. Display the proposal title, description and latest vote count.

## Testing
Write test cases to cover the successful contract deployment, as well as negative tests.

Your contract should cover at least the following negative tests.

- Double asset creation fails
- Fail to issue token when user has not opted into asset
- Fail to issue token when user already has a token
- Fail to issue token when supply is insufficient
- Fail to revoke when user does not have a token
- Issuing fails when not called by creator
- Revoking fails when not caled by creator
- Voting before opting into proposal contract fails
- Voting without token fails
- Voting more than once fails

## Deployment
Your application should be able to connect to AlgoSigner (localhost) and allow the connected account to vote. As an added bonus, try to deploy your application to TestNet as well.

## Setup instructions

### 1. Install packages
```
yarn install
```

### 2. Update environement variables
1. Copy `.env.example` to `.env`.
2. Update credentials in `.env` file.

### 3. Algo Builder deployment commands
```
# Run all deployment scripts
yarn run algob deploy

# Run one deployment script
yarn run algob deploy scripts/<filename>

# Run non deployment scripts
yarn run algob run scripts/path/to/filename

# Clear cache
yarn run algob clean

# Run tests
yarn run algob test

# Run dapp on localhost
yarn serve
```
