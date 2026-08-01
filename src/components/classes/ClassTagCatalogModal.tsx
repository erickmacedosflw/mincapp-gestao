import { DeleteOutlined, EditOutlined, PlusOutlined, TagsOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, Input, List, Modal, Space, Typography, message } from 'antd'
import { useState } from 'react'
import type { ClassTag } from '../../types/class'

type ClassTagCatalogModalProps = {
  open: boolean
  tags: ClassTag[]
  loading?: boolean
  onCancel: () => void
  onCreate: (description: string) => Promise<void>
  onRename: (tagId: string, description: string) => Promise<void>
  onDelete: (tagId: string) => Promise<void>
}

export default function ClassTagCatalogModal({
  open,
  tags,
  loading = false,
  onCancel,
  onCreate,
  onRename,
  onDelete,
}: ClassTagCatalogModalProps) {
  const [newDescription, setNewDescription] = useState('')
  const [editingTag, setEditingTag] = useState<ClassTag | null>(null)
  const [editingDescription, setEditingDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isDuplicate = (description: string, ignoredId?: string) => {
    const normalized = description.trim().toLocaleLowerCase('pt-BR')
    return tags.some(
      (tag) => tag.id !== ignoredId && tag.description.trim().toLocaleLowerCase('pt-BR') === normalized,
    )
  }

  const handleCreate = async () => {
    const description = newDescription.trim()
    if (!description || isDuplicate(description)) {
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage(null)
      await onCreate(description)
      setNewDescription('')
      message.success('Tag criada com sucesso.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível criar a tag.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRename = async () => {
    const description = editingDescription.trim()
    if (!editingTag || !description || isDuplicate(description, editingTag.id)) {
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage(null)
      await onRename(editingTag.id, description)
      setEditingTag(null)
      setEditingDescription('')
      message.success('Tag renomeada em todas as turmas.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível renomear a tag.')
    } finally {
      setSubmitting(false)
    }
  }

  const requestDelete = (tag: ClassTag) => {
    Modal.confirm({
      title: `Excluir a tag “${tag.description}”?`,
      content: 'A tag será removida do catálogo e de todas as turmas que a utilizam.',
      okText: 'Excluir globalmente',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      async onOk() {
        try {
          setErrorMessage(null)
          await onDelete(tag.id)
          message.success('Tag excluída do catálogo.')
        } catch (error) {
          const nextMessage = error instanceof Error ? error.message : 'Não foi possível excluir a tag.'
          setErrorMessage(nextMessage)
          throw error
        }
      },
    })
  }

  const newTagDuplicated = Boolean(newDescription.trim()) && isDuplicate(newDescription)
  const editDuplicated = Boolean(editingDescription.trim()) && isDuplicate(editingDescription, editingTag?.id)

  return (
    <Modal
      open={open}
      width={620}
      title={
        <Space size={8}>
          <TagsOutlined />
          <span>Catálogo de tags</span>
        </Space>
      }
      footer={<Button onClick={onCancel}>Fechar</Button>}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          Tags são reutilizadas entre turmas. Renomear ou excluir afeta todos os vínculos existentes.
        </Typography.Text>

        {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={newDescription}
            onChange={(event) => setNewDescription(event.target.value)}
            onPressEnter={handleCreate}
            placeholder="Descrição da nova tag"
            maxLength={100}
            status={newTagDuplicated ? 'error' : undefined}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={submitting}
            disabled={!newDescription.trim() || newTagDuplicated}
            onClick={handleCreate}
          >
            Criar tag
          </Button>
        </Space.Compact>

        {newTagDuplicated ? <Typography.Text type="danger">Essa tag já existe.</Typography.Text> : null}

        <List
          bordered
          loading={loading}
          dataSource={tags}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhuma tag cadastrada" /> }}
          renderItem={(tag) => (
            <List.Item
              actions={
                editingTag?.id === tag.id
                  ? [
                      <Button key="save" type="link" disabled={!editingDescription.trim() || editDuplicated} onClick={handleRename}>
                        Salvar
                      </Button>,
                      <Button key="cancel" type="link" onClick={() => setEditingTag(null)}>
                        Cancelar
                      </Button>,
                    ]
                  : [
                      <Button
                        key="edit"
                        type="text"
                        aria-label={`Renomear ${tag.description}`}
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingTag(tag)
                          setEditingDescription(tag.description)
                        }}
                      />,
                      <Button
                        key="delete"
                        type="text"
                        danger
                        aria-label={`Excluir ${tag.description}`}
                        icon={<DeleteOutlined />}
                        onClick={() => requestDelete(tag)}
                      />,
                    ]
              }
            >
              {editingTag?.id === tag.id ? (
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Input
                    value={editingDescription}
                    onChange={(event) => setEditingDescription(event.target.value)}
                    onPressEnter={handleRename}
                    maxLength={100}
                    status={editDuplicated ? 'error' : undefined}
                    autoFocus
                  />
                  {editDuplicated ? <Typography.Text type="danger">Essa tag já existe.</Typography.Text> : null}
                </Space>
              ) : (
                <Typography.Text>{tag.description}</Typography.Text>
              )}
            </List.Item>
          )}
        />
      </Space>
    </Modal>
  )
}
