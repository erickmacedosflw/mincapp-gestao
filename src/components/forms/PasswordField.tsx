import { Input } from 'antd'

type PasswordFieldProps = {
  value?: string
  onChange?: (value: string) => void
}

export default function PasswordField({ value, onChange }: PasswordFieldProps) {
  // Campo de senha isolado para padronizar uso em diferentes formulários.
  return (
    <Input.Password
      value={value}
      placeholder="Digite sua senha"
      size="large"
      onChange={(event) => onChange?.(event.target.value)}
    />
  )
}
