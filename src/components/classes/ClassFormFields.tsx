import { useEffect, useMemo, useState } from 'react'
import { Alert, Col, DatePicker, Form, Input, Row, Select, Spin } from 'antd'
import type { FormInstance } from 'antd'
import type { Dayjs } from 'dayjs'
import ptBR from 'antd/es/date-picker/locale/pt_BR'
import { getCampuses } from '../../services/campus/campus.service'
import { getClassTypes } from '../../services/class/class-type.service'
import { useAdminAccess } from '../../access/use-admin-access'
import type { CampusItem } from '../../types/campus'
import type { ClassTypeItem } from '../../types/class-type'

export type ClassFormValues = {
  name: string
  period: [Dayjs, Dayjs]
  subscriptionEndDate?: Dayjs | null
  campusId: string
  classTypeId?: string
}

type ClassFormFieldsProps = {
  form: FormInstance<ClassFormValues>
}

export default function ClassFormFields({ form }: ClassFormFieldsProps) {
  const { admin, isLoading: adminLoading } = useAdminAccess()
  const [campuses, setCampuses] = useState<CampusItem[]>([])
  const [classTypes, setClassTypes] = useState<ClassTypeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoading(true)
        setErrorMessage(null)

        const [campusData, classTypeData] = await Promise.all([getCampuses(), getClassTypes()])

        setCampuses(campusData)
        setClassTypes(classTypeData)
      } catch (error) {
        const nextMessage =
          error instanceof Error ? error.message : 'Não foi possível carregar os dados auxiliares da turma.'
        setErrorMessage(nextMessage)
      } finally {
        setLoading(false)
      }
    }

    loadOptions()
  }, [])

  const availableCampuses = useMemo(() => {
    if (!admin?.campusIds?.length) {
      return campuses
    }

    const allowedCampusIds = new Set(admin.campusIds)
    return campuses.filter((campus) => allowedCampusIds.has(campus.id))
  }, [admin?.campusIds, campuses])

  useEffect(() => {
    if (!availableCampuses.length) {
      return
    }

    const currentCampusId = form.getFieldValue('campusId')

    if (!currentCampusId) {
      form.setFieldValue('campusId', availableCampuses[0].id)
      return
    }

    const hasCurrentCampus = availableCampuses.some((campus) => campus.id === currentCampusId)

    if (!hasCurrentCampus) {
      form.setFieldValue('campusId', availableCampuses[0].id)
    }
  }, [availableCampuses, form])

  if (loading || adminLoading) {
    return <Spin />
  }

  return (
    <>
      {errorMessage ? <Alert type="error" showIcon message={errorMessage} style={{ marginBottom: 16 }} /> : null}

      <Form.Item
        label="Nome da turma"
        name="name"
        rules={[
          { required: true, message: 'Informe o nome da turma.' },
          { whitespace: true, message: 'Informe o nome da turma.' },
        ]}
      >
        <Input placeholder="Ex.: Turma A" maxLength={120} />
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

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Campus"
            name="campusId"
            rules={[{ required: true, message: 'Selecione o campus da turma.' }]}
          >
            <Select
              placeholder="Selecione o campus"
              options={availableCampuses.map((campus) => ({
                value: campus.id,
                label: campus.name,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item label="Tipo de turma" name="classTypeId">
            <Select
              allowClear
              placeholder="Selecione o tipo"
              options={classTypes.map((classType) => ({
                value: classType.id,
                label: classType.name,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Data limite de inscrição" name="subscriptionEndDate">
        <DatePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          locale={ptBR}
          placeholder="Selecione a data"
        />
      </Form.Item>
    </>
  )
}
