export type CompanyStatus = 'active' | 'inactive' | 'suspended'

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
  averageRating?: number
  totalRatings?: number
  created_at?: string
}

export type CompaniesListQuery = {
  search?: string
  status?: CompanyStatus | CompanyStatus[] | ''
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

export type UpdateCompanyInput = {
  name: string
  email: string
  phone: string
  address: string
  description: string
  status: CompanyStatus
}

export type CreateCompanyResult = {
  company: PlatformCompany
  raw: unknown
}
