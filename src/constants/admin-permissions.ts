import type { CreatePermissionTypePayload } from '../types/admin'

export const DEFAULT_ADMIN_PERMISSIONS: CreatePermissionTypePayload[] = [
  {
    name: 'gerenciar_turmas',
    description: 'Acessa a area de turmas, incluindo listagem, criacao e gestao geral da turma',
  },
  {
    name: 'gerenciar_tipos_turma',
    description: 'Acessa a area de tipos de turma, incluindo listagem, criacao, edicao e exclusao',
  },
  {
    name: 'gerenciar_alunos',
    description: 'Acessa a area de alunos, incluindo listagens, vinculo com turmas, transferencias e vida academica',
  },
  {
    name: 'gerenciar_materias',
    description: 'Acessa a area de materias da turma, incluindo cadastro, edicao e configuracao de aulas',
  },
  {
    name: 'gerenciar_presencas',
    description: 'Acessa a area de marcacoes de presenca das materias',
  },
  {
    name: 'gerenciar_justificativas',
    description: 'Acessa a area de justificativas de ausencia, incluindo analise, aprovacao e reprovacao',
  },
  {
    name: 'visualizar_dashboards',
    description: 'Acessa a area de dashboards e analises gerais de alunos',
  },
  {
    name: 'gerenciar_admins',
    description: 'Acessa a area de administracao de admins, incluindo cadastro de novos administradores',
  },
]
