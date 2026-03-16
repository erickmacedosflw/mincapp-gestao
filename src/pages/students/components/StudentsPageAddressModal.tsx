import { EnvironmentOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Modal, Space, Spin, Typography } from "antd";
import type { RefObject } from "react";
import type { StudentItem } from "../../../types/student";

type StudentsPageAddressModalProps = {
  student: StudentItem | null;
  geocodeLoading: boolean;
  geocodeError: string | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  buildAddressLabel: (student: StudentItem) => string;
  buildGoogleMapsUri: (student: StudentItem) => string | null;
  onClose: () => void;
};

export default function StudentsPageAddressModal({
  student,
  geocodeLoading,
  geocodeError,
  mapContainerRef,
  buildAddressLabel,
  buildGoogleMapsUri,
  onClose,
}: StudentsPageAddressModalProps) {
  return (
    <Modal
      open={Boolean(student)}
      title="Endereço do aluno"
      onCancel={onClose}
      footer={null}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Card size="small">
          <Typography.Text>
            {student ? buildAddressLabel(student) : "-"}
          </Typography.Text>
        </Card>

        <Card size="small" styles={{ body: { padding: 10 } }}>
          {geocodeLoading ? (
            <Space
              style={{
                width: "100%",
                justifyContent: "center",
                minHeight: 220,
              }}
            >
              <Spin />
            </Space>
          ) : geocodeError ? (
            <Alert type="warning" showIcon message={geocodeError} />
          ) : (
            <div
              ref={mapContainerRef}
              style={{
                width: "100%",
                height: 260,
                borderRadius: 10,
                overflow: "hidden",
              }}
            />
          )}
        </Card>

        <Space>
          <Button onClick={onClose}>Fechar</Button>
          <Button
            type="primary"
            icon={<EnvironmentOutlined />}
            href={student ? (buildGoogleMapsUri(student) ?? undefined) : undefined}
            target="_blank"
            rel="noreferrer"
            disabled={!student || !buildGoogleMapsUri(student)}
          >
            Ver no mapa
          </Button>
        </Space>
      </Space>
    </Modal>
  );
}
