'use client'
import { ConnectButton, useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useState } from 'react'

const PACKAGE_ID = "0x997e53c07355247d6debd7d11272d63428d564cc1c2cfe4674b0199047bf1672"
const TREASURY_CAP_ID = "0x2c5b6c528561c0dd8f0512ef01a3f1b68b65a5cdc448d9b70a3b0485e43481b1"

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

  // Get challenges owned by user - this is the fix!
  const { data: userChallenges, refetch: refetchChallenges } = useSuiClientQuery(
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

              {/* Your Challenges */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">🏟️ Your Challenges</h3>
                {userChallenges && userChallenges.data && userChallenges.data.length > 0 ? (
                  <div className="space-y-3">
                    {userChallenges.data.map((challenge: any, index: number) => {
                      // Extract challenge data
                      const challengeData = challenge?.data?.content?.fields
                      const challengeId = challenge?.data?.objectId
                      
                      // Check if challenge has opponent
                      const hasOpponent = challengeData?.opponent && challengeData.opponent !== null
                      
                      // Get stake amount
                      const stakeAmount = parseInt(challengeData?.stake?.fields?.balance || '0')
                      
                      return (
                        <div 
                          key={challengeId || `challenge-${index}`} 
                          className="bg-gray-700 p-4 rounded flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold">Challenge #{index + 1}</p>
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
                            <button 
                              className="bg-gray-600 px-4 py-2 rounded font-semibold cursor-not-allowed"
                              disabled
                            >
                              📱 Your Challenge
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No challenges created yet</p>
                    <p className="text-sm text-gray-500">Create your first challenge below! 🎮</p>
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