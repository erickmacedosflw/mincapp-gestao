import { CheckCircleFilled, UserAddOutlined } from "@ant-design/icons";
import {
  Alert,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import type { StudentItem } from "../../../types/student";

type StudentsPageAddTenantStudentsModalProps = {
  open: boolean;
  students: StudentItem[];
  total: number;
  page: number;
  perPage: number;
  searchInput: string;
  selectedStudentIds: string[];
  currentClassStudentIds: Set<string>;
  isLoading: boolean;
  isSaving: boolean;
  isError: boolean;
  onSearchInputChange: (value: string) => void;
  onSearch: (value: string) => void;
  onPageChange: (page: number) => void;
  onSelectionChange: (studentIds: string[]) => void;
  onClose: () => void;
  onConfirm: () => void;
};

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 11) {
    return value;
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function getOptionalStudentField(value?: string | null) {
  return value || "-";
}

export default function StudentsPageAddTenantStudentsModal({
  open,
  students,
  total,
  page,
  perPage,
  searchInput,
  selectedStudentIds,
  currentClassStudentIds,
  isLoading,
  isSaving,
  isError,
  onSearchInputChange,
  onSearch,
  onPageChange,
  onSelectionChange,
  onClose,
  onConfirm,
}: StudentsPageAddTenantStudentsModalProps) {
  const columns: TableProps<StudentItem>["columns"] = [
    {
      title: "Aluno",
      key: "student",
      render: (_: unknown, student) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{student.name}</Typography.Text>
          <Typography.Text type="secondary">
            CPF: {formatCpf(student.cpf)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "E-mail",
      dataIndex: "email",
      key: "email",
      render: (email: string | null | undefined) => email || "Sem e-mail",
    },
    {
      title: "Tamanho da camisa",
      dataIndex: "shirtSize",
      key: "shirtSize",
      width: 150,
      render: (shirtSize: string | null | undefined) =>
        getOptionalStudentField(shirtSize),
    },
    {
      title: "Célula",
      dataIndex: "cellName",
      key: "cellName",
      width: 150,
      render: (cellName: string | null | undefined) =>
        getOptionalStudentField(cellName),
    },
    {
      title: "Líder",
      dataIndex: "leaderName",
      key: "leaderName",
      width: 150,
      render: (leaderName: string | null | undefined) =>
        getOptionalStudentField(leaderName),
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_: unknown, student) =>
        currentClassStudentIds.has(student.id) ? (
          <Tag color="default">Já na turma</Tag>
        ) : (
          <Tag color="blue">Disponível</Tag>
        ),
    },
  ];

  return (
    <Modal
      open={open}
      title={
        <Space size={8} align="center">
          <UserAddOutlined style={{ fontSize: 22 }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Adicionar novos alunos
          </Typography.Title>
        </Space>
      }
      onCancel={onClose}
      onOk={onConfirm}
      okText="Salvar"
      cancelText="Cancelar"
      okButtonProps={{
        disabled: selectedStudentIds.length === 0,
        loading: isSaving,
        icon: <CheckCircleFilled />,
      }}
      cancelButtonProps={{ disabled: isSaving }}
      confirmLoading={isSaving}
      width={900}
      destroyOnHidden
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Input.Search
          value={searchInput}
          allowClear
          placeholder="Buscar aluno por nome ou e-mail"
          disabled={isSaving}
          onChange={(event) => onSearchInputChange(event.target.value)}
          onSearch={onSearch}
        />

        <Typography.Text strong>
          {selectedStudentIds.length} aluno(s) selecionado(s)
        </Typography.Text>

        {isError ? (
          <Alert
            type="error"
            showIcon
            message="Não foi possível carregar os alunos do tenant."
          />
        ) : (
          <Table<StudentItem>
            rowKey="id"
            columns={columns}
            dataSource={students}
            loading={isLoading || isSaving}
            pagination={{
              current: page,
              disabled: isSaving,
              pageSize: perPage,
              total,
              onChange: onPageChange,
              showSizeChanger: false,
            }}
            scroll={{ x: 980 }}
            locale={{
              emptyText: "Nenhum aluno encontrado para os filtros informados.",
            }}
            rowSelection={{
              preserveSelectedRowKeys: true,
              selectedRowKeys: selectedStudentIds,
              onChange: (selectedRowKeys) =>
                onSelectionChange(selectedRowKeys.map(String)),
              getCheckboxProps: (student) => ({
                disabled: isSaving || currentClassStudentIds.has(student.id),
              }),
            }}
          />
        )}

        {currentClassStudentIds.size > 0 ? (
          <Typography.Text type="secondary">
            Alunos que ja pertencem a esta turma aparecem desabilitados.
          </Typography.Text>
        ) : null}
      </Space>
    </Modal>
  );
}
