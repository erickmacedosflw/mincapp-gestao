import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import {
  deleteAdmin,
  getAdminById,
  getAdmins,
  removeCampusFromAdmin,
  addCampusToAdmin,
  updateAdmin,
} from "../../services/admin/admin.service";
import { getCampuses } from "../../services/campus/campus.service";
import type { AdminItem } from "../../types/admin";
import type { CampusItem } from "../../types/campus";

type EditAdminFormValues = {
  name: string;
  email: string;
  isActive: boolean;
  campusIds: string[];
};

function renderPermissions(admin: Pick<AdminItem, "permissions">) {
  if (!admin.permissions.length) {
    return <Typography.Text type="secondary">Sem permissões</Typography.Text>;
  }

  return (
    <Space size={[4, 4]} wrap>
      {admin.permissions.map((permission) => (
        <Tooltip key={permission.id} title={permission.description}>
          <Tag>{permission.name}</Tag>
        </Tooltip>
      ))}
    </Space>
  );
}

export default function AdminsPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<EditAdminFormValues>();
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [campusesLoading, setCampusesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [campusesErrorMessage, setCampusesErrorMessage] = useState<
    string | null
  >(null);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);

  const loadAdmins = useCallback(
    async (options?: { keepLoadingState?: boolean }) => {
      try {
        if (options?.keepLoadingState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage(null);
        const response = await getAdmins({
          page: 1,
          perPage: 100,
          ...(search.trim() ? { search: search.trim() } : {}),
        });
        setAdmins(response.data);
      } catch (error) {
        const nextMessage =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os administradores.";
        setErrorMessage(nextMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search],
  );

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  useEffect(() => {
    async function loadCampusOptions() {
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

    loadCampusOptions();
  }, []);

  const tableData = useMemo(
    () => admins.map((item) => ({ ...item, key: item.id })),
    [admins],
  );
  const campusNameById = useMemo(
    () => new Map(campuses.map((campus) => [campus.id, campus.name])),
    [campuses],
  );

  const renderCampusRestriction = (
    admin: Pick<AdminItem, "campuses" | "campusIds">,
  ) => {
    if (!admin.campuses?.length && !admin.campusIds?.length) {
      return <Tag color="default">Todos os campus</Tag>;
    }

    const campusNames = admin.campuses?.length
      ? admin.campuses.map((campus) => campus.name)
      : (admin.campusIds ?? []).map(
          (campusId) => campusNameById.get(campusId) ?? campusId,
        );

    return (
      <Space size={[4, 4]} wrap>
        {campusNames.map((campusName, index) => (
          <Tag key={`${campusName}-${index}`} color="blue">
            {campusName}
          </Tag>
        ))}
      </Space>
    );
  };

  const closeEditModal = (force = false) => {
    if (saving && !force) {
      return;
    }

    setEditingAdminId(null);
    setEditingAdmin(null);
    form.resetFields();
  };

  const openEditModal = async (adminId: string) => {
    try {
      setEditingAdminId(adminId);
      setSaving(true);
      const admin = await getAdminById(adminId);
      setEditingAdmin(admin);
      form.setFieldsValue({
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        campusIds: admin.campusIds ?? admin.campuses.map((campus) => campus.id),
      });
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados do administrador.";
      message.error(nextMessage);
      setEditingAdminId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (adminId: string) => {
    try {
      await deleteAdmin(adminId);
      message.success("Administrador removido com sucesso.");
      setAdmins((previous) => previous.filter((item) => item.id !== adminId));
      if (editingAdminId === adminId) {
        closeEditModal();
      }
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível remover o administrador.";
      message.error(nextMessage);
    }
  };

  const handleSaveEdit = async (values: EditAdminFormValues) => {
    if (!editingAdmin) {
      return;
    }

    const nextCampusIds = values.campusIds ?? [];
    const currentCampusIds =
      editingAdmin.campusIds ??
      editingAdmin.campuses.map((campus) => campus.id);
    const campusIdsToAdd = nextCampusIds.filter(
      (campusId) => !currentCampusIds.includes(campusId),
    );
    const campusIdsToRemove = currentCampusIds.filter(
      (campusId) => !nextCampusIds.includes(campusId),
    );

    try {
      setSaving(true);

      await updateAdmin(editingAdmin.id, {
        name: values.name.trim(),
        email: values.email.trim(),
        isActive: values.isActive,
      });

      await Promise.all([
        ...campusIdsToAdd.map((campusId) =>
          addCampusToAdmin(editingAdmin.id, campusId),
        ),
        ...campusIdsToRemove.map((campusId) =>
          removeCampusFromAdmin(editingAdmin.id, campusId),
        ),
      ]);

      const refreshedAdmin = await getAdminById(editingAdmin.id);
      setEditingAdmin(refreshedAdmin);
      setAdmins((previous) =>
        previous.map((item) =>
          item.id === refreshedAdmin.id ? refreshedAdmin : item,
        ),
      );
      form.setFieldsValue({
        name: refreshedAdmin.name,
        email: refreshedAdmin.email,
        isActive: refreshedAdmin.isActive,
        campusIds:
          refreshedAdmin.campusIds ??
          refreshedAdmin.campuses.map((campus) => campus.id),
      });
      message.success("Administrador atualizado com sucesso.");
      closeEditModal(true);
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o administrador.";
      message.error(nextMessage);
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<AdminItem> = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
      render: (_, admin) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{admin.name}</Typography.Text>
          <Typography.Text type="secondary">{admin.email}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 140,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "default"}>
          {isActive ? "Ativo" : "Inativo"}
        </Tag>
      ),
    },
    {
      title: "Permissões",
      key: "permissions",
      render: (_, admin) => renderPermissions(admin),
    },
    {
      title: "Campus",
      key: "campuses",
      render: (_, admin) => renderCampusRestriction(admin),
    },
    {
      title: "Ações",
      key: "actions",
      width: 140,
      render: (_, admin) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(admin.id)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Remover admin"
            description="Tem certeza que deseja remover este administrador?"
            okText="Remover"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(admin.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          { title: "Admins" },
        ]}
      />

      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Space size={8} align="center">
            <SafetyCertificateOutlined style={{ fontSize: 22 }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Admins
            </Typography.Title>
          </Space>

          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              loading={refreshing}
              onClick={() => loadAdmins({ keepLoadingState: true })}
            >
              Atualizar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/admins/new")}
            >
              Novo admin
            </Button>
          </Space>
        </div>
        <Typography.Text type="secondary">
          Gerencie administradores, permissões atribuídas e restrições de
          campus.
        </Typography.Text>
      </Space>

      <Card>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Space
            style={{ width: "100%", justifyContent: "space-between" }}
            wrap
          >
            <Input.Search
              value={searchInput}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSearchInput(nextValue);

                if (!nextValue) {
                  setSearch("");
                }
              }}
              onSearch={(value) => setSearch(value)}
              placeholder="Buscar por nome ou e-mail"
              allowClear
              style={{ maxWidth: 360 }}
            />
          </Space>

          {errorMessage ? (
            <Alert type="error" showIcon message={errorMessage} />
          ) : null}

          {loading ? (
            <Spin />
          ) : tableData.length === 0 ? (
            <Empty description="Nenhum administrador encontrado." />
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              scroll={{ x: 960 }}
            />
          )}
        </Space>
      </Card>

      <Modal
        open={Boolean(editingAdminId)}
        title="Editar administrador"
        onCancel={() => closeEditModal()}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {campusesErrorMessage ? (
            <Alert type="error" showIcon message={campusesErrorMessage} />
          ) : null}

          {!editingAdmin ? (
            <Spin />
          ) : (
            <>
              <Card size="small">
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Typography.Text strong>
                    Restrição atual de campus
                  </Typography.Text>
                  {renderCampusRestriction(editingAdmin)}
                  <Typography.Text type="secondary">
                    Nenhum campus selecionado: acesso a todos os campus.
                  </Typography.Text>
                </Space>
              </Card>

              <Form<EditAdminFormValues>
                form={form}
                layout="vertical"
                initialValues={{ isActive: true, campusIds: [] }}
                onFinish={handleSaveEdit}
              >
                <Form.Item
                  label="Nome"
                  name="name"
                  rules={[
                    {
                      required: true,
                      message: "Informe o nome do administrador.",
                    },
                    {
                      whitespace: true,
                      message: "Informe o nome do administrador.",
                    },
                  ]}
                >
                  <Input maxLength={120} />
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
                  <Input type="email" />
                </Form.Item>

                <Form.Item
                  label="Status"
                  name="isActive"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
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
                    optionFilterProp="label"
                    placeholder="Selecione um ou mais campus"
                    options={campuses.map((campus) => ({
                      value: campus.id,
                      label: campus.name,
                    }))}
                  />
                </Form.Item>
              </Form>
            </>
          )}
        </Space>
      </Modal>
    </Space>
  );
}
