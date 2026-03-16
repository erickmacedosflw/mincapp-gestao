import { DeleteOutlined, MoreOutlined, PlusOutlined, ReadOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Badge, Button, Card, Dropdown, Empty, Modal, Space, Spin, Typography } from "antd";
import ClassCard from "../../../components/classes/ClassCard";
import type { ClassItem } from "../../../types/class";
import type { StudentItem } from "../../../types/student";

type StudentsPageStudentClassesModalProps = {
  student: StudentItem | null;
  openAddClassModal: () => void;
  isLoading: boolean;
  isError: boolean;
  activeClasses: ClassItem[];
  closedClasses: ClassItem[];
  showClosedClasses: boolean;
  getClassTypeName: (classTypeId?: string | null) => string | undefined;
  onToggleClosedClasses: () => void;
  onRequestRemoveClass: (classItem: ClassItem) => void;
  onClose: () => void;
};

export default function StudentsPageStudentClassesModal({
  student,
  openAddClassModal,
  isLoading,
  isError,
  activeClasses,
  closedClasses,
  showClosedClasses,
  getClassTypeName,
  onToggleClosedClasses,
  onRequestRemoveClass,
  onClose,
}: StudentsPageStudentClassesModalProps) {
  return (
    <Modal
      open={Boolean(student)}
      title={
        <Space size={8} align="center">
          <ReadOutlined style={{ fontSize: 22 }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Turmas do aluno
          </Typography.Title>
        </Space>
      }
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Card size="small">
          <Space size={10} align="center">
            <Avatar
              size={42}
              src={student?.avatar ?? undefined}
              icon={<UserOutlined />}
            />
            <Typography.Title level={5} style={{ margin: 0, fontSize: 16 }}>
              {student?.name}
            </Typography.Title>
          </Space>
        </Card>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddClassModal}>
            Adicionar em turma
          </Button>
        </Space>

        {isLoading ? (
          <Space
            style={{
              width: "100%",
              justifyContent: "center",
              minHeight: 180,
            }}
          >
            <Spin />
          </Space>
        ) : isError ? (
          <Alert
            type="error"
            showIcon
            message="Não foi possível carregar as turmas do aluno."
          />
        ) : activeClasses.length === 0 && closedClasses.length === 0 ? (
          <Empty description="Nenhuma turma relacionada para este aluno." />
        ) : (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Space size={8} align="center">
              <Typography.Text strong>Turmas em andamento</Typography.Text>
              <Badge
                count={activeClasses.length}
                overflowCount={999999}
                style={{ backgroundColor: "#1677FF" }}
              />
            </Space>
            {activeClasses.length === 0 ? (
              <Typography.Text type="secondary">
                Nenhuma turma em andamento.
              </Typography.Text>
            ) : (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {activeClasses.map((classItem) => (
                  <ClassCard
                    key={classItem.id}
                    data={classItem}
                    classTypeName={getClassTypeName(classItem.classTypeId)}
                    compact
                    showStatusTag={false}
                    headerExtra={
                      <Dropdown
                        trigger={["click"]}
                        menu={{
                          items: [
                            {
                              key: "remove-student",
                              icon: <DeleteOutlined />,
                              label: "Remover aluno da turma",
                              danger: true,
                            },
                          ],
                          onClick: () => onRequestRemoveClass(classItem),
                        }}
                      >
                        <Button type="text" shape="circle" icon={<MoreOutlined />} />
                      </Dropdown>
                    }
                  />
                ))}
              </Space>
            )}

            <Space size={8} align="center">
              <Typography.Text strong>Turmas encerradas</Typography.Text>
              <Badge count={closedClasses.length} overflowCount={999999} />
              {closedClasses.length > 0 ? (
                <Button type="link" style={{ paddingInline: 0 }} onClick={onToggleClosedClasses}>
                  {showClosedClasses ? "Ocultar" : "Mostrar"}
                </Button>
              ) : null}
            </Space>
            {closedClasses.length === 0 ? (
              <Typography.Text type="secondary">
                Nenhuma turma encerrada.
              </Typography.Text>
            ) : showClosedClasses ? (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {closedClasses.map((classItem) => (
                  <ClassCard
                    key={classItem.id}
                    data={classItem}
                    classTypeName={getClassTypeName(classItem.classTypeId)}
                    compact
                    showStatusTag={false}
                    showRemainingDays={false}
                  />
                ))}
              </Space>
            ) : null}
          </Space>
        )}
      </Space>
    </Modal>
  );
}
