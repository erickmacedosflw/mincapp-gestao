import { useEffect, useMemo, useState } from 'react'
import {
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Col,
  Collapse,
  Empty,
  Image,
  List,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ClassItem } from '../../types/class'
import { getClassById } from '../../services/class/class.service'
import { getClassTypes } from '../../services/class/class-type.service'
import type { ClassTypeItem } from '../../types/class-type'
import {
  getDaysUntilClassEnd,
  getPeriodStatus,
  getRemainingDaysInPeriod,
  isClassFinished,
  toPeriodLabel,
} from '../../utils/date'
import {
  acceptJustification,
  getJustificationsByClassId,
  rejectJustification,
} from '../../services/justification/justification.service'
import { getSubjectsByClassId } from '../../services/subject/subject.service'
import { getStudentsByClassId } from '../../services/student/student.service'
import type { SubjectItem } from '../../types/subject'
import type { JustificationItem } from '../../types/justification'
import AppDialog from '../../components/feedback/AppDialog'

export default function ClassManagementPage() {
  const navigate = useNavigate()
  const { classId } = useParams()

  const [classData, setClassData] = useState<ClassItem | null>(null)
  const [classTypes, setClassTypes] = useState<ClassTypeItem[]>([])
  const [subjectsCount, setSubjectsCount] = useState(0)
  const [studentsCount, setStudentsCount] = useState(0)
  const [ongoingSubjects, setOngoingSubjects] = useState<SubjectItem[]>([])
  const [pendingJustifications, setPendingJustifications] = useState<JustificationItem[]>([])
  const [pendingJustificationsCount, setPendingJustificationsCount] = useState(0)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'accept' | 'reject'
    item: JustificationItem
  } | null>(null)
  const [openReceiptsByJustification, setOpenReceiptsByJustification] = useState<Set<string>>(new Set())
  const [submittingAction, setSubmittingAction] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!classId) {
        setErrorMessage('Turma não informada.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setErrorMessage(null)
        setSubjectsCount(0)
        setStudentsCount(0)
        setOngoingSubjects([])
        setPendingJustifications([])
        setPendingJustificationsCount(0)

        const [foundClass, types] = await Promise.all([getClassById(classId), getClassTypes()])

        if (!foundClass) {
          setErrorMessage('Turma não encontrada.')
          return
        }

        setClassData(foundClass)
        setClassTypes(types)

        try {
          const subjects = await getSubjectsByClassId(classId)
          setSubjectsCount(subjects.length)
          const currentOngoing = subjects.filter((item) => getPeriodStatus(item.initDate, item.finishDate) === 'ongoing')
          setOngoingSubjects(currentOngoing)
        } catch {
          setSubjectsCount(0)
          setOngoingSubjects([])
        }

        try {
          const studentsResponse = await getStudentsByClassId({
            classId,
            page: 1,
            perPage: 1,
          })
          setStudentsCount(studentsResponse.total)
        } catch {
          setStudentsCount(0)
        }

        try {
          const pendingResponse = await getJustificationsByClassId({ classId, status: 'PENDING' })
          setPendingJustificationsCount(pendingResponse.data.length)
          setPendingJustifications(pendingResponse.data)
        } catch {
          setPendingJustifications([])
          setPendingJustificationsCount(0)
        }
      } catch {
        setErrorMessage('Não foi possível carregar os dados da turma.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [classId])

  const typeName = useMemo(() => {
    if (!classData) {
      return 'Sem tipo'
    }

    return classTypes.find((item) => item.id === classData.classTypeId)?.name ?? 'Sem tipo'
  }, [classData, classTypes])

  const groupedPendingByStudent = useMemo(() => {
    const studentsMap = new Map<
      string,
      {
        studentId: string
        studentName: string
        studentAvatar: string | null
        items: JustificationItem[]
      }
    >()

    pendingJustifications.forEach((item) => {
      const current = studentsMap.get(item.studentId)

      if (!current) {
        studentsMap.set(item.studentId, {
          studentId: item.studentId,
          studentName: item.studentName,
          studentAvatar: item.studentAvatar,
          items: [item],
        })
        return
      }

      current.items.push(item)
    })

    return Array.from(studentsMap.values()).sort((a, b) => a.studentName.localeCompare(b.studentName, 'pt-BR'))
  }, [pendingJustifications])

  if (loading) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
      </Space>
    )
  }

  if (errorMessage) {
    return <Alert type="error" showIcon message={errorMessage} />
  }

  if (!classData) {
    return <Empty description="Turma não encontrada." />
  }

  const finished = isClassFinished(classData.finishDate)
  const remainingDays = getDaysUntilClassEnd(classData.finishDate)

  const toggleReceipts = (justificationId: string) => {
    setOpenReceiptsByJustification((previous) => {
      const next = new Set(previous)

      if (next.has(justificationId)) {
        next.delete(justificationId)
        return next
      }

      next.add(justificationId)
      return next
    })
  }

  const isImageReceipt = (url: string) => {
    const normalized = url.split('?')[0].toLowerCase()
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(normalized)
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) {
      return
    }

    try {
      setSubmittingAction(true)

      if (confirmAction.type === 'accept') {
        await acceptJustification(confirmAction.item.id)
        message.success('Justificativa aprovada com sucesso.')
      } else {
        await rejectJustification(confirmAction.item.id)
        message.success('Justificativa reprovada com sucesso.')
      }

      setPendingJustifications((previous) => previous.filter((item) => item.id !== confirmAction.item.id))
      setPendingJustificationsCount((previous) => Math.max(0, previous - 1))
      setOpenReceiptsByJustification((previous) => {
        const next = new Set(previous)
        next.delete(confirmAction.item.id)
        return next
      })
      setConfirmAction(null)
    } catch {
      message.error('Não foi possível concluir esta ação na justificativa.')
    } finally {
      setSubmittingAction(false)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          { title: `Gestão da turma ${classData.name}` },
        ]}
      />

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} lg={7}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {classData.name}
                </Typography.Title>

                <Space size={6} wrap>
                  <Tag>{typeName}</Tag>
                  <Tag color={finished ? 'default' : 'blue'}>{finished ? 'Encerrada' : 'Em andamento'}</Tag>
                </Space>

                <Space size={8}>
                  <ClockCircleOutlined />
                  <Typography.Text type="secondary">
                    {toPeriodLabel(classData.initDate, classData.finishDate)}
                  </Typography.Text>
                </Space>

                {!finished ? (
                  <Typography.Text type="secondary">
                    Faltam <Typography.Text strong>{remainingDays} dias</Typography.Text> para encerramento da turma
                  </Typography.Text>
                ) : null}
              </Space>
            </Card>

            <Card>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  Menu da turma
                </Typography.Title>

                <Card hoverable size="small" onClick={() => navigate(`/class/${classData.id}/subjects`)} style={{ cursor: 'pointer' }}>
                  <Space size={10} align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space size={10} align="center" style={{ flex: 1 }}>
                      <BookOutlined style={{ fontSize: 20 }} />
                      <Typography.Text strong>Matérias</Typography.Text>
                    </Space>
                    <Badge count={subjectsCount} showZero overflowCount={999999} style={{ backgroundColor: '#8C8C8C' }} />
                  </Space>
                </Card>

                <Card hoverable size="small" onClick={() => navigate(`/class/${classData.id}/students`)} style={{ cursor: 'pointer' }}>
                  <Space size={10} align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space size={10} align="center" style={{ flex: 1 }}>
                      <TeamOutlined style={{ fontSize: 20 }} />
                      <Typography.Text strong>Alunos</Typography.Text>
                    </Space>
                    <Badge count={studentsCount} showZero overflowCount={999999} style={{ backgroundColor: '#8C8C8C' }} />
                  </Space>
                </Card>

                <Card
                  hoverable
                  size="small"
                  onClick={() => navigate(`/class/${classData.id}/justifications`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Space size={10} align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space size={10} align="center">
                      <FileTextOutlined style={{ fontSize: 20 }} />
                      <Typography.Text strong>Justificativas</Typography.Text>
                    </Space>
                    {pendingJustificationsCount > 0 ? <Badge count={pendingJustificationsCount} color="orange" overflowCount={99} /> : null}
                  </Space>
                </Card>
              </Space>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={17}>
          <Card>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space size={6} align="center">
                <BookOutlined />
                <Typography.Text strong>Matéria atual em andamento</Typography.Text>
              </Space>

              {ongoingSubjects.length === 0 ? (
                <Typography.Text type="secondary">Não há nenhuma matéria em andamento.</Typography.Text>
              ) : (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {ongoingSubjects.map((subject) => (
                    <Card key={subject.id} size="small" style={{ borderColor: 'var(--ant-color-primary-border)' }}>
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Space size={8} wrap>
                          <Space size={6} align="center">
                            <BookOutlined />
                            <Typography.Text strong>{subject.name}</Typography.Text>
                          </Space>
                          <Tag color="blue">Em andamento</Tag>
                        </Space>

                        <Typography.Text type="secondary">
                          <UserOutlined style={{ marginRight: 6 }} />
                          Professor: {subject.teacherName}
                        </Typography.Text>

                        <Typography.Text type="secondary">
                          <CalendarOutlined style={{ marginRight: 6 }} />
                          Período: {toPeriodLabel(subject.initDate, subject.finishDate)}
                        </Typography.Text>

                        <Typography.Text type="secondary">
                          <ClockCircleOutlined style={{ marginRight: 6 }} />
                          Faltam {getRemainingDaysInPeriod(subject.initDate, subject.finishDate) ?? 0} dias para
                          encerramento
                        </Typography.Text>
                      </Space>
                    </Card>
                  ))}
                </Space>
              )}

              <Space size={6} align="center" style={{ marginTop: 8 }}>
                <FileTextOutlined />
                <Typography.Text strong>Justificativas pendentes</Typography.Text>
              </Space>

              {groupedPendingByStudent.length === 0 ? (
                <Typography.Text type="secondary">Nenhuma justificativa pendente.</Typography.Text>
              ) : (
                <Collapse
                  items={groupedPendingByStudent.map((student) => ({
                    key: student.studentId,
                    label: (
                      <Space size={12} align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space size={10} align="center">
                          <Avatar src={student.studentAvatar || undefined}>{student.studentName.charAt(0)}</Avatar>
                          <Typography.Text strong>{student.studentName}</Typography.Text>
                        </Space>

                        <Badge count={student.items.length} color="orange" />
                      </Space>
                    ),
                    children: (
                      <List
                        dataSource={student.items}
                        renderItem={(item) => {
                          const imageReceipts = item.receipts.filter(isImageReceipt)
                          const fileReceipts = item.receipts.filter((receipt) => !isImageReceipt(receipt))

                          return (
                            <List.Item>
                              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                <Space size={8} wrap>
                                  <Typography.Text strong>{item.subjectName}</Typography.Text>
                                  <Tag>{item.callTypeDescription}</Tag>
                                  <Tag>{item.date}</Tag>
                                  <Tag color={item.daysIsOpen > 0 ? 'gold' : 'blue'}>
                                    há {item.daysIsOpen} dia(s) em aberto
                                  </Tag>
                                </Space>

                                <Typography.Text>{item.reason}</Typography.Text>

                                <Space size={8} wrap>
                                  <Button
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                    onClick={() => setConfirmAction({ type: 'accept', item })}
                                  >
                                    Aprovar
                                  </Button>
                                  <Button
                                    type="primary"
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => setConfirmAction({ type: 'reject', item })}
                                  >
                                    Reprovar
                                  </Button>
                                </Space>

                                {item.receipts.length > 0 ? (
                                  <Space direction="vertical" size={8}>
                                    <Button
                                      type="link"
                                      style={{ paddingInline: 0 }}
                                      onClick={() => toggleReceipts(item.id)}
                                    >
                                      {openReceiptsByJustification.has(item.id)
                                        ? `Ocultar anexos (${item.receipts.length})`
                                        : `Exibir anexos (${item.receipts.length})`}
                                    </Button>

                                    {openReceiptsByJustification.has(item.id) ? (
                                      <>
                                        {imageReceipts.length > 0 ? (
                                          <Image.PreviewGroup>
                                            <Space wrap>
                                              {imageReceipts.map((receipt) => (
                                                <Image
                                                  key={receipt}
                                                  src={receipt}
                                                  width={72}
                                                  height={72}
                                                  style={{ objectFit: 'cover', borderRadius: 8 }}
                                                />
                                              ))}
                                            </Space>
                                          </Image.PreviewGroup>
                                        ) : null}

                                        {fileReceipts.map((receipt) => (
                                          <Typography.Link key={receipt} href={receipt} target="_blank" rel="noreferrer">
                                            <PaperClipOutlined style={{ marginRight: 6 }} />
                                            Abrir anexo
                                          </Typography.Link>
                                        ))}
                                      </>
                                    ) : null}
                                  </Space>
                                ) : null}
                              </Space>
                            </List.Item>
                          )
                        }}
                      />
                    ),
                  }))}
                />
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <AppDialog
        open={Boolean(confirmAction)}
        type={confirmAction?.type === 'accept' ? 'success' : 'danger'}
        title={confirmAction?.type === 'accept' ? 'Confirmar aprovação' : 'Confirmar reprovação'}
        message={
          confirmAction?.type === 'accept'
            ? 'Deseja aprovar esta justificativa do aluno?'
            : 'Deseja reprovar esta justificativa do aluno?'
        }
        confirmText={confirmAction?.type === 'accept' ? 'Aprovar' : 'Reprovar'}
        cancelText="Cancelar"
        confirmLoading={submittingAction}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          if (!submittingAction) {
            setConfirmAction(null)
          }
        }}
      />
    </Space>
  )
}
