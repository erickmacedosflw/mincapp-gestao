import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Col, Empty, Radio, Row, Select, Space, Spin, Typography } from 'antd'
import { PlusOutlined, ReadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { ADMIN_PERMISSIONS } from '../../access/admin-access'
import { useAdminAccess } from '../../access/use-admin-access'
import type { ClassItem } from '../../types/class'
import { getClasses } from '../../services/class/class.service'
import ClassCard from '../../components/classes/ClassCard'
import { isClassActive, isClassFinished, isClassScheduled } from '../../utils/date'
import { getClassTypes } from '../../services/class/class-type.service'
import type { ClassTypeItem } from '../../types/class-type'
import { getCampuses } from '../../services/campus/campus.service'
import type { CampusItem } from '../../types/campus'

type ClassFilter = 'scheduled' | 'ongoing' | 'closed'

export default function ClassesPage() {
  const navigate = useNavigate()
  const { admin, hasPermission } = useAdminAccess()
  const canManageClasses = hasPermission(ADMIN_PERMISSIONS.gerenciarTurmas)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [classTypes, setClassTypes] = useState<ClassTypeItem[]>([])
  const [campuses, setCampuses] = useState<CampusItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filter, setFilter] = useState<ClassFilter>('ongoing')
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all')
  const [selectedTypeId, setSelectedTypeId] = useState<string>('all')

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true)
        setErrorMessage(null)

        const [classData, classTypeData, campusData] = await Promise.all([getClasses(), getClassTypes(), getCampuses()])
        setClasses(classData)
        setClassTypes(classTypeData)
        setCampuses(campusData)
      } catch {
        setErrorMessage('Não foi possível carregar as turmas.')
      } finally {
        setLoading(false)
      }
    }

    loadClasses()
  }, [])

  const availableCampuses = useMemo(() => {
    if (!admin?.campusIds?.length) {
      return campuses
    }

    const allowedCampusIds = new Set(admin.campusIds)
    return campuses.filter((campus) => allowedCampusIds.has(campus.id))
  }, [admin?.campusIds, campuses])

  const filteredClasses = useMemo(() => {
    const byStatus = classes.filter((item) => {
      if (filter === 'scheduled') {
        return isClassScheduled(item.initDate)
      }

      if (filter === 'ongoing') {
        return isClassActive(item.initDate, item.finishDate)
      }

      return isClassFinished(item.finishDate)
    })

    const byCampus = selectedCampusId === 'all' ? byStatus : byStatus.filter((item) => item.campusId === selectedCampusId)

    if (selectedTypeId === 'all') {
      return byCampus
    }

    return byCampus.filter((item) => item.classTypeId === selectedTypeId)
  }, [classes, filter, selectedCampusId, selectedTypeId])

  const typeNameById = useMemo(() => {
    return new Map(classTypes.map((item) => [item.id, item.name]))
  }, [classTypes])

  const groupedClasses = useMemo(() => {
    const groupedMap = new Map<string, ClassItem[]>()

    filteredClasses.forEach((item) => {
      const typeId = item.classTypeId ?? 'unknown'
      const existing = groupedMap.get(typeId) ?? []
      groupedMap.set(typeId, [...existing, item])
    })

    const orderedGroups = classTypes
      .map((type) => ({
        typeId: type.id,
        typeName: type.name,
        items: groupedMap.get(type.id) ?? [],
      }))
      .filter((group) => group.items.length > 0)

    const unknownTypeItems = filteredClasses.filter((item) => !item.classTypeId || !typeNameById.get(item.classTypeId))

    if (unknownTypeItems.length > 0) {
      orderedGroups.push({
        typeId: 'unknown',
        typeName: 'Sem tipo',
        items: unknownTypeItems,
      })
    }

    return orderedGroups
  }, [filteredClasses, classTypes, typeNameById])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Space size={8} align="center">
            <ReadOutlined style={{ fontSize: 22 }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Turmas
            </Typography.Title>
          </Space>
          {canManageClasses ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/class/new')}>
              Nova turma
            </Button>
          ) : null}
        </div>
        <Typography.Text type="secondary">
          Lista de turmas com período, status e campus.
        </Typography.Text>
      </Space>

      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        options={[
          { label: 'Agendadas', value: 'scheduled' },
          { label: 'Em andamento', value: 'ongoing' },
          { label: 'Encerradas', value: 'closed' },
        ]}
      />

      <Select
        value={selectedCampusId}
        style={{ width: 260, maxWidth: '100%' }}
        onChange={setSelectedCampusId}
        options={[
          { label: 'Todos os campus', value: 'all' },
          ...availableCampuses.map((item) => ({ label: item.name, value: item.id })),
        ]}
      />

      <Select
        value={selectedTypeId}
        style={{ width: 260, maxWidth: '100%' }}
        onChange={setSelectedTypeId}
        options={[
          { label: 'Todos os tipos', value: 'all' },
          ...classTypes.map((item) => ({ label: item.name, value: item.id })),
        ]}
      />

      {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

      {loading ? (
        <Spin />
      ) : filteredClasses.length === 0 ? (
        <Empty description="Nenhuma turma encontrada para este filtro." />
      ) : (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          {groupedClasses.map((group) => (
            <Space key={group.typeId} direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {group.typeName}
              </Typography.Title>
              <Row gutter={[16, 16]}>
                {group.items.map((item) => (
                  <Col xs={24} md={12} lg={8} key={item.id}>
                    <ClassCard
                      data={item}
                      classTypeName={item.classTypeId ? typeNameById.get(item.classTypeId) : undefined}
                      onClick={() => navigate(`/class/${item.id}`)}
                    />
                  </Col>
                ))}
              </Row>
            </Space>
          ))}
        </Space>
      )}
    </Space>
  )
}
