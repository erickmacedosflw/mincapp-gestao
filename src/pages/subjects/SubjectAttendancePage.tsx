import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftOutlined,
  CheckSquareOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Empty,
  Skeleton,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getClassById,
  getEducationClassStudents,
} from "../../services/class/class.service";
import {
  getSubjectAttendanceMarks,
  getSubjectById,
  updateSubjectAttendanceMarks,
} from "../../services/subject/subject.service";
import type { ClassItem, ClassStudentAttendanceItem } from "../../types/class";
import type {
  SubjectAttendanceDateItem,
  SubjectDetailsItem,
} from "../../types/subject";
import { parseDayMonthYear, toPeriodLabel } from "../../utils/date";

type AttendanceMatrixRow = {
  key: string;
  studentId: string;
  studentName: string;
  cpf: string;
};

type AttendanceCellSnapshot = {
  checked: boolean;
  markId: string | null;
};

type AttendanceDateMeta = {
  date: string;
  callTypeId: string | null;
};

function getPresenceMarkType(attendance: SubjectAttendanceDateItem) {
  return (
    attendance.markTypes.find(
      (item) => item.description.trim().toLowerCase() === "presença",
    ) ??
    attendance.markTypes.find((item) =>
      item.description.trim().toLowerCase().includes("presença"),
    ) ??
    attendance.markTypes[0] ??
    null
  );
}

export default function SubjectAttendancePage() {
  const navigate = useNavigate();
  const { classId, subjectId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [subject, setSubject] = useState<SubjectDetailsItem | null>(null);
  const [students, setStudents] = useState<ClassStudentAttendanceItem[]>([]);
  const [attendanceDates, setAttendanceDates] = useState<AttendanceDateMeta[]>(
    [],
  );
  const [initialPresenceMap, setInitialPresenceMap] = useState<
    Record<string, AttendanceCellSnapshot>
  >({});
  const [presenceMap, setPresenceMap] = useState<
    Record<string, AttendanceCellSnapshot>
  >({});

  useEffect(() => {
    async function loadData() {
      if (!classId || !subjectId) {
        setErrorMessage("Turma ou matéria não informada.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage(null);

        const [classData, subjectData, classStudents, attendanceData] =
          await Promise.all([
            getClassById(classId),
            getSubjectById(subjectId),
            getEducationClassStudents(classId),
            getSubjectAttendanceMarks(subjectId),
          ]);

        if (!classData) {
          setErrorMessage("Turma não encontrada.");
          return;
        }

        const safeClassStudents = Array.isArray(classStudents)
          ? classStudents
          : [];
        const safeAttendanceData = Array.isArray(attendanceData)
          ? attendanceData
          : [];

        const sortedAttendanceData = [...safeAttendanceData].sort(
          (left, right) =>
            parseDayMonthYear(left.date).getTime() -
            parseDayMonthYear(right.date).getTime(),
        );

        const nextAttendanceDates = sortedAttendanceData.map((item) => {
          const presenceMarkType = getPresenceMarkType(item);

          return {
            date: item.date,
            callTypeId: presenceMarkType?.id ?? null,
          };
        });

        const nextPresenceMap: Record<string, AttendanceCellSnapshot> = {};

        sortedAttendanceData.forEach((item) => {
          const presenceMarkType = getPresenceMarkType(item);

          presenceMarkType?.marks.forEach((mark) => {
            nextPresenceMap[`${mark.studentId}::${item.date}`] = {
              checked: true,
              markId: mark.id,
            };
          });
        });

        safeClassStudents.forEach((student) => {
          nextAttendanceDates.forEach((attendanceDate) => {
            const cellKey = `${student.id}::${attendanceDate.date}`;

            if (!nextPresenceMap[cellKey]) {
              nextPresenceMap[cellKey] = {
                checked: false,
                markId: null,
              };
            }
          });
        });

        setSelectedClass(classData);
        setSubject(subjectData);
        setStudents(safeClassStudents);
        setAttendanceDates(nextAttendanceDates);
        setInitialPresenceMap(nextPresenceMap);
        setPresenceMap(nextPresenceMap);
      } catch (error) {
        console.error("Erro ao carregar marcações de presença:", error);
        setErrorMessage(
          "Não foi possível carregar as marcações de presença desta matéria.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [classId, subjectId]);

  const hasChanges = useMemo(
    () =>
      Object.keys(presenceMap).some((key) => {
        const initialCell = initialPresenceMap[key];
        const currentCell = presenceMap[key];

        return initialCell?.checked !== currentCell?.checked;
      }),
    [initialPresenceMap, presenceMap],
  );

  const rows = useMemo<AttendanceMatrixRow[]>(
    () =>
      [...students]
        .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))
        .map((student) => ({
          key: student.id,
          studentId: student.id,
          studentName: student.name,
          cpf: student.cpf,
        })),
    [students],
  );

  const columns = useMemo<TableColumnsType<AttendanceMatrixRow>>(() => {
    const baseColumns: TableColumnsType<AttendanceMatrixRow> = [
      {
        title: "Aluno",
        dataIndex: "studentName",
        key: "studentName",
        fixed: "left",
        width: 280,
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{record.studentName}</Typography.Text>
            <Typography.Text type="secondary">{record.cpf}</Typography.Text>
          </Space>
        ),
      },
    ];

    const dateColumns = attendanceDates.map((attendanceDate) => ({
      title: attendanceDate.date,
      key: attendanceDate.date,
      width: 120,
      align: "center" as const,
      render: (_value: unknown, record: AttendanceMatrixRow) => {
        const cellKey = `${record.studentId}::${attendanceDate.date}`;
        const cell = presenceMap[cellKey] ?? { checked: false, markId: null };
        const initialCell = initialPresenceMap[cellKey] ?? { checked: false, markId: null };
        const changed = initialCell.checked !== cell.checked;

        return (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 44,
              minHeight: 44,
              padding: 6,
              borderRadius: 10,
              backgroundColor: changed ? "#fff7e6" : "transparent",
              border: changed ? "1px solid #ffd591" : "1px solid transparent",
              transition: "all 0.2s ease",
            }}
          >
            <Checkbox
              checked={cell.checked}
              disabled={!attendanceDate.callTypeId || saving}
              onChange={(event) => {
                const nextChecked = event.target.checked;

                setPresenceMap((current) => ({
                  ...current,
                  [cellKey]: {
                    checked: nextChecked,
                    markId: current[cellKey]?.markId ?? null,
                  },
                }));
              }}
            />
          </div>
        );
      },
    }));

    return [...baseColumns, ...dateColumns];
  }, [attendanceDates, initialPresenceMap, presenceMap, saving]);

  const handleSave = async () => {
    if (!hasChanges) {
      return;
    }

    const payload = attendanceDates.reduce(
      (accumulator, attendanceDate) => {
        rows.forEach((student) => {
          const cellKey = `${student.studentId}::${attendanceDate.date}`;
          const initialCell = initialPresenceMap[cellKey] ?? {
            checked: false,
            markId: null,
          };
          const currentCell = presenceMap[cellKey] ?? {
            checked: false,
            markId: null,
          };

          if (initialCell.checked === currentCell.checked) {
            return;
          }

          if (currentCell.checked && !initialCell.checked) {
            if (attendanceDate.callTypeId) {
              accumulator.check.push({
                studentId: student.studentId,
                callTypeId: attendanceDate.callTypeId,
                date: attendanceDate.date,
              });
            }

            return;
          }

          if (
            !currentCell.checked &&
            initialCell.checked &&
            initialCell.markId
          ) {
            accumulator.uncheck.push({
              id: initialCell.markId,
            });
          }
        });

        return accumulator;
      },
      {
        check: [] as Array<{
          studentId: string;
          callTypeId: string;
          date: string;
        }>,
        uncheck: [] as Array<{ id: string }>,
      },
    );

    try {
      setSaving(true);
      await updateSubjectAttendanceMarks(payload);
      message.success("Marcações de presença salvas com sucesso.");
      navigate(classId ? `/class/${classId}` : "/class");
    } catch {
      message.error("Não foi possível salvar as marcações de presença.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Space>
    );
  }

  if (errorMessage) {
    return <Alert type="error" showIcon message={errorMessage} />;
  }

  if (!selectedClass || !subject) {
    return (
      <Empty description="Não foi possível localizar a turma ou a matéria." />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          {
            title: (
              <Link to={`/class/${selectedClass.id}`}>Gestão da turma</Link>
            ),
          },
          {
            title: (
              <Link to={`/class/${selectedClass.id}/subjects`}>Matérias</Link>
            ),
          },
          { title: "Marcações de Presença" },
        ]}
      />

      <Card>
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <Space
            style={{ width: "100%", justifyContent: "space-between" }}
            wrap
          >
            <Space direction="vertical" size={2}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                Marcações de Presença
              </Typography.Title>
              <Typography.Text strong>{subject.name}</Typography.Text>
              <Typography.Text type="secondary">
                Turma {selectedClass.name} •{" "}
                {toPeriodLabel(subject.initDate, subject.finishDate)}
              </Typography.Text>
            </Space>

            <Space wrap>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/class/${selectedClass.id}/subjects`)}
              >
                Voltar
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={!hasChanges}
                loading={saving}
              >
                Salvar
              </Button>
            </Space>
          </Space>

          <Space size={16} wrap>
            <Typography.Text type="secondary">
              Alunos: {students.length}
            </Typography.Text>
            <Typography.Text type="secondary">
              Datas de aula: {attendanceDates.length}
            </Typography.Text>
            <Typography.Text type={hasChanges ? undefined : "secondary"}>
              <CheckSquareOutlined style={{ marginRight: 6 }} />
              {hasChanges
                ? "Existem alterações pendentes de salvamento."
                : "Nenhuma alteração pendente."}
            </Typography.Text>
          </Space>
        </Space>
      </Card>

      <Card>
        {students.length === 0 ? (
          <Empty description="Nenhum aluno encontrado nesta turma." />
        ) : attendanceDates.length === 0 ? (
          <Empty description="Nenhuma data de chamada encontrada para esta matéria." />
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <Table
              rowKey="studentId"
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: "max-content" }}
              bordered
              sticky
            />
          </div>
        )}
      </Card>
    </Space>
  );
}
