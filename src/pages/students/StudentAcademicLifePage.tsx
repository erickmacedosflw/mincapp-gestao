import { useMemo, useState } from 'react'
import {
  BookOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  MailOutlined,
  ReadOutlined,
  SafetyOutlined,
  UserOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons'
import { Alert, Avatar, Breadcrumb, Button, Card, Divider, Empty, Grid, Menu, Skeleton, Space, Tabs, Tag, Typography } from 'antd'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStudentById } from '../../services/student/student.service'
import type { StudentAvailableClassItem, StudentItem } from '../../types/student'

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '')

  if (digits.length !== 11) {
    return value
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function buildAddressLabel(student: StudentItem) {
  const firstLine = [student.address, student.numberAddress].filter(Boolean).join(', ')
  const secondLine = [student.complementString, student.neighborhood].filter(Boolean).join(' - ')
  const thirdLine = [student.city, student.state, student.zipCode].filter(Boolean).join(' - ')

  return [firstLine, secondLine, thirdLine].filter(Boolean).join(' | ')
}

function buildWhatsAppUri(phone?: string | null) {
  const digits = (phone ?? '').replace(/\D/g, '')

  if (!digits) {
    return null
  }

  const withCountryCode = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCountryCode}`
}

function formatPhone(value?: string | null) {
  const digits = (value ?? '').replace(/\D/g, '')

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return value || '-'
}

function SubscriptionCard({ item }: { item: StudentAvailableClassItem }) {
  return (
    <Card size="small">
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Typography.Text strong>{item.name}</Typography.Text>
        <Typography.Text type="secondary">
          <CalendarOutlined style={{ marginRight: 6 }} />
          {item.initDate} até {item.finishDate}
        </Typography.Text>
        <Typography.Text type="secondary">Prazo da matrícula: {item.subscriptionEndDate}</Typography.Text>
      </Space>
    </Card>
  )
}

export default function StudentAcademicLifePage() {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const { studentId } = useParams()
  const [searchParams] = useSearchParams()
  const [classesTab, setClassesTab] = useState<'active' | 'closed'>('active')
  const [mobileMenu, setMobileMenu] = useState<'student' | 'academic'>('academic')
  const classId = searchParams.get('classId')

  const studentQuery = useQuery({
    queryKey: ['student-academic-life', studentId],
    queryFn: () => getStudentById(studentId ?? ''),
    enabled: Boolean(studentId),
  })

  const activeClassesCount = studentQuery.data?.subscriptions?.length ?? 0
  const closedClassesCount = studentQuery.data?.previousSubscriptions?.length ?? 0
  const totalClassesCount = activeClassesCount + closedClassesCount
  const documents = [studentQuery.data?.addressProof, studentQuery.data?.maritalStatusProof].filter(
    (value): value is string => Boolean(value),
  )

  const contactItems = useMemo(() => {
    const student = studentQuery.data

    if (!student) {
      return []
    }

    return [
      {
        key: 'address',
        icon: <EnvironmentOutlined />,
        label: 'Endereço',
        value: buildAddressLabel(student) || '-',
      },
      {
        key: 'email',
        icon: <MailOutlined />,
        label: 'E-mail',
        value: student.email || '-',
      },
      {
        key: 'whatsapp',
        icon: <WhatsAppOutlined />,
        label: 'WhatsApp',
        value: formatPhone(student.phone),
        href: buildWhatsAppUri(student.phone),
      },
    ]
  }, [studentQuery.data])

  if (studentQuery.isLoading) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 7 }} />
        </Card>
      </Space>
    )
  }

  if (studentQuery.isError) {
    return <Alert type="error" showIcon message="Não foi possível carregar a vida acadêmica do aluno." />
  }

  if (!studentQuery.data) {
    return <Empty description="Aluno não encontrado." />
  }

  const student = studentQuery.data
  const studentCard = (
    <Card style={{ width: isMobile ? '100%' : 340, maxWidth: '100%' }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Space direction="vertical" size={4} align="center" style={{ width: '100%' }}>
          <Avatar size={88} src={student.avatar ?? undefined} icon={<UserOutlined />} />
          <Typography.Title level={4} style={{ margin: 0, textAlign: 'center' }}>
            {student.name}
          </Typography.Title>
          <Typography.Text type="secondary">{student.nameChurch || '-'}</Typography.Text>
        </Space>

        <Space size={8} wrap>
          <Tag icon={<ReadOutlined />}>{totalClassesCount} turmas</Tag>
          <Tag color="blue" icon={<ReadOutlined />}>
            {activeClassesCount} em andamento
          </Tag>
          <Tag icon={<ReadOutlined />}>{closedClassesCount} encerradas</Tag>
        </Space>

        <Card size="small">
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Typography.Text type="secondary">Situação de cadastro</Typography.Text>
            <Tag color={student.isComplete ? 'green' : 'gold'} icon={<SafetyOutlined />}>
              {student.isComplete ? 'Cadastro completo' : 'Cadastro incompleto'}
            </Tag>

            <Typography.Text type="secondary">Data de nascimento</Typography.Text>
            <Typography.Text>{student.dateBirth ?? '-'}</Typography.Text>

            <Typography.Text type="secondary">CPF</Typography.Text>
            <Typography.Text>{formatCpf(student.cpf)}</Typography.Text>

            <Typography.Text type="secondary">Idade</Typography.Text>
            <Typography.Text>{student.age ?? '-'}</Typography.Text>

            <Typography.Text type="secondary">Estado civil</Typography.Text>
            <Typography.Text>{student.maritalStatus ?? '-'}</Typography.Text>

            <Typography.Text type="secondary">Escolaridade</Typography.Text>
            <Typography.Text>{student.schooling ?? '-'}</Typography.Text>

            <Typography.Text type="secondary">Profissão</Typography.Text>
            <Typography.Text>{student.profession ?? '-'}</Typography.Text>

            {contactItems.map((item) => (
              <Space key={item.key} direction="vertical" size={2} style={{ width: '100%' }}>
                <Typography.Text type="secondary">
                  {item.icon} {item.label}
                </Typography.Text>
                {item.href ? (
                  <Typography.Link href={item.href} target="_blank" rel="noreferrer">
                    {item.value}
                  </Typography.Link>
                ) : (
                  <Typography.Text>{item.value}</Typography.Text>
                )}
              </Space>
            ))}

            <Divider style={{ margin: '6px 0' }} />

            <Typography.Text type="secondary">Documentos enviados</Typography.Text>
            <Typography.Text>{documents.length} documento(s)</Typography.Text>

            {documents.length > 0 ? (
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {documents.map((documentUrl, index) => (
                  <Typography.Link key={documentUrl} href={documentUrl} target="_blank" rel="noreferrer">
                    Abrir documento {index + 1}
                  </Typography.Link>
                ))}
              </Space>
            ) : (
              <Typography.Text type="secondary">Nenhum documento disponível.</Typography.Text>
            )}
          </Space>
        </Card>
      </Space>
    </Card>
  )

  const academicCard = (
    <Card style={{ flex: 1, minWidth: isMobile ? '100%' : 320 }}>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Space size={8} align="center">
          <BookOutlined style={{ fontSize: 22 }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Vida Acadêmica
          </Typography.Title>
        </Space>

        <Menu
          mode="horizontal"
          selectedKeys={['classes']}
          items={[
            {
              key: 'classes',
              icon: <ReadOutlined />,
              label: 'Turmas',
            },
          ]}
        />

        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Tabs
            activeKey={classesTab}
            onChange={(key) => setClassesTab(key as 'active' | 'closed')}
            items={[
              {
                key: 'active',
                label: `Em andamento (${student.subscriptions.length})`,
                children:
                  student.subscriptions.length === 0 ? (
                    <Typography.Text type="secondary">Nenhuma turma em andamento.</Typography.Text>
                  ) : (
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      {student.subscriptions.map((item) => (
                        <SubscriptionCard key={item.id} item={item} />
                      ))}
                    </Space>
                  ),
              },
              {
                key: 'closed',
                label: `Encerradas (${student.previousSubscriptions.length})`,
                children:
                  student.previousSubscriptions.length === 0 ? (
                    <Typography.Text type="secondary">Nenhuma turma encerrada no histórico.</Typography.Text>
                  ) : (
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      {student.previousSubscriptions.map((item) => (
                        <SubscriptionCard key={item.id} item={item} />
                      ))}
                    </Space>
                  ),
              },
            ]}
          />
        </Space>
      </Space>
    </Card>
  )

  return (
    <Space direction="vertical" size={16} style={{ width: '100%', paddingBottom: isMobile ? 84 : 0 }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          ...(classId ? [{ title: <Link to={`/class/${classId}/students`}>Alunos da turma</Link> }] : [{ title: <Link to="/students">Alunos</Link> }]),
          { title: 'Vida Acadêmica' },
        ]}
      />

      {isMobile ? (
        mobileMenu === 'student' ? (
          studentCard
        ) : (
          academicCard
        )
      ) : (
        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'nowrap' }}>
          {studentCard}
          {academicCard}
        </div>
      )}

      {isMobile ? (
        <div
          style={{
            position: 'fixed',
            bottom: 12,
            left: 0,
            right: 0,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 12px',
            pointerEvents: 'none',
          }}
        >
          <Card
            size="small"
            style={{ width: '100%', maxWidth: 420, borderRadius: 999, pointerEvents: 'auto' }}
            bodyStyle={{ padding: 8 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              <Button
                size="large"
                shape="round"
                type={mobileMenu === 'student' ? 'primary' : 'default'}
                icon={<UserOutlined />}
                onClick={() => setMobileMenu('student')}
                style={{ width: '100%', height: 44 }}
              >
                Aluno
              </Button>
              <Button
                size="large"
                shape="round"
                type={mobileMenu === 'academic' ? 'primary' : 'default'}
                icon={<BookOutlined />}
                onClick={() => setMobileMenu('academic')}
                style={{ width: '100%', height: 44 }}
              >
                Vida Acadêmica
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </Space>
  )
}
