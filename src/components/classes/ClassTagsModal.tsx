import { PlusOutlined, TagsOutlined } from '@ant-design/icons'
import { Alert, Button, Divider, Input, Modal, Select, Space, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { ClassItem, ClassTag } from '../../types/class'

type ClassTagsModalProps = {
  open: boolean
  classData: ClassItem | null
  catalog: ClassTag[]
  loading?: boolean
  onCancel: () => void
  onCreateTag: (description: string) => Promise<ClassTag>
  onSave: (tagIds: string[]) => Promise<void>
}

export default function ClassTagsModal({
  open,
  classData,
  catalog,
  loading = false,
  onCancel,
  onCreateTag,
  onSave,
}: ClassTagsModalProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedTagIds((classData?.tags ?? []).map((tag) => tag.id))
    setNewDescription('')
    setErrorMessage(null)
  }, [classData, open])

  const normalizedDescription = newDescription.trim()
  const duplicatedDescription = useMemo(
    () => catalog.some((tag) => tag.description.trim().toLocaleLowerCase('pt-BR') === normalizedDescription.toLocaleLowerCase('pt-BR')),
    [catalog, normalizedDescription],
  )

  const handleCreate = async () => {
    if (!normalizedDescription || duplicatedDescription) {
      return
    }

    try {
      setCreating(true)
      setErrorMessage(null)
      const createdTag = await onCreateTag(normalizedDescription)
      setSelectedTagIds((current) => [...new Set([...current, createdTag.id])])
      setNewDescription('')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível criar a tag.')
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setErrorMessage(null)
      await onSave(selectedTagIds)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível atualizar as tags da turma.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={
        <Space size={8}>
          <TagsOutlined />
          <span>Tags da turma</span>
        </Space>
      }
      okText="Salvar tags"
      cancelText="Cancelar"
      confirmLoading={saving}
      onOk={handleSave}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          {classData ? `Organize “${classData.name}” usando uma ou mais tags.` : 'Selecione as tags da turma.'}
        </Typography.Text>

        {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

        <Select
          mode="multiple"
          allowClear
          autoFocus
          loading={loading}
          value={selectedTagIds}
          onChange={setSelectedTagIds}
          placeholder="Selecione as tags"
          options={catalog.map((tag) => ({ value: tag.id, label: tag.description }))}
          showSearch
          optionFilterProp="label"
          maxTagCount="responsive"
          style={{ width: '100%' }}
        />

        <Divider style={{ margin: 0 }} />

        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          <Typography.Text strong>Criar uma nova tag</Typography.Text>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              onPressEnter={handleCreate}
              placeholder="Ex.: Turma avançada"
              maxLength={100}
              status={duplicatedDescription ? 'error' : undefined}
            />
            <Button
              icon={<PlusOutlined />}
              loading={creating}
              disabled={!normalizedDescription || duplicatedDescription}
              onClick={handleCreate}
            >
              Criar
            </Button>
          </Space.Compact>
          {duplicatedDescription ? (
            <Typography.Text type="danger">Já existe uma tag com essa descrição.</Typography.Text>
          ) : null}
        </Space>
      </Space>
    </Modal>
  )
}
