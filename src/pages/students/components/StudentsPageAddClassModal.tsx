import { CheckCircleFilled, ReadOutlined } from "@ant-design/icons";
import { Alert, Col, Empty, Modal, Row, Space, Spin, Typography } from "antd";
import ClassCard from "../../../components/classes/ClassCard";
import type { ClassItem } from "../../../types/class";

type GroupedClasses = {
  typeName: string;
  items: ClassItem[];
};

type StudentsPageAddClassModalProps = {
  open: boolean;
  isLoading: boolean;
  isError: boolean;
  availableClasses: ClassItem[];
  groupedClasses: GroupedClasses[];
  selectedAvailableClassIds: string[];
  getClassTypeName: (classTypeId?: string | null) => string | undefined;
  onToggleClass: (classId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function StudentsPageAddClassModal({
  open,
  isLoading,
  isError,
  availableClasses,
  groupedClasses,
  selectedAvailableClassIds,
  getClassTypeName,
  onToggleClass,
  onClose,
  onConfirm,
}: StudentsPageAddClassModalProps) {
  return (
    <Modal
      open={open}
      title={
        <Space size={8} align="center">
          <ReadOutlined style={{ fontSize: 22 }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Adicionar em turma
          </Typography.Title>
        </Space>
      }
      onCancel={onClose}
      onOk={onConfirm}
      okText="Confirmar"
      cancelText="Cancelar"
      okButtonProps={{
        disabled: selectedAvailableClassIds.length === 0,
        icon: <CheckCircleFilled />,
      }}
      width={760}
    >
      {isLoading ? (
        <Space
          style={{ width: "100%", justifyContent: "center", minHeight: 180 }}
        >
          <Spin />
        </Space>
      ) : isError ? (
        <Alert
          type="error"
          showIcon
          message="Não foi possível carregar as turmas disponíveis."
        />
      ) : availableClasses.length === 0 ? (
        <Empty description="Nenhuma outra turma disponível para este aluno." />
      ) : (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Text strong>
            {selectedAvailableClassIds.length} turma(s) selecionada(s)
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
                  const selected = selectedAvailableClassIds.includes(classItem.id);

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
                          showStatusTag={false}
                          showRemainingDays={false}
                          onClick={() => onToggleClass(classItem.id)}
                        />
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Space>
          ))}
        </Space>
      )}
    </Modal>
  );
}
