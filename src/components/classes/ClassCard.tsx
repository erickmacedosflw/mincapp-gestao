import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Card, Space, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import type { ClassItem } from '../../types/class'
import { getDaysUntilClassEnd, isClassFinished, toPeriodLabel } from '../../utils/date'

type ClassCardProps = {
  data: ClassItem
  classTypeName?: string
  onClick?: () => void
  showStatusTag?: boolean
  showRemainingDays?: boolean
  headerExtra?: ReactNode
  compact?: boolean
}

export default function ClassCard({
  data,
  classTypeName,
  onClick,
  showStatusTag = true,
  showRemainingDays = true,
  headerExtra,
  compact = false,
}: ClassCardProps) {
  const finished = isClassFinished(data.finishDate)
  const remainingDays = getDaysUntilClassEnd(data.finishDate)

  const content = (
    <Space direction="vertical" size={compact ? 8 : 10} style={{ width: '100%' }}>
      <Space direction="vertical" size={compact ? 4 : 6}>
        <Typography.Title level={compact ? 5 : 5} style={{ margin: 0, fontSize: compact ? 16 : undefined }}>
          {data.name}
        </Typography.Title>
        <Space size={6} wrap>
          <Tag>{classTypeName ?? 'Sem tipo'}</Tag>
          {showStatusTag ? <Tag color={finished ? 'default' : 'blue'}>{finished ? 'Encerrada' : 'Em andamento'}</Tag> : null}
        </Space>
      </Space>

      <Space size={8} align="start">
        <CalendarOutlined style={{ marginTop: 2 }} />
        <Space direction="vertical" size={0}>
          <Typography.Text strong>Período</Typography.Text>
          <Typography.Text type="secondary">{toPeriodLabel(data.initDate, data.finishDate)}</Typography.Text>
        </Space>
      </Space>

      {showRemainingDays && !finished ? (
        <Space size={8}>
          <ClockCircleOutlined />
          <Typography.Text type="secondary">
            {remainingDays === 1 ? (
              <>
                Falta <Typography.Text strong>1 dia</Typography.Text> para encerramento da turma
              </>
            ) : (
              <>
                Faltam <Typography.Text strong>{remainingDays} dias</Typography.Text> para encerramento da turma
              </>
            )}
          </Typography.Text>
        </Space>
      ) : null}
    </Space>
  )

  return (
    <Card
      size={compact ? 'small' : 'default'}
      hoverable={Boolean(onClick)}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {headerExtra ? (
        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start" size={12}>
          <div style={{ flex: 1, minWidth: 0 }}>{content}</div>
          <div>{headerExtra}</div>
        </Space>
      ) : (
        content
      )}
    </Card>
  )
}
