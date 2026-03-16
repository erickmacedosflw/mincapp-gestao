import { TeamOutlined } from "@ant-design/icons";
import { Card, Input, Space, Typography } from "antd";
import type { ClassItem } from "../../../types/class";

type StudentsPageSearchCardProps = {
  selectedClass: ClassItem | null | undefined;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (value: string) => void;
};

export default function StudentsPageSearchCard({
  selectedClass,
  searchInput,
  onSearchInputChange,
  onSearch,
}: StudentsPageSearchCardProps) {
  return (
    <Card>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Space size={8} align="center">
          <TeamOutlined style={{ fontSize: 22 }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Alunos da turma {selectedClass?.name ?? ""}
          </Typography.Title>
        </Space>

        <Input.Search
          value={searchInput}
          allowClear
          placeholder="Buscar aluno por nome"
          onChange={(event) => onSearchInputChange(event.target.value)}
          onSearch={onSearch}
        />
      </Space>
    </Card>
  );
}
