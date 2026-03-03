import { useEffect, useMemo, useRef, useState } from 'react'
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
  Skeleton,
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
  createSubjectCallType,
  createSubjectException,
  createSubjectWeekday,
  deleteSubjectCallType,
  deleteSubjectException,
  deleteSubjectWeekday,
  getSubjectById,
  updateSubject,
  updateSubjectCallType,
} from '../../services/subject/subject.service'
import type { SubjectCallExceptionItem, SubjectCallTypeItem, SubjectWeekDayItem } from '../../types/subject'

type SubjectEditFormValues = {
  name: string
  teacherName: string
  period: [Dayjs, Dayjs]
}

type CallTypeDraft = {
  id: string
  serverId?: string
  description: string
  initTime: Dayjs
  finishTime: Dayjs
  source: 'existing' | 'new'
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

function parseBrDate(value: string) {
  const [day, month, year] = value.split('/').map(Number)
  return dayjs(new Date(year, month - 1, day))
}

function toTimeDayjs(hour: number, minute: number) {
  return dayjs().hour(hour).minute(minute).second(0).millisecond(0)
}

export default function SubjectEditPage() {
  const navigate = useNavigate()
  const { classId, subjectId } = useParams()

  const [form] = Form.useForm<SubjectEditFormValues>()
  const [callTypeForm] = Form.useForm<CallTypeFormValues>()

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
  const [exceptionReasonByDate, setExceptionReasonByDate] = useState<Record<string, string>>({})
  const [callTypeDrafts, setCallTypeDrafts] = useState<CallTypeDraft[]>([])
  const [editingCallTypeId, setEditingCallTypeId] = useState<string | null>(null)
  const [isCallTypeModalOpen, setIsCallTypeModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [highlightedArea, setHighlightedArea] = useState<'form' | 'weekdays' | 'preview' | 'calltypes' | null>(null)

  const [originalWeekdays, setOriginalWeekdays] = useState<SubjectWeekDayItem[]>([])
  const [originalExceptions, setOriginalExceptions] = useState<SubjectCallExceptionItem[]>([])
  const [originalCallTypes, setOriginalCallTypes] = useState<SubjectCallTypeItem[]>([])

  const weekdaysSectionRef = useRef<HTMLDivElement | null>(null)
  const callTypesSectionRef = useRef<HTMLDivElement | null>(null)

  const period = Form.useWatch('period', form)

  const focusArea = (
    area: 'form' | 'weekdays' | 'preview' | 'calltypes',
    options?: {
      fieldName?: keyof SubjectEditFormValues
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

  useEffect(() => {
    async function loadData() {
      if (!subjectId) {
        setErrorMessage('Matéria não informada.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setErrorMessage(null)

        const details = await getSubjectById(subjectId)

        form.setFieldsValue({
          name: details.name,
          teacherName: details.teacherName,
          period: [parseBrDate(details.initDate), parseBrDate(details.finishDate)],
        })

        setSelectedWeekdays(details.weekDays.map((item) => item.dayOfWeek))
        setExceptionReasonByDate(
          details.callExceptions.reduce<Record<string, string>>((acc, item) => {
            const normalizedKey = parseBrDate(item.date).format('YYYY-MM-DD')
            acc[normalizedKey] = item.description
            return acc
          }, {}),
        )
        setCallTypeDrafts(
          details.callTypes.map((item) => ({
            id: item.id,
            serverId: item.id,
            source: 'existing' as const,
            description: item.description,
            initTime: toTimeDayjs(item.initHour, item.initMinute),
            finishTime: toTimeDayjs(item.finishHour, item.finishMinute),
          })),
        )

        setOriginalWeekdays(details.weekDays)
        setOriginalExceptions(details.callExceptions)
        setOriginalCallTypes(details.callTypes)
      } catch {
        setErrorMessage('Não foi possível carregar os dados da matéria.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [form, subjectId])

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

      setCallTypeDrafts((previous) => {
        const currentDraft = previous.find((item) => item.id === editingCallTypeId)
        const payload: CallTypeDraft = {
          id: editingCallTypeId ?? crypto.randomUUID(),
          serverId: currentDraft?.serverId,
          source: currentDraft?.source ?? 'new',
          description: values.description.trim(),
          initTime: values.initTime,
          finishTime: values.finishTime,
        }

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
    if (!classId || !subjectId) {
      setFormErrorMessage('Turma ou matéria não informada.')
      return
    }

    setFormErrorMessage(null)

    try {
      await form.validateFields()
    } catch (error: any) {
      setFormErrorMessage('Preencha corretamente os dados obrigatórios da matéria.')

      const firstFieldName = error?.errorFields?.[0]?.name?.[0] as keyof SubjectEditFormValues | undefined

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
      focusArea('preview', { elementId: `exception-reason-${invalidException[0]}` })
      return
    }

    setIsConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    if (!classId || !subjectId) {
      return
    }

    const values = form.getFieldsValue()
    const [initDate, finishDate] = values.period

    if (!values.name || !values.teacherName || !initDate || !finishDate) {
      return
    }

    const desiredExceptionsByDate = new Map<string, string>()

    Object.entries(exceptionReasonByDate).forEach(([dateKey, description]) => {
      desiredExceptionsByDate.set(dayjs(dateKey, 'YYYY-MM-DD').format('DD/MM/YYYY'), description.trim())
    })

    const originalCallTypesById = new Map(originalCallTypes.map((item) => [item.id, item]))

    try {
      setIsSubmitting(true)

      await updateSubject(subjectId, {
        name: values.name.trim(),
        teacherName: values.teacherName.trim(),
        initDate: initDate.format('DD/MM/YYYY'),
        finishDate: finishDate.format('DD/MM/YYYY'),
        classId,
      })

      const originalWeekdaysSet = new Set(originalWeekdays.map((item) => item.dayOfWeek))
      const selectedWeekdaysSet = new Set(selectedWeekdays)

      const weekdaysToCreate = selectedWeekdays.filter((dayOfWeek) => !originalWeekdaysSet.has(dayOfWeek))
      const weekdaysToDelete = originalWeekdays.filter((item) => !selectedWeekdaysSet.has(item.dayOfWeek))

      await Promise.all(weekdaysToCreate.map((dayOfWeek) => createSubjectWeekday({ subjectId, dayOfWeek })))
      await Promise.all(weekdaysToDelete.map((item) => deleteSubjectWeekday(item.id)))

      const originalExceptionsByDate = new Map(originalExceptions.map((item) => [item.date, item]))

      const exceptionsToDeleteIds: string[] = []
      const exceptionsToCreate: Array<{ date: string; description: string }> = []

      originalExceptions.forEach((item) => {
        const desiredDescription = desiredExceptionsByDate.get(item.date)

        if (!desiredDescription) {
          exceptionsToDeleteIds.push(item.id)
          return
        }

        if (desiredDescription !== item.description) {
          exceptionsToDeleteIds.push(item.id)
          exceptionsToCreate.push({ date: item.date, description: desiredDescription })
        }
      })

      desiredExceptionsByDate.forEach((description, date) => {
        if (!originalExceptionsByDate.has(date)) {
          exceptionsToCreate.push({ date, description })
        }
      })

      await Promise.all(exceptionsToDeleteIds.map((exceptionId) => deleteSubjectException(exceptionId)))
      await Promise.all(
        exceptionsToCreate.map((item) =>
          createSubjectException({
            subjectId,
            date: item.date,
            description: item.description,
          }),
        ),
      )

      const currentExistingCallTypes = callTypeDrafts.filter((item) => item.source === 'existing' && item.serverId)
      const currentExistingCallTypeIds = new Set(currentExistingCallTypes.map((item) => item.serverId as string))

      const callTypesToDelete = originalCallTypes.filter((item) => !currentExistingCallTypeIds.has(item.id))
      await Promise.all(callTypesToDelete.map((item) => deleteSubjectCallType(item.id)))

      const callTypesToUpdate = currentExistingCallTypes.filter((item) => {
        const original = originalCallTypesById.get(item.serverId as string)

        if (!original) {
          return false
        }

        return (
          original.description !== item.description ||
          original.initHour !== item.initTime.hour() ||
          original.initMinute !== item.initTime.minute() ||
          original.finishHour !== item.finishTime.hour() ||
          original.finishMinute !== item.finishTime.minute()
        )
      })

      await Promise.all(
        callTypesToUpdate.map((item) =>
          updateSubjectCallType(item.serverId as string, {
            description: item.description,
            subjectId,
            initHour: item.initTime.hour(),
            initMinute: item.initTime.minute(),
            finishHour: item.finishTime.hour(),
            finishMinute: item.finishTime.minute(),
          }),
        ),
      )

      const callTypesToCreate = callTypeDrafts.filter((item) => item.source === 'new')
      await Promise.all(
        callTypesToCreate.map((item) =>
          createSubjectCallType({
            description: item.description,
            subjectId,
            initHour: item.initTime.hour(),
            initMinute: item.initTime.minute(),
            finishHour: item.finishTime.hour(),
            finishMinute: item.finishTime.minute(),
          }),
        ),
      )

      message.success('Matéria atualizada com sucesso.')
      setIsConfirmOpen(false)
      navigate(`/class/${classId}/subjects`)
    } catch {
      message.error('Não foi possível salvar as alterações da matéria.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
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

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          { title: <Link to={classId ? `/class/${classId}` : '/class'}>Gestão da turma</Link> },
          { title: <Link to={classId ? `/class/${classId}/subjects` : '/class'}>Matérias</Link> },
          { title: 'Editar matéria' },
        ]}
      />

      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Editar matéria
        </Typography.Title>
        <Typography.Text type="secondary">
          Ajuste dados, dias de aula, exceções e marcações antes de salvar.
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
          <Form<SubjectEditFormValues> layout="vertical" form={form} requiredMark style={{ width: '100%' }}>
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
          Salvar alterações
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
        title="Confirmar atualização da matéria"
        message="Deseja salvar as alterações desta matéria agora?"
        confirmText="Salvar"
        cancelText="Revisar"
        confirmLoading={isSubmitting}
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </Space>
  )
}
