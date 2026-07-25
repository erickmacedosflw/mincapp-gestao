import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  FileDoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd"
import type { Dayjs } from "dayjs"
import type { TableColumnsType } from "antd"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import ptBR from "antd/es/date-picker/locale/pt_BR"
import { Link, useNavigate, useParams } from "react-router-dom"
import AppDialog from "../../components/feedback/AppDialog"
import {
  createActivity,
  createGrade,
  deleteActivity,
  deleteGrade,
  updateActivity,
  updateGrade,
} from "../../services/activity/activity.service"
import {
  getClassById,
  getEducationClassStudents,
} from "../../services/class/class.service"
import { getSubjectById } from "../../services/subject/subject.service"
import type { SubjectActivityItem } from "../../types/activity"
import type { ClassItem, ClassStudentAttendanceItem } from "../../types/class"
import type { SubjectDetailsItem } from "../../types/subject"
import { toPeriodLabel } from "../../utils/date"
import { isValidUuid } from "../../utils/uuid"

dayjs.extend(customParseFormat)

type ActivityFormValues = {
  name: string
  value: number
  finishDate: Dayjs
}

type GradeMatrixRow = {
  key: string
  studentId: string
  studentName: string
}

type GradeValue = number | null

function getGradeKey(studentId: string, activityId: string) {
  return `${studentId}::${activityId}`
}

function normalizeNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseActivityDate(value: string) {
  const parsed = dayjs(
    value,
    ["DD/MM/YYYY", "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.SSSZ"],
    true,
  )
  return parsed.isValid() ? parsed : dayjs(value)
}

function formatActivityDate(value: string) {
  const parsed = parseActivityDate(value)
  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : value
}

function sortActivities(items: SubjectActivityItem[]) {
  return [...items].sort(
    (left, right) =>
      parseActivityDate(left.dateFinish).valueOf() -
      parseActivityDate(right.dateFinish).valueOf(),
  )
}

export default function SubjectActivitiesPage() {
  const navigate = useNavigate()
  const { classId, subjectId } = useParams()
  const [form] = Form.useForm<ActivityFormValues>()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingActivity, setSavingActivity] = useState(false)
  const [savingGrades, setSavingGrades] = useState(false)
  const [deletingActivity, setDeletingActivity] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [subject, setSubject] = useState<SubjectDetailsItem | null>(null)
  const [students, setStudents] = useState<ClassStudentAttendanceItem[]>([])
  const [activities, setActivities] = useState<SubjectActivityItem[]>([])
  const [initialGrades, setInitialGrades] = useState<Record<string, GradeValue>>(
    {},
  )
  const [gradeIds, setGradeIds] = useState<Record<string, string | null>>({})
  const [grades, setGrades] = useState<Record<string, GradeValue>>({})
  const [search, setSearch] = useState("")
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] =
    useState<SubjectActivityItem | null>(null)
  const [activityPendingDelete, setActivityPendingDelete] =
    useState<SubjectActivityItem | null>(null)

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!classId || !subjectId) {
        setErrorMessage("Turma ou matéria não informada.")
        setLoading(false)
        return
      }

      if (!isValidUuid(classId) || !isValidUuid(subjectId)) {
        setErrorMessage("Turma ou matéria inválida.")
        setLoading(false)
        return
      }

      try {
        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        setErrorMessage(null)

        const [classData, subjectData, classStudents] = await Promise.all([
          getClassById(classId),
          getSubjectById(subjectId),
          getEducationClassStudents(classId),
        ])

        if (!classData) {
          setErrorMessage("Turma não encontrada.")
          return
        }

        const safeStudents = Array.isArray(classStudents) ? classStudents : []
        const sortedActivities = sortActivities(
          Array.isArray(subjectData.activities) ? subjectData.activities : [],
        )
        const nextGrades: Record<string, GradeValue> = {}
        const nextGradeIds: Record<string, string | null> = {}

        sortedActivities.forEach((activity) => {
          safeStudents.forEach((student) => {
            const gradeKey = getGradeKey(student.id, activity.id)
            nextGrades[gradeKey] = null
            nextGradeIds[gradeKey] = null
          })

          const studentGrades = Array.isArray(activity.studentGrades)
            ? activity.studentGrades
            : []

          studentGrades.forEach((studentGrade) => {
            const gradeKey = getGradeKey(studentGrade.studentId, activity.id)
            nextGrades[gradeKey] = normalizeNumber(studentGrade.grade)
            nextGradeIds[gradeKey] = studentGrade.id
          })
        })

        setSelectedClass(classData)
        setSubject(subjectData)
        setStudents(safeStudents)
        setActivities(sortedActivities)
        setInitialGrades(nextGrades)
        setGradeIds(nextGradeIds)
        setGrades(nextGrades)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as atividades e notas da matéria.",
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [classId, subjectId],
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  const rows = useMemo<GradeMatrixRow[]>(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR")

    return [...students]
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))
      .filter(
        (student) =>
          !normalizedSearch ||
          student.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
      )
      .map((student) => ({
        key: student.id,
        studentId: student.id,
        studentName: student.name,
      }))
  }, [search, students])

  const changedGradeKeys = useMemo(
    () =>
      Object.keys(grades).filter(
        (key) =>
          normalizeNumber(grades[key]) !== normalizeNumber(initialGrades[key]),
      ),
    [grades, initialGrades],
  )

  const invalidGradeKeys = useMemo(() => {
    const activityById = new Map(
      activities.map((activity) => [activity.id, activity]),
    )

    return Object.entries(grades)
      .filter(([, grade]) => grade !== null)
      .filter(([key, grade]) => {
        const activityId = key.split("::")[1]
        const activity = activityById.get(activityId)
        return (
          !activity ||
          !Number.isFinite(grade) ||
          Number(grade) < 0 ||
          Number(grade) > Number(activity.value)
        )
      })
      .map(([key]) => key)
  }, [activities, grades])

  const invalidGradeKeySet = useMemo(
    () => new Set(invalidGradeKeys),
    [invalidGradeKeys],
  )

  const handleOpenCreateModal = () => {
    setEditingActivity(null)
    form.resetFields()
    setIsActivityModalOpen(true)
  }

  const handleOpenEditModal = useCallback(
    (activity: SubjectActivityItem) => {
      setEditingActivity(activity)
      form.setFieldsValue({
        name: activity.name,
        value: Number(activity.value),
        finishDate: parseActivityDate(activity.dateFinish),
      })
      setIsActivityModalOpen(true)
    },
    [form],
  )

  const handleCloseActivityModal = () => {
    if (savingActivity) {
      return
    }

    setIsActivityModalOpen(false)
    setEditingActivity(null)
    form.resetFields()
  }

  const handleSaveActivity = async (values: ActivityFormValues) => {
    if (!subjectId) {
      return
    }

    const payload = {
      name: values.name.trim(),
      value: Number(values.value),
      dateFinish: `${values.finishDate.format("YYYY-MM-DD")}T00:00:00.000Z`,
      subjectId,
    }

    try {
      setSavingActivity(true)

      if (editingActivity) {
        await updateActivity(editingActivity.id, payload)
        message.success("Atividade editada com sucesso.")
      } else {
        await createActivity(payload)
        message.success("Atividade criada com sucesso.")
      }

      setIsActivityModalOpen(false)
      setEditingActivity(null)
      form.resetFields()
      await loadData(true)
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a atividade.",
      )
    } finally {
      setSavingActivity(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!activityPendingDelete) {
      return
    }

    try {
      setDeletingActivity(true)
      await deleteActivity(activityPendingDelete.id)
      message.success("Atividade excluída com sucesso.")
      setActivityPendingDelete(null)
      await loadData(true)
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a atividade.",
      )
    } finally {
      setDeletingActivity(false)
    }
  }

  const handleSaveGrades = async () => {
    if (!changedGradeKeys.length || invalidGradeKeys.length) {
      return
    }

    try {
      setSavingGrades(true)

      const results = await Promise.allSettled(
        changedGradeKeys.map((key) => {
          const [studentId, activityId] = key.split("::")
          const grade = normalizeNumber(grades[key])
          const gradeId = gradeIds[key]
          const initialGrade = normalizeNumber(initialGrades[key])

          if (initialGrade !== null && !gradeId) {
            throw new Error(
              "Não foi possível identificar a nota que deve ser alterada.",
            )
          }

          if (grade === null) {
            return gradeId ? deleteGrade(gradeId) : Promise.resolve()
          }

          const payload = { grade, activityId, studentId }
          return gradeId
            ? updateGrade(gradeId, payload)
            : createGrade(payload)
        }),
      )

      const failedResult = results.find((result) => result.status === "rejected")
      await loadData(true)

      if (failedResult?.status === "rejected") {
        throw failedResult.reason
      }

      message.success("Notas salvas com sucesso.")
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as notas.",
      )
    } finally {
      setSavingGrades(false)
    }
  }

  const columns = useMemo<TableColumnsType<GradeMatrixRow>>(() => {
    const baseColumns: TableColumnsType<GradeMatrixRow> = [
      {
        title: "Aluno",
        dataIndex: "studentName",
        key: "studentName",
        fixed: "left",
        width: 260,
        render: (studentName: string) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{studentName}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Aluno da turma
            </Typography.Text>
          </Space>
        ),
      },
    ]

    const activityColumns: TableColumnsType<GradeMatrixRow> = activities.map(
      (activity) => ({
        title: (
          <div className="activity-column-heading">
            <Space direction="vertical" size={3} style={{ width: "100%" }}>
              <Space
                align="start"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <Tooltip title={activity.name}>
                  <Typography.Text
                    strong
                    ellipsis
                    style={{ maxWidth: 140 }}
                  >
                    {activity.name}
                  </Typography.Text>
                </Tooltip>
                <Space size={2}>
                  <Tooltip title="Editar atividade">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      aria-label={`Editar ${activity.name}`}
                      onClick={() => handleOpenEditModal(activity)}
                    />
                  </Tooltip>
                  <Tooltip title="Excluir atividade">
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      aria-label={`Excluir ${activity.name}`}
                      onClick={() => setActivityPendingDelete(activity)}
                    />
                  </Tooltip>
                </Space>
              </Space>
              <Space size={6} wrap>
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                  Vale {Number(activity.value).toLocaleString("pt-BR")}
                </Tag>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {formatActivityDate(activity.dateFinish)}
                </Typography.Text>
              </Space>
            </Space>
          </div>
        ),
        key: activity.id,
        width: 210,
        align: "center",
        render: (_value, row) => {
          const gradeKey = getGradeKey(row.studentId, activity.id)
          const grade = grades[gradeKey] ?? null
          const changed =
            normalizeNumber(grade) !== normalizeNumber(initialGrades[gradeKey])
          const invalid = invalidGradeKeySet.has(gradeKey)

          return (
            <div
              className={[
                "activity-grade-cell",
                changed ? "activity-grade-cell--changed" : "",
                invalid ? "activity-grade-cell--invalid" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <InputNumber<number>
                aria-label={`Nota de ${row.studentName} em ${activity.name}`}
                value={grade}
                min={0}
                max={Number(activity.value)}
                precision={2}
                step={0.5}
                controls={false}
                placeholder="Sem nota"
                status={invalid ? "error" : undefined}
                disabled={savingGrades}
                onChange={(value) =>
                  setGrades((current) => ({
                    ...current,
                    [gradeKey]: normalizeNumber(value),
                  }))
                }
                style={{ width: "100%" }}
              />
              <Typography.Text
                type={invalid ? "danger" : "secondary"}
                style={{ fontSize: 11 }}
              >
                {invalid
                  ? `Use um valor entre 0 e ${Number(activity.value).toLocaleString("pt-BR")}`
                  : grade === null
                    ? "Sem nota"
                    : `de ${Number(activity.value).toLocaleString("pt-BR")}`}
              </Typography.Text>
            </div>
          )
        },
      }),
    )

    return [...baseColumns, ...activityColumns]
  }, [
    activities,
    grades,
    handleOpenEditModal,
    initialGrades,
    invalidGradeKeySet,
    savingGrades,
  ])

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
    )
  }

  if (!selectedClass || !subject) {
    return (
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {errorMessage ? (
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            action={
              <Button size="small" onClick={() => loadData()}>
                Tentar novamente
              </Button>
            }
          />
        ) : null}
        <Empty description="Não foi possível localizar a turma ou a matéria." />
      </Space>
    )
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
          { title: "Atividades e notas" },
        ]}
      />

      <Card className="activity-page-header">
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <div className="activity-page-heading">
            <Space direction="vertical" size={2}>
              <Space size={8}>
                <FileDoneOutlined className="activity-page-icon" />
                <Typography.Title level={4} style={{ margin: 0 }}>
                  Atividades e notas
                </Typography.Title>
              </Space>
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
                icon={<ReloadOutlined />}
                loading={refreshing}
                onClick={() => loadData(true)}
              >
                Atualizar
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreateModal}
              >
                Nova atividade
              </Button>
            </Space>
          </div>

          <Space size={8} wrap>
            <Tag>{students.length} alunos</Tag>
            <Tag>{activities.length} atividades</Tag>
            <Typography.Text
              type={changedGradeKeys.length ? undefined : "secondary"}
            >
              {changedGradeKeys.length
                ? `${changedGradeKeys.length} nota${changedGradeKeys.length === 1 ? "" : "s"} com alteração pendente`
                : "Nenhuma alteração pendente"}
            </Typography.Text>
          </Space>
        </Space>
      </Card>

      {errorMessage ? (
        <Alert
          type="error"
          showIcon
          message={errorMessage}
          action={
            <Button size="small" onClick={() => loadData(true)}>
              Tentar novamente
            </Button>
          }
        />
      ) : null}

      <Card>
        <div className="activity-grade-toolbar">
          <Input
            allowClear
            value={search}
            prefix={<SearchOutlined />}
            placeholder="Buscar aluno pelo nome"
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 360 }}
          />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={
              changedGradeKeys.length === 0 || invalidGradeKeys.length > 0
            }
            loading={savingGrades}
            onClick={handleSaveGrades}
          >
            Salvar alterações
          </Button>
        </div>

        {invalidGradeKeys.length > 0 ? (
          <Alert
            type="warning"
            showIcon
            message="Revise as notas destacadas"
            description="A nota deve ser maior ou igual a zero e não pode ultrapassar o valor total da atividade."
            style={{ marginBottom: 16 }}
          />
        ) : null}

        {students.length === 0 ? (
          <Empty description="Nenhum aluno encontrado nesta turma." />
        ) : activities.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Nenhuma atividade cadastrada"
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
            >
              Cadastrar primeira atividade
            </Button>
          </Empty>
        ) : rows.length === 0 ? (
          <Empty description="Nenhum aluno encontrado para esta busca." />
        ) : (
          <Table
            className="activity-grades-table"
            rowKey="studentId"
            columns={columns}
            dataSource={rows}
            bordered
            scroll={{ x: "max-content" }}
            pagination={{
              defaultPageSize: 25,
              showSizeChanger: true,
              pageSizeOptions: [10, 25, 50, 100],
              showTotal: (total) => `${total} aluno${total === 1 ? "" : "s"}`,
            }}
          />
        )}
      </Card>

      <Modal
        open={isActivityModalOpen}
        title={editingActivity ? "Editar atividade" : "Nova atividade"}
        okText={editingActivity ? "Salvar alterações" : "Cadastrar atividade"}
        cancelText="Cancelar"
        confirmLoading={savingActivity}
        onOk={() => form.submit()}
        onCancel={handleCloseActivityModal}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          {editingActivity
            ? "Atualize os dados acadêmicos desta atividade."
            : `Cadastre uma nova atividade para a matéria ${subject.name}.`}
        </Typography.Paragraph>
        <Form<ActivityFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSaveActivity}
          requiredMark="optional"
        >
          <Form.Item
            label="Nome"
            name="name"
            rules={[
              { required: true, message: "Informe o nome da atividade." },
              { whitespace: true, message: "Informe o nome da atividade." },
            ]}
          >
            <Input
              autoFocus
              maxLength={160}
              placeholder="Ex.: Trabalho de conclusão"
            />
          </Form.Item>

          <Form.Item
            label="Valor"
            name="value"
            rules={[
              { required: true, message: "Informe o valor da atividade." },
              {
                type: "number",
                min: 0.01,
                message: "O valor deve ser maior que zero.",
              },
            ]}
          >
            <InputNumber<number>
              min={0.01}
              precision={2}
              step={0.5}
              placeholder="Ex.: 10"
              addonAfter="pontos"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="Data de finalização"
            name="finishDate"
            rules={[
              {
                required: true,
                message: "Informe a data de finalização.",
              },
            ]}
          >
            <DatePicker
              locale={ptBR}
              format="DD/MM/YYYY"
              placeholder="Selecione a data"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <AppDialog
        open={Boolean(activityPendingDelete)}
        type="danger"
        title="Excluir atividade"
        message={
          activityPendingDelete
            ? `Deseja realmente excluir a atividade "${activityPendingDelete.name}"? As notas lançadas para ela também poderão ser removidas.`
            : "Deseja realmente excluir esta atividade?"
        }
        confirmText="Excluir atividade"
        cancelText="Cancelar"
        confirmLoading={deletingActivity}
        onConfirm={handleConfirmDelete}
        onCancel={() => setActivityPendingDelete(null)}
      />
    </Space>
  )
}
