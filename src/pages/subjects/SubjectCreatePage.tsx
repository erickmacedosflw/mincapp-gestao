import { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Modal,
  Space,
  Tag,
  TimePicker,
  Typography,
  message,
} from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import ptBR from 'antd/es/date-picker/locale/pt_BR'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppDialog from '../../components/feedback/AppDialog'
import {
  createSubject,
  createSubjectCallType,
  createSubjectException,
  createSubjectWeekday,
} from '../../services/subject/subject.service'

type SubjectCreateFormValues = {
  name: string
  teacherName: string
  period: [Dayjs, Dayjs]
}

type CallTypeDraft = {
  id: string
  description: string
  initTime: Dayjs
  finishTime: Dayjs
}

type CallTypeFormValues = {
  description: string
  initTime: Dayjs
  finishTime: Dayjs
}

type LessonDatePreview = {
  date: Dayjs
  key: string
  weekDayLabel: string
}

const weekdayOptions = [
  { label: 'Domingo', value: 0 },
  { label: 'Segunda', value: 1 },
  { label: 'Terça', value: 2 },
  { label: 'Quarta', value: 3 },
  { label: 'Quinta', value: 4 },
  { label: 'Sexta', value: 5 },
  { label: 'Sábado', value: 6 },
]

const weekdayLabelByValue = new Map(weekdayOptions.map((item) => [item.value, item.label]))

export default function SubjectCreatePage() {
  const navigate = useNavigate()
  const { classId } = useParams()

  const [form] = Form.useForm<SubjectCreateFormValues>()
  const [callTypeForm] = Form.useForm<CallTypeFormValues>()
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
  const [exceptionReasonByDate, setExceptionReasonByDate] = useState<Record<string, string>>({})
  const [callTypeDrafts, setCallTypeDrafts] = useState<CallTypeDraft[]>([])
  const [editingCallTypeId, setEditingCallTypeId] = useState<string | null>(null)
  const [isCallTypeModalOpen, setIsCallTypeModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [highlightedArea, setHighlightedArea] = useState<'form' | 'weekdays' | 'preview' | 'calltypes' | null>(null)

  const weekdaysSectionRef = useRef<HTMLDivElement | null>(null)
  const callTypesSectionRef = useRef<HTMLDivElement | null>(null)

  const focusArea = (
    area: 'form' | 'weekdays' | 'preview' | 'calltypes',
    options?: {
      fieldName?: keyof SubjectCreateFormValues
      elementId?: string
      refElement?: HTMLDivElement | null
    },
  ) => {
    setHighlightedArea(area)

    if (options?.fieldName) {
      form.scrollToField(options.fieldName)
    } else if (options?.elementId) {
      const element = document.getElementById(options.elementId)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element?.focus()
    } else if (options?.refElement) {
      options.refElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    window.setTimeout(() => {
      setHighlightedArea((current) => (current === area ? null : current))
    }, 2600)
  }

  const period = Form.useWatch('period', form)

  const lessonDatePreviews = useMemo<LessonDatePreview[]>(() => {
    if (!period || selectedWeekdays.length === 0) {
      return []
    }

    const [start, end] = period

    if (!start || !end || end.isBefore(start, 'day')) {
      return []
    }

    const output: LessonDatePreview[] = []
    let cursor = start.startOf('day')
    const endDate = end.startOf('day')

    while (cursor.isBefore(endDate, 'day') || cursor.isSame(endDate, 'day')) {
      const dayOfWeek = cursor.day()

      if (selectedWeekdays.includes(dayOfWeek)) {
        output.push({
          date: cursor,
          key: cursor.format('YYYY-MM-DD'),
          weekDayLabel: weekdayLabelByValue.get(dayOfWeek) ?? 'Dia',
        })
      }

      cursor = cursor.add(1, 'day')
    }

    return output
  }, [period, selectedWeekdays])

  const totalExceptions = useMemo(() => {
    return Object.values(exceptionReasonByDate).filter((value) => value.trim().length > 0).length
  }, [exceptionReasonByDate])

  const openCreateCallTypeModal = () => {
    setEditingCallTypeId(null)
    callTypeForm.resetFields()
    setIsCallTypeModalOpen(true)
  }

  const openEditCallTypeModal = (draft: CallTypeDraft) => {
    setEditingCallTypeId(draft.id)
    callTypeForm.setFieldsValue({
      description: draft.description,
      initTime: draft.initTime,
      finishTime: draft.finishTime,
    })
    setIsCallTypeModalOpen(true)
  }

  const closeCallTypeModal = () => {
    setIsCallTypeModalOpen(false)
    setEditingCallTypeId(null)
    callTypeForm.resetFields()
  }

  const handleSaveCallType = async () => {
    try {
      const values = await callTypeForm.validateFields()
      const payload: CallTypeDraft = {
        id: editingCallTypeId ?? crypto.randomUUID(),
        description: values.description.trim(),
        initTime: values.initTime,
        finishTime: values.finishTime,
      }

      setCallTypeDrafts((previous) => {
        if (!editingCallTypeId) {
          return [...previous, payload]
        }

        return previous.map((item) => (item.id === editingCallTypeId ? payload : item))
      })

      closeCallTypeModal()
    } catch {
      // validações do formulário já tratadas pelo antd
    }
  }

  const handleDeleteCallType = (id: string) => {
    setCallTypeDrafts((previous) => previous.filter((item) => item.id !== id))
  }

  const handleToggleException = (dateKey: string, enabled: boolean) => {
    setExceptionReasonByDate((previous) => {
      if (!enabled) {
        const next = { ...previous }
        delete next[dateKey]
        return next
      }

      return {
        ...previous,
        [dateKey]: previous[dateKey] ?? '',
      }
    })
  }

  const handleChangeExceptionReason = (dateKey: string, reason: string) => {
    setExceptionReasonByDate((previous) => ({
      ...previous,
      [dateKey]: reason,
    }))
  }

  const handleSaveRequest = async () => {
    if (!classId) {
      setFormErrorMessage('Turma não informada para criação da matéria.')
      return
    }

    setFormErrorMessage(null)

    try {
      await form.validateFields()
    } catch (error: any) {
      setFormErrorMessage('Preencha corretamente os dados obrigatórios da matéria.')

      const firstFieldName = error?.errorFields?.[0]?.name?.[0] as keyof SubjectCreateFormValues | undefined

      if (firstFieldName) {
        focusArea('form', { fieldName: firstFieldName })
      }

      return
    }

    if (selectedWeekdays.length === 0) {
      setFormErrorMessage('Selecione pelo menos um dia da semana com aula.')
      focusArea('weekdays', { refElement: weekdaysSectionRef.current })
      return
    }

    if (callTypeDrafts.length === 0) {
      setFormErrorMessage('Cadastre pelo menos uma marcação para a matéria.')
      focusArea('calltypes', { refElement: callTypesSectionRef.current })
      return
    }

    const invalidException = Object.entries(exceptionReasonByDate).find(([, value]) => value.trim().length === 0)

    if (invalidException) {
      setFormErrorMessage('Toda exceção deve ter um motivo obrigatório.')
      const exceptionElementId = `exception-reason-${invalidException[0]}`
      focusArea('preview', { elementId: exceptionElementId })
      return
    }

    setIsConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    if (!classId) {
      return
    }

    const values = form.getFieldsValue()
    const [initDate, finishDate] = values.period

    if (!initDate || !finishDate) {
      return
    }

    const exceptionPayload = Object.entries(exceptionReasonByDate).map(([dateKey, description]) => ({
      date: dayjs(dateKey, 'YYYY-MM-DD').format('DD/MM/YYYY'),
      description: description.trim(),
    }))

    try {
      setIsSubmitting(true)

      const subject = await createSubject({
        name: values.name.trim(),
        teacherName: values.teacherName.trim(),
        initDate: initDate.format('DD/MM/YYYY'),
        finishDate: finishDate.format('DD/MM/YYYY'),
        classId,
      })

      await Promise.all(selectedWeekdays.map((dayOfWeek) => createSubjectWeekday({ subjectId: subject.id, dayOfWeek })))
      await Promise.all(
        exceptionPayload.map((item) =>
          createSubjectException({
            subjectId: subject.id,
            description: item.description,
            date: item.date,
          }),
        ),
      )
      await Promise.all(
        callTypeDrafts.map((item) =>
          createSubjectCallType({
            description: item.description,
            subjectId: subject.id,
            initHour: item.initTime.hour(),
            initMinute: item.initTime.minute(),
            finishHour: item.finishTime.hour(),
            finishMinute: item.finishTime.minute(),
          }),
        ),
      )

      message.success('Matéria criada com sucesso.')
      setIsConfirmOpen(false)
      navigate(`/class/${classId}/subjects`)
    } catch {
      message.error('Não foi possível salvar a matéria e suas configurações.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          { title: <Link to={classId ? `/class/${classId}` : '/class'}>Gestão da turma</Link> },
          { title: <Link to={classId ? `/class/${classId}/subjects` : '/class'}>Matérias</Link> },
          { title: 'Nova matéria' },
        ]}
      />

      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Criar matéria
        </Typography.Title>
        <Typography.Text type="secondary">
          Defina período, dias de aula, exceções e marcações antes de salvar.
        </Typography.Text>
      </Space>

      {formErrorMessage ? <Alert type="error" showIcon message={formErrorMessage} /> : null}

      <Card>
        <div
          style={
            highlightedArea === 'form'
              ? { border: '1px solid #faad14', borderRadius: 8, padding: 12 }
              : undefined
          }
        >
          <Form<SubjectCreateFormValues> layout="vertical" form={form} requiredMark style={{ width: '100%' }}>
          <Form.Item
            label="Nome da matéria"
            name="name"
            rules={[
              { required: true, message: 'Informe o nome da matéria.' },
              { whitespace: true, message: 'Informe o nome da matéria.' },
            ]}
          >
            <Input placeholder="Ex.: Matéria | Admin" maxLength={120} />
          </Form.Item>

          <Form.Item
            label="Professor(a)"
            name="teacherName"
            rules={[
              { required: true, message: 'Informe o nome do professor.' },
              { whitespace: true, message: 'Informe o nome do professor.' },
            ]}
          >
            <Input placeholder="Ex.: Erick Macedo" maxLength={120} />
          </Form.Item>

          <Form.Item
            label="Período da matéria"
            name="period"
            rules={[{ required: true, message: 'Selecione o período da matéria.' }]}
          >
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              locale={ptBR}
              placeholder={['Data de início', 'Data de fim']}
              allowClear={false}
            />
          </Form.Item>

          <Form.Item label="Dias da semana com aula" required>
            <Space
              direction="vertical"
              size={12}
              style={{
                width: '100%',
                border: highlightedArea === 'weekdays' ? '1px solid #faad14' : undefined,
                borderRadius: highlightedArea === 'weekdays' ? 8 : undefined,
                padding: highlightedArea === 'weekdays' ? 10 : undefined,
              }}
              ref={weekdaysSectionRef}
            >
              <Checkbox.Group
                options={weekdayOptions}
                value={selectedWeekdays}
                onChange={(values) => setSelectedWeekdays(values as number[])}
              />
              <Typography.Text type="secondary">Selecione os dias em que a matéria acontece.</Typography.Text>
            </Space>
          </Form.Item>
          </Form>
        </div>
      </Card>

      <Card
        style={
          highlightedArea === 'preview'
            ? {
                borderColor: '#faad14',
              }
            : undefined
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Prévia dos dias de aula
            </Typography.Title>
            <Tag color="blue">Total: {lessonDatePreviews.length}</Tag>
          </Space>

          {lessonDatePreviews.length === 0 ? (
            <Typography.Text type="secondary">Selecione período e dias da semana para visualizar as aulas.</Typography.Text>
          ) : (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {lessonDatePreviews.map((item) => {
                const reason = exceptionReasonByDate[item.key] ?? ''
                const hasException = Object.hasOwn(exceptionReasonByDate, item.key)

                return (
                  <Card key={item.key} size="small">
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Typography.Text strong>
                          {item.date.format('DD/MM/YYYY')} • {item.weekDayLabel}
                        </Typography.Text>
                        <Checkbox checked={hasException} onChange={(event) => handleToggleException(item.key, event.target.checked)}>
                          Sem aula nesta data
                        </Checkbox>
                      </Space>

                      {hasException ? (
                        <Input
                          id={`exception-reason-${item.key}`}
                          placeholder="Motivo da exceção (obrigatório)"
                          value={reason}
                          maxLength={160}
                          onChange={(event) => handleChangeExceptionReason(item.key, event.target.value)}
                        />
                      ) : null}
                    </Space>
                  </Card>
                )
              })}
            </Space>
          )}

          <Typography.Text type="secondary">Exceções configuradas: {totalExceptions}</Typography.Text>
        </Space>
      </Card>

      <Card
        ref={callTypesSectionRef}
        style={
          highlightedArea === 'calltypes'
            ? {
                borderColor: '#faad14',
              }
            : undefined
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Marcações da matéria
            </Typography.Title>
            <Button type="primary" onClick={openCreateCallTypeModal}>
              Adicionar marcação
            </Button>
          </Space>

          {callTypeDrafts.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              message="Cadastre pelo menos uma marcação para conseguir salvar a matéria."
            />
          ) : (
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {callTypeDrafts.map((item) => (
                <Card key={item.id} size="small">
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Typography.Text strong>{item.description}</Typography.Text>
                    <Typography.Text type="secondary">
                      {item.initTime.format('HH:mm')} até {item.finishTime.format('HH:mm')}
                    </Typography.Text>
                    <Space>
                      <Button size="small" onClick={() => openEditCallTypeModal(item)}>
                        Editar
                      </Button>
                      <Button size="small" danger onClick={() => handleDeleteCallType(item.id)}>
                        Excluir
                      </Button>
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Space>
      </Card>

      <Space size={8}>
        <Button type="primary" onClick={handleSaveRequest} loading={isSubmitting}>
          Salvar matéria
        </Button>
        <Button onClick={() => navigate(classId ? `/class/${classId}/subjects` : '/class')} disabled={isSubmitting}>
          Cancelar
        </Button>
      </Space>

      <Modal
        open={isCallTypeModalOpen}
        title={editingCallTypeId ? 'Editar marcação' : 'Nova marcação'}
        onCancel={closeCallTypeModal}
        onOk={handleSaveCallType}
        okText="Salvar"
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form<CallTypeFormValues> layout="vertical" form={callTypeForm} requiredMark>
          <Form.Item
            label="Descrição da marcação"
            name="description"
            rules={[
              { required: true, message: 'Informe a descrição da marcação.' },
              { whitespace: true, message: 'Informe a descrição da marcação.' },
            ]}
          >
            <Input placeholder="Ex.: Entrada" maxLength={80} />
          </Form.Item>

          <Form.Item label="Hora de início" name="initTime" rules={[{ required: true, message: 'Informe a hora de início.' }]}>
            <TimePicker format="HH:mm" minuteStep={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Hora de fim" name="finishTime" rules={[{ required: true, message: 'Informe a hora de fim.' }]}>
            <TimePicker format="HH:mm" minuteStep={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <AppDialog
        open={isConfirmOpen}
        type="warning"
        title="Confirmar criação da matéria"
        message="Deseja salvar esta matéria com dias, exceções e marcações configuradas?"
        confirmText="Salvar"
        cancelText="Revisar"
        confirmLoading={isSubmitting}
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </Space>
  )
}
