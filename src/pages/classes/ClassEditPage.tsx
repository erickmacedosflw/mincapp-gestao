import { useEffect, useState } from 'react'
import { Breadcrumb, Button, Form, Space, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppDialog from '../../components/feedback/AppDialog'
import ClassFormFields, { type ClassFormValues } from '../../components/classes/ClassFormFields'
import { getClassById, updateClass } from '../../services/class/class.service'
import { parseDayMonthYear } from '../../utils/date'
import type { ClassItem } from '../../types/class'

function toDayjs(value?: string) {
  return value ? dayjs(parseDayMonthYear(value)) : null
}

export default function ClassEditPage() {
  const navigate = useNavigate()
  const { classId } = useParams()
  const [form] = Form.useForm<ClassFormValues>()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingClass, setIsLoadingClass] = useState(true)
  const [pendingValues, setPendingValues] = useState<ClassFormValues | null>(null)
  const [classData, setClassData] = useState<ClassItem | null>(null)

  useEffect(() => {
    async function loadClass() {
      if (!classId) {
        message.error('Turma não informada.')
        navigate('/class', { replace: true })
        return
      }

      try {
        setIsLoadingClass(true)
        const foundClass = await getClassById(classId)

        if (!foundClass) {
          message.error('Turma não encontrada.')
          navigate('/class', { replace: true })
          return
        }

        setClassData(foundClass)
        form.setFieldsValue({
          name: foundClass.name,
          period: [dayjs(parseDayMonthYear(foundClass.initDate)), dayjs(parseDayMonthYear(foundClass.finishDate))],
          subscriptionEndDate: toDayjs(foundClass.subscriptionEndDate) ?? undefined,
          campusId: foundClass.campusId,
          classTypeId: foundClass.classTypeId ?? undefined,
        })
      } catch (error) {
        const nextMessage = error instanceof Error ? error.message : 'Não foi possível carregar a turma.'
        message.error(nextMessage)
        navigate('/class', { replace: true })
      } finally {
        setIsLoadingClass(false)
      }
    }

    loadClass()
  }, [classId, form, navigate])

  const handleSubmitForm = (values: ClassFormValues) => {
    setPendingValues(values)
    setIsConfirmOpen(true)
  }

  const handleConfirmEdit = async () => {
    if (!pendingValues || !classId) {
      return
    }

    const [initDate, finishDate] = pendingValues.period

    try {
      setIsSubmitting(true)

      await updateClass(classId, {
        name: pendingValues.name.trim(),
        initDate: initDate.format('DD/MM/YYYY'),
        finishDate: finishDate.format('DD/MM/YYYY'),
        subscriptionEndDate: pendingValues.subscriptionEndDate?.format('DD/MM/YYYY') || undefined,
        campusId: pendingValues.campusId,
        classTypeId: pendingValues.classTypeId || undefined,
      })

      message.success('Turma atualizada com sucesso.')
      setIsConfirmOpen(false)
      navigate(`/class/${classId}`)
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Não foi possível atualizar a turma.'
      message.error(nextMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          classData ? { title: <Link to={`/class/${classData.id}`}>{classData.name}</Link> } : { title: 'Turma' },
          { title: 'Editar turma' },
        ]}
      />

      <Space direction="vertical" size={4}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Editar turma
        </Typography.Title>
        <Typography.Text type="secondary">
          Atualize os dados da turma mantendo o período, campus e tipo conforme necessário.
        </Typography.Text>
      </Space>

      <Form<ClassFormValues>
        layout="vertical"
        form={form}
        onFinish={handleSubmitForm}
        requiredMark
        style={{ maxWidth: 720, width: '100%' }}
        disabled={isLoadingClass}
      >
        <ClassFormFields form={form} />

        <Space size={8}>
          <Button type="primary" htmlType="submit" loading={isSubmitting || isLoadingClass}>
            Salvar alterações
          </Button>
          <Button onClick={() => navigate(classData ? `/class/${classData.id}` : '/class')} disabled={isSubmitting}>
            Cancelar
          </Button>
        </Space>
      </Form>

      <AppDialog
        open={isConfirmOpen}
        type="warning"
        title="Confirmar edição da turma"
        message="Deseja realmente salvar as alterações desta turma?"
        confirmText="Salvar"
        cancelText="Voltar"
        confirmLoading={isSubmitting}
        onConfirm={handleConfirmEdit}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </Space>
  )
}
