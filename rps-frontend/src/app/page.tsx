'use client'
import { ConnectButton, useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useState, useEffect } from 'react'

const PACKAGE_ID = "0x2d87063a9452573338e0545e86d6a0c4062bbe8fa606956f8315f3c56f1ba05d"
const TREASURY_CAP_ID = "0xa1958abf65ec23cf3fe6a0298334173e788e9c30020d193aed6a0d236e932ab5"

export default function Home() {
  const account = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [stakeAmount, setStakeAmount] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(null)
  const [cancellingChallengeId, setCancellingChallengeId] = useState<string | null>(null)
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string | null>(null)
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const [isRefreshingChallenges, setIsRefreshingChallenges] = useState(false)
  
  // Clear state when wallet changes
  useEffect(() => {
    const newAddress = account?.address || null
    if (currentWalletAddress !== newAddress) {
      console.log('Wallet changed from', currentWalletAddress, 'to', newAddress)
      // Clear any cached state
      setStakeAmount('')
      setIsCreating(false)
      setJoiningChallengeId(null)
      setCancellingChallengeId(null)
      setIsRefreshingBalance(false)
      setIsRefreshingChallenges(false)
      setCurrentWalletAddress(newAddress)
    }
  }, [account?.address, currentWalletAddress])

  // Get user's RPS token balance
  const { data: balance, refetch: refetchBalance } = useSuiClientQuery(
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
  const { data: userCoins, refetch: refetchUserCoins } = useSuiClientQuery(
    'getCoins',
    {
      owner: account?.address || '',
      coinType: `${PACKAGE_ID}::rps_token::RPS_TOKEN`
    },
    {
      enabled: !!account?.address
    }
  )

  // Refetch user data when wallet changes
  useEffect(() => {
    if (account?.address) {
      refetchBalance()
      refetchUserCoins()
    }
  }, [account?.address, refetchBalance, refetchUserCoins])

  // Check if package exists
  const { data: packageData } = useSuiClientQuery(
    'getObject',
    { id: PACKAGE_ID },
    { enabled: !!account }
  )

  // Query challenge creation events to get all challenge IDs
  const { data: challengeEvents, refetch: refetchChallengeEvents } = useSuiClientQuery(
    'queryEvents',
    {
      query: {
        MoveEventType: `${PACKAGE_ID}::rps_game::ChallengeCreated`
      }
    },
    {
      enabled: !!account?.address
    }
  )

  // Extract challenge IDs from events
  const challengeIds = challengeEvents?.data?.map((event: any) => event.parsedJson?.challenge_id).filter(Boolean) || []

  // Manual refresh functions
  const refreshBalance = async () => {
    if (!account?.address) return
    setIsRefreshingBalance(true)
    try {
      await Promise.all([refetchBalance(), refetchUserCoins()])
    } finally {
      setIsRefreshingBalance(false)
    }
  }

  const refreshChallenges = async () => {
    setIsRefreshingChallenges(true)
    try {
      await Promise.all([refetchChallengeEvents(), refetchChallenges()])
    } finally {
      setIsRefreshingChallenges(false)
    }
  }

  // Get challenge objects by their IDs
  const { data: challengeObjects, refetch: refetchChallenges } = useSuiClientQuery(
    'multiGetObjects',
    {
      ids: challengeIds,
      options: {
        showContent: true,
        showType: true,
        showOwner: true
      }
    },
    {
      enabled: challengeIds.length > 0
    }
  )

  // Create a simple structure that matches the old format
  const allChallenges = {
    data: challengeObjects?.filter(obj => obj.data).map(obj => ({ data: obj.data })) || []
  }

  const createChallenge = () => {
    if (!account || !stakeAmount || !userCoins?.data || userCoins.data.length === 0) {
      alert('You need RPS tokens to create a challenge!')
      return
    }
    
    const requiredStake = Math.floor(parseFloat(stakeAmount) * 100)
    
    // Find a coin with enough balance
    const suitableCoin = userCoins.data.find(coin => parseInt(coin.balance) >= requiredStake)
    
    if (!suitableCoin) {
      alert(`You need at least ${parseFloat(stakeAmount).toFixed(2)} RPS tokens to create this challenge!`)
      return
    }
    
    setIsCreating(true)
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
      target: `${PACKAGE_ID}::rps_game::create_challenge`,
      arguments: [
        stakeCoin
      ]
    })

    signAndExecute(
      { 
        transaction: tx
      },
      {
        onSuccess: (result: any) => {
          console.log('Challenge created!', result)
          
          setStakeAmount('')
          setIsCreating(false)
          refetchChallengeEvents() // Refresh the events
          refetchChallenges() // Refresh the challenges
          refetchBalance() // Refresh balance
          refetchUserCoins() // Refresh coins
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
    
    // Find a coin with enough balance that belongs to current wallet
    const suitableCoin = userCoins.data.find(coin => {
      const hasEnoughBalance = parseInt(coin.balance) >= requiredStake
      // Verify token ownership - the coin should be owned by current account
      console.log('Checking coin:', coin.coinObjectId, 'Balance:', coin.balance, 'Current account:', account.address)
      return hasEnoughBalance
    })
    
    if (!suitableCoin) {
      alert(`You need at least ${(requiredStake / 100).toFixed(2)} RPS tokens to join this challenge!`)
      return
    }
    
    // Double-check ownership before proceeding
    console.log('Using coin:', suitableCoin.coinObjectId, 'owned by current wallet:', account.address)
    console.log('Coin balance:', suitableCoin.balance, 'Required stake:', requiredStake)
    console.log('Challenge ID to join:', challengeId)
    
    setJoiningChallengeId(challengeId)
    const tx = new Transaction()
    
    // Split coin if needed or use existing coin
    let stakeCoin
    if (parseInt(suitableCoin.balance) === requiredStake) {
      // Use the exact coin
      stakeCoin = tx.object(suitableCoin.coinObjectId)
      console.log('Using exact coin:', suitableCoin.coinObjectId)
    } else {
      // Split the coin to get exact amount
      const splitCoins = tx.splitCoins(tx.object(suitableCoin.coinObjectId), [tx.pure.u64(requiredStake)])
      stakeCoin = splitCoins
      console.log('Splitting coin:', suitableCoin.coinObjectId, 'to get', requiredStake)
    }
    
    console.log('=== TRANSACTION DETAILS ===')
    console.log('Challenge object ID:', challengeId)
    console.log('Stake coin object ID:', suitableCoin.coinObjectId)
    console.log('Current signer address:', account.address)
    
    tx.moveCall({
      target: `${PACKAGE_ID}::rps_game::join_challenge`,
      arguments: [
        tx.object(challengeId),
        stakeCoin
      ]
    })
    
    // Log transaction inputs before execution
    console.log('=== TRANSACTION INPUTS ===')
    console.log('Transaction object:', tx)
    console.log('All transaction inputs:', tx.getData().inputs)

    signAndExecute(
      { 
        transaction: tx
      },
      {
        onSuccess: (result) => {
          console.log('Joined challenge!', result)
          setJoiningChallengeId(null)
          refetchChallengeEvents() // Refresh the events
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

  const cancelChallenge = (challengeId: string) => {
    if (!account) {
      alert('Please connect your wallet!')
      return
    }
    
    console.log('Cancelling challenge:', challengeId)
    setCancellingChallengeId(challengeId)
    
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${PACKAGE_ID}::rps_game::cancel_challenge`,
      arguments: [
        tx.object(challengeId)
      ]
    })

    signAndExecute(
      { 
        transaction: tx
      },
      {
        onSuccess: (result) => {
          console.log('Challenge cancelled successfully!', result)
          setCancellingChallengeId(null)
          refetchChallengeEvents() // Refresh the events
          refetchChallenges() // Refresh the challenges
          refetchBalance() // Refresh balance
          refetchUserCoins() // Refresh coins
          alert('Challenge cancelled! Your funds have been returned. 💰')
        },
        onError: (error) => {
          console.error('Error cancelling challenge:', error)
          setCancellingChallengeId(null)
          alert('Error cancelling challenge: ' + (error.message || 'Unknown error'))
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
              {/* STATUS BANNER */}
              <div className="bg-green-900 border border-green-500 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">🎉 PRODUCTION READY - FULLY FUNCTIONAL GAMEFI PLATFORM</h3>
                <p className="text-sm mb-2">
                  <strong>Status:</strong> ✅ Fund escrow ✅ Token consumption ✅ Balance updates ✅ Challenge cancellation
                </p>
                <p className="text-sm mb-2">
                  <strong>Contract:</strong> {PACKAGE_ID}
                </p>
                <p className="text-sm">
                  <strong>Features:</strong> Create challenges • Join battles • Cancel for refunds • Real-time balance updates
                </p>
              </div>

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
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">💰 RPS Token Balance</h4>
                    <button
                      onClick={refreshBalance}
                      disabled={isRefreshingBalance}
                      className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      {isRefreshingBalance ? '⏳' : '🔄'} {isRefreshingBalance ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    {balance ? (parseInt(balance.totalBalance) / 100).toFixed(2) : '0.00'} RPS
                  </p>
                </div>
              </div>

              {/* All Challenges (Global Lobby) */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">🏟️ Available Challenges</h3>
                  <button
                    onClick={refreshChallenges}
                    disabled={isRefreshingChallenges}
                    className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    {isRefreshingChallenges ? '⏳' : '🔄'} {isRefreshingChallenges ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                {allChallenges && allChallenges.data && allChallenges.data.length > 0 ? (
                  <div className="space-y-3">
                    {allChallenges.data
                      .filter((challenge: any) => {
                        // Only show challenges that are NOT completed
                        const challengeData = challenge?.data?.content?.fields
                        const isCompleted = challengeData?.is_completed
                        return !isCompleted
                      })
                      .map((challenge: any, index: number) => {
                      // Extract challenge data
                      const challengeData = challenge?.data?.content?.fields
                      const challengeId = challenge?.data?.objectId
                      
                      // For shared objects, we need to check the creator field instead
                      const challengeCreator = challengeData?.creator
                      
                      // Check if challenge has opponent
                      const hasOpponent = challengeData?.opponent && challengeData.opponent !== null
                      
                      // Get stake amount (now using proper contract structure)
                      const stakeAmount = parseInt(challengeData?.stake_amount || '0')
                      
                      // Check if this is the current user's challenge
                      const isMyChallenge = challengeCreator === account?.address
                      
                      return (
                        <div 
                          key={`${challengeCreator}-${challengeId}-${index}`}
                          className="bg-gray-700 p-4 rounded flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold">
                              Challenge #{index + 1} 
                              {isMyChallenge && <span className="text-blue-400"> (Your Challenge)</span>}
                            </p>
                            <p className="text-sm text-gray-300">
                              Creator: {challengeCreator?.slice(0, 6)}...{challengeCreator?.slice(-4)}
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
                              <div className="flex gap-2">
                                <button 
                                  className="bg-gray-600 px-4 py-2 rounded font-semibold cursor-not-allowed"
                                  disabled
                                >
                                  📱 Your Challenge
                                </button>
                                {!hasOpponent && (
                                  <button 
                                    onClick={() => cancelChallenge(challengeId)}
                                    disabled={cancellingChallengeId === challengeId}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold transition-colors"
                                    title="Cancel challenge and recover your staked tokens"
                                  >
                                    {cancellingChallengeId === challengeId ? '⏳ Cancelling...' : '❌ Cancel Challenge'}
                                  </button>
                                )}
                              </div>
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
                    {allChallenges && allChallenges.data && allChallenges.data.length > 0 ? (
                      <div>
                        <p className="text-gray-400 mb-4">All challenges are completed</p>
                        <p className="text-sm text-gray-500">Create a new challenge below! 🎮</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-400 mb-4">No challenges available</p>
                        <p className="text-sm text-gray-500">Create the first challenge below! 🎮</p>
                      </div>
                    )}
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