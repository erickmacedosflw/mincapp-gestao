export function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export function formatCpf(value: string) {
  const digits = digitsOnly(value).slice(0, 11)

  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function isValidCpf(value: string) {
  const cpf = digitsOnly(value)

  if (cpf.length !== 11 || /(\d)\1{10}/.test(cpf)) {
    return false
  }

  const calcDigit = (base: string, factor: number) => {
    const sum = base
      .split('')
      .reduce((acc, digit) => acc + Number(digit) * factor--, 0)

    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  const firstDigit = calcDigit(cpf.slice(0, 9), 10)
  const secondDigit = calcDigit(cpf.slice(0, 10), 11)

  return firstDigit === Number(cpf[9]) && secondDigit === Number(cpf[10])
}
