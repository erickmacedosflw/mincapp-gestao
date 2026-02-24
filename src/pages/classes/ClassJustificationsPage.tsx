import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  PaperClipOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Breadcrumb,
  Card,
  Collapse,
  Empty,
  Image,
  List,
  message,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import { Link, useParams } from 'react-router-dom'
import AppDialog from '../../components/feedback/AppDialog'
import { getClassById } from '../../services/class/class.service'
import {
  acceptJustification,
  getJustificationsByClassId,
  rejectJustification,
} from '../../services/justification/justification.service'
import type { ClassItem } from '../../types/class'
import type { JustificationItem, JustificationStatusType } from '../../types/justification'

const STATUS_ORDER: JustificationStatusType[] = ['PENDING', 'APPROVED', 'DISAPPROVED']

const STATUS_LABEL: Record<JustificationStatusType, string> = {
  PENDING: 'Pendentes',
  APPROVED: 'Aprovados',
  DISAPPROVED: 'Rejeitados',
}

const STATUS_COLOR: Record<JustificationStatusType, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  DISAPPROVED: 'red',
}

function isImageReceipt(url: string) {
  const normalized = url.split('?')[0].toLowerCase()
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(normalized)
}

export default function ClassJustificationsPage() {
  const { classId } = useParams()

  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [justifications, setJustifications] = useState<JustificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<JustificationStatusType>('PENDING')
  const [statusOptions, setStatusOptions] = useState<JustificationStatusType[]>(STATUS_ORDER)
  const [openReceiptsByJustification, setOpenReceiptsByJustification] = useState<Set<string>>(new Set())
  const [confirmAction, setConfirmAction] = useState<{
    type: 'accept' | 'reject'
    item: JustificationItem
  } | null>(null)
  const [submittingAction, setSubmittingAction] = useState(false)

  const loadData = useCallback(async () => {
      if (!classId) {
        setErrorMessage('Turma não informada.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setErrorMessage(null)

        const [classData, response] = await Promise.all([
          getClassById(classId),
          getJustificationsByClassId({ classId, status: selectedStatus }),
        ])

        if (!classData) {
          setErrorMessage('Turma não encontrada.')
          return
        }

        const apiStatuses = response.enum?.status?.map((item) => item.type) ?? []
        const normalizedStatuses = STATUS_ORDER.filter((status) => apiStatuses.includes(status))

        setSelectedClass(classData)
        setJustifications(response.data)
        setStatusOptions(normalizedStatuses.length ? normalizedStatuses : STATUS_ORDER)
      } catch {
        setErrorMessage('Não foi possível carregar as justificativas da turma.')
      } finally {
        setLoading(false)
      }
    }, [classId, selectedStatus])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setOpenReceiptsByJustification(new Set())
  }, [classId, selectedStatus])

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

  const handleConfirmAction = async () => {
    if (!confirmAction) {
      return
    }

    const actedJustificationId = confirmAction.item.id

    try {
      setSubmittingAction(true)

      if (confirmAction.type === 'accept') {
        await acceptJustification(confirmAction.item.id)
        message.success('Justificativa aprovada com sucesso.')
      } else {
        await rejectJustification(confirmAction.item.id)
        message.success('Justificativa reprovada com sucesso.')
      }

      setJustifications((previous) => previous.filter((item) => item.id !== actedJustificationId))
      setOpenReceiptsByJustification((previous) => {
        const next = new Set(previous)
        next.delete(actedJustificationId)
        return next
      })
      setConfirmAction(null)
      await loadData()
    } catch {
      message.error('Não foi possível concluir esta ação na justificativa.')
    } finally {
      setSubmittingAction(false)
    }
  }

  const groupedStudents = useMemo(() => {
    const studentsMap = new Map<
      string,
      {
        studentId: string
        studentName: string
        studentAvatar: string | null
        items: JustificationItem[]
      }
    >()

    justifications.forEach((item) => {
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
  }, [justifications])

  if (loading) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Space>
    )
  }

  if (errorMessage) {
    return <Alert type="error" showIcon message={errorMessage} />
  }

  if (!selectedClass) {
    return <Empty description="Turma não encontrada." />
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          { title: <Link to={`/class/${selectedClass.id}`}>Gestão da turma</Link> },
          { title: 'Justificativas' },
        ]}
      />

      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space size={8} align="center">
            <FileTextOutlined style={{ fontSize: 22 }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Justificativas da turma {selectedClass.name}
            </Typography.Title>
          </Space>

          <Tabs
            activeKey={selectedStatus}
            onChange={(key) => setSelectedStatus(key as JustificationStatusType)}
            items={statusOptions.map((status) => ({
              key: status,
              label: STATUS_LABEL[status],
            }))}
          />

          <Typography.Text strong>Justificativas: {justifications.length}</Typography.Text>

          {groupedStudents.length === 0 ? (
            <Empty description="Nenhuma justificativa encontrada para este status." />
          ) : (
            <Collapse
              items={groupedStudents.map((student) => ({
                key: student.studentId,
                label: (
                  <Space size={12} align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space size={10} align="center">
                      <Avatar src={student.studentAvatar || undefined}>{student.studentName.charAt(0)}</Avatar>
                      <Typography.Text strong>{student.studentName}</Typography.Text>
                    </Space>

                    <Badge count={student.items.length} color={STATUS_COLOR[selectedStatus]} />
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
                          <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <Space size={8} wrap>
                              <Space size={6} align="center">
                                <BookOutlined />
                                <Typography.Text strong>{item.subjectName}</Typography.Text>
                              </Space>
                              <Tag color={STATUS_COLOR[item.status]}>{STATUS_LABEL[item.status]}</Tag>
                              <Tag>{item.callTypeDescription}</Tag>
                              <Tag>{item.date}</Tag>
                              <Tag color={item.daysIsOpen > 0 ? 'gold' : 'blue'}>
                                há {item.daysIsOpen} dia(s) em aberto
                              </Tag>
                            </Space>

                            <Typography.Text>{item.reason}</Typography.Text>

                            {item.status === 'PENDING' ? (
                              <Space size={8} wrap>
                                <Button
                                  type="primary"
                                  icon={<CheckCircleOutlined />}
                                  style={{
                                    background: '#52c41a',
                                    borderColor: '#52c41a',
                                  }}
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
                            ) : null}

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
                                      <Typography.Link
                                        key={receipt}
                                        href={receipt}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
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
