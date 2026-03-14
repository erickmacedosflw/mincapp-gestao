import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Form, Input, Select, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { applyTenantBranding } from "../../app/app-branding";
import PasswordField from "../../components/forms/PasswordField";
import {
  getTenantBrand,
  TENANT_OPTIONS,
  type TenantId,
} from "../../config/tenant";
import { authenticate } from "../../services/auth/auth.service";
import {
  getTenantSelection,
  saveTenantSelection,
} from "../../services/auth/token.storage";

type LoginForm = {
  tenant: TenantId;
  email: string;
  password: string;
};

export default function LoginPage() {
  // Tela de login sem cadastro, focada no acesso rápido para operação diária.
  const navigate = useNavigate();
  const [form] = Form.useForm<LoginForm>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantId | null>(
    getTenantSelection(),
  );
  const brand = useMemo(() => getTenantBrand(selectedTenant), [selectedTenant]);

  useEffect(() => {
    applyTenantBranding(brand);
  }, [brand]);

  const handleSubmit = async (values: LoginForm) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      saveTenantSelection(values.tenant);

      await authenticate(
        {
          email: values.email,
          password: values.password,
        },
        values.tenant,
      );

      navigate("/class", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao autenticar";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card" bordered={false}>
        <img
          src={brand.logoSrc}
          alt={brand.fullName}
          className="login-logo"
          style={{ margin: "0 auto 16px" }}
        />
        <Typography.Text strong>{brand.fullName}</Typography.Text>
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

        <Form<LoginForm>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            tenant: selectedTenant ?? undefined,
          }}
        >
          <Form.Item
            label="E-mail"
            name="email"
            rules={[
              { required: true, message: "Informe o e-mail." },
              { type: "email", message: "Informe um e-mail válido." },
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
            rules={[{ required: true, message: "Informe a senha." }]}
          >
            <PasswordField />
          </Form.Item>

          <Form.Item
            label="Selecione o ambiente"
            name="tenant"
            rules={[{ required: true, message: "Selecione o ambiente." }]}
          >
            <Select
              size="large"
              placeholder="Escolha o ambiente"
              options={TENANT_OPTIONS.map((tenant) => ({
                value: tenant.id,
                label: tenant.label,
              }))}
              onChange={(value: TenantId) => {
                setSelectedTenant(value);
                setErrorMessage(null);
              }}
            />
          </Form.Item>

          <Button
            block
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
          >
            Entrar
          </Button>
        </Form>

        <Typography.Text type="secondary" className="app-version-text">
          Versão do app: {__APP_VERSION__}
        </Typography.Text>
      </Card>
    </div>
  );
}
