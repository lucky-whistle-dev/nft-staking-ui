import {
  createStakePool,
  createStakePoolAndRewardDistributor,
  executeTransaction,
  stakePool,
} from '@cardinal/staking'
import { RewardDistributorKind } from '@cardinal/staking/dist/cjs/programs/rewardDistributor'
import { withInitRewardDistributor } from '@cardinal/staking/dist/cjs/programs/rewardDistributor/transaction'
import { StakePoolData } from '@cardinal/staking/dist/cjs/programs/stakePool'
import { getStakePool } from '@cardinal/staking/dist/cjs/programs/stakePool/accounts'
import { withInitStakePool } from '@cardinal/staking/dist/cjs/programs/stakePool/transaction'
import { AccountData } from '@cardinal/token-manager'
import { Wallet } from '@metaplex/js'
import { BN } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { Header } from 'common/Header'
import Head from 'next/head'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { useState } from 'react'
import { useEffect } from 'react'
import { TailSpin } from 'react-loader-spinner'
import Select from 'react-select'

function Admin() {
  const { setAddress, address } = useUserTokenData()
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()

  const [overlayText, setOverlayText] = useState('')
  const [collectionAddresses, setCollectionAddresses] = useState<string>('')
  const [creatorAddresses, setCreatorAddresses] = useState<string>('')
  const [authorizeNFT, setAuthorizeNFT] = useState<boolean>(false)
  const [rewardAmount, setRewardAmount] = useState<string>('')
  const [rewardDurationSeconds, setRewardDurationSeconds] = useState<string>('')
  const [rewardMintAddress, setRewardMintAddress] = useState<string>('')
  const [rewardDistribution, setRewardDistribution] = useState<string>('0')
  const [rewardMintSupply, setRewardMintSupply] = useState<string>('')

  const [loading, setLoading] = useState<boolean>(false)
  const [stakePool, setStakePool] = useState<AccountData<StakePoolData>>()

  useEffect(() => {
    if (wallet && wallet.connected && wallet.publicKey) {
      setAddress(wallet.publicKey.toBase58())
    }
  }, [wallet.publicKey])

  const FormFieldTitleInput = (props: {
    title: string
    description: string
  }) => (
    <>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-200">
        {props.title}
      </label>
      <p className="mb-2 text-sm italic text-gray-300">{props.description}</p>
    </>
  )

  const handleCreation = async () => {
    setStakePool(undefined)
    setLoading(true)
    try {
      if (!address) {
        throw 'Wallet not connected'
      }
      if (!wallet.wallet) {
        throw 'Wallet not connected'
      }
      if (
        (!rewardAmount && rewardDurationSeconds) ||
        (rewardAmount && !rewardDurationSeconds)
      ) {
        throw 'Both reward amount and reward duration must be specified'
      }
      if ((rewardAmount || rewardMintAddress) && rewardDistribution === '0') {
        throw 'Reward distribution must be specified (cannot be none)'
      }
      if (rewardDistribution === '1' && !rewardMintSupply) {
        throw 'Reward mint supply must be specified (cannot be none)'
      }
      if (
        (rewardAmount || rewardMintAddress || rewardDistribution !== '0') &&
        (!rewardAmount || !rewardMintAddress)
      ) {
        throw 'Please fill out all the fields for reward distribution paramters'
      }

      const collectionPublicKeys =
        collectionAddresses.length > 0
          ? collectionAddresses
              .split(',')
              .map((address) => new PublicKey(address.trim()))
          : []
      const creatorPublicKeys =
        creatorAddresses.length > 0
          ? creatorAddresses
              .split(',')
              .map((address) => new PublicKey(address.trim()))
          : []
      const rewardMintPublicKey = rewardMintAddress
        ? new PublicKey(rewardMintAddress.trim())
        : undefined
      const rewardAmountBN = rewardAmount
        ? new BN(parseFloat(rewardAmount))
        : undefined
      const rewardDurationSecondsBN = rewardDurationSeconds
        ? new BN(parseInt(rewardDurationSeconds))
        : undefined
      const rewardDistributorKind =
        rewardDistribution === '1'
          ? RewardDistributorKind.Mint
          : rewardDistribution === '2'
          ? RewardDistributorKind.Treasury
          : undefined
      const supply = rewardMintSupply
        ? new BN(parseFloat(rewardMintSupply))
        : undefined

      const stakePoolParams = {
        requiresCollections:
          collectionPublicKeys.length > 0 ? collectionPublicKeys : undefined,
        requiresCreators:
          creatorPublicKeys.length > 0 ? creatorPublicKeys : undefined,
        requiresAuthorization: authorizeNFT,
        overlayText: overlayText.length > 0 ? overlayText : undefined,
      }

      let transaction = new Transaction()

      const [, stakePoolPK] = await withInitStakePool(
        transaction,
        connection,
        wallet as Wallet,
        stakePoolParams
      )

      if (rewardDistributorKind) {
        const rewardDistributionParams = {
          stakePoolId: stakePoolPK,
          rewardMintId: rewardMintPublicKey!,
          rewardAmount: rewardAmountBN,
          rewardDurationSeconds: rewardDurationSecondsBN,
          kind: rewardDistributorKind,
          supply: supply,
        }

        await withInitRewardDistributor(
          transaction,
          connection,
          wallet as Wallet,
          rewardDistributionParams
        )
      }

      await executeTransaction(connection, wallet as Wallet, transaction, {
        silent: false,
        signers: [],
      })

      const stakePoolData = await getStakePool(connection, stakePoolPK)
      setStakePool(stakePoolData)

      alert(
        'Stake pool created! Stake Pool ID: ' +
          stakePoolData.pubkey.toString()
      )
    } catch (e) {
      alert(`Error creating stake pool: ${e}`)
    } finally {
      setLoading(false)
    }
  }

  const customStyles = {
    control: (base: {}) => ({
      ...base,
      background: 'rgb(55 65 81)',
      borderColor: 'rgb(107 114 128)',
      color: '#fff',
    }),
    Input: (base: {}) => ({
      ...base,
      color: 'white',
    }),
    menu: (base: {}) => ({
      ...base,
      background: 'rgb(55 65 81)',
      '&:hover': {
        background: 'rgb(55 65 81)',
      },
      '&:focus': {
        background: 'rgb(75 85 99) !important',
      },
      borderRadius: 0,
      marginTop: 0,
      color: 'rgb(20 20 20)',
    }),
    option: (base: {}) => ({
      ...base,
      '&:hover': {
        background: 'rgb(75 85 99)',
      },
      '&:focus': {
        background: 'rgb(75 85 99) !important',
      },
    }),
    singleValue: (provided: {}) => ({
      ...provided,
      color: 'white',
    }),
  }

  return (
    <div>
      <Head>
        <title>Cardinal Staking UI</title>
        <meta name="description" content="Generated by Cardinal Staking UI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>
        <div className="container mx-auto max-h-[90vh] w-full bg-[#1a1b20]">
          <Header />
          <div className="my-2 grid h-full grid-cols-1 gap-4">
            <div className="rounded-md bg-white bg-opacity-5 p-10 text-gray-200">
              <p className="text-lg font-bold">Create Staking Pool</p>
              <p className="mt-1 mb-2 text-sm">
                All parameters for staking pool are optional
              </p>
              {stakePool ? (
                <div className="bg-green-600 bg-opacity-20 p-4">
                  <p>Successfully created Stake Pool. </p>
                  <p className="mt-2">
                    <b>Address:</b> {stakePool.pubkey.toString()} <br />{' '}
                    <b>Identifier:</b> {stakePool.parsed.identifier.toString()}
                  </p>
                </div>
              ) : null}
              <form className="w-full max-w-lg">
                <div className="-mx-3 flex flex-wrap">
                  <div className="mb-6 mt-4 w-full px-3 md:mb-0">
                    <FormFieldTitleInput
                      title={'Overlay Text'}
                      description={'Text to display over the rental receipt'}
                    />
                    <input
                      className="mb-3 block w-full appearance-none rounded border border-gray-500 bg-gray-700 py-3 px-4 leading-tight text-gray-200 placeholder-gray-500 focus:bg-gray-800 focus:outline-none"
                      type="text"
                      placeholder={'RENTED'}
                      value={overlayText}
                      onChange={(e) => {
                        setOverlayText(e.target.value)
                      }}
                    />
                  </div>
                </div>
                <div className="-mx-3 flex flex-wrap">
                  <div className="mb-6 mt-4 w-full px-3 md:mb-0">
                    <FormFieldTitleInput
                      title={'Collection Addresses []'}
                      description={
                        'Only allow NFTs with these collection addresses (separated by commas)'
                      }
                    />
                    <input
                      className="mb-3 block w-full appearance-none rounded border border-gray-500 bg-gray-700 py-3 px-4 leading-tight text-gray-200 placeholder-gray-500 focus:bg-gray-800 focus:outline-none"
                      type="text"
                      placeholder={'Cmwy..., A3fD...'}
                      value={collectionAddresses}
                      onChange={(e) => {
                        setCollectionAddresses(e.target.value)
                      }}
                    />
                  </div>
                </div>
                <div className="-mx-3 flex flex-wrap">
                  <div className="mb-6 mt-4 w-full px-3 md:mb-0">
                    <FormFieldTitleInput
                      title={'Creator Addresses []'}
                      description={
                        'Only allow NFTs with these creator addresses (separated by commas)'
                      }
                    />
                    <input
                      className="mb-3 block w-full appearance-none rounded border border-gray-500 bg-gray-700 py-3 px-4 leading-tight text-gray-200 placeholder-gray-500 focus:bg-gray-800 focus:outline-none"
                      type="text"
                      placeholder={'Cmwy..., A3fD...'}
                      value={creatorAddresses}
                      onChange={(e) => {
                        setCreatorAddresses(e.target.value)
                      }}
                    />
                  </div>
                </div>
                <div className="-mx-3 flex flex-wrap">
                  <div className="mb-6 mt-4 w-full px-3 md:mb-0">
                    <label
                      className="mb-2 block inline-block text-xs font-bold uppercase tracking-wide text-gray-200"
                      htmlFor="require-authorization"
                    >
                      Authorize NFTs
                    </label>
                    <p className="mb-2 text-sm italic text-gray-300">
                      If selected, NFTs must be authorized on-chain before
                      entering the pool
                    </p>
                    <input
                      className="mb-3"
                      id="require-authorization"
                      type="checkbox"
                      checked={authorizeNFT}
                      onChange={(e) => {
                        setAuthorizeNFT(e.target.checked)
                      }}
                    />{' '}
                    <span className="my-auto text-sm">
                      Require Authorization
                    </span>
                  </div>
                </div>
                <div>
                  <div className="-mx-3 flex flex-wrap bg-white bg-opacity-5 rounded-md pb-2">
                    <div className="mb-6 mt-4 w-full px-3 md:mb-0">
                      <FormFieldTitleInput
                        title={'Reward Distribution'}
                        description={
                          'Mint tokens from the mint address or transfer tokens to the stake pool.'
                        }
                      />
                      <Select
                        styles={customStyles}
                        className="mb-3"
                        isSearchable={false}
                        onChange={(option) =>
                          setRewardDistribution(option!.value)
                        }
                        defaultValue={{ label: 'None', value: '0' }}
                        options={[
                          { value: '0', label: 'None' },
                          { value: '1', label: 'Mint' },
                          { value: '2', label: 'Transfer' },
                        ]}
                      />
                    </div>
                    {rewardDistribution !== '0' && (
                      <>
                        <div className="mb-6 mt-4 w-1/2 px-3 md:mb-0">
                          <FormFieldTitleInput
                            title={'Reward Amount'}
                            description={
                              'Amount of token to be paid to the staked NFT'
                            }
                          />
                          <input
                            className="mb-3 block w-full appearance-none rounded border border-gray-500 bg-gray-700 py-3 px-4 leading-tight text-gray-200 placeholder-gray-500 focus:bg-gray-800 focus:outline-none"
                            type="text"
                            placeholder={'10'}
                            value={rewardAmount}
                            onChange={(e) => {
                              setRewardAmount(e.target.value)
                            }}
                          />
                        </div>
                        <div className="mb-6 mt-4 w-1/2 px-3 md:mb-0">
                          <FormFieldTitleInput
                            title={'Reward Duration Seconds'}
                            description={
                              'Staked duration needed to receive reward amount'
                            }
                          />
                          <input
                            className="mb-3 block w-full appearance-none rounded border border-gray-500 bg-gray-700 py-3 px-4 leading-tight text-gray-200 placeholder-gray-500 focus:bg-gray-800 focus:outline-none"
                            type="text"
                            placeholder={'60'}
                            value={rewardDurationSeconds}
                            onChange={(e) => {
                              setRewardDurationSeconds(e.target.value)
                            }}
                          />
                        </div>
                        <div className="mb-6 mt-4 w-full px-3 md:mb-0">
                          <FormFieldTitleInput
                            title={'Reward Mint Address'}
                            description={'The mint address of the reward token'}
                          />
                          <input
                            className="mb-3 block w-full appearance-none rounded border border-gray-500 bg-gray-700 py-3 px-4 leading-tight text-gray-200 placeholder-gray-500 focus:bg-gray-800 focus:outline-none"
                            type="text"
                            placeholder={'Cmwy...g4ds'}
                            value={rewardMintAddress}
                            onChange={(e) => {
                              setRewardMintAddress(e.target.value)
                            }}
                          />
                        </div>

                        {rewardDistribution === '2' && (
                          <div className="mb-6 mt-4 w-full px-3 md:mb-0">
                            <FormFieldTitleInput
                              title={'Reward Transfer Amount'}
                              description={
                                'How many tokens to transfer to the stake pool for future distribution.'
                              }
                            />
                            <input
                              className="mb-3 block w-full appearance-none rounded border border-gray-500 bg-gray-700 py-3 px-4 leading-tight text-gray-200 placeholder-gray-500 focus:bg-gray-800 focus:outline-none"
                              type="text"
                              placeholder={'1000000'}
                              value={rewardMintSupply}
                              onChange={(e) => {
                                setRewardMintSupply(e.target.value)
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-4 inline-block rounded-md bg-blue-700 px-4 py-2"
                  onClick={() => handleCreation()}
                >
                  <div className="flex">
                    {loading && (
                      <div className="mr-2">
                        <TailSpin color="#fff" height={20} width={20} />
                      </div>
                    )}
                    Create Pool
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin
