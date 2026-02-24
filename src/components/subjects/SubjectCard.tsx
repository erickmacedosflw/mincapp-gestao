import { CalendarOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import { Card, Space, Tag, Typography } from 'antd'
import type { SubjectItem } from '../../types/subject'
import { getPeriodStatus, getRemainingDaysInPeriod, toPeriodLabel } from '../../utils/date'

type SubjectCardProps = {
  data: SubjectItem
}

export default function SubjectCard({ data }: SubjectCardProps) {
  const status = getPeriodStatus(data.initDate, data.finishDate)
  const remainingDays = getRemainingDaysInPeriod(data.initDate, data.finishDate)

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

  return (
    <Card>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {data.name}
          </Typography.Title>
          <Tag color={statusColorByKey[status]}>{statusLabelByKey[status]}</Tag>
        </Space>

        <Space size={8}>
          <UserOutlined />
          <Typography.Text type="secondary">Professor: {data.teacherName}</Typography.Text>
        </Space>

        <Space size={8} align="start">
          <CalendarOutlined style={{ marginTop: 2 }} />
          <Space direction="vertical" size={0}>
            <Typography.Text strong>Período</Typography.Text>
            <Typography.Text type="secondary">{toPeriodLabel(data.initDate, data.finishDate)}</Typography.Text>
          </Space>
        </Space>

        <Space size={8}>
          <ClockCircleOutlined />
          <Typography.Text type="secondary">
            {status === 'ongoing' ? (
              <>
                Faltam <Typography.Text strong>{remainingDays} dias</Typography.Text> para encerramento
              </>
            ) : status === 'not_started' ? (
              'Não iniciado'
            ) : (
              'Encerrada'
            )}
          </Typography.Text>
        </Space>
      </Space>
    </Card>
  )
}
