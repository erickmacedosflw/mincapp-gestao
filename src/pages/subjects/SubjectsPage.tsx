import { useEffect, useMemo, useState } from 'react'
import {
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Alert, Breadcrumb, Card, Col, Empty, Grid, List, Radio, Row, Skeleton, Space, Table, Tag, Typography } from 'antd'
import { Link, useParams } from 'react-router-dom'
import type { SubjectItem } from '../../types/subject'
import type { ClassItem } from '../../types/class'
import { getSubjectsByClassId } from '../../services/subject/subject.service'
import { getClassById } from '../../services/class/class.service'
import { getDaysUntilClassEnd, getPeriodStatus, getRemainingDaysInPeriod, isClassFinished, toPeriodLabel } from '../../utils/date'

type SubjectFilter = 'all' | 'ongoing' | 'closed' | 'not_started'

export default function SubjectsPage() {
  const { classId } = useParams()
  const screens = Grid.useBreakpoint()

  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filter, setFilter] = useState<SubjectFilter>('all')

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

        const [classData, subjectData] = await Promise.all([getClassById(classId), getSubjectsByClassId(classId)])

        if (!classData) {
          setErrorMessage('Turma não encontrada.')
          return
        }

        setSelectedClass(classData)
        setSubjects(subjectData)
      } catch {
        setErrorMessage('Não foi possível carregar as matérias da turma.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [classId])

  const filteredSubjects = useMemo(() => {
    if (filter === 'all') {
      return subjects
    }

    return subjects.filter((item) => getPeriodStatus(item.initDate, item.finishDate) === filter)
  }, [subjects, filter])

  const isMobile = !screens.md

  const statusLabelByKey = {
    ongoing: 'Em andamento',
    closed: 'Encerrada',
    not_started: 'Não iniciado',
  }

  const statusColorByKey = {
    ongoing: 'blue',
    closed: 'default',
    not_started: 'gold',
  } as const

  const tableColumns = [
    {
      title: 'Matéria',
      key: 'name',
      render: (_: unknown, item: SubjectItem) => {
        const status = getPeriodStatus(item.initDate, item.finishDate)
        return (
          <Space size={8} wrap>
            <Typography.Text strong>{item.name}</Typography.Text>
            <Tag color={statusColorByKey[status]}>{statusLabelByKey[status]}</Tag>
          </Space>
        )
      },
    },
    {
      title: 'Professor',
      key: 'teacher',
      render: (_: unknown, item: SubjectItem) => (
        <Typography.Text type="secondary">
          <UserOutlined style={{ marginRight: 6 }} />
          {item.teacherName}
        </Typography.Text>
      ),
    },
    {
      title: 'Período',
      key: 'period',
      render: (_: unknown, item: SubjectItem) => (
        <Typography.Text type="secondary">
          <CalendarOutlined style={{ marginRight: 6 }} />
          {toPeriodLabel(item.initDate, item.finishDate)}
        </Typography.Text>
      ),
    },
    {
      title: 'Prazo',
      key: 'remaining',
      width: 220,
      render: (_: unknown, item: SubjectItem) => {
        const status = getPeriodStatus(item.initDate, item.finishDate)
        const remainingDays = getRemainingDaysInPeriod(item.initDate, item.finishDate)

        return (
          <Typography.Text type="secondary">
            <ClockCircleOutlined style={{ marginRight: 6 }} />
            {status === 'ongoing'
              ? `Faltam ${remainingDays} dias`
              : status === 'not_started'
                ? 'Não iniciado'
                : 'Encerrada'}
          </Typography.Text>
        )
      },
    },
  ]

  if (loading) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
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

  const classFinished = isClassFinished(selectedClass.finishDate)
  const classRemainingDays = getDaysUntilClassEnd(selectedClass.finishDate)

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          { title: <Link to={`/class/${selectedClass.id}`}>Gestão da turma</Link> },
          { title: 'Matérias' },
        ]}
      />

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} lg={6}>
          <Card>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {selectedClass.name}
              </Typography.Title>

              <Space size={6} wrap>
                <Tag color={classFinished ? 'default' : 'blue'}>{classFinished ? 'Encerrada' : 'Em andamento'}</Tag>
              </Space>

              <Space size={8}>
                <ClockCircleOutlined />
                <Typography.Text type="secondary">{toPeriodLabel(selectedClass.initDate, selectedClass.finishDate)}</Typography.Text>
              </Space>

              {!classFinished ? (
                <Typography.Text type="secondary">
                  Faltam <Typography.Text strong>{classRemainingDays} dias</Typography.Text> para encerramento
                </Typography.Text>
              ) : null}

              <Typography.Text strong>Total de matérias: {subjects.length}</Typography.Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Space size={8} align="center">
                  <BookOutlined style={{ fontSize: 22 }} />
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Matérias da turma {selectedClass.name}
                  </Typography.Title>
                </Space>

                <Space size={8} align="center" wrap>
                  <FilterOutlined />
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    options={[
                      { label: 'Todas', value: 'all' },
                      { label: 'Em andamento', value: 'ongoing' },
                      { label: 'Encerradas', value: 'closed' },
                      { label: 'Não iniciado', value: 'not_started' },
                    ]}
                  />
                </Space>
              </Space>
            </Card>

            {filteredSubjects.length === 0 ? (
              <Empty description="Nenhuma matéria encontrada para este filtro." />
            ) : (
              <Card>
                {isMobile ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={filteredSubjects}
                    renderItem={(item) => {
                      const status = getPeriodStatus(item.initDate, item.finishDate)
                      const remainingDays = getRemainingDaysInPeriod(item.initDate, item.finishDate)

                      return (
                        <List.Item>
                          <List.Item.Meta
                            title={
                              <Space size={8} wrap>
                                <Typography.Text strong>{item.name}</Typography.Text>
                                <Tag color={statusColorByKey[status]}>{statusLabelByKey[status]}</Tag>
                              </Space>
                            }
                            description={
                              <Space direction="vertical" size={2}>
                                <Typography.Text type="secondary">
                                  <UserOutlined style={{ marginRight: 6 }} />
                                  Professor: {item.teacherName}
                                </Typography.Text>

                                <Typography.Text type="secondary">
                                  <CalendarOutlined style={{ marginRight: 6 }} />
                                  Período: {toPeriodLabel(item.initDate, item.finishDate)}
                                </Typography.Text>

                                <Typography.Text type="secondary">
                                  <ClockCircleOutlined style={{ marginRight: 6 }} />
                                  {status === 'ongoing'
                                    ? `Faltam ${remainingDays} dias para encerramento`
                                    : status === 'not_started'
                                      ? 'Não iniciado'
                                      : 'Encerrada'}
                                </Typography.Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )
                    }}
                  />
                ) : (
                  <Table rowKey="id" columns={tableColumns} dataSource={filteredSubjects} pagination={false} />
                )}
              </Card>
            )}
          </Space>
        </Col>
      </Row>
    </Space>
  )
}
