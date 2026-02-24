import { useState } from 'react'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import PasswordField from '../../components/forms/PasswordField'
import { authenticate } from '../../services/auth/auth.service'

type LoginForm = {
  email: string
  password: string
}

export default function LoginPage() {
  // Tela de login sem cadastro, focada no acesso rápido para operação diária.
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (values: LoginForm) => {
    try {
      setLoading(true)
      setErrorMessage(null)

      await authenticate({
        email: values.email,
        password: values.password,
      })

      navigate('/dashboard', { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao autenticar'
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card" bordered={false}>
        <img src="/branding/logo-inspire.png" alt="Gestão Inspire" className="login-logo" />
        <Typography.Text strong>Gestão</Typography.Text>
        <Typography.Paragraph type="secondary">
          Entre com e-mail e senha para acessar a gestão.
        </Typography.Paragraph>

        {errorMessage ? (
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Form<LoginForm> layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="E-mail"
            name="email"
            rules={[
              { required: true, message: 'Informe o e-mail.' },
              { type: 'email', message: 'Informe um e-mail válido.' },
            ]}
          >
            <Input
              size="large"
              type="email"
              placeholder="seu-email@dominio.com"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            label="Senha"
            name="password"
            rules={[{ required: true, message: 'Informe a senha.' }]}
          >
            <PasswordField />
          </Form.Item>

          <Button block type="primary" htmlType="submit" size="large" loading={loading}>
            Entrar
          </Button>
        </Form>
      </Card>
    </div>
  )
}
