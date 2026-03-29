import {
  BarChartOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { Button, Card, Space, Tag, Typography } from "antd";
import type { ClassItem } from "../../../types/class";
import { getDaysUntilClassEnd, isClassFinished, toPeriodLabel } from "../../../utils/date";

type StudentsPageClassSummaryCardProps = {
  selectedClass: ClassItem | null | undefined;
  total: number;
  canViewDashboards: boolean;
  onOpenDashboard: () => void;
  onOpenAddStudentsModal: () => void;
};

export default function StudentsPageClassSummaryCard({
  selectedClass,
  total,
  canViewDashboards,
  onOpenDashboard,
  onOpenAddStudentsModal,
}: StudentsPageClassSummaryCardProps) {
  const classFinished = selectedClass
    ? isClassFinished(selectedClass.finishDate)
    : false;
  const classRemainingDays = selectedClass
    ? getDaysUntilClassEnd(selectedClass.finishDate)
    : 0;

  return (
    <Card>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {selectedClass?.name ?? "-"}
        </Typography.Title>

        <Space size={6} wrap>
          <Tag color={classFinished ? "default" : "blue"}>
            {classFinished ? "Encerrada" : "Em andamento"}
          </Tag>
        </Space>

        <Space size={8}>
          <ClockCircleOutlined />
          <Typography.Text type="secondary">
            {selectedClass
              ? toPeriodLabel(selectedClass.initDate, selectedClass.finishDate)
              : "-"}
          </Typography.Text>
        </Space>

        {!classFinished && selectedClass ? (
          <Typography.Text type="secondary">
            Faltam <Typography.Text strong>{classRemainingDays} dias</Typography.Text>{" "}
            para encerramento
          </Typography.Text>
        ) : null}

        <Typography.Text strong>Total de alunos: {total}</Typography.Text>

        {canViewDashboards ? (
          <Button
            icon={<BarChartOutlined />}
            onClick={onOpenDashboard}
            style={{ width: "fit-content" }}
          >
            Dashboard de alunos
          </Button>
        ) : null}

        <Button
          icon={<UserAddOutlined />}
          onClick={onOpenAddStudentsModal}
          style={{ width: "fit-content" }}
        >
          Adicionar novos alunos
        </Button>
      </Space>
    </Card>
  );
}
