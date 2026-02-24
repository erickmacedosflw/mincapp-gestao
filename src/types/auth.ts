export type LoginPayload = {
  email: string
  password: string
}

export type AdminProfile = {
  id: string
  name: string
  email: string
}

export type AuthResponse = {
  token: string
  admin: AdminProfile
}
