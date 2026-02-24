import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChartOutlined, TeamOutlined } from '@ant-design/icons'
import { Alert, Badge, Card, Col, Empty, Row, Select, Skeleton, Space, Typography } from 'antd'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { getAllStudentsForDashboard } from '../../services/student/student.service'

type DashboardFilter = 'students'

type PieDataItem = {
  name: string
  value: number
}

const PIE_COLORS = ['#7AA2F7', '#E88989', '#EACB70', '#5D8A72']

function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`
}

function PieCard({
  title,
  data,
  keepOrder,
}: {
  title: string
  data: PieDataItem[]
  keepOrder?: boolean
}) {
  const chartData = keepOrder ? data : [...data].sort((firstItem, secondItem) => firstItem.value - secondItem.value)
  const total = chartData.reduce((accumulator, current) => accumulator + current.value, 0)
  const hasData = total > 0

  return (
    <Card>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {title}
        </Typography.Title>

        {!hasData ? (
          <Empty description="Sem dados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={92}
                  innerRadius={44}
                  label={({ percent }) => formatPercent(percent ?? 0)}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined) => {
                    const numericValue = typeof value === 'number' ? value : Number(value ?? 0)
                    const percent = total === 0 ? 0 : numericValue / total

                    return [`${numericValue} (${formatPercent(percent)})`, 'Quantidade']
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Space>
    </Card>
  )
}

export default function DashboardPage() {
  const [analysisFilter, setAnalysisFilter] = useState<DashboardFilter>('students')

  const studentsQuery = useQuery({
    queryKey: ['students-all-full'],
    queryFn: getAllStudentsForDashboard,
  })

  const ageChartData = useMemo(() => {
    const students = studentsQuery.data ?? []

    return [
      {
        name: 'Até 18',
        value: students.filter((item) => (item.age ?? 0) <= 18).length,
      },
      {
        name: '19 a 30',
        value: students.filter((item) => (item.age ?? 0) >= 19 && (item.age ?? 0) <= 30).length,
      },
      {
        name: '31 a 50',
        value: students.filter((item) => (item.age ?? 0) >= 31 && (item.age ?? 0) <= 50).length,
      },
      {
        name: 'Mais de 50',
        value: students.filter((item) => (item.age ?? 0) > 50).length,
      },
    ]
  }, [studentsQuery.data])

  const genderChartData = useMemo(() => {
    const students = studentsQuery.data ?? []

    const male = students.filter((item) => item.gender?.toUpperCase() === 'MASCULINO').length
    const female = students.filter((item) => item.gender?.toUpperCase() === 'FEMININO').length
    const other = students.length - male - female

    return [
      { name: 'Masculino', value: male },
      { name: 'Feminino', value: female },
      { name: 'Não informado', value: other },
    ]
  }, [studentsQuery.data])

  const churchChartData = useMemo(() => {
    const students = studentsQuery.data ?? []

    const memberCount = students.filter((item) => item.isMember === true).length
    const nonMemberCount = students.filter((item) => item.isMember === false).length
    const notInformedCount = students.length - memberCount - nonMemberCount

    return [
      { name: 'Da igreja', value: memberCount },
      { name: 'Não é da igreja', value: nonMemberCount },
      { name: 'Não informado', value: notInformedCount },
    ]
  }, [studentsQuery.data])

  if (studentsQuery.isLoading) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <Row gutter={[16, 16]}>
          {[1, 2, 3].map((item) => (
            <Col key={item} xs={24} lg={8}>
              <Card>
                <Skeleton active paragraph={{ rows: 6 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </Space>
    )
  }

  if (studentsQuery.isError) {
    return <Alert type="error" showIcon message="Não foi possível carregar os dados do dashboard." />
  }

  const totalStudents = studentsQuery.data?.length ?? 0

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Space size={8} align="center">
            <BarChartOutlined style={{ fontSize: 22 }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Dashboards
            </Typography.Title>
          </Space>

          <Badge
            color="#7AA2F7"
            text={
              <Space size={6}>
                <TeamOutlined />
                <Typography.Text strong>Total de alunos: {totalStudents}</Typography.Text>
              </Space>
            }
          />

          <Select<DashboardFilter>
            value={analysisFilter}
            style={{ width: 260, maxWidth: '100%' }}
            options={[{ label: 'Análise de alunos', value: 'students' }]}
            onChange={(value) => setAnalysisFilter(value)}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <PieCard title="Alunos por idade" data={ageChartData} keepOrder />
        </Col>
        <Col xs={24} lg={8}>
          <PieCard title="Alunos por gênero" data={genderChartData} />
        </Col>
        <Col xs={24} lg={8}>
          <PieCard title="Vínculo com a igreja" data={churchChartData} />
        </Col>
      </Row>
    </Space>
  )
}
