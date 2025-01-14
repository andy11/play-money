import Decimal from 'decimal.js'
import _ from 'lodash'
import { trade, quote } from '@play-money/finance/amms/maniswap-v1.1'
import { createTransaction, TransactionItemInput } from '@play-money/finance/lib/createTransaction'
import { convertMarketSharesToPrimary } from '@play-money/finance/lib/exchanger'
import { getBalances } from '@play-money/finance/lib/getBalances'
import { getUserPrimaryAccount } from '@play-money/users/lib/getUserPrimaryAccount'
import { getMarketAmmAccount } from './getMarketAmmAccount'
import { getMarketOption } from './getMarketOption'

type MarketSellTransactionInput = {
  userId: string
  amount: Decimal // in shares
  optionId: string
  marketId: string
}

export async function createMarketSellTransaction({ userId, marketId, amount, optionId }: MarketSellTransactionInput) {
  const userAccount = await getUserPrimaryAccount({ userId })
  const ammAccount = await getMarketAmmAccount({ marketId })
  const marketOption = await getMarketOption({ id: optionId, marketId })

  const ammBalances = await getBalances({ accountId: ammAccount.id, marketId })
  const ammAssetBalances = ammBalances.filter(({ assetType }) => assetType === 'MARKET_OPTION')

  // When selling shares, the number of shares will decrease some by filling amm/limit orders.
  // We need an equilivant number of yes and no shares to get money back out of the exchanger.
  let outstandingShares = amount
  let oppositeOutstandingShares = new Decimal(0)
  let accumulatedTransactionItems: Array<TransactionItemInput> = []
  // To account for floating point errors, we will limit the number of loops to a sane number.
  let maximumSaneLoops = 100

  while (outstandingShares.toDecimalPlaces(4).gt(0) && maximumSaneLoops > 0) {
    let closestLimitOrder = {} as any // TODO: Implement limit order matching

    const amountToSell = closestLimitOrder?.probability
      ? (
          await quote({
            amount: outstandingShares,
            probability: closestLimitOrder?.probability ?? 0.99,
            targetShare: ammAssetBalances.find((balance) => balance.assetId === marketOption.id)!.amount,
            shares: ammAssetBalances.map((balance) => balance.amount),
          })
        ).cost
      : outstandingShares

    const returnedShares = await trade({
      amount: amountToSell,
      targetShare: ammAssetBalances.find((balance) => balance.assetId === marketOption.id)!.amount,
      shares: ammAssetBalances.map((balance) => balance.amount),
      isBuy: false,
    })

    const oppositeCurrencyCode = marketOption.currencyCode === 'YES' ? 'NO' : 'YES'

    accumulatedTransactionItems.push(
      // Giving the shares to the AMM.
      { accountId: userAccount.id, currencyCode: marketOption.currencyCode, amount: amountToSell.neg() },
      { accountId: ammAccount.id, currencyCode: marketOption.currencyCode, amount: amountToSell },

      // Returning purchased shares to the user.
      { accountId: userAccount.id, currencyCode: marketOption.currencyCode, amount: returnedShares },
      { accountId: userAccount.id, currencyCode: oppositeCurrencyCode, amount: returnedShares },
      { accountId: ammAccount.id, currencyCode: marketOption.currencyCode, amount: returnedShares.neg() },
      { accountId: ammAccount.id, currencyCode: oppositeCurrencyCode, amount: returnedShares.neg() }
    )

    outstandingShares = outstandingShares.sub(amountToSell)
    oppositeOutstandingShares = oppositeOutstandingShares.add(returnedShares)
    maximumSaneLoops -= 1
  }

  const exchangerTransactions = await convertMarketSharesToPrimary({
    fromAccountId: userAccount.id,
    amount: oppositeOutstandingShares,
    marketId,
    inflightTransactionItems: accumulatedTransactionItems,
  })
  accumulatedTransactionItems.push(...exchangerTransactions)

  if (maximumSaneLoops === 0) {
    console.log('Maximum sane loops reached')
  }

  const transaction = await createTransaction({
    creatorId: userAccount.id,
    type: 'MARKET_SELL',
    description: `Sell ${amount} worth of option ${optionId} in market ${marketId}`,
    marketId,
    transactionItems: accumulatedTransactionItems,
  })

  return transaction
}
