variable "region" {
  description = "Región de AWS donde desplegar."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefijo para nombrar los recursos."
  type        = string
  default     = "combatti"
}

variable "instance_type" {
  description = "Tipo de instancia EC2. Se recomienda >= t3.large por la compilación de 9 módulos Maven."
  type        = string
  default     = "t3.large"
}

variable "repo_url" {
  description = "URL del repositorio a clonar en el arranque."
  type        = string
  default     = "https://github.com/isdavigar/combatti-pub.git"
}

variable "repo_branch" {
  description = "Rama a desplegar."
  type        = string
  default     = "main"
}

variable "cors_allowed_origins" {
  description = "Origen del frontend permitido por CORS (URL de Cloudflare Pages)."
  type        = string
  default     = "https://combatti-pub.pages.dev"
}

variable "ssh_key_name" {
  description = "Nombre de un key pair de EC2 para acceso SSH (opcional; vacío = sin SSH)."
  type        = string
  default     = ""
}

variable "ssh_allowed_cidr" {
  description = "CIDR autorizado para SSH (por ejemplo TU_IP/32). Solo aplica si ssh_key_name no está vacío."
  type        = string
  default     = "0.0.0.0/0"
}

variable "jwt_secret" {
  description = "Secreto JWT. Si se deja vacío, Terraform genera uno fuerte automáticamente."
  type        = string
  default     = ""
  sensitive   = true
}

variable "seed_admin_password" {
  description = "Contraseña del admin inicial. Si se deja vacío, Terraform genera una fuerte automáticamente."
  type        = string
  default     = ""
  sensitive   = true
}

variable "root_volume_gb" {
  description = "Tamaño del disco raíz (GB)."
  type        = number
  default     = 30
}
