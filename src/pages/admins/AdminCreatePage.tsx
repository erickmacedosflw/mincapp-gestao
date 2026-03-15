import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import {
  EnvironmentOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import PasswordField from "../../components/forms/PasswordField";
import { DEFAULT_ADMIN_PERMISSIONS } from "../../constants/admin-permissions";
import {
  assignPermissionToAdmin,
  createAdmin,
  createPermissionTypesBulk,
  getPermissionTypes,
} from "../../services/admin/admin.service";
import { getCampuses } from "../../services/campus/campus.service";
import type { CampusItem } from "../../types/campus";
import type { PermissionTypeItem } from "../../types/admin";

type AdminCreateFormValues = {
  name: string;
  email: string;
  password: string;
  campusIds?: string[];
};

export default function AdminCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<AdminCreateFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionsErrorMessage, setPermissionsErrorMessage] = useState<
    string | null
  >(null);
  const [permissionSelectionError, setPermissionSelectionError] = useState<
    string | null
  >(null);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [permissions, setPermissions] = useState<PermissionTypeItem[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [campusesLoading, setCampusesLoading] = useState(true);
  const [campusesErrorMessage, setCampusesErrorMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function loadPermissions() {
      try {
        setPermissionsLoading(true);
        setPermissionsErrorMessage(null);

        const currentPermissions = await getPermissionTypes();
        const existingNames = new Set(
          currentPermissions.map((item) => item.name),
        );
        const missingPermissions = DEFAULT_ADMIN_PERMISSIONS.filter(
          (item) => !existingNames.has(item.name),
        );

        if (missingPermissions.length > 0) {
          await createPermissionTypesBulk({ permissions: missingPermissions });
        }

        const refreshedPermissions = await getPermissionTypes();
        setPermissions(
          [...refreshedPermissions].sort((firstItem, secondItem) =>
            firstItem.name.localeCompare(secondItem.name, "pt-BR"),
          ),
        );
      } catch (error) {
        const nextMessage =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as permissões disponíveis.";

        setPermissionsErrorMessage(nextMessage);
      } finally {
        setPermissionsLoading(false);
      }
    }

    loadPermissions();
  }, []);

  useEffect(() => {
    async function loadCampuses() {
      try {
        setCampusesLoading(true);
        setCampusesErrorMessage(null);
        setCampuses(await getCampuses());
      } catch (error) {
        const nextMessage =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os campus disponíveis.";

        setCampusesErrorMessage(nextMessage);
      } finally {
        setCampusesLoading(false);
      }
    }

    loadCampuses();
  }, []);

  const filteredPermissions = useMemo(() => {
    const normalizedSearch = permissionSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return permissions;
    }

    return permissions.filter((item) => {
      const haystack = `${item.name} ${item.description}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [permissionSearch, permissions]);

  const allPermissionsSelected =
    permissions.length > 0 &&
    selectedPermissionIds.length === permissions.length;

  const handleSubmit = async (values: AdminCreateFormValues) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setPermissionSelectionError(null);

      if (selectedPermissionIds.length === 0) {
        setPermissionSelectionError(
          "Selecione pelo menos uma permissão para cadastrar o administrador.",
        );
        setIsSubmitting(false);
        return;
      }

      // Scroll para o topo da página para exibir possíveis mensagens de erro
      window.scrollTo({ top: 0, behavior: "smooth" });

      const createdAdmin = await createAdmin({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        campusIds: values.campusIds?.length ? values.campusIds : [],
      });

      if (selectedPermissionIds.length > 0) {
        await Promise.all(
          selectedPermissionIds.map((permissionId) =>
            assignPermissionToAdmin(createdAdmin.id, permissionId),
          ),
        );
      }

      message.success("Administrador cadastrado com sucesso.");
      form.resetFields();
      setSelectedPermissionIds([]);
      setPermissionSearch("");
      setPermissionSelectionError(null);

      // Redireciona para a página de listagem de admins
      navigate("/admins");
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o administrador.";

      setErrorMessage(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Breadcrumb
        items={[
          { title: <Link to="/admins">Admins</Link> },
          { title: "Novo Admin" },
        ]}
      />

      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <Space size={8} align="center">
          <SafetyCertificateOutlined style={{ fontSize: 22 }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Novo Admin
          </Typography.Title>
        </Space>
        <Typography.Text type="secondary">
          Cadastre um novo administrador usando o token e o tenant da sessão
          atual.
        </Typography.Text>
      </Space>

      <Card bordered={false} style={{ maxWidth: 720, width: "100%" }}>
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          {errorMessage ? (
            <Alert type="error" showIcon message={errorMessage} />
          ) : null}

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
                { required: true, message: "Informe o nome do administrador." },
                {
                  whitespace: true,
                  message: "Informe o nome do administrador.",
                },
                {
                  validator: async (_, value: string | undefined) => {
                    if (!value || value.trim().length >= 2) {
                      return;
                    }

                    throw new Error("O nome deve ter pelo menos 2 caracteres.");
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
                {
                  required: true,
                  message: "Informe o e-mail do administrador.",
                },
                { type: "email", message: "Informe um e-mail válido." },
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
                { required: true, message: "Informe a senha." },
                {
                  min: 8,
                  message: "A senha deve ter pelo menos 8 caracteres.",
                },
              ]}
            >
              <PasswordField />
            </Form.Item>

            <Form.Item
              label="Campus permitidos"
              name="campusIds"
              extra="Nenhum campus selecionado: acesso a todos os campus."
            >
              <Select
                mode="multiple"
                allowClear
                loading={campusesLoading}
                placeholder="Selecione um ou mais campus"
                optionFilterProp="label"
                options={campuses.map((campus) => ({
                  value: campus.id,
                  label: campus.name,
                }))}
                notFoundContent={
                  campusesLoading
                    ? "Carregando campus..."
                    : "Nenhum campus disponível."
                }
              />
            </Form.Item>

            {campusesErrorMessage ? (
              <Alert
                type="error"
                showIcon
                message={campusesErrorMessage}
                style={{ marginBottom: 16 }}
              />
            ) : null}

            <Card size="small" style={{ marginBottom: 24 }}>
              <Space size={8} align="start">
                <EnvironmentOutlined style={{ marginTop: 3 }} />
                <Space direction="vertical" size={2}>
                  <Typography.Text strong>Restrição de campus</Typography.Text>
                  <Typography.Text type="secondary">
                    Deixe o campo vazio para criar um admin sem restrição de
                    campus, com acesso a todos os campus.
                  </Typography.Text>
                </Space>
              </Space>
            </Card>

            <Card size="small" title="Permissões do administrador">
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Typography.Text type="secondary">
                  Selecione as permissões que serão atribuídas ao novo
                  administrador após o cadastro.
                </Typography.Text>

                {permissionsErrorMessage ? (
                  <Alert
                    type="error"
                    showIcon
                    message={permissionsErrorMessage}
                  />
                ) : null}
                {permissionSelectionError ? (
                  <Alert
                    type="warning"
                    showIcon
                    message={permissionSelectionError}
                  />
                ) : null}

                <Input.Search
                  value={permissionSearch}
                  onChange={(event) => setPermissionSearch(event.target.value)}
                  placeholder="Buscar permissões por nome ou descrição"
                  allowClear
                  disabled={permissionsLoading || isSubmitting}
                />

                <Space size={8} wrap>
                  <Button
                    onClick={() => {
                      setSelectedPermissionIds(
                        permissions.map((item) => item.id),
                      );
                      setPermissionSelectionError(null);
                    }}
                    disabled={
                      permissionsLoading ||
                      permissions.length === 0 ||
                      allPermissionsSelected ||
                      isSubmitting
                    }
                  >
                    Marcar todas
                  </Button>
                  <Button
                    onClick={() => setSelectedPermissionIds([])}
                    disabled={
                      permissionsLoading ||
                      selectedPermissionIds.length === 0 ||
                      isSubmitting
                    }
                  >
                    Desmarcar todas
                  </Button>
                  <Typography.Text type="secondary">
                    {selectedPermissionIds.length} de {permissions.length}{" "}
                    selecionada(s)
                  </Typography.Text>
                </Space>

                {permissionsLoading ? (
                  <Typography.Text type="secondary">
                    Carregando permissões...
                  </Typography.Text>
                ) : filteredPermissions.length === 0 ? (
                  <Typography.Text type="secondary">
                    Nenhuma permissão encontrada para a busca informada.
                  </Typography.Text>
                ) : (
                  <Checkbox.Group
                    value={selectedPermissionIds}
                    onChange={(checkedValues) => {
                      const nextValues = checkedValues as string[];
                      setSelectedPermissionIds(nextValues);

                      if (nextValues.length > 0) {
                        setPermissionSelectionError(null);
                      }
                    }}
                    style={{ width: "100%" }}
                    disabled={isSubmitting}
                  >
                    <Row gutter={[12, 12]}>
                      {filteredPermissions.map((permission) => (
                        <Col xs={24} key={permission.id}>
                          <Card size="small">
                            <Checkbox
                              value={permission.id}
                              style={{ width: "100%" }}
                            >
                              <Space
                                direction="vertical"
                                size={2}
                                style={{ width: "100%" }}
                              >
                                <Typography.Text strong>
                                  {permission.name}
                                </Typography.Text>
                                <Typography.Text type="secondary">
                                  {permission.description}
                                </Typography.Text>
                              </Space>
                            </Checkbox>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                )}
              </Space>
            </Card>

            <Space
              size={8}
              style={{
                marginTop: 24,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                htmlType="button"
                onClick={() => form.resetFields()}
                disabled={isSubmitting}
              >
                Limpar
              </Button>
              <Button
                htmlType="button"
                onClick={() => navigate("/admins")}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Salvar admin
              </Button>
            </Space>
          </Form>
        </Space>
      </Card>
    </Space>
  );
}
