import { LockOutlined } from '@ant-design/icons'
import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAdminAccess } from '../../access/use-admin-access'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  const { getDefaultAuthorizedPath } = useAdminAccess()

  return (
    <Result
      status="403"
      title="Acesso negado"
      subTitle="Voce nao tem permissao para acessar esta area do sistema."
      icon={<LockOutlined />}
      extra={
        <Button type="primary" onClick={() => navigate(getDefaultAuthorizedPath(), { replace: true })}>
          Voltar
        </Button>
      }
    />
  )
}
