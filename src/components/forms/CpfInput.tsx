import { Input } from 'antd'
import { formatCpf } from '../../utils/cpf'

type CpfInputProps = {
  value?: string
  onChange?: (value: string) => void
}

export default function CpfInput({ value, onChange }: CpfInputProps) {
  // Campo de CPF reutilizável para manter máscara consistente em formulários.
  const handleChange = (inputValue: string) => {
    onChange?.(formatCpf(inputValue))
  }

  return (
    <Input
      value={value}
      maxLength={14}
      placeholder="000.000.000-00"
      inputMode="numeric"
      size="large"
      onChange={(event) => handleChange(event.target.value)}
    />
  )
}
