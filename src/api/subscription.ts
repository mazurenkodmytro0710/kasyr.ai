import client from './client'
import type { SubscriptionTier } from '../types'

export interface WayForPayCheckout {
  merchantAccount: string
  merchantDomainName: string
  orderReference: string
  orderDate: number
  amount: number
  currency: string
  productName: string[]
  productCount: number[]
  productPrice: number[]
  merchantSignature: string
  returnUrl: string
  serviceUrl: string
}

export interface Plan {
  name: string
  price: number
  oldPrice?: number
  features: string[]
  maxBanks: number
  aiClassify: boolean
}

export async function getPlans(): Promise<Record<SubscriptionTier, Plan>> {
  const res = await client.get<Record<SubscriptionTier, Plan>>('/api/subscription/plans')
  return res.data
}

export async function createCheckout(tier: SubscriptionTier): Promise<WayForPayCheckout> {
  const res = await client.post<WayForPayCheckout>('/api/subscription/checkout', { tier })
  return res.data
}

export function openWayForPay(params: WayForPayCheckout): void {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = 'https://secure.wayforpay.com/pay'
  form.style.display = 'none'

  const fields: Record<string, string | number | string[] | number[]> = {
    merchantAccount: params.merchantAccount,
    merchantDomainName: params.merchantDomainName,
    orderReference: params.orderReference,
    orderDate: params.orderDate,
    amount: params.amount,
    currency: params.currency,
    merchantSignature: params.merchantSignature,
    returnUrl: params.returnUrl,
    serviceUrl: params.serviceUrl,
  }

  // Append array fields with indexed names
  params.productName.forEach((name, i) => {
    fields[`productName[${i}]`] = name
    fields[`productCount[${i}]`] = params.productCount[i] ?? 1
    fields[`productPrice[${i}]`] = params.productPrice[i] ?? params.amount
  })

  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = String(value)
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}
