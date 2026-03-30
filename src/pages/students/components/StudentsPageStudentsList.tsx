import {
  BookOutlined,
  MailOutlined,
  MoreOutlined,
  ReadOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserOutlined,
  WhatsAppOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  Empty,
  List,
  Pagination,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { MenuProps, TableProps } from "antd";
import type { StudentItem } from "../../../types/student";

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

type StudentsPageStudentsListProps = {
  students: StudentItem[];
  total: number;
  page: number;
  perPage: number;
  isMobile: boolean;
  buildWhatsAppUri: (phone?: string | null) => string | null;
  buildGoogleMapsUri: (student: StudentItem) => string | null;
  onViewAcademicLife: (student: StudentItem) => void;
  onViewClasses: (student: StudentItem) => void;
  onTransferStudent: (student: StudentItem) => void;
  onPreviewAddress: (student: StudentItem) => void;
  onPageChange: (page: number) => void;
};

export default function StudentsPageStudentsList({
  students,
  total,
  page,
  perPage,
  isMobile,
  buildWhatsAppUri,
  buildGoogleMapsUri,
  onViewAcademicLife,
  onViewClasses,
  onTransferStudent,
  onPreviewAddress,
  onPageChange,
}: StudentsPageStudentsListProps) {
  const getStudentClassesCount = (student: StudentItem) => {
    return student.classes?.length ?? 0;
  };

  const renderStudentClassesShortcut = (student: StudentItem) => {
    const classesCount = getStudentClassesCount(student);

    if (classesCount === 0) {
      return <Typography.Text type="secondary">-</Typography.Text>;
    }

    return (
      <Button
        type="link"
        style={{ padding: 0, height: "auto" }}
        onClick={() => onViewClasses(student)}
        icon={<ReadOutlined />}
      >
        <Badge
          count={classesCount}
          overflowCount={999999}
          style={{ backgroundColor: "var(--ant-color-primary)" }}
        />
      </Button>
    );
  };

  const renderStudentRegistrationTag = (student: StudentItem) => {
    const isComplete = student.isComplete === true;

    return (
      <Tag color={isComplete ? "success" : "warning"} icon={<SafetyOutlined />}>
        {isComplete ? "Completo" : "Incompleto"}
      </Tag>
    );
  };

  const getStudentMenuItems = (student: StudentItem) => {
    return [
      {
        key: "academic-life",
        icon: <BookOutlined />,
        label: "Vida acadêmica",
      },
      {
        key: "classes",
        icon: <ReadOutlined />,
        label: "Turmas do aluno",
      },
      {
        key: "transfer",
        icon: <TeamOutlined />,
        label: "Transferir de turma",
      },
      student.email
        ? {
            key: "email",
            icon: <MailOutlined />,
            label: <a href={`mailto:${student.email}`}>Enviar e-mail</a>,
          }
        : null,
      buildWhatsAppUri(student.phone)
        ? {
            key: "whatsapp",
            icon: <WhatsAppOutlined />,
            label: (
              <a
                href={buildWhatsAppUri(student.phone) ?? undefined}
                target="_blank"
                rel="noreferrer"
              >
                Chamar no WhatsApp
              </a>
            ),
          }
        : null,
      buildGoogleMapsUri(student)
        ? {
            key: "map",
            icon: <EnvironmentOutlined />,
            label: "Ver endereço",
          }
        : null,
    ].filter(Boolean) as MenuProps["items"];
  };

  const handleStudentMenuClick = (key: string, student: StudentItem) => {
    if (key === "academic-life") {
      onViewAcademicLife(student);
    }

    if (key === "map") {
      onPreviewAddress(student);
    }

    if (key === "classes") {
      onViewClasses(student);
    }

    if (key === "transfer") {
      onTransferStudent(student);
    }
  };

  const desktopColumns: TableProps<StudentItem>["columns"] = [
    {
      title: "Aluno",
      key: "student",
      render: (_: unknown, student) => (
        <Space size={10} align="center">
          <Avatar
            size={42}
            src={student.avatar ?? undefined}
            icon={<UserOutlined />}
          />
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{student.name}</Typography.Text>
            <Typography.Text type="secondary">
              CPF: {formatCpf(student.cpf)}
            </Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Idade",
      dataIndex: "age",
      key: "age",
      width: 70,
      render: (age: number | null | undefined) => age ?? "-",
    },
    {
      title: "E-mail",
      key: "email",
      render: (_: unknown, student) => (
        <Typography.Text type="secondary">
          <MailOutlined style={{ marginRight: 6 }} />
          {student.email || "Sem e-mail"}
        </Typography.Text>
      ),
    },
    {
      title: "WhatsApp",
      key: "whatsapp",
      width: 140,
      render: (_: unknown, student) => {
        const whatsAppUri = buildWhatsAppUri(student.phone);

        if (!whatsAppUri) {
          return <Typography.Text type="secondary">-</Typography.Text>;
        }

        return (
          <a href={whatsAppUri} target="_blank" rel="noreferrer">
            <Space size={6}>
              <WhatsAppOutlined style={{ color: "#52c41a" }} />
              <Typography.Text>{student.phone}</Typography.Text>
            </Space>
          </a>
        );
      },
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
      title: "Rede",
      dataIndex: "network",
      key: "network",
      width: 150,
      render: (network: string | null | undefined) =>
        getOptionalStudentField(network),
    },
    {
      title: "Turmas",
      key: "classes",
      width: 90,
      render: (_: unknown, student) => renderStudentClassesShortcut(student),
    },
    {
      title: "Cadastro",
      key: "registration-status",
      width: 130,
      render: (_: unknown, student) => renderStudentRegistrationTag(student),
    },
    {
      title: "",
      key: "actions",
      width: 70,
      align: "right",
      render: (_: unknown, student) => (
        <Tooltip title="Ações do aluno">
          <Dropdown
            trigger={["click"]}
            menu={{
              items: getStudentMenuItems(student),
              onClick: ({ key }) => handleStudentMenuClick(String(key), student),
            }}
          >
            <Button type="text" shape="circle" icon={<MoreOutlined />} />
          </Dropdown>
        </Tooltip>
      ),
    },
  ];

  if (students.length === 0) {
    return <Empty description="Nenhum aluno encontrado para esta turma." />;
  }

  return (
    <Card>
      {isMobile ? (
        <List
          itemLayout="horizontal"
          dataSource={students}
          renderItem={(student) => {
            const whatsAppUri = buildWhatsAppUri(student.phone);

            return (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={48}
                      src={student.avatar ?? undefined}
                      icon={<UserOutlined />}
                    />
                  }
                  title={
                    <Space
                      style={{
                        width: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography.Text strong>{student.name}</Typography.Text>
                      <Tooltip title="Ações do aluno">
                        <Dropdown
                          trigger={["click"]}
                          menu={{
                            items: getStudentMenuItems(student),
                            onClick: ({ key }) =>
                              handleStudentMenuClick(String(key), student),
                          }}
                        >
                          <Button
                            type="text"
                            shape="circle"
                            icon={<MoreOutlined />}
                          />
                        </Dropdown>
                      </Tooltip>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={2}>
                      <Typography.Text type="secondary">
                        Idade: {student.age ?? "-"}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        <MailOutlined style={{ marginRight: 6 }} />
                        {student.email || "Sem e-mail"}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        <WhatsAppOutlined
                          style={{ marginRight: 6, color: "#52c41a" }}
                        />
                        {student.phone && whatsAppUri ? (
                          <a href={whatsAppUri} target="_blank" rel="noreferrer">
                            {student.phone}
                          </a>
                        ) : (
                          "-"
                        )}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        Tamanho da camisa:{" "}
                        {getOptionalStudentField(student.shirtSize)}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        Célula: {getOptionalStudentField(student.cellName)}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        Líder: {getOptionalStudentField(student.leaderName)}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        Rede: {getOptionalStudentField(student.network)}
                      </Typography.Text>
                      {renderStudentRegistrationTag(student)}
                      <Space size={6}>
                        {renderStudentClassesShortcut(student)}
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      ) : (
        <Table
          rowKey="id"
          dataSource={students}
          columns={desktopColumns}
          pagination={false}
          scroll={{ x: 1250 }}
        />
      )}

      <Pagination
        style={{ marginTop: 16, textAlign: "right" }}
        current={page}
        total={total}
        pageSize={perPage}
        showSizeChanger={false}
        onChange={onPageChange}
      />
    </Card>
  );
}
