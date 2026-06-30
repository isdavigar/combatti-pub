output "gateway_url" {
  description = "URL pública del gateway (úsala como BACKEND_URL en Cloudflare Pages)."
  value       = "http://${aws_instance.backend.public_ip}:8080"
}

output "public_ip" {
  description = "IP pública de la instancia."
  value       = aws_instance.backend.public_ip
}

output "admin_password" {
  description = "Contraseña del admin inicial. Recupérala con: terraform output -raw admin_password"
  value       = local.admin_password
  sensitive   = true
}

output "jwt_secret" {
  description = "Secreto JWT en uso. Recupéralo con: terraform output -raw jwt_secret"
  value       = local.jwt_secret
  sensitive   = true
}

output "ssh_command" {
  description = "Comando SSH (si configuraste ssh_key_name)."
  value       = local.enable_ssh ? "ssh ec2-user@${aws_instance.backend.public_ip}" : "SSH no habilitado (define ssh_key_name)."
}

output "health_check" {
  description = "Verificación rápida del backend tras el arranque."
  value       = "curl http://${aws_instance.backend.public_ip}:8080/api/auth/health"
}
