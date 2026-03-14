export type TenantId = 'inspire' | 'edf'

export type TenantBrand = {
  id: TenantId
  label: string
  name: string
  fullName: string
  logoSrc: string
}

export const TENANT_OPTIONS: TenantBrand[] = [
  {
    id: 'inspire',
    label: 'Inspire',
    name: 'Inspire',
    fullName: 'Gestão Inspire',
    logoSrc: '/branding/logoInspire.png',
  },
  {
    id: 'edf',
    label: 'EDF',
    name: 'EDF',
    fullName: 'Gestão EDF',
    logoSrc: '/branding/logoEDF.png',
  },
]

export function isTenantId(value: string | null | undefined): value is TenantId {
  return value === 'inspire' || value === 'edf'
}

export function getTenantBrand(tenantId: TenantId | null | undefined) {
  return TENANT_OPTIONS.find((tenant) => tenant.id === tenantId) ?? TENANT_OPTIONS[0]
}
