import db from '@play-money/database'
import { getUniqueTraderIds } from '@play-money/markets/lib/getUniqueTraderIds'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { getUserById } from '@play-money/users/lib/getUserById'
import { createMarketExcessLiquidityTransactions } from './createMarketExcessLiquidityTransactions'
import { createMarketResolveLossTransactions } from './createMarketResolveLossTransactions'
import { createMarketResolveWinTransactions } from './createMarketResolveWinTransactions'
import { getMarket } from './getMarket'
import { canResolveMarket } from './helpers'

export async function resolveMarket({
  resolverId,
  marketId,
  optionId,
  supportingLink,
}: {
  resolverId: string
  marketId: string
  optionId: string
  supportingLink?: string
}) {
  const market = await getMarket({ id: marketId, extended: true })

  if (market.resolvedAt) {
    throw new Error('Market already resolved')
  }

  if (!canResolveMarket({ market, userId: resolverId })) {
    throw new Error('User cannot resolve market')
  }

  await db.$transaction(async (tx) => {
    const now = new Date()

    await tx.marketResolution.upsert({
      where: { marketId },
      create: {
        marketId,
        resolutionId: optionId,
        supportingLink,
        resolvedById: resolverId,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        resolutionId: optionId,
        supportingLink,
        resolvedById: resolverId,
        updatedAt: now,
      },
    })

    await tx.market.update({
      where: { id: marketId },
      data: { resolvedAt: now, closeDate: now },
    })
  })

  await createMarketResolveLossTransactions({
    marketId,
    initiatorId: resolverId,
    winningOptionId: optionId,
  })

  await createMarketResolveWinTransactions({
    marketId,
    initiatorId: resolverId,
    winningOptionId: optionId,
  })

  await createMarketExcessLiquidityTransactions({ marketId, initiatorId: resolverId })

  const user = await getUserById({ id: resolverId })
  const recipientIds = await getUniqueTraderIds(marketId, [user.id])

  await Promise.all(
    recipientIds.map((recipientId) =>
      createNotification({
        type: 'MARKET_RESOLVED',
        actorId: resolverId,
        marketId: market.id,
        marketOptionId: optionId,
        groupKey: market.id,
        userId: recipientId,
        actionUrl: `/questions/${market.id}/${market.slug}`,
      })
    )
  )
}
