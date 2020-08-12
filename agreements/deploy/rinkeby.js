const { utf8ToHex } = require('web3-utils')
const { bn, ONE_DAY } = require('@aragon/contract-helpers-test')

const { hash } = require('eth-ens-namehash')
const createActions = require('./src/create-actions')
const installAgreements = require('./src/install-agreements')
const Arapp = require("../../arapp.json")

const RINKEBY_ENS_REGISTRY_ADDRESS = Arapp.environments.rinkeby.registry
const ONE_HUNDRED_PERCENT = 1e18

const config = {

  // To create new DAO set all of the below app/proxy addresses to ''

  convictionVoting: {
    proxy:                '0x1Bc05ae71cF4ED62E23C4bDB9f69d1a180Eeabde', // Can be ''
    actionCollateral:     bn(0),
    challengeCollateral:  bn(0),
    challengeDuration:    ONE_DAY * 3
  },

  arbitrator:     '0x52180af656a1923024d1accf1d827ab85ce48878',   // Aragon Court staging instance
  stakingFactory: '0x07429001eeA415E967C57B8d43484233d57F8b0B',   // Real StakingFactory instance on Rinkeby
  appFeesCashier: '0x0000000000000000000000000000000000000000',   // None
  feeToken:       '0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42',   // DAI mock token used in Aragon Court staging
  agreement: {
    base:         '0xAC7bA031E2A598A01d823aa96fB25b6662721de6',    // Agreement base v4.0.0
    proxy:        '',    // Can be ''
    appId:        '0x34c62f3aec3073826f39c2c35e9a1297d9dbf3cc77472283106f09eee9cf47bf',
    title:        'Agreement Test v3',
    content:      utf8ToHex('ipfs:QmdLu3XXT9uUYxqDKXXsTYG77qNYNPbhzL27ZYT9kErqcZ')
  }
}

async function deploy() {
  let options = await loadConfig(config)
  options = await installAgreements(options)

  await createActions(options)
}

async function loadConfig(config) {

  const options = config

  options.owner = await getSender()

  options.kernelBase = await instanceOrEmpty(options.kernelBase, 'Kernel')
  options.aclBase = await instanceOrEmpty(options.aclBase, 'ACL')
  options.evmScriptReg = await instanceOrEmpty(options.evmScriptReg, 'EVMScriptRegistryFactory')
  options.daoFact = await instanceOrEmpty(options.daoFact, 'DAOFactory')
  options.dao = await instanceOrEmpty(options.dao, 'Kernel')
  options.acl = options.dao ? await getInstance('ACL', await options.dao.acl()) : ''


  options.convictionVoting.proxy = await instanceOrEmpty(options.convictionVoting.proxy, 'ConvictionVoting')


  options.agreement.base = await getInstance('Agreement', options.agreement.base)
  options.agreement.proxy = await instanceOrEmpty(options.agreement.proxy, 'Agreement')
  options.feeToken = await getInstance('MiniMeToken', options.feeToken)
  options.arbitrator = await getInstance('IArbitrator', options.arbitrator)
  options.stakingFactory = await getInstance('StakingFactory', options.stakingFactory)
  options.aragonAppFeesCashier = { address: options.appFeesCashier }

  return options
}

async function getSender() {
  const accounts = await web3.eth.getAccounts()
  return accounts[0]
}

const instanceOrEmpty = async (address, contractType) => {
  return address ? await getInstance(contractType, address) : ""
}

async function getInstance(contract, address) {
  return artifacts.require(contract).at(address)
}

module.exports = async (callback) => {
  try {
    await deploy()
  } catch (error) {
    console.log(error)
  }
  callback()
}
