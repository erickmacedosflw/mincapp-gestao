import type { TenantBrand } from '../config/tenant'

export function applyTenantBranding(brand: TenantBrand) {
  document.title = brand.fullName

  const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']")

  if (favicon) {
    favicon.href = brand.logoSrc
  }
}
