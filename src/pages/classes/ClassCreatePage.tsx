import { useState } from 'react'
import { Breadcrumb, Button, DatePicker, Form, Input, Space, Typography, message } from 'antd'
import type { Dayjs } from 'dayjs'
import ptBR from 'antd/es/date-picker/locale/pt_BR'
import { Link, useNavigate } from 'react-router-dom'
import AppDialog from '../../components/feedback/AppDialog'
import { createClass } from '../../services/class/class.service'

type ClassCreateFormValues = {
  name: string
  period: [Dayjs, Dayjs]
  subscriptionEndDate: Dayjs
}

export default function ClassCreatePage() {
  const navigate = useNavigate()
  const [form] = Form.useForm<ClassCreateFormValues>()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isPostCreateDialogOpen, setIsPostCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingValues, setPendingValues] = useState<ClassCreateFormValues | null>(null)
  const [createdClassId, setCreatedClassId] = useState<string | null>(null)

  const handleSubmitForm = (values: ClassCreateFormValues) => {
    setPendingValues(values)
    setIsConfirmOpen(true)
  }

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false)
  }

  const handleGoToClassList = () => {
    setIsPostCreateDialogOpen(false)
    navigate('/class')
  }

  const handleGoToSubjects = () => {
    if (!createdClassId) {
      navigate('/class')
      return
    }

    setIsPostCreateDialogOpen(false)
    navigate(`/class/${createdClassId}/subjects`)
  }

  const handleConfirmCreate = async () => {
    if (!pendingValues) {
      return
    }

    const [initDate, finishDate] = pendingValues.period

    try {
      setIsSubmitting(true)

      const createdClass = await createClass({
        name: pendingValues.name.trim(),
        initDate: initDate.format('DD/MM/YYYY'),
        finishDate: finishDate.format('DD/MM/YYYY'),
        subscriptionEndDate: pendingValues.subscriptionEndDate.format('DD/MM/YYYY'),
      })

      message.success('Turma criada com sucesso.')
      setIsConfirmOpen(false)
      form.resetFields()
      setPendingValues(null)
      setCreatedClassId(createdClass.id)
      setIsPostCreateDialogOpen(true)
    } catch {
      message.error('Não foi possível criar a turma.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          { title: 'Nova turma' },
        ]}
      />

      <Space direction="vertical" size={4}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Criar turma
        </Typography.Title>
        <Typography.Text type="secondary">Preencha todos os campos para cadastrar uma nova turma.</Typography.Text>
      </Space>

      <Form<ClassCreateFormValues>
        layout="vertical"
        form={form}
        onFinish={handleSubmitForm}
        requiredMark
        style={{ maxWidth: 720, width: '100%' }}
      >
        <Form.Item
          label="Nome da turma"
          name="name"
          rules={[
            { required: true, message: 'Informe o nome da turma.' },
            { whitespace: true, message: 'Informe o nome da turma.' },
          ]}
        >
          <Input placeholder="Ex.: Teste | Admin" maxLength={120} />
        </Form.Item>

        <Form.Item
          label="Período da turma"
          name="period"
          rules={[{ required: true, message: 'Selecione a data de início e fim.' }]}
        >
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            locale={ptBR}
            placeholder={['Data de início', 'Data de fim']}
            allowClear={false}
          />
        </Form.Item>

        <Form.Item
          label="Data limite de inscrição"
          name="subscriptionEndDate"
          rules={[{ required: true, message: 'Selecione a data limite de inscrição.' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            locale={ptBR}
            placeholder="Selecione a data"
            allowClear={false}
          />
        </Form.Item>

        <Space size={8}>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Salvar turma
          </Button>
          <Button onClick={() => navigate('/class')} disabled={isSubmitting}>
            Cancelar
          </Button>
        </Space>
      </Form>

      <AppDialog
        open={isConfirmOpen}
        type="warning"
        title="Confirmar criação da turma"
        message="Deseja realmente salvar esta turma?"
        confirmText="Salvar"
        cancelText="Voltar"
        confirmLoading={isSubmitting}
        onConfirm={handleConfirmCreate}
        onCancel={handleCancelConfirm}
      />

      <AppDialog
        open={isPostCreateDialogOpen}
        type="info"
        title="Cadastrar matérias da turma"
        message="Deseja cadastrar matérias para a nova turma agora?"
        confirmText="Sim, cadastrar"
        cancelText="Não, voltar para turmas"
        onConfirm={handleGoToSubjects}
        onCancel={handleGoToClassList}
      />
    </Space>
  )
}
