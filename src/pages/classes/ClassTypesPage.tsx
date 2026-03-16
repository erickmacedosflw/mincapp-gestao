import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Breadcrumb,
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { AppstoreOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import AppDialog from '../../components/feedback/AppDialog'
import {
  createClassType,
  deleteClassType,
  getClassTypeById,
  getClassTypes,
  updateClassType,
} from '../../services/class/class-type.service'
import type { ClassTypeItem } from '../../types/class-type'

type ClassTypeFormValues = {
  name: string
}

export default function ClassTypesPage() {
  const [form] = Form.useForm<ClassTypeFormValues>()
  const [classTypes, setClassTypes] = useState<ClassTypeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClassType, setEditingClassType] = useState<ClassTypeItem | null>(null)
  const [classTypePendingDelete, setClassTypePendingDelete] = useState<ClassTypeItem | null>(null)

  const loadClassTypes = useCallback(async (keepLoadingState = false) => {
    try {
      if (keepLoadingState) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setErrorMessage(null)
      const data = await getClassTypes()
      setClassTypes([...data].sort((firstItem, secondItem) => firstItem.name.localeCompare(secondItem.name, 'pt-BR')))
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Não foi possível carregar os tipos de turma.'
      setErrorMessage(nextMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadClassTypes()
  }, [loadClassTypes])

  const tableData = useMemo(() => classTypes.map((item) => ({ ...item, key: item.id })), [classTypes])

  const handleOpenCreateModal = () => {
    setEditingClassType(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleOpenEditModal = async (classTypeId: string) => {
    try {
      setSaving(true)
      const foundClassType = await getClassTypeById(classTypeId)
      setEditingClassType(foundClassType)
      form.setFieldsValue({ name: foundClassType.name })
      setIsModalOpen(true)
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Não foi possível carregar o tipo de turma.'
      message.error(nextMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCloseModal = (force = false) => {
    if (saving && !force) {
      return
    }

    setIsModalOpen(false)
    setEditingClassType(null)
    form.resetFields()
  }

  const handleSave = async (values: ClassTypeFormValues) => {
    try {
      setSaving(true)

      if (editingClassType) {
        const updated = await updateClassType(editingClassType.id, {
          name: values.name.trim(),
        })

        setClassTypes((previous) =>
          previous
            .map((item) => (item.id === updated.id ? updated : item))
            .sort((firstItem, secondItem) => firstItem.name.localeCompare(secondItem.name, 'pt-BR')),
        )
        message.success('Tipo de turma atualizado com sucesso.')
      } else {
        const created = await createClassType({
          name: values.name.trim(),
        })

        setClassTypes((previous) =>
          [...previous, created].sort((firstItem, secondItem) => firstItem.name.localeCompare(secondItem.name, 'pt-BR')),
        )
        message.success('Tipo de turma criado com sucesso.')
      }

      handleCloseModal(true)
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Não foi possível salvar o tipo de turma.'
      message.error(nextMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!classTypePendingDelete) {
      return
    }

    try {
      setSaving(true)
      await deleteClassType(classTypePendingDelete.id)
      setClassTypes((previous) => previous.filter((item) => item.id !== classTypePendingDelete.id))
      setClassTypePendingDelete(null)
      message.success('Tipo de turma excluído com sucesso.')
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Não foi possível excluir o tipo de turma.'
      message.error(nextMessage)
    } finally {
      setSaving(false)
    }
  }

  const columns: TableColumnsType<ClassTypeItem & { key: string }> = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => <Typography.Text strong>{record.name}</Typography.Text>,
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size={8}>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEditModal(record.id)}>
            Editar
          </Button>
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => setClassTypePendingDelete(record)}>
            Excluir
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          { title: 'Tipos de turma' },
        ]}
      />

      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Space size={8} align="center">
            <AppstoreOutlined style={{ fontSize: 22 }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Tipos de turma
            </Typography.Title>
          </Space>

          <Space size={8} wrap>
            <Button icon={<ReloadOutlined />} onClick={() => loadClassTypes(true)} loading={refreshing}>
              Atualizar
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
              Novo tipo
            </Button>
          </Space>
        </div>

        <Typography.Text type="secondary">
          Gerencie os tipos usados no cadastro e edição das turmas.
        </Typography.Text>
      </Space>

      {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

      <Table
        rowKey="id"
        loading={loading}
        dataSource={tableData}
        columns={columns}
        pagination={false}
        locale={{
          emptyText: 'Nenhum tipo de turma cadastrado.',
        }}
      />

      <Modal
        open={isModalOpen}
        title={editingClassType ? 'Editar tipo de turma' : 'Novo tipo de turma'}
        onCancel={() => handleCloseModal()}
        onOk={() => form.submit()}
        okText={editingClassType ? 'Salvar alterações' : 'Criar tipo'}
        cancelText="Cancelar"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form<ClassTypeFormValues> layout="vertical" form={form} onFinish={handleSave}>
          <Form.Item
            label="Nome"
            name="name"
            rules={[
              { required: true, message: 'Informe o nome do tipo de turma.' },
              { whitespace: true, message: 'Informe o nome do tipo de turma.' },
            ]}
          >
            <Input placeholder="Ex.: Presencial" maxLength={120} />
          </Form.Item>
        </Form>
      </Modal>

      <AppDialog
        open={Boolean(classTypePendingDelete)}
        type="danger"
        title="Excluir tipo de turma"
        message={
          classTypePendingDelete
            ? `Deseja realmente excluir o tipo "${classTypePendingDelete.name}"?`
            : 'Deseja realmente excluir este tipo de turma?'
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmLoading={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setClassTypePendingDelete(null)}
      />
    </Space>
  )
}
