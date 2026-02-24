import { useState } from 'react'
import { Button, Layout, Menu, Space, Typography } from 'antd'
import {
  BarChartOutlined,
  LogoutOutlined,
  ReadOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAdminProfile } from '../../services/auth/token.storage'
import { useAppTheme } from '../../app/theme.context'
import AppDialog from '../feedback/AppDialog'

const { Header, Content, Sider } = Layout

export default function AppLayout() {
  // Layout principal para manter UX consistente no painel administrativo.
  const location = useLocation()
  const navigate = useNavigate()
  const admin = getAdminProfile()
  const { mode, toggleMode } = useAppTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const handleConfirmLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const handleOpenLogoutDialog = () => {
    setIsLogoutDialogOpen(true)
  }

  const handleCloseLogoutDialog = () => {
    setIsLogoutDialogOpen(false)
  }

  const handleToggleMenu = () => {
    setCollapsed((previous) => !previous)
  }

  const handleBreakpoint = (broken: boolean) => {
    setIsMobile(broken)
    setCollapsed(broken)
  }

  const isClassManagementRoute = /^\/class\/.+/.test(location.pathname)
  const selectedMenuKey = location.pathname.startsWith('/students')
    ? '/students'
    : location.pathname.startsWith('/dashboard')
      ? '/dashboard'
      : '/class'

  return (
    <Layout className="app-shell">
      <Sider
        breakpoint="lg"
        collapsed={collapsed}
        collapsedWidth={isMobile ? 0 : 64}
        collapsible
        trigger={null}
        onBreakpoint={handleBreakpoint}
        theme="light"
        width={240}
        className="app-sider"
      >
        <div className="app-sider-inner">
          <div className="app-brand">
            <img src="/branding/logo-inspire.png" alt="Gestão Inspire" className="app-brand-logo" />
            {isMobile && !collapsed ? (
              <Button
                type="text"
                size="small"
                icon={<MenuFoldOutlined />}
                onClick={handleToggleMenu}
                aria-label="Retrair menu"
                className="app-sider-close"
              />
            ) : null}
          </div>
          <Menu
            className="app-menu"
            mode="inline"
            selectedKeys={[selectedMenuKey]}
            onClick={() => {
              if (isMobile) {
                setCollapsed(true)
              }
            }}
            items={[
              {
                key: '/dashboard',
                icon: <BarChartOutlined />,
                label: <Link to="/dashboard">Dashboards</Link>,
              },
              {
                key: '/class',
                icon: <ReadOutlined />,
                label: <Link to="/class">Turmas</Link>,
              },
              {
                key: '/students',
                icon: <TeamOutlined />,
                label: <Link to="/students">Alunos</Link>,
              },
            ]}
          />
          <div className="app-sider-actions">
            <Button
              type="text"
              className="app-sider-action-btn"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleMode}
              aria-label="Alternar tema"
            >
              {!collapsed ? 'Tema' : null}
            </Button>
            <Button
              type="text"
              className="app-sider-action-btn"
              icon={<LogoutOutlined />}
              onClick={handleOpenLogoutDialog}
            >
              {!collapsed ? 'Sair' : null}
            </Button>
          </div>
        </div>
      </Sider>

      <Layout className="app-main-layout">
        <Header className="app-header">
          <Space size="middle" className="app-header-content">
            <Space size="small" className="app-header-left">
              {!isMobile || collapsed ? (
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={handleToggleMenu}
                  aria-label="Alternar menu"
                />
              ) : null}
              {isClassManagementRoute ? (
                <Space size={8} align="center">
                  <Typography.Text>Gestão da turma selecionada</Typography.Text>
                </Space>
              ) : (
                <Typography.Text>
                  {admin?.name ? `Olá, ${admin.name}` : 'Painel Gestão Inspire'}
                </Typography.Text>
              )}
            </Space>
          </Space>
        </Header>

        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>

      <AppDialog
        open={isLogoutDialogOpen}
        type="warning"
        title="Confirmar saída"
        message="Tem certeza que deseja sair da sua conta?"
        confirmText="Sim"
        cancelText="Não"
        onConfirm={handleConfirmLogout}
        onCancel={handleCloseLogoutDialog}
      />
    </Layout>
  )
}
