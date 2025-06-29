'use client'
import { ConnectButton, useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useState } from 'react'

const PACKAGE_ID = "0xa8cef4c6922a112de65e68e086a1796b115419feeb8c97eaafde24296c0dcafd"
const TREASURY_CAP_ID = "0x95b5afdc04c0154d0675714bc965d07490fef0fe4ecc0742ac05f4ae660186a4"

export default function Home() {
  const account = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [stakeAmount, setStakeAmount] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(null)
  
  // Get user's RPS token balance
  const { data: balance } = useSuiClientQuery(
    'getBalance',
    {
      owner: account?.address || '',
      coinType: `${PACKAGE_ID}::rps_token::RPS_TOKEN`
    },
    {
      enabled: !!account?.address
    }
  )

  // Get user's RPS token coins for joining challenges
  const { data: userCoins } = useSuiClientQuery(
    'getCoins',
    {
      owner: account?.address || '',
      coinType: `${PACKAGE_ID}::rps_token::RPS_TOKEN`
    },
    {
      enabled: !!account?.address
    }
  )

  // Check if package exists
  const { data: packageData } = useSuiClientQuery(
    'getObject',
    { id: PACKAGE_ID },
    { enabled: !!account }
  )

  // Get user's own challenges
  const { data: userChallenges, refetch: refetchUserChallenges } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      filter: {
        StructType: `${PACKAGE_ID}::rps_game::Challenge`
      },
      options: {
        showContent: true,
        showType: true,
        showOwner: true
      }
    },
    {
      enabled: !!account?.address
    }
  )

  // For demo purposes, let's also try to get challenges from known addresses
  // You can add more addresses here as needed
  const knownAddresses = [
    '0x4b7a68b6293f08efa401feefb329be3c73956efd2a09caf98d6cdc2d13b9feec', // First wallet
    '0xd7a8dfef94eca3e56b54afff4116cd04f55b3be16b05d38106d2130e7d39774a'  // Second wallet
  ]

  // Get challenges from other known players
  const { data: otherChallenges1 } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: knownAddresses[0],
      filter: {
        StructType: `${PACKAGE_ID}::rps_game::Challenge`
      },
      options: {
        showContent: true,
        showType: true,
        showOwner: true
      }
    },
    {
      enabled: !!account?.address && account.address !== knownAddresses[0]
    }
  )

  const { data: otherChallenges2 } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: knownAddresses[1],
      filter: {
        StructType: `${PACKAGE_ID}::rps_game::Challenge`
      },
      options: {
        showContent: true,
        showType: true,
        showOwner: true
      }
    },
    {
      enabled: !!account?.address && account.address !== knownAddresses[1]
    }
  )

  // Combine all challenges and remove duplicates
const allChallengesData = [
  ...(userChallenges?.data || []),
  ...(otherChallenges1?.data || []),
  ...(otherChallenges2?.data || [])
]

// Remove duplicate challenges by Object ID - more robust approach
const seenIds = new Set()
const uniqueChallenges = allChallengesData.filter((challenge) => {
  const id = challenge?.data?.objectId
  if (!id || seenIds.has(id)) {
    return false
  }
  seenIds.add(id)
  return true
})

const allChallenges = {
  data: uniqueChallenges
}
  const refetchChallenges = () => {
    refetchUserChallenges()
  }

  const createChallenge = () => {
    if (!account || !stakeAmount) return
    
    setIsCreating(true)
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${PACKAGE_ID}::rps_game::create_challenge`,
      arguments: [
        tx.object(TREASURY_CAP_ID),
        tx.pure.u64(Math.floor(parseFloat(stakeAmount) * 100))
      ]
    })

    signAndExecute(
      { 
        transaction: tx,
        options: {
          showObjectChanges: true,
          showEffects: true,
        }
      },
      {
        onSuccess: (result) => {
          console.log('Challenge created!', result)
          setStakeAmount('')
          setIsCreating(false)
          refetchChallenges() // Refresh the challenges
          alert('Challenge created successfully! 🎉')
        },
        onError: (error) => {
          console.error('Error creating challenge:', error)
          setIsCreating(false)
          alert('Error: ' + (error.message || 'Unknown error'))
        }
      }
    )
  }

  const joinChallenge = (challengeId: string, requiredStake: number) => {
    if (!account || !userCoins?.data || userCoins.data.length === 0) {
      alert('You need RPS tokens to join a challenge!')
      return
    }
    
    // Find a coin with enough balance
    const suitableCoin = userCoins.data.find(coin => 
      parseInt(coin.balance) >= requiredStake
    )
    
    if (!suitableCoin) {
      alert(`You need at least ${(requiredStake / 100).toFixed(2)} RPS tokens to join this challenge!`)
      return
    }
    
    setJoiningChallengeId(challengeId)
    const tx = new Transaction()
    
    // Split coin if needed or use existing coin
    let stakeCoin
    if (parseInt(suitableCoin.balance) === requiredStake) {
      // Use the exact coin
      stakeCoin = tx.object(suitableCoin.coinObjectId)
    } else {
      // Split the coin to get exact amount
      const splitCoins = tx.splitCoins(tx.object(suitableCoin.coinObjectId), [tx.pure.u64(requiredStake)])
      stakeCoin = splitCoins
    }
    
    tx.moveCall({
      target: `${PACKAGE_ID}::rps_game::join_challenge`,
      arguments: [
        tx.object(challengeId),
        stakeCoin
      ]
    })

    signAndExecute(
      { 
        transaction: tx,
        options: {
          showObjectChanges: true,
          showEffects: true,
        }
      },
      {
        onSuccess: (result) => {
          console.log('Joined challenge!', result)
          setJoiningChallengeId(null)
          refetchChallenges() // Refresh the challenges
          alert('Challenge joined successfully! Game starting! 🎉⚔️')
        },
        onError: (error) => {
          console.error('Error joining challenge:', error)
          setJoiningChallengeId(null)
          alert('Error joining challenge: ' + (error.message || 'Unknown error'))
        }
      }
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          🎮 Rock Paper Scissors Game
        </h1>
        
        <div className="text-center">
          <p className="text-xl mb-8">
            Blockchain-powered RPS battles on Sui Network
          </p>
          
          <div className="mb-8">
            <ConnectButton />
          </div>

          {account && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Wallet Info */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Wallet Connected! 🎉</h3>
                <p className="text-sm text-gray-300 break-all mb-4">
                  Address: {account.address}
                </p>
                
                {/* Status */}
                <div className="bg-green-900 p-3 rounded mb-4 text-sm">
                  <p><strong>Status:</strong> {packageData ? '✅ Ready to create challenges!' : '❌ Package not found'}</p>
                </div>
                
                {/* Token Balance */}
                <div className="bg-gray-700 p-4 rounded">
                  <h4 className="font-semibold mb-2">💰 RPS Token Balance</h4>
                  <p className="text-2xl font-bold text-green-400">
                    {balance ? (parseInt(balance.totalBalance) / 100).toFixed(2) : '0.00'} RPS
                  </p>
                </div>
              </div>

              {/* All Challenges (Global Lobby) */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">🏟️ Available Challenges</h3>
                {allChallenges && allChallenges.data && allChallenges.data.length > 0 ? (
                  <div className="space-y-3">
                    {allChallenges.data.map((challenge: any, index: number) => {
                      // Extract challenge data
                      const challengeData = challenge?.data?.content?.fields
                      const challengeId = challenge?.data?.objectId
                      const challengeOwner = challenge?.data?.owner?.AddressOwner
                      
                      // Check if challenge has opponent
                      const hasOpponent = challengeData?.opponent && challengeData.opponent !== null
                      
                      // Get stake amount
                      const stakeAmount = parseInt(challengeData?.stake?.fields?.balance || '0')
                      
                      // Check if this is the current user's challenge
                      const isMyChallenge = challengeOwner === account?.address
                      
                      return (
                        <div 
                          key={`${challengeOwner}-${challengeId}-${index}`}
                          className="bg-gray-700 p-4 rounded flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold">
                              Challenge #{index + 1} 
                              {isMyChallenge && <span className="text-blue-400"> (Your Challenge)</span>}
                            </p>
                            <p className="text-sm text-gray-300">
                              Creator: {challengeOwner?.slice(0, 6)}...{challengeOwner?.slice(-4)}
                            </p>
                            <p className="text-sm text-gray-300">
                              Object ID: {challengeId?.slice(0, 10)}...
                            </p>
                            <p className="text-sm text-gray-300">
                              Stake: {(stakeAmount / 100).toFixed(2)} RPS
                            </p>
                            <p className="text-sm text-gray-300">
                              Status: {hasOpponent ? '🔴 Battle Ready - Need to implement game!' : '🟢 Waiting for opponent'}
                            </p>
                            <p className="text-xs text-gray-400">
                              Created: {new Date(parseInt(challengeData?.created_at || '0')).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {isMyChallenge ? (
                              <button 
                                className="bg-gray-600 px-4 py-2 rounded font-semibold cursor-not-allowed"
                                disabled
                              >
                                📱 Your Challenge
                              </button>
                            ) : (
                              !hasOpponent && (
                                <button 
                                  onClick={() => joinChallenge(challengeId, stakeAmount)}
                                  disabled={joiningChallengeId === challengeId}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold transition-colors"
                                >
                                  {joiningChallengeId === challengeId ? '⏳ Joining...' : '⚔️ Join Challenge'}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No challenges available</p>
                    <p className="text-sm text-gray-500">Create the first challenge below! 🎮</p>
                  </div>
                )}
              </div>

              {/* Create Challenge */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">⚔️ Create New Challenge</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Stake amount (e.g., 1.50)"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-600 rounded text-white placeholder-gray-400"
                      min="0.01"
                      max="10"
                      step="0.01"
                    />
                    <span className="flex items-center text-gray-300 font-semibold">RPS</span>
                  </div>
                  <button
                    onClick={createChallenge}
                    disabled={!stakeAmount || isCreating || !packageData || parseFloat(stakeAmount) <= 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-3 rounded font-semibold transition-colors"
                  >
                    {isCreating ? '⏳ Creating Challenge...' : packageData ? '🎮 Create Challenge' : '❌ Package Not Found'}
                  </button>
                  {stakeAmount && parseFloat(stakeAmount) > 0 && (
                    <p className="text-sm text-gray-400 text-center">
                      Challenge will await an opponent to join
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}