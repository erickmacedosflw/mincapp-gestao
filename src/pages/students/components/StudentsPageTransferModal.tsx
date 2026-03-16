import { CheckCircleFilled, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Card, Col, Empty, Modal, Radio, Row, Space, Spin, Typography } from "antd";
import ClassCard from "../../../components/classes/ClassCard";
import type { ClassItem } from "../../../types/class";
import type { StudentItem } from "../../../types/student";

type GroupedClasses = {
  typeName: string;
  items: ClassItem[];
};

type StudentsPageTransferModalProps = {
  student: StudentItem | null;
  selectedClassName?: string;
  isLoading: boolean;
  isError: boolean;
  availableClasses: ClassItem[];
  groupedClasses: GroupedClasses[];
  selectedTransferClassId: string | null;
  transferringStudent: boolean;
  getClassTypeName: (classTypeId?: string | null) => string | undefined;
  onSelectClass: (classId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function StudentsPageTransferModal({
  student,
  selectedClassName,
  isLoading,
  isError,
  availableClasses,
  groupedClasses,
  selectedTransferClassId,
  transferringStudent,
  getClassTypeName,
  onSelectClass,
  onClose,
  onConfirm,
}: StudentsPageTransferModalProps) {
  return (
    <Modal
      open={Boolean(student)}
      title={
        <Space size={8} align="center">
          <TeamOutlined style={{ fontSize: 22 }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Transferir de turma
          </Typography.Title>
        </Space>
      }
      onCancel={onClose}
      onOk={onConfirm}
      okText="Transferir"
      cancelText="Cancelar"
      okButtonProps={{
        disabled: !selectedTransferClassId,
        loading: transferringStudent,
      }}
      cancelButtonProps={{
        disabled: transferringStudent,
      }}
      width={760}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Card size="small">
          <Space size={10} align="center">
            <Avatar
              size={42}
              src={student?.avatar ?? undefined}
              icon={<UserOutlined />}
            />
            <Space direction="vertical" size={0}>
              <Typography.Title level={5} style={{ margin: 0, fontSize: 16 }}>
                {student?.name}
              </Typography.Title>
              <Typography.Text type="secondary">
                Turma atual: {selectedClassName ?? "-"}
              </Typography.Text>
            </Space>
          </Space>
        </Card>

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
            message="Não foi possível carregar as turmas disponíveis para transferência."
          />
        ) : availableClasses.length === 0 ? (
          <Empty description="Nenhuma outra turma disponível para transferência." />
        ) : (
          <Radio.Group
            style={{ width: "100%" }}
            value={selectedTransferClassId}
            onChange={(event) => onSelectClass(event.target.value)}
          >
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Typography.Text strong>
                Selecione a nova turma do aluno
              </Typography.Text>

              {groupedClasses.map((group) => (
                <Space
                  key={group.typeName}
                  direction="vertical"
                  size={10}
                  style={{ width: "100%" }}
                >
                  <Typography.Text strong>{group.typeName}</Typography.Text>
                  <Row gutter={[10, 10]}>
                    {group.items.map((classItem) => {
                      const selected = selectedTransferClassId === classItem.id;

                      return (
                        <Col key={classItem.id} xs={24} md={12}>
                          <div
                            style={{
                              position: "relative",
                              border: `1px solid ${selected ? "#1677FF" : "#E8E8E8"}`,
                              borderRadius: 10,
                              padding: 1,
                            }}
                          >
                            {selected ? (
                              <CheckCircleFilled
                                style={{
                                  position: "absolute",
                                  top: 10,
                                  right: 10,
                                  color: "var(--ant-color-primary)",
                                  zIndex: 1,
                                  fontSize: 18,
                                  background: "#fff",
                                  borderRadius: "50%",
                                }}
                              />
                            ) : null}

                            <ClassCard
                              compact
                              data={classItem}
                              classTypeName={getClassTypeName(classItem.classTypeId)}
                              showRemainingDays={false}
                              onClick={() => onSelectClass(classItem.id)}
                              headerExtra={<Radio checked={selected} />}
                            />
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Space>
              ))}
            </Space>
          </Radio.Group>
        )}
      </Space>
    </Modal>
  );
}
