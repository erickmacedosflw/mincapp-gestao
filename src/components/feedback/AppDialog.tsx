import { Modal, Space, Typography } from 'antd'
import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

type AppDialogType = 'info' | 'success' | 'warning' | 'danger'

type AppDialogProps = {
  open: boolean
  type?: AppDialogType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

type DialogVisual = {
  icon: ReactNode
  color: string
}

const visualByType: Record<AppDialogType, DialogVisual> = {
  info: {
    icon: <InfoCircleFilled />,
    color: '#1677ff',
  },
  success: {
    icon: <CheckCircleFilled />,
    color: '#52c41a',
  },
  warning: {
    icon: <ExclamationCircleFilled />,
    color: '#faad14',
  },
  danger: {
    icon: <CloseCircleFilled />,
    color: '#ff4d4f',
  },
}

export default function AppDialog({
  open,
  type = 'info',
  title,
  message,
  confirmText = 'Sim',
  cancelText = 'Não',
  confirmLoading = false,
  onConfirm,
  onCancel,
}: AppDialogProps) {
  // Componente padrão de diálogo para manter consistência visual e semântica.
  const visual = visualByType[type]

  return (
    <Modal
      open={open}
      title={null}
      centered
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
      confirmLoading={confirmLoading}
      okButtonProps={{
        danger: type === 'danger',
        style:
          type === 'success'
            ? {
                background: '#52c41a',
                borderColor: '#52c41a',
                color: '#fff',
              }
            : undefined,
      }}
    >
      <Space align="start" size={12}>
        <span style={{ color: visual.color, fontSize: 22, lineHeight: 1 }}>{visual.icon}</span>
        <Space direction="vertical" size={4}>
          <Typography.Text strong>{title}</Typography.Text>
          <Typography.Text type="secondary">{message}</Typography.Text>
        </Space>
      </Space>
    </Modal>
  )
}
