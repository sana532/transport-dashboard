export type CompanyStatus = 'active' | 'inactive'

export type PlatformCompany = {
  id: number
  name: string
  email: string
  phone: string
  address?: string | null
  description?: string | null
  status: CompanyStatus
  logo_url?: string | null
  cover_image_url?: string | null
  created_at?: string
}

export type CreateCompanyInput = {
  company: {
    name: string
    email: string
    phone: string
    address: string
    description: string
    status: CompanyStatus
    logo: File | null
    coverImage: File | null
  }
  manager: {
    name: string
    username: string
    phoneNumber: string
    email: string
    password: string
    passwordConfirmation: string
  }
}

export type CreateCompanyResult = {
  company: PlatformCompany
  raw: unknown
}
