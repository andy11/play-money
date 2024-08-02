'use client'

import React from 'react'
import { cn } from '@play-money/ui/utils'
import { formatCurrency, formatNumber } from '../lib/formatCurrency'
import { useCurrencyContext } from './CurrencyProvider'

export function CurrencyDisplay({
  value,
  currencyCode,
  className,
  hasSymbol = true,
  isShort = false,
}: {
  value: number
  currencyCode: string
  className?: string
  hasSymbol?: boolean
  isShort?: boolean
}) {
  const { currencies, displayOptions } = useCurrencyContext()
  const currency = currencies[currencyCode]

  const formattedValue = formatCurrency(value, '', displayOptions.decimals)
  const formattedShort = formatNumber(value)

  return (
    <span className={cn('whitespace-nowrap font-mono', className)}>
      <span className="inline-block -translate-y-[5%] scale-125 pr-0.5 leading-none">
        {hasSymbol ? (currencyCode === 'PRIMARY' ? '¤' : currency.symbol) : null}
      </span>
      {isShort ? formattedShort : formattedValue}
    </span>
  )
}
