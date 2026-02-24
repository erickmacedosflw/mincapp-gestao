import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChartOutlined,
  BookOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  PlusOutlined,
  ReadOutlined,
  EnvironmentOutlined,
  MailOutlined,
  MoreOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Dropdown,
  Empty,
  Grid,
  Input,
  List,
  message,
  Modal,
  Pagination,
  Radio,
  Row,
  Col,
  Skeleton,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { MenuProps } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ClassItem } from '../../types/class'
import type { ClassTypeItem } from '../../types/class-type'
import type { StudentItem } from '../../types/student'
import { getAllStudentsForDashboard, getStudentById } from '../../services/student/student.service'
import { getClassTypes } from '../../services/class/class-type.service'
import { addStudentToClass, removeStudentFromClass } from '../../services/class/class.service'
import * as maptalks from 'maptalks'
import 'maptalks/dist/maptalks.css'
import ClassCard from '../../components/classes/ClassCard'
import AppDialog from '../../components/feedback/AppDialog'

const PER_PAGE = 15
type MapCoordinates = [number, number]
type EnrollmentStatusFilter = 'all' | 'active' | 'closed' | 'without-active'

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '')

  if (digits.length !== 11) {
    return value
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export default function InspireStudentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const screens = Grid.useBreakpoint()
  const listTopRef = useRef<HTMLDivElement | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maptalks.Map | null>(null)

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState<EnrollmentStatusFilter>('all')
  const [addressPreviewStudent, setAddressPreviewStudent] = useState<StudentItem | null>(null)
  const [classesPreviewStudent, setClassesPreviewStudent] = useState<StudentItem | null>(null)
  const [removeClassTarget, setRemoveClassTarget] = useState<ClassItem | null>(null)
  const [addClassModalOpen, setAddClassModalOpen] = useState(false)
  const [selectedAvailableClassIds, setSelectedAvailableClassIds] = useState<string[]>([])
  const [addClassConfirmTargets, setAddClassConfirmTargets] = useState<ClassItem[]>([])
  const [showClosedClasses, setShowClosedClasses] = useState(false)
  const [removingStudent, setRemovingStudent] = useState(false)
  const [addingStudent, setAddingStudent] = useState(false)
  const [mapCoordinates, setMapCoordinates] = useState<MapCoordinates | null>(null)
  const [geocodeLoading, setGeocodeLoading] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)

  const normalizedSearch = useMemo(() => searchTerm.trim(), [searchTerm])

  const studentsQuery = useQuery<StudentItem[]>({
    queryKey: ['students-all-full'],
    queryFn: getAllStudentsForDashboard,
  })

  const allStudents = studentsQuery.data ?? []
  const enrollmentQueryKey = ['students-enrollment-status', allStudents.map((student) => student.id).join(',')]

  const studentsEnrollmentQuery = useQuery<Record<string, { activeCount: number; closedCount: number }>>({
    queryKey: enrollmentQueryKey,
    queryFn: async () => {
      const details = await Promise.all(allStudents.map((student) => getStudentById(student.id)))

      return details.reduce<Record<string, { activeCount: number; closedCount: number }>>((accumulator, current) => {
        accumulator[current.id] = {
          activeCount: current.subscriptions?.length ?? 0,
          closedCount: current.previousSubscriptions?.length ?? 0,
        }

        return accumulator
      }, {})
    },
    enabled: allStudents.length > 0,
  })

  const classTypesQuery = useQuery<ClassTypeItem[]>({
    queryKey: ['class-types'],
    queryFn: getClassTypes,
  })

  const studentDetailsQuery = useQuery({
    queryKey: ['student-details', classesPreviewStudent?.id],
    queryFn: () => getStudentById(classesPreviewStudent?.id ?? ''),
    enabled: Boolean(classesPreviewStudent?.id),
  })

  const classTypeNameMap = useMemo(() => {
    const entries = classTypesQuery.data ?? []
    return new Map(entries.map((item) => [item.id, item.name]))
  }, [classTypesQuery.data])

  const activeClasses = useMemo<ClassItem[]>(() => {
    const subscriptions = studentDetailsQuery.data?.subscriptions ?? []

    return subscriptions.map((item) => ({
      id: item.id,
      name: item.name,
      initDate: item.initDate,
      finishDate: item.finishDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      classTypeId: item.classTypeId ?? '',
      campusId: item.campus_id,
    }))
  }, [studentDetailsQuery.data])

  const closedClasses = useMemo<ClassItem[]>(() => {
    const subscriptions = studentDetailsQuery.data?.previousSubscriptions ?? []

    return subscriptions.map((item) => ({
      id: item.id,
      name: item.name,
      initDate: item.initDate,
      finishDate: item.finishDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      classTypeId: item.classTypeId ?? '',
      campusId: item.campus_id,
    }))
  }, [studentDetailsQuery.data])

  const availableClassesForAdd = useMemo<ClassItem[]>(() => {
    const subscriptions = studentDetailsQuery.data?.availableForSubscription ?? []

    return subscriptions.map((item) => ({
      id: item.id,
      name: item.name,
      initDate: item.initDate,
      finishDate: item.finishDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      classTypeId: item.classTypeId ?? '',
      campusId: item.campus_id,
    }))
  }, [studentDetailsQuery.data])

  const groupedAvailableClassesForAdd = useMemo(() => {
    const groupedMap = new Map<string, ClassItem[]>()

    availableClassesForAdd.forEach((item) => {
      const typeName = classTypeNameMap.get(item.classTypeId) ?? 'Sem tipo'
      const current = groupedMap.get(typeName) ?? []
      groupedMap.set(typeName, [...current, item])
    })

    return Array.from(groupedMap.entries()).map(([typeName, items]) => ({ typeName, items }))
  }, [availableClassesForAdd, classTypeNameMap])

  const handleSearch = (value: string) => {
    setPage(1)
    setSearchTerm(value.trim())
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const buildWhatsAppUri = (phone?: string | null) => {
    const digits = (phone ?? '').replace(/\D/g, '')

    if (!digits) {
      return null
    }

    const withCountryCode = digits.startsWith('55') ? digits : `55${digits}`
    return `https://wa.me/${withCountryCode}`
  }

  const buildAddressLabel = (student: StudentItem) => {
    const firstLine = [student.address, student.numberAddress]
      .filter(Boolean)
      .join(', ')
    const secondLine = [student.complementString, student.neighborhood]
      .filter(Boolean)
      .join(' - ')
    const thirdLine = [student.city, student.state, student.zipCode]
      .filter(Boolean)
      .join(' - ')

    return [firstLine, secondLine, thirdLine].filter(Boolean).join(' | ')
  }

  const buildGoogleMapsUri = (student: StudentItem) => {
    const address = buildAddressLabel(student)

    if (!address) {
      return null
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }

  const handleConfirmRemoveFromClass = async () => {
    if (!removeClassTarget || !classesPreviewStudent) {
      return
    }

    try {
      setRemovingStudent(true)

      await removeStudentFromClass({
        classId: removeClassTarget.id,
        studentId: classesPreviewStudent.id,
      })

      const refreshedDetails = await studentDetailsQuery.refetch()

      queryClient.setQueryData<Record<string, { activeCount: number; closedCount: number }>>(
        enrollmentQueryKey,
        (previous) => {
          if (!previous || !classesPreviewStudent) {
            return previous
          }

          return {
            ...previous,
            [classesPreviewStudent.id]: {
              activeCount: refreshedDetails.data?.subscriptions?.length ?? 0,
              closedCount: refreshedDetails.data?.previousSubscriptions?.length ?? 0,
            },
          }
        },
      )

      message.success('Aluno removido da turma com sucesso.')
      setRemoveClassTarget(null)
    } catch {
      message.error('Não foi possível remover o aluno da turma.')
    } finally {
      setRemovingStudent(false)
    }
  }

  const handleRequestAddToClass = () => {
    const selectedClasses = availableClassesForAdd.filter((item) => selectedAvailableClassIds.includes(item.id))

    if (selectedClasses.length === 0) {
      message.warning('Selecione ao menos uma turma para continuar.')
      return
    }

    setAddClassConfirmTargets(selectedClasses)
  }

  const handleConfirmAddToClass = async () => {
    if (addClassConfirmTargets.length === 0 || !classesPreviewStudent) {
      return
    }

    try {
      setAddingStudent(true)

      await Promise.all(
        addClassConfirmTargets.map((classItem) =>
          addStudentToClass({
            classId: classItem.id,
            studentId: classesPreviewStudent.id,
          }),
        ),
      )

      const refreshedDetails = await studentDetailsQuery.refetch()

      queryClient.setQueryData<Record<string, { activeCount: number; closedCount: number }>>(
        enrollmentQueryKey,
        (previous) => {
          if (!previous || !classesPreviewStudent) {
            return previous
          }

          return {
            ...previous,
            [classesPreviewStudent.id]: {
              activeCount: refreshedDetails.data?.subscriptions?.length ?? 0,
              closedCount: refreshedDetails.data?.previousSubscriptions?.length ?? 0,
            },
          }
        },
      )

      message.success(
        addClassConfirmTargets.length === 1
          ? 'Aluno adicionado na turma com sucesso.'
          : `Aluno adicionado em ${addClassConfirmTargets.length} turmas com sucesso.`,
      )
      setAddClassConfirmTargets([])
      setAddClassModalOpen(false)
      setSelectedAvailableClassIds([])
    } catch {
      message.error('Não foi possível adicionar o aluno na turma.')
    } finally {
      setAddingStudent(false)
    }
  }

  const handleToggleAvailableClassSelection = (classIdToToggle: string) => {
    setSelectedAvailableClassIds((previous) => {
      if (previous.includes(classIdToToggle)) {
        return previous.filter((item) => item !== classIdToToggle)
      }

      return [...previous, classIdToToggle]
    })
  }

  useEffect(() => {
    async function geocodeAddress() {
      if (!addressPreviewStudent) {
        setMapCoordinates(null)
        setGeocodeError(null)
        setGeocodeLoading(false)
        return
      }

      const addressLabel = buildAddressLabel(addressPreviewStudent)

      if (!addressLabel) {
        setMapCoordinates(null)
        setGeocodeError('Endereço indisponível para localização no mapa.')
        return
      }

      try {
        setGeocodeLoading(true)
        setGeocodeError(null)

        const query = encodeURIComponent(addressLabel)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`,
          {
            headers: {
              Accept: 'application/json',
            },
          },
        )

        if (!response.ok) {
          throw new Error('Não foi possível geocodificar o endereço.')
        }

        const results = (await response.json()) as Array<{ lat: string; lon: string }>

        if (!results.length) {
          setMapCoordinates(null)
          setGeocodeError('Não foi possível localizar este endereço no mapa.')
          return
        }

        const latitude = Number(results[0].lat)
        const longitude = Number(results[0].lon)

        setMapCoordinates([longitude, latitude])
      } catch {
        setMapCoordinates(null)
        setGeocodeError('Falha ao carregar o mapa para este endereço.')
      } finally {
        setGeocodeLoading(false)
      }
    }

    geocodeAddress()
  }, [addressPreviewStudent])

  useEffect(() => {
    if (!addressPreviewStudent || !mapCoordinates || !mapContainerRef.current) {
      return
    }

    const coordinate = new maptalks.Coordinate(mapCoordinates[0], mapCoordinates[1])

    if (!mapRef.current) {
      const map = new maptalks.Map(mapContainerRef.current, {
        center: coordinate,
        zoom: 16,
        attribution: false,
        baseLayer: new maptalks.TileLayer('base', {
          urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          subdomains: ['a', 'b', 'c'],
        }),
      })

      const markerLayer = new maptalks.VectorLayer('marker').addTo(map)

      new maptalks.Marker(coordinate, {
        symbol: {
          markerType: 'ellipse',
          markerFill: '#3B67E0',
          markerLineColor: '#FFFFFF',
          markerLineWidth: 2,
          markerWidth: 16,
          markerHeight: 16,
        },
      }).addTo(markerLayer)

      mapRef.current = map
      return
    }

    mapRef.current.setCenter(coordinate)
    mapRef.current.setZoom(16)
  }, [addressPreviewStudent, mapCoordinates])

  useEffect(() => {
    if (!addressPreviewStudent && mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }
  }, [addressPreviewStudent])

  useEffect(() => {
    setShowClosedClasses(false)
  }, [classesPreviewStudent?.id])

  if ((studentsQuery.isLoading && !studentsQuery.data) || (studentsEnrollmentQuery.isLoading && allStudents.length > 0)) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Space>
    )
  }

  if (studentsQuery.isError || studentsEnrollmentQuery.isError) {
    return <Alert type="error" showIcon message="Não foi possível carregar os alunos do sistema." />
  }

  const students = studentsQuery.data ?? []
  const enrollmentMap = studentsEnrollmentQuery.data ?? {}
  const searchedStudents = students.filter((student) => {
    if (!normalizedSearch) {
      return true
    }

    const term = normalizedSearch.toLowerCase()

    return [student.name, student.email, student.cpf]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term))
  })
  const activeStudentsCount = searchedStudents.filter((student) => (enrollmentMap[student.id]?.activeCount ?? 0) > 0).length
  const closedStudentsCount = searchedStudents.filter((student) => (enrollmentMap[student.id]?.closedCount ?? 0) > 0).length
  const studentsWithoutActiveClassCount = searchedStudents.filter((student) => {
    const activeCount = enrollmentMap[student.id]?.activeCount ?? 0
    const closedCount = enrollmentMap[student.id]?.closedCount ?? 0

    return activeCount === 0 && closedCount === 0
  }).length
  const filteredStudents = searchedStudents.filter((student) => {
    const hasActiveClass = (enrollmentMap[student.id]?.activeCount ?? 0) > 0
    const hasClosedClass = (enrollmentMap[student.id]?.closedCount ?? 0) > 0

    if (enrollmentStatusFilter === 'active') {
      return hasActiveClass
    }

    if (enrollmentStatusFilter === 'closed') {
      return hasClosedClass
    }

    if (enrollmentStatusFilter === 'without-active') {
      return !hasActiveClass && !hasClosedClass
    }

    return true
  })
  const totalFilteredStudents = filteredStudents.length
  const paginatedStudents = filteredStudents.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const isMobile = !screens.md

  const getStudentClassesCount = (student: StudentItem) => {
    const enrollment = enrollmentMap[student.id]

    if (enrollment) {
      return enrollment.activeCount + enrollment.closedCount
    }

    return student.classes?.length ?? 0
  }

  const renderStudentClassesShortcut = (student: StudentItem) => {
    const classesCount = getStudentClassesCount(student)

    if (classesCount === 0) {
      return <Typography.Text type="secondary">-</Typography.Text>
    }

    return (
      <Button
        type="link"
        style={{ padding: 0, height: 'auto' }}
        onClick={() => setClassesPreviewStudent(student)}
        icon={<ReadOutlined />}
      >
        <Badge
          count={classesCount}
          overflowCount={999999}
          style={{ backgroundColor: 'var(--ant-color-primary)' }}
        />
      </Button>
    )
  }

  const renderStudentRegistrationTag = (student: StudentItem) => {
    const isComplete = student.isComplete === true

    return (
      <Tag color={isComplete ? 'success' : 'warning'} icon={<SafetyOutlined />}>
        {isComplete ? 'Completo' : 'Incompleto'}
      </Tag>
    )
  }

  const getStudentMenuItems = (student: StudentItem) => {
    return [
      {
        key: 'academic-life',
        icon: <BookOutlined />,
        label: 'Vida acadêmica',
      },
      {
        key: 'classes',
        icon: <ReadOutlined />,
        label: 'Turmas do aluno',
      },
      student.email
        ? {
            key: 'email',
            icon: <MailOutlined />,
            label: <a href={`mailto:${student.email}`}>Enviar e-mail</a>,
          }
        : null,
      buildWhatsAppUri(student.phone)
        ? {
            key: 'whatsapp',
            icon: <WhatsAppOutlined />,
            label: <a href={buildWhatsAppUri(student.phone) ?? undefined} target="_blank" rel="noreferrer">Chamar no WhatsApp</a>,
          }
        : null,
      buildGoogleMapsUri(student)
        ? {
            key: 'map',
            icon: <EnvironmentOutlined />,
            label: 'Ver endereço',
          }
        : null,
    ].filter(Boolean) as MenuProps['items']
  }

  const handleStudentMenuClick = (key: string, student: StudentItem) => {
    if (key === 'academic-life') {
      navigate(`/students/${student.id}/academic-life`)
    }

    if (key === 'map') {
      setAddressPreviewStudent(student)
    }

    if (key === 'classes') {
      setClassesPreviewStudent(student)
    }
  }

  const desktopColumns = [
    {
      title: 'Aluno',
      key: 'student',
      render: (_: unknown, student: StudentItem) => (
        <Space size={10} align="center">
          <Avatar size={42} src={student.avatar ?? undefined} icon={<UserOutlined />} />
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{student.name}</Typography.Text>
            <Typography.Text type="secondary">CPF: {formatCpf(student.cpf)}</Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Idade',
      dataIndex: 'age',
      key: 'age',
      width: 90,
      render: (age: number | null | undefined) => age ?? '-',
    },
    {
      title: 'E-mail',
      key: 'email',
      render: (_: unknown, student: StudentItem) => (
        <Typography.Text type="secondary">
          <MailOutlined style={{ marginRight: 6 }} />
          {student.email || 'Sem e-mail'}
        </Typography.Text>
      ),
    },
    {
      title: 'WhatsApp',
      key: 'whatsapp',
      width: 180,
      render: (_: unknown, student: StudentItem) => {
        const whatsAppUri = buildWhatsAppUri(student.phone)

        if (!whatsAppUri) {
          return <Typography.Text type="secondary">-</Typography.Text>
        }

        return (
          <a href={whatsAppUri} target="_blank" rel="noreferrer">
            <Space size={6}>
              <WhatsAppOutlined style={{ color: '#52c41a' }} />
              <Typography.Text>{student.phone}</Typography.Text>
            </Space>
          </a>
        )
      },
    },
    {
      title: 'Turmas',
      key: 'classes',
      width: 120,
      render: (_: unknown, student: StudentItem) => renderStudentClassesShortcut(student),
    },
    {
      title: 'Cadastro',
      key: 'registration-status',
      width: 130,
      render: (_: unknown, student: StudentItem) => renderStudentRegistrationTag(student),
    },
    {
      title: '',
      key: 'actions',
      width: 70,
      align: 'right' as const,
      render: (_: unknown, student: StudentItem) => (
        <Tooltip title="Ações do aluno">
          <Dropdown
            trigger={['click']}
            menu={{
              items: getStudentMenuItems(student),
              onClick: ({ key }) => handleStudentMenuClick(String(key), student),
            }}
          >
            <Button type="text" shape="circle" icon={<MoreOutlined />} />
          </Dropdown>
        </Tooltip>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb items={[{ title: <Link to="/students">Alunos</Link> }]} />

      <Card>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space size={8} align="center">
            <TeamOutlined style={{ fontSize: 22 }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Alunos
            </Typography.Title>
          </Space>
          <Typography.Text type="secondary">Listagem paginada de todos os alunos do sistema.</Typography.Text>
          <Typography.Text strong>Total de alunos: {students.length}</Typography.Text>
          <Button icon={<BarChartOutlined />} onClick={() => navigate('/dashboard')} style={{ width: 'fit-content' }}>
            Dashboard de alunos
          </Button>
        </Space>
      </Card>

      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input.Search
            value={searchInput}
            allowClear
            placeholder="Buscar aluno por nome"
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={handleSearch}
          />

          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text strong>Situação em turmas</Typography.Text>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={enrollmentStatusFilter}
              onChange={(event) => {
                setEnrollmentStatusFilter(event.target.value)
                setPage(1)
              }}
              options={[
                {
                  value: 'all',
                  label: (
                    <Space size={6}>
                      Todos
                      <Badge count={searchedStudents.length} showZero overflowCount={999999} style={{ backgroundColor: '#8C8C8C' }} />
                    </Space>
                  ),
                },
                {
                  value: 'active',
                  label: (
                    <Space size={6}>
                      Em andamento
                      <Badge count={activeStudentsCount} showZero overflowCount={999999} style={{ backgroundColor: '#8C8C8C' }} />
                    </Space>
                  ),
                },
                {
                  value: 'closed',
                  label: (
                    <Space size={6}>
                      Encerradas
                      <Badge count={closedStudentsCount} showZero overflowCount={999999} style={{ backgroundColor: '#8C8C8C' }} />
                    </Space>
                  ),
                },
                {
                  value: 'without-active',
                  label: (
                    <Space size={6}>
                      Sem turma
                      <Badge
                        count={studentsWithoutActiveClassCount}
                        showZero
                        overflowCount={999999}
                        style={{ backgroundColor: '#8C8C8C' }}
                      />
                    </Space>
                  ),
                },
              ]}
            />
          </Space>
        </Space>
      </Card>

      <div ref={listTopRef} />

      {totalFilteredStudents === 0 ? (
        <Empty description="Nenhum aluno encontrado para este filtro." />
      ) : (
        <Card>
          {isMobile ? (
            <List
              itemLayout="horizontal"
              dataSource={paginatedStudents}
              renderItem={(student) => {
                const whatsAppUri = buildWhatsAppUri(student.phone)

                return (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar size={48} src={student.avatar ?? undefined} icon={<UserOutlined />} />}
                      title={
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Typography.Text strong>{student.name}</Typography.Text>
                          <Tooltip title="Ações do aluno">
                            <Dropdown
                              trigger={['click']}
                              menu={{
                                items: getStudentMenuItems(student),
                                onClick: ({ key }) => handleStudentMenuClick(String(key), student),
                              }}
                            >
                              <Button type="text" shape="circle" icon={<MoreOutlined />} />
                            </Dropdown>
                          </Tooltip>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={2}>
                          <Typography.Text type="secondary">Idade: {student.age ?? '-'}</Typography.Text>
                          <Typography.Text type="secondary">
                            <MailOutlined style={{ marginRight: 6 }} />
                            {student.email || 'Sem e-mail'}
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            <WhatsAppOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                            {student.phone && whatsAppUri ? (
                              <a href={whatsAppUri} target="_blank" rel="noreferrer">
                                {student.phone}
                              </a>
                            ) : (
                              '-'
                            )}
                          </Typography.Text>
                          {renderStudentRegistrationTag(student)}
                          <Space size={6}>
                            {renderStudentClassesShortcut(student)}
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )
              }}
            />
          ) : (
            <Table
              rowKey="id"
              dataSource={paginatedStudents}
              columns={desktopColumns}
              pagination={false}
            />
          )}

          <Pagination
            style={{ marginTop: 16, textAlign: 'right' }}
            current={page}
            total={totalFilteredStudents}
            pageSize={PER_PAGE}
            showSizeChanger={false}
            onChange={handlePageChange}
          />
        </Card>
      )}

      <Modal
        open={Boolean(addressPreviewStudent)}
        title="Endereço do aluno"
        onCancel={() => setAddressPreviewStudent(null)}
        footer={null}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Card size="small">
            <Typography.Text>{addressPreviewStudent ? buildAddressLabel(addressPreviewStudent) : '-'}</Typography.Text>
          </Card>

          <Card size="small" styles={{ body: { padding: 10 } }}>
            {geocodeLoading ? (
              <Space style={{ width: '100%', justifyContent: 'center', minHeight: 220 }}>
                <Spin />
              </Space>
            ) : geocodeError ? (
              <Alert type="warning" showIcon message={geocodeError} />
            ) : (
              <div
                ref={mapContainerRef}
                style={{
                  width: '100%',
                  height: 260,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              />
            )}
          </Card>

          <Space>
            <Button onClick={() => setAddressPreviewStudent(null)}>Fechar</Button>
            <Button
              type="primary"
              icon={<EnvironmentOutlined />}
              href={addressPreviewStudent ? buildGoogleMapsUri(addressPreviewStudent) ?? undefined : undefined}
              target="_blank"
              rel="noreferrer"
              disabled={!addressPreviewStudent || !buildGoogleMapsUri(addressPreviewStudent)}
            >
              Ver no mapa
            </Button>
          </Space>
        </Space>
      </Modal>

      <Modal
        open={Boolean(classesPreviewStudent)}
        title={
          <Space size={8} align="center">
            <ReadOutlined style={{ fontSize: 22 }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Turmas do aluno
            </Typography.Title>
          </Space>
        }
        onCancel={() => {
          setClassesPreviewStudent(null)
          setAddClassModalOpen(false)
          setSelectedAvailableClassIds([])
          setAddClassConfirmTargets([])
          setShowClosedClasses(false)
        }}
        footer={null}
        width={700}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Card size="small">
            <Space size={10} align="center">
              <Avatar size={42} src={classesPreviewStudent?.avatar ?? undefined} icon={<UserOutlined />} />
              <Typography.Title level={5} style={{ margin: 0, fontSize: 16 }}>
                {classesPreviewStudent?.name}
              </Typography.Title>
            </Space>
          </Card>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setAddClassModalOpen(true)
                setSelectedAvailableClassIds([])
              }}
            >
              Adicionar em turma
            </Button>
          </Space>

          {studentDetailsQuery.isLoading ? (
            <Space style={{ width: '100%', justifyContent: 'center', minHeight: 180 }}>
              <Spin />
            </Space>
          ) : studentDetailsQuery.isError ? (
            <Alert type="error" showIcon message="Não foi possível carregar as turmas do aluno." />
          ) : activeClasses.length === 0 && closedClasses.length === 0 ? (
            <Empty description="Nenhuma turma relacionada para este aluno." />
          ) : (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space size={8} align="center">
                <Typography.Text strong>Turmas em andamento</Typography.Text>
                <Badge count={activeClasses.length} overflowCount={999999} style={{ backgroundColor: '#1677FF' }} />
              </Space>
              {activeClasses.length === 0 ? (
                <Typography.Text type="secondary">Nenhuma turma em andamento.</Typography.Text>
              ) : (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {activeClasses.map((classItem) => (
                    <ClassCard
                      key={classItem.id}
                      data={classItem}
                      classTypeName={classTypeNameMap.get(classItem.classTypeId)}
                      compact
                      showStatusTag={false}
                      headerExtra={
                        <Dropdown
                          trigger={['click']}
                          menu={{
                            items: [
                              {
                                key: 'remove-student',
                                icon: <DeleteOutlined />,
                                label: 'Remover aluno da turma',
                                danger: true,
                              },
                            ],
                            onClick: () => setRemoveClassTarget(classItem),
                          }}
                        >
                          <Button type="text" shape="circle" icon={<MoreOutlined />} />
                        </Dropdown>
                      }
                    />
                  ))}
                </Space>
              )}

              <Space size={8} align="center">
                <Typography.Text strong>Turmas encerradas</Typography.Text>
                <Badge count={closedClasses.length} overflowCount={999999} />
                {closedClasses.length > 0 ? (
                  <Button
                    type="link"
                    style={{ paddingInline: 0 }}
                    onClick={() => setShowClosedClasses((previous) => !previous)}
                  >
                    {showClosedClasses ? 'Ocultar' : 'Mostrar'}
                  </Button>
                ) : null}
              </Space>
              {closedClasses.length === 0 ? (
                <Typography.Text type="secondary">Nenhuma turma encerrada.</Typography.Text>
              ) : showClosedClasses ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {closedClasses.map((classItem) => (
                    <ClassCard
                      key={classItem.id}
                      data={classItem}
                      classTypeName={classTypeNameMap.get(classItem.classTypeId)}
                      compact
                      showStatusTag={false}
                      showRemainingDays={false}
                    />
                  ))}
                </Space>
              ) : null}
            </Space>
          )}
        </Space>
      </Modal>

      <AppDialog
        open={Boolean(removeClassTarget)}
        type="danger"
        title="Remover aluno da turma"
        message={
          removeClassTarget
            ? `Tem certeza que deseja remover ${classesPreviewStudent?.name ?? 'este aluno'} da turma ${removeClassTarget.name}?`
            : 'Tem certeza que deseja remover este aluno da turma?'
        }
        confirmText={removingStudent ? 'Removendo...' : 'Remover'}
        cancelText="Cancelar"
        onCancel={() => {
          if (!removingStudent) {
            setRemoveClassTarget(null)
          }
        }}
        onConfirm={handleConfirmRemoveFromClass}
      />

      <Modal
        open={addClassModalOpen}
        title={
          <Space size={8} align="center">
            <ReadOutlined style={{ fontSize: 22 }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Adicionar em turma
            </Typography.Title>
          </Space>
        }
        onCancel={() => {
          setAddClassModalOpen(false)
          setSelectedAvailableClassIds([])
        }}
        onOk={handleRequestAddToClass}
        okText="Confirmar"
        cancelText="Cancelar"
        okButtonProps={{
          disabled: selectedAvailableClassIds.length === 0,
          icon: <CheckCircleFilled />,
        }}
        width={760}
      >
        {studentDetailsQuery.isLoading ? (
          <Space style={{ width: '100%', justifyContent: 'center', minHeight: 180 }}>
            <Spin />
          </Space>
        ) : studentDetailsQuery.isError ? (
          <Alert type="error" showIcon message="Não foi possível carregar as turmas disponíveis." />
        ) : availableClassesForAdd.length === 0 ? (
          <Empty description="Nenhuma turma em andamento disponível para este aluno." />
        ) : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Text strong>
              {selectedAvailableClassIds.length} turma(s) selecionada(s)
            </Typography.Text>

            {groupedAvailableClassesForAdd.map((group) => (
              <Space key={group.typeName} direction="vertical" size={10} style={{ width: '100%' }}>
                <Typography.Text strong>{group.typeName}</Typography.Text>
                <Row gutter={[10, 10]}>
                  {group.items.map((classItem) => {
                    const selected = selectedAvailableClassIds.includes(classItem.id)

                    return (
                      <Col key={classItem.id} xs={24} md={12}>
                        <div
                          style={{
                            position: 'relative',
                            border: `1px solid ${selected ? '#1677FF' : '#E8E8E8'}`,
                            borderRadius: 10,
                            padding: 1,
                          }}
                        >
                          {selected ? (
                            <CheckCircleFilled
                              style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                color: 'var(--ant-color-primary)',
                                zIndex: 1,
                                fontSize: 18,
                                background: '#fff',
                                borderRadius: '50%',
                              }}
                            />
                          ) : null}
                          <ClassCard
                            compact
                            data={classItem}
                            classTypeName={classTypeNameMap.get(classItem.classTypeId)}
                            showStatusTag={false}
                            showRemainingDays={false}
                            onClick={() => handleToggleAvailableClassSelection(classItem.id)}
                          />
                        </div>
                      </Col>
                    )
                  })}
                </Row>
              </Space>
            ))}
          </Space>
        )}
      </Modal>

      <AppDialog
        open={addClassConfirmTargets.length > 0}
        type="warning"
        title={
          addClassConfirmTargets.length > 1 ? 'Confirmar adição em turmas' : 'Confirmar adição em turma'
        }
        message={
          addClassConfirmTargets.length > 1
            ? `Tem certeza que deseja adicionar ${classesPreviewStudent?.name ?? 'este aluno'} em ${addClassConfirmTargets.length} turmas selecionadas?`
            : addClassConfirmTargets.length === 1
              ? `Tem certeza que deseja adicionar ${classesPreviewStudent?.name ?? 'este aluno'} na turma ${addClassConfirmTargets[0].name}?`
              : 'Tem certeza que deseja adicionar este aluno na turma selecionada?'
        }
        confirmText={addingStudent ? 'Adicionando...' : 'Adicionar'}
        cancelText="Cancelar"
        onCancel={() => {
          if (!addingStudent) {
            setAddClassConfirmTargets([])
          }
        }}
        onConfirm={handleConfirmAddToClass}
      />
    </Space>
  )
}
