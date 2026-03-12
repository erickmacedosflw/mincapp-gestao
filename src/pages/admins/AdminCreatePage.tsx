import { useState } from 'react'
import { Alert, Breadcrumb, Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import PasswordField from '../../components/forms/PasswordField'
import { createAdmin } from '../../services/admin/admin.service'

type AdminCreateFormValues = {
  name: string
  email: string
  password: string
}

export default function AdminCreatePage() {
  const [form] = Form.useForm<AdminCreateFormValues>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (values: AdminCreateFormValues) => {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      await createAdmin({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })

      message.success('Administrador cadastrado com sucesso.')
      form.resetFields()
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : 'Não foi possível cadastrar o administrador.'

      setErrorMessage(nextMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Início</Link> },
          { title: 'Novo Admin' },
        ]}
      />

      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space size={8} align="center">
          <SafetyCertificateOutlined style={{ fontSize: 22 }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Novo Admin
          </Typography.Title>
        </Space>
        <Typography.Text type="secondary">
          Cadastre um novo administrador usando o token e o tenant da sessão atual.
        </Typography.Text>
      </Space>

      <Card bordered={false} style={{ maxWidth: 720, width: '100%' }}>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

          <Form<AdminCreateFormValues>
            layout="vertical"
            form={form}
            onFinish={handleSubmit}
            requiredMark
            disabled={isSubmitting}
          >
            <Form.Item
              label="Nome"
              name="name"
              rules={[
                { required: true, message: 'Informe o nome do administrador.' },
                { whitespace: true, message: 'Informe o nome do administrador.' },
                {
                  validator: async (_, value: string | undefined) => {
                    if (!value || value.trim().length >= 2) {
                      return
                    }

                    throw new Error('O nome deve ter pelo menos 2 caracteres.')
                  },
                },
              ]}
            >
              <Input
                placeholder="Novo Administrador"
                maxLength={120}
                autoComplete="name"
              />
            </Form.Item>

            <Form.Item
              label="E-mail"
              name="email"
              rules={[
                { required: true, message: 'Informe o e-mail do administrador.' },
                { type: 'email', message: 'Informe um e-mail válido.' },
              ]}
            >
              <Input
                type="email"
                placeholder="novo.admin@dominio.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              label="Senha"
              name="password"
              rules={[
                { required: true, message: 'Informe a senha.' },
                {
                  min: 8,
                  message: 'A senha deve ter pelo menos 8 caracteres.',
                },
              ]}
            >
              <PasswordField />
            </Form.Item>

            <Space size={8}>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Salvar admin
              </Button>
              <Button htmlType="button" onClick={() => form.resetFields()} disabled={isSubmitting}>
                Limpar
              </Button>
            </Space>
          </Form>
        </Space>
      </Card>
    </Space>
  )
}
