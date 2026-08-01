import {
  CalendarOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  MoreOutlined,
  PlusOutlined,
  ReadOutlined,
  SearchOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Dropdown,
  Empty,
  Grid,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import type { TableColumnsType } from 'antd'
import ptBR from 'antd/es/date-picker/locale/pt_BR'
import type { Dayjs } from 'dayjs'
import { useDeferredValue, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_PERMISSIONS } from '../../access/admin-access'
import { useAdminAccess } from '../../access/use-admin-access'
import ClassTagCatalogModal from '../../components/classes/ClassTagCatalogModal'
import ClassTagsModal from '../../components/classes/ClassTagsModal'
import { getCampuses } from '../../services/campus/campus.service'
import {
  createClassTag,
  deleteClassTag,
  getClassesPage,
  getClassTags,
  replaceClassTags,
  updateClassTag,
} from '../../services/class/class.service'
import { getClassTypes } from '../../services/class/class-type.service'
import type { ClassItem, ClassesListResponse, ClassTag } from '../../types/class'
import { getPeriodStatus } from '../../utils/date'

const DEFAULT_PAGE_SIZE = 10

type DateRange = [Dayjs, Dayjs] | null

function getStatusPresentation(classData: ClassItem) {
  const status = getPeriodStatus(classData.initDate, classData.finishDate)

  if (status === 'not_started') {
    return { label: 'Agendada', color: 'gold' }
  }

  if (status === 'closed') {
    return { label: 'Encerrada', color: 'default' }
  }

  return { label: 'Em andamento', color: 'blue' }
}

function renderClassTags(tags: ClassTag[] = [], limit = 2) {
  if (!tags.length) {
    return <Typography.Text type="secondary">Sem tags</Typography.Text>
  }

  return (
    <Space size={[4, 4]} wrap>
      {tags.slice(0, limit).map((tag) => (
        <Tag key={tag.id} color="geekblue" className="class-list-tag">
          {tag.description}
        </Tag>
      ))}
      {tags.length > limit ? <Tag>+{tags.length - limit}</Tag> : null}
    </Space>
  )
}

export default function ClassesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const screens = Grid.useBreakpoint()
  const { admin, hasPermission } = useAdminAccess()
  const canManageClasses = hasPermission(ADMIN_PERMISSIONS.gerenciarTurmas)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCampusId, setSelectedCampusId] = useState<string>()
  const [selectedTypeId, setSelectedTypeId] = useState<string>()
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange>(null)
  const [tagsClass, setTagsClass] = useState<ClassItem | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const deferredSearch = useDeferredValue(searchTerm.trim())

  const classTypesQuery = useQuery({
    queryKey: ['class-types'],
    queryFn: getClassTypes,
  })
  const campusesQuery = useQuery({
    queryKey: ['campuses'],
    queryFn: getCampuses,
  })
  const tagsQuery = useQuery({
    queryKey: ['class-tags'],
    queryFn: getClassTags,
  })

  const classesQuery = useQuery({
    queryKey: [
      'classes',
      'list',
      {
        page,
        pageSize,
        search: deferredSearch,
        campusId: selectedCampusId,
        classTypeId: selectedTypeId,
        tagIds: selectedTagIds,
        initDate: dateRange?.[0].format('DD/MM/YYYY'),
        finishDate: dateRange?.[1].format('DD/MM/YYYY'),
      },
    ],
    queryFn: () =>
      getClassesPage({
        page,
        perPage: pageSize,
        search: deferredSearch || undefined,
        campusId: selectedCampusId,
        classTypeId: selectedTypeId,
        tagIds: selectedTagIds,
        initDate: dateRange?.[0].format('DD/MM/YYYY'),
        finishDate: dateRange?.[1].format('DD/MM/YYYY'),
      }),
    placeholderData: (previousData) => previousData,
  })

  const classTypes = classTypesQuery.data ?? []
  const tags = tagsQuery.data ?? []
  const classes = classesQuery.data?.data ?? []
  const total = classesQuery.data?.total ?? 0

  const campuses = campusesQuery.data ?? []
  const availableCampuses = admin?.campusIds?.length
    ? campuses.filter((campus) => admin.campusIds.includes(campus.id))
    : campuses

  const setFirstPage = () => setPage(1)

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCampusId(undefined)
    setSelectedTypeId(undefined)
    setSelectedTagIds([])
    setDateRange(null)
    setFirstPage()
  }

  const hasActiveFilters = Boolean(
    searchTerm.trim() || selectedCampusId || selectedTypeId || selectedTagIds.length || dateRange,
  )

  const updateClassInCache = (updatedClass: ClassItem) => {
    queryClient.setQueriesData<ClassesListResponse>({ queryKey: ['classes', 'list'] }, (current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        data: current.data.map((item) => (item.id === updatedClass.id ? updatedClass : item)),
      }
    })
    queryClient.setQueryData(['class', updatedClass.id], updatedClass)
  }

  const handleCreateTag = async (description: string) => {
    const createdTag = await createClassTag({ description })
    queryClient.setQueryData<ClassTag[]>(['class-tags'], (current = []) =>
      [...current, createdTag].sort((a, b) => a.description.localeCompare(b.description, 'pt-BR')),
    )
    await queryClient.invalidateQueries({ queryKey: ['class-tags'] })
    return createdTag
  }

  const handleRenameTag = async (tagId: string, description: string) => {
    const updatedTag = await updateClassTag(tagId, { description })
    queryClient.setQueryData<ClassTag[]>(['class-tags'], (current = []) =>
      current
        .map((tag) => (tag.id === tagId ? updatedTag : tag))
        .sort((a, b) => a.description.localeCompare(b.description, 'pt-BR')),
    )
    queryClient.setQueriesData<ClassesListResponse>({ queryKey: ['classes', 'list'] }, (current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        data: current.data.map((item) => ({
          ...item,
          tags: (item.tags ?? []).map((tag) => (tag.id === tagId ? updatedTag : tag)),
        })),
      }
    })
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['class-tags'] }),
      queryClient.invalidateQueries({ queryKey: ['classes', 'list'] }),
    ])
  }

  const handleDeleteTag = async (tagId: string) => {
    await deleteClassTag(tagId)
    queryClient.setQueryData<ClassTag[]>(['class-tags'], (current = []) => current.filter((tag) => tag.id !== tagId))
    queryClient.setQueriesData<ClassesListResponse>({ queryKey: ['classes', 'list'] }, (current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        data: current.data.map((item) => ({
          ...item,
          tags: (item.tags ?? []).filter((tag) => tag.id !== tagId),
        })),
      }
    })
    setSelectedTagIds((current) => current.filter((id) => id !== tagId))
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['class-tags'] }),
      queryClient.invalidateQueries({ queryKey: ['classes', 'list'] }),
    ])
  }

  const handleSaveClassTags = async (tagIds: string[]) => {
    if (!tagsClass) {
      return
    }

    const updatedClass = await replaceClassTags(tagsClass.id, tagIds)
    updateClassInCache(updatedClass)
    setTagsClass(null)
    message.success('Tags da turma atualizadas com sucesso.')
    await queryClient.invalidateQueries({ queryKey: ['classes', 'list'] })
  }

  const columns: TableColumnsType<ClassItem> = [
    {
      title: 'Turma',
      key: 'name',
      width: 250,
      fixed: screens.md ? 'left' : undefined,
      render: (_, item) => {
        const status = getStatusPresentation(item)
        const typeName = item.classType?.name ?? classTypes.find((type) => type.id === item.classTypeId)?.name ?? 'Sem tipo'

        return (
          <Space direction="vertical" size={screens.md ? 2 : 8} className="class-name-cell">
            <Typography.Text strong>{item.name}</Typography.Text>
            <Typography.Text type="secondary" className="class-list-secondary">
              {typeName}
            </Typography.Text>

            {!screens.md ? (
              <Space direction="vertical" size={6} className="class-mobile-details">
                <Space size={[6, 4]} wrap>
                  <Tag color={status.color}>{status.label}</Tag>
                  <Typography.Text type="secondary">{item.campus?.name ?? 'Campus não informado'}</Typography.Text>
                </Space>
                <Typography.Text type="secondary">
                  <CalendarOutlined /> {item.initDate} — {item.finishDate}
                </Typography.Text>
                {renderClassTags(item.tags, 2)}
              </Space>
            ) : null}
          </Space>
        )
      },
    },
    {
      title: 'Campus',
      dataIndex: ['campus', 'name'],
      key: 'campus',
      width: 180,
      responsive: ['md'],
      render: (campusName?: string) => campusName || <Typography.Text type="secondary">Não informado</Typography.Text>,
    },
    {
      title: 'Tipo',
      key: 'classType',
      width: 160,
      responsive: ['lg'],
      render: (_, item) =>
        item.classType?.name ??
        classTypes.find((type) => type.id === item.classTypeId)?.name ?? <Typography.Text type="secondary">Sem tipo</Typography.Text>,
    },
    {
      title: 'Período',
      key: 'period',
      width: 170,
      responsive: ['md'],
      render: (_, item) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{item.initDate}</Typography.Text>
          <Typography.Text type="secondary">até {item.finishDate}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 135,
      responsive: ['md'],
      render: (_, item) => {
        const status = getStatusPresentation(item)
        return <Tag color={status.color}>{status.label}</Tag>
      },
    },
    {
      title: 'Tags',
      key: 'tags',
      width: 230,
      responsive: ['lg'],
      render: (_, item) => renderClassTags(item.tags),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 104,
      fixed: screens.md ? 'right' : undefined,
      align: 'right',
      render: (_, item) => (
        <Space size={4} onClick={(event) => event.stopPropagation()}>
          <Tooltip title="Abrir turma">
            <Button
              type="text"
              aria-label={`Abrir ${item.name}`}
              icon={<EyeOutlined />}
              onClick={() => navigate(`/class/${item.id}`)}
            />
          </Tooltip>
          {canManageClasses ? (
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'edit', icon: <EditOutlined />, label: 'Editar turma' },
                  { key: 'tags', icon: <TagsOutlined />, label: 'Alterar tags' },
                ],
                onClick: ({ key }) => {
                  if (key === 'edit') {
                    navigate(`/class/${item.id}/edit`)
                  } else {
                    setTagsClass(item)
                  }
                },
              }}
            >
              <Button type="text" aria-label={`Mais ações para ${item.name}`} icon={<MoreOutlined />} />
            </Dropdown>
          ) : null}
        </Space>
      ),
    },
  ]

  const auxiliaryError = classTypesQuery.error ?? campusesQuery.error ?? tagsQuery.error

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }} className="classes-page">
      <div className="classes-page-heading">
        <Space direction="vertical" size={4}>
          <Space size={9} align="center">
            <ReadOutlined className="classes-page-icon" />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Turmas
            </Typography.Title>
          </Space>
          <Typography.Text type="secondary">Encontre, organize e acompanhe todas as turmas em um só lugar.</Typography.Text>
        </Space>

        {canManageClasses ? (
          <Space size={8} wrap>
            <Button icon={<TagsOutlined />} onClick={() => setCatalogOpen(true)}>
              Gerenciar tags
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/class/new')}>
              Nova turma
            </Button>
          </Space>
        ) : null}
      </div>

      <Card className="class-filters-card" styles={{ body: { padding: 16 } }}>
        <div className="class-filters-heading">
          <Space size={7}>
            <FilterOutlined />
            <Typography.Text strong>Filtros</Typography.Text>
          </Space>
          {hasActiveFilters ? (
            <Button type="link" size="small" onClick={clearFilters}>
              Limpar filtros
            </Button>
          ) : null}
        </div>

        <div className="class-filters-grid">
          <label className="class-filter-field class-filter-search">
            <Typography.Text>Buscar turma</Typography.Text>
            <Input
              allowClear
              value={searchTerm}
              prefix={<SearchOutlined />}
              placeholder="Digite o nome da turma"
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setFirstPage()
              }}
            />
          </label>

          <label className="class-filter-field">
            <Typography.Text>Campus</Typography.Text>
            <Select
              allowClear
              value={selectedCampusId}
              loading={campusesQuery.isLoading}
              placeholder="Todos os campus"
              showSearch
              optionFilterProp="label"
              onChange={(value) => {
                setSelectedCampusId(value)
                setFirstPage()
              }}
              options={availableCampuses.map((campus) => ({ value: campus.id, label: campus.name }))}
            />
          </label>

          <label className="class-filter-field">
            <Typography.Text>Tipo</Typography.Text>
            <Select
              allowClear
              value={selectedTypeId}
              loading={classTypesQuery.isLoading}
              placeholder="Todos os tipos"
              showSearch
              optionFilterProp="label"
              onChange={(value) => {
                setSelectedTypeId(value)
                setFirstPage()
              }}
              options={classTypes.map((type) => ({ value: type.id, label: type.name }))}
            />
          </label>

          <label className="class-filter-field class-filter-tags">
            <Typography.Text>Tags</Typography.Text>
            <Select
              mode="multiple"
              allowClear
              value={selectedTagIds}
              loading={tagsQuery.isLoading}
              placeholder="Todas as tags"
              showSearch
              optionFilterProp="label"
              maxTagCount="responsive"
              onChange={(value) => {
                setSelectedTagIds(value)
                setFirstPage()
              }}
              options={tags.map((tag) => ({ value: tag.id, label: tag.description }))}
            />
          </label>

          <label className="class-filter-field class-filter-period">
            <Typography.Text>Período</Typography.Text>
            <DatePicker.RangePicker
              allowClear
              value={dateRange}
              format="DD/MM/YYYY"
              locale={ptBR}
              placeholder={['Início', 'Fim']}
              onChange={(value) => {
                setDateRange(value as DateRange)
                setFirstPage()
              }}
            />
          </label>
        </div>
      </Card>

      {auxiliaryError ? (
        <Alert
          type="warning"
          showIcon
          message={auxiliaryError instanceof Error ? auxiliaryError.message : 'Alguns filtros não puderam ser carregados.'}
        />
      ) : null}

      {classesQuery.isError ? (
        <Alert
          type="error"
          showIcon
          message={classesQuery.error instanceof Error ? classesQuery.error.message : 'Não foi possível carregar as turmas.'}
          action={
            <Button size="small" onClick={() => classesQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : null}

      <Card className="classes-table-card" styles={{ body: { padding: 0 } }}>
        <Table<ClassItem>
          rowKey="id"
          className="classes-table"
          columns={columns}
          dataSource={classes}
          loading={classesQuery.isLoading || classesQuery.isFetching}
          scroll={screens.lg ? { x: 1200 } : screens.md ? { x: 850 } : undefined}
          rowClassName="class-table-row"
          onRow={(item) => ({ onClick: () => navigate(`/class/${item.id}`) })}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={hasActiveFilters ? 'Nenhuma turma encontrada com estes filtros.' : 'Nenhuma turma cadastrada.'}
              >
                {hasActiveFilters ? <Button onClick={clearFilters}>Limpar filtros</Button> : null}
              </Empty>
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            responsive: true,
            showTotal: (count, range) => `${range[0]}–${range[1]} de ${count} turmas`,
            onChange: (nextPage, nextPageSize) => {
              setPageSize(nextPageSize)
              setPage(nextPageSize !== pageSize ? 1 : nextPage)
            },
          }}
        />
      </Card>

      <ClassTagsModal
        open={Boolean(tagsClass)}
        classData={tagsClass}
        catalog={tags}
        loading={tagsQuery.isLoading}
        onCancel={() => setTagsClass(null)}
        onCreateTag={handleCreateTag}
        onSave={handleSaveClassTags}
      />

      <ClassTagCatalogModal
        open={catalogOpen}
        tags={tags}
        loading={tagsQuery.isLoading}
        onCancel={() => setCatalogOpen(false)}
        onCreate={async (description) => {
          await handleCreateTag(description)
        }}
        onRename={handleRenameTag}
        onDelete={handleDeleteTag}
      />
    </Space>
  )
}
