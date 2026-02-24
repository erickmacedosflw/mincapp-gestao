import { useEffect, useMemo, useState } from 'react'
import { Alert, Col, Empty, Radio, Row, Select, Space, Spin, Typography } from 'antd'
import { ReadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ClassItem } from '../../types/class'
import { getClasses } from '../../services/class/class.service'
import ClassCard from '../../components/classes/ClassCard'
import { isClassActive, isClassFinished } from '../../utils/date'
import { getClassTypes } from '../../services/class/class-type.service'
import type { ClassTypeItem } from '../../types/class-type'

type ClassFilter = 'ongoing' | 'closed'

export default function ClassesPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [classTypes, setClassTypes] = useState<ClassTypeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filter, setFilter] = useState<ClassFilter>('ongoing')
  const [selectedTypeId, setSelectedTypeId] = useState<string>('all')

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true)
        setErrorMessage(null)

        const [classData, classTypeData] = await Promise.all([getClasses(), getClassTypes()])
        setClasses(classData)
        setClassTypes(classTypeData)
      } catch {
        setErrorMessage('Não foi possível carregar as turmas.')
      } finally {
        setLoading(false)
      }
    }

    loadClasses()
  }, [])

  const filteredClasses = useMemo(() => {
    const byStatus =
      filter === 'ongoing'
        ? classes.filter((item) => isClassActive(item.initDate, item.finishDate))
        : classes.filter((item) => isClassFinished(item.finishDate))

    if (selectedTypeId === 'all') {
      return byStatus
    }

    return byStatus.filter((item) => item.classTypeId === selectedTypeId)
  }, [classes, filter, selectedTypeId])

  const typeNameById = useMemo(() => {
    return new Map(classTypes.map((item) => [item.id, item.name]))
  }, [classTypes])

  const groupedClasses = useMemo(() => {
    const groupedMap = new Map<string, ClassItem[]>()

    filteredClasses.forEach((item) => {
      const existing = groupedMap.get(item.classTypeId) ?? []
      groupedMap.set(item.classTypeId, [...existing, item])
    })

    const orderedGroups = classTypes
      .map((type) => ({
        typeId: type.id,
        typeName: type.name,
        items: groupedMap.get(type.id) ?? [],
      }))
      .filter((group) => group.items.length > 0)

    const unknownTypeItems = filteredClasses.filter((item) => !typeNameById.get(item.classTypeId))

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
      <Space direction="vertical" size={4}>
        <Space size={8} align="center">
          <ReadOutlined style={{ fontSize: 22 }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Turmas
          </Typography.Title>
        </Space>
        <Typography.Text type="secondary">
          Lista de turmas com período e status.
        </Typography.Text>
      </Space>

      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        options={[
          { label: 'Em andamento', value: 'ongoing' },
          { label: 'Encerradas', value: 'closed' },
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
                      classTypeName={typeNameById.get(item.classTypeId)}
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
