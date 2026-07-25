import { useState } from 'react'
import {
  CalendarOutlined,
  FileTextOutlined,
  PrinterOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Card, Empty, Form, Select, Skeleton, Space, Typography } from 'antd'
import CpfInput from '../../../components/forms/CpfInput'
import { getTenantBrand } from '../../../config/tenant'
import { getClassTypes } from '../../../services/class/class-type.service'
import { getTenantSelection } from '../../../services/auth/token.storage'
import { getStudentAcademicReport } from '../../../services/student/student.service'
import type {
  StudentAcademicReportClass,
  StudentAcademicReportParams,
  StudentAcademicReportSubject,
} from '../../../types/student'
import { digitsOnly, formatCpf } from '../../../utils/cpf'

type ReportFormValues = {
  cpf: string
  classTypeId?: string
}

type StudentAcademicReportProps = {
  initialCpf: string
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value
  }

  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (isoDate) {
    return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`
  }

  return value
}

function formatDays(days?: string[] | null) {
  return days?.length ? days.join(', ') : '-'
}

function formatClassType(type: StudentAcademicReportClass['type']) {
  if (typeof type === 'string') {
    return type || '-'
  }

  return type?.name || '-'
}

function formatGrade(subject: StudentAcademicReportSubject) {
  if (subject.totalGrade === null) {
    return '-'
  }

  const grade = numberFormatter.format(subject.totalGrade)

  if (subject.totalValue === null || subject.totalValue === undefined) {
    return grade
  }

  return `${grade} de ${numberFormatter.format(subject.totalValue)}`
}

function formatAttendancePercentage(value: number | null) {
  return value === null ? '-' : `${numberFormatter.format(value)}%`
}

function formatAttendanceCalls(subject: StudentAcademicReportSubject) {
  if (subject.presentCalls === null || subject.presentCalls === undefined) {
    return '-'
  }

  if (subject.expectedCalls === null || subject.expectedCalls === undefined) {
    return `${subject.presentCalls}`
  }

  return `${subject.presentCalls} de ${subject.expectedCalls} aulas`
}

export default function StudentAcademicReport({ initialCpf }: StudentAcademicReportProps) {
  const [form] = Form.useForm<ReportFormValues>()
  const [filters, setFilters] = useState<StudentAcademicReportParams | null>(null)
  const brand = getTenantBrand(getTenantSelection())

  const classTypesQuery = useQuery({
    queryKey: ['class-types', 'student-academic-report'],
    queryFn: getClassTypes,
  })

  const reportQuery = useQuery({
    queryKey: ['student-academic-report', filters],
    queryFn: () => {
      if (!filters) {
        throw new Error('Informe os filtros do boletim.')
      }

      return getStudentAcademicReport(filters)
    },
    enabled: Boolean(filters),
  })

  const handleSubmit = (values: ReportFormValues) => {
    setFilters({
      cpf: digitsOnly(values.cpf),
      classTypeId: values.classTypeId || undefined,
    })
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small" className="academic-report-filter-card">
        <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 16 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Consultar boletim
          </Typography.Title>
          <Typography.Text type="secondary">
            Informe o CPF e, se desejar, filtre o histórico por tipo de turma.
          </Typography.Text>
        </Space>

        <Form<ReportFormValues>
          form={form}
          layout="vertical"
          initialValues={{ cpf: formatCpf(initialCpf) }}
          onFinish={handleSubmit}
        >
          <div className="academic-report-filters">
            <Form.Item
              label="CPF do aluno"
              name="cpf"
              rules={[
                { required: true, message: 'Informe o CPF do aluno.' },
                {
                  validator: (_, value?: string) =>
                    digitsOnly(value ?? '').length === 11
                      ? Promise.resolve()
                      : Promise.reject(new Error('Informe um CPF com 11 dígitos.')),
                },
              ]}
            >
              <CpfInput />
            </Form.Item>

            <Form.Item label="Tipo de turma (opcional)" name="classTypeId">
              <Select
                allowClear
                showSearch
                size="large"
                optionFilterProp="label"
                placeholder="Todos os tipos"
                loading={classTypesQuery.isLoading}
                options={(classTypesQuery.data ?? []).map((classType) => ({
                  value: classType.id,
                  label: classType.name,
                }))}
              />
            </Form.Item>

            <Form.Item label=" ">
              <Button
                block
                type="primary"
                size="large"
                htmlType="submit"
                icon={<SearchOutlined />}
                loading={reportQuery.isFetching}
              >
                Visualizar boletim
              </Button>
            </Form.Item>
          </div>
        </Form>

        {classTypesQuery.isError ? (
          <Alert
            type="warning"
            showIcon
            message="Os tipos de turma não puderam ser carregados. Ainda é possível consultar todos os boletins."
          />
        ) : null}
      </Card>

      {reportQuery.isFetching ? (
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : null}

      {reportQuery.isError ? (
        <Alert
          type="error"
          showIcon
          message="Não foi possível carregar o boletim."
          description={reportQuery.error instanceof Error ? reportQuery.error.message : undefined}
        />
      ) : null}

      {reportQuery.data ? (
        reportQuery.data.classes.length > 0 ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div className="academic-report-preview-toolbar">
              <Space size={8} align="center">
                <FileTextOutlined />
                <Typography.Text strong>
                  Prévia do boletim · {reportQuery.data.classes.length}{' '}
                  {reportQuery.data.classes.length === 1 ? 'página' : 'páginas'}
                </Typography.Text>
              </Space>
              <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
                Imprimir
              </Button>
            </div>

            <div className="academic-report-pages">
              {reportQuery.data.classes.map((classItem, classIndex) => (
                <article
                  className="academic-report-page"
                  key={`${classItem.name}-${classItem.initDate ?? classIndex}`}
                >
                  <header className="academic-report-page-header">
                    <img src={brand.logoSrc} alt={brand.fullName} className="academic-report-logo" />
                    <div>
                      <span className="academic-report-eyebrow">Registro acadêmico</span>
                      <h2>Boletim acadêmico</h2>
                    </div>
                    <span className="academic-report-page-number">
                      Página {classIndex + 1} de {reportQuery.data.classes.length}
                    </span>
                  </header>

                  <section className="academic-report-student-summary">
                    <div>
                      <span>Aluno</span>
                      <strong>{reportQuery.data.student.name}</strong>
                    </div>
                    <div>
                      <span>CPF</span>
                      <strong>{formatCpf(reportQuery.data.student.cpf)}</strong>
                    </div>
                    {reportQuery.data.student.dateBirth ? (
                      <div>
                        <span>Data de nascimento</span>
                        <strong>{formatDate(reportQuery.data.student.dateBirth)}</strong>
                      </div>
                    ) : null}
                  </section>

                  <section className="academic-report-class-summary">
                    <div className="academic-report-class-title">
                      <span>Turma</span>
                      <h3>{classItem.name}</h3>
                    </div>
                    <div className="academic-report-class-details">
                      <div>
                        <TeamOutlined />
                        <span>
                          <small>Tipo de turma</small>
                          <strong>{formatClassType(classItem.type)}</strong>
                        </span>
                      </div>
                      <div>
                        <CalendarOutlined />
                        <span>
                          <small>Período</small>
                          <strong>
                            {formatDate(classItem.initDate)} a {formatDate(classItem.finishDate)}
                          </strong>
                        </span>
                      </div>
                      <div>
                        <FileTextOutlined />
                        <span>
                          <small>Matrícula</small>
                          <strong>{formatDate(classItem.enrollmentDate)}</strong>
                        </span>
                      </div>
                    </div>
                    <p>
                      <strong>Dias de aula:</strong> {formatDays(classItem.daysOfWeek)}
                    </p>
                  </section>

                  <section className="academic-report-subjects">
                    <div className="academic-report-subjects-heading">
                      <h4>Disciplinas</h4>
                      <span>
                        {classItem.subjects.length}{' '}
                        {classItem.subjects.length === 1 ? 'disciplina' : 'disciplinas'}
                      </span>
                    </div>

                    {classItem.subjects.length > 0 ? (
                      <div className="academic-report-subject-list">
                        <div className="academic-report-subject-row academic-report-subject-labels">
                          <span>Disciplina</span>
                          <span>Aulas</span>
                          <span>Nota</span>
                          <span>Frequência</span>
                        </div>
                        {classItem.subjects.map((subject, subjectIndex) => (
                          <div
                            className="academic-report-subject-row"
                            key={`${subject.name}-${subject.teacherName ?? subjectIndex}`}
                          >
                            <div className="academic-report-subject-name">
                              <strong>{subject.name}</strong>
                              <span>Professor: {subject.teacherName || '-'}</span>
                            </div>
                            <div>
                              <strong>{formatDate(subject.initDate)} a {formatDate(subject.finishDate)}</strong>
                              <span>{formatDays(subject.daysOfWeek)}</span>
                            </div>
                            <div>
                              <strong>{formatGrade(subject)}</strong>
                              <span>Resultado</span>
                            </div>
                            <div>
                              <strong>{formatAttendancePercentage(subject.attendancePercentage)}</strong>
                              <span>{formatAttendanceCalls(subject)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="academic-report-empty-subjects">Nenhuma disciplina registrada nesta turma.</div>
                    )}
                  </section>

                  <footer className="academic-report-page-footer">
                    <span>{brand.fullName}</span>
                    <span>Documento para acompanhamento acadêmico</span>
                  </footer>
                </article>
              ))}
            </div>
          </Space>
        ) : (
          <Card>
            <Empty description="Nenhuma turma encontrada para os filtros informados." />
          </Card>
        )
      ) : null}
    </Space>
  )
}
