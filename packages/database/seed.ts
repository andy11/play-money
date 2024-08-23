import { faker } from '@faker-js/faker'
import { User } from '@prisma/client'
import Decimal from 'decimal.js'
import _ from 'lodash'
import { createComment } from '@play-money/comments/lib/createComment'
import db from '@play-money/database'
import { INITIAL_USER_BALANCE_PRIMARY } from '@play-money/finance/economy'
import { createHouseUserGiftTransaction } from '@play-money/finance/lib/createHouseUserGiftTransaction'
import { createMarket } from '@play-money/markets/lib/createMarket'
import { marketBuy } from '@play-money/markets/lib/marketBuy'
import { resolveMarket } from '@play-money/markets/lib/resolveMarket'
import { mockUser } from './mocks'
import { OmittedUserFields } from './prisma'

async function main() {
  await db.currency.upsert({
    where: { code: 'PRIMARY' },
    update: {},
    create: {
      name: 'Dollars',
      symbol: '$',
      code: 'PRIMARY',
      imageUrl: '/images/dollars.svg',
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  })

  await db.currency.upsert({
    where: { code: 'YES' },
    update: {},
    create: {
      name: 'Yes Shares',
      symbol: 'Y',
      code: 'YES',
      imageUrl: '/images/yes-shares.svg',
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  })

  await db.currency.upsert({
    where: { code: 'NO' },
    update: {},
    create: {
      name: 'No Shares',
      symbol: 'N',
      code: 'NO',
      imageUrl: '/images/no-shares.svg',
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  })

  await db.currency.upsert({
    where: { code: 'LPB' },
    update: {},
    create: {
      name: 'LP Bonuses',
      symbol: 'LPB',
      code: 'LPB',
      imageUrl: '/images/lp-bonuses.svg',
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  })

  await db.account.upsert({
    where: { internalType: 'HOUSE' },
    update: {},
    create: {
      internalType: 'HOUSE',
    },
  })

  await db.account.upsert({
    where: { internalType: 'EXCHANGER' },
    update: {},
    create: {
      internalType: 'EXCHANGER',
    },
  })
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
