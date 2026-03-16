import { memo, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
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
  SubjectAttendanceMarkTypeItem,
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

type AttendanceMarkTypeMeta = {
  id: string;
  description: string;
};

type AttendanceDateMeta = {
  date: string;
  markTypes: AttendanceMarkTypeMeta[];
};

type AttendanceMarkCheckboxProps = {
  cellKey: string;
  description: string;
  checked: boolean;
  changed: boolean;
  saving: boolean;
  setPresenceMap: Dispatch<
    SetStateAction<Record<string, AttendanceCellSnapshot>>
  >;
};

function getCellKey(studentId: string, date: string, callTypeId: string) {
  return `${studentId}::${date}::${callTypeId}`;
}

function toAttendanceMarkTypeMeta(
  markType: SubjectAttendanceMarkTypeItem,
): AttendanceMarkTypeMeta {
  return {
    id: markType.id,
    description: markType.description,
  };
}

const AttendanceMarkCheckbox = memo(function AttendanceMarkCheckbox({
  cellKey,
  description,
  checked,
  changed,
  saving,
  setPresenceMap,
}: AttendanceMarkCheckboxProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 8,
        borderRadius: 10,
        backgroundColor: changed ? "#fff7e6" : "transparent",
        border: changed ? "1px solid #ffd591" : "1px solid #f0f0f0",
        transition: "all 0.2s ease",
      }}
    >
      <Typography.Text
        style={{
          fontSize: 12,
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        {description}
      </Typography.Text>
      <Checkbox
        checked={checked}
        disabled={saving}
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
});

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
  const [showFloatingSave, setShowFloatingSave] = useState(false);

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

        const nextAttendanceDates = sortedAttendanceData.map((item) => ({
          date: item.date,
          markTypes: item.markTypes.map(toAttendanceMarkTypeMeta),
        }));

        const nextPresenceMap: Record<string, AttendanceCellSnapshot> = {};

        sortedAttendanceData.forEach((item) => {
          item.markTypes.forEach((markType) => {
            markType.marks.forEach((mark) => {
              nextPresenceMap[
                getCellKey(mark.studentId, item.date, markType.id)
              ] = {
                checked: true,
                markId: mark.id,
              };
            });
          });
        });

        safeClassStudents.forEach((student) => {
          nextAttendanceDates.forEach((attendanceDate) => {
            attendanceDate.markTypes.forEach((markType) => {
              const cellKey = getCellKey(
                student.id,
                attendanceDate.date,
                markType.id,
              );

              if (!nextPresenceMap[cellKey]) {
                nextPresenceMap[cellKey] = {
                  checked: false,
                  markId: null,
                };
              }
            });
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

  useEffect(() => {
    let frameId = 0;
    const scrollContainer =
      document.querySelector<HTMLElement>(".app-content") ?? window;

    const updateFloatingSaveVisibility = () => {
      const scrollTop =
        scrollContainer instanceof Window
          ? scrollContainer.scrollY
          : scrollContainer.scrollTop;
      const viewportHeight =
        scrollContainer instanceof Window
          ? scrollContainer.innerHeight
          : scrollContainer.clientHeight;
      const shouldShow = scrollTop > viewportHeight;

      setShowFloatingSave((current) =>
        current === shouldShow ? current : shouldShow,
      );
    };

    const handleScroll = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        updateFloatingSaveVisibility();
        frameId = 0;
      });
    };

    updateFloatingSaveVisibility();
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const hasChanges = useMemo(
    () =>
      Object.keys(presenceMap).some((key) => {
        const initialCell = initialPresenceMap[key] ?? {
          checked: false,
          markId: null,
        };
        const currentCell = presenceMap[key] ?? {
          checked: false,
          markId: null,
        };

        return initialCell.checked !== currentCell.checked;
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
        const hasMarkTypes = attendanceDate.markTypes.length > 0;

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              gap: 8,
              minWidth: 110,
            }}
          >
            {hasMarkTypes ? (
              attendanceDate.markTypes.map((markType) => {
                const cellKey = getCellKey(
                  record.studentId,
                  attendanceDate.date,
                  markType.id,
                );
                const cell = presenceMap[cellKey] ?? {
                  checked: false,
                  markId: null,
                };
                const initialCell = initialPresenceMap[cellKey] ?? {
                  checked: false,
                  markId: null,
                };
                const changed = initialCell.checked !== cell.checked;

                return (
                  <AttendanceMarkCheckbox
                    key={markType.id}
                    cellKey={cellKey}
                    description={markType.description}
                    checked={cell.checked}
                    changed={changed}
                    saving={saving}
                    setPresenceMap={setPresenceMap}
                  />
                );
              })
            ) : (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Sem marcações
              </Typography.Text>
            )}
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
          attendanceDate.markTypes.forEach((markType) => {
            const cellKey = getCellKey(
              student.studentId,
              attendanceDate.date,
              markType.id,
            );
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
              accumulator.check.push({
                studentId: student.studentId,
                callTypeId: markType.id,
                date: attendanceDate.date,
              });

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
      navigate(classId ? `/class/${classId}/subjects` : "/class");
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
    <Space
      direction="vertical"
      size={16}
      style={{
        width: "100%",
        paddingBottom: hasChanges && showFloatingSave ? 88 : 0,
      }}
    >
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
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              overflowY: "visible",
            }}
          >
            <Table
              className="attendance-marks-table"
              rowKey="studentId"
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: "max-content" }}
              bordered
            />
          </div>
        )}
      </Card>

      {hasChanges && showFloatingSave ? (
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: 30,
            height: 52,
            paddingInline: 20,
            borderRadius: 999,
            boxShadow: "0 18px 40px rgba(24, 144, 255, 0.28)",
          }}
        >
          Salvar alterações
        </Button>
      ) : null}
    </Space>
  );
}
