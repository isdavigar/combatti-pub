locals {
  jwt_secret     = var.jwt_secret != "" ? var.jwt_secret : random_password.jwt.result
  admin_password = var.seed_admin_password != "" ? var.seed_admin_password : random_password.admin.result
  enable_ssh     = var.ssh_key_name != ""
}

# Secretos generados automáticamente si no se proporcionan.
resource "random_password" "jwt" {
  length  = 48
  special = false # alfanumérico, evita problemas de escape en el .env
}

resource "random_password" "admin" {
  length           = 18
  special          = true
  override_special = "-_."
}

# Red y AMI por defecto (VPC default, Amazon Linux 2023).
data "aws_vpc" "default" {
  default = true
}

data "aws_caller_identity" "current" {}

# --- Rol IAM para que la instancia pueda leer imágenes de ECR ---
resource "aws_iam_role" "ec2" {
  name_prefix = "${var.project_name}-ec2-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = { Project = var.project_name }
}

resource "aws_iam_role_policy_attachment" "ecr_readonly" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${var.project_name}-ec2-"
  role        = aws_iam_role.ec2.name
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

resource "aws_security_group" "backend" {
  name_prefix = "${var.project_name}-backend-"
  description = "Combatti backend: gateway publico y SSH opcional."
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "Gateway HTTP"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = local.enable_ssh ? [1] : []
    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [var.ssh_allowed_cidr]
    }
  }

  egress {
    description = "Salida total"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Project = var.project_name }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_instance" "backend" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  subnet_id                   = data.aws_subnets.default.ids[0]
  vpc_security_group_ids      = [aws_security_group.backend.id]
  associate_public_ip_address = true
  key_name                    = local.enable_ssh ? var.ssh_key_name : null
  iam_instance_profile        = aws_iam_instance_profile.ec2.name

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    repo_url             = var.repo_url
    repo_branch          = var.repo_branch
    jwt_secret           = local.jwt_secret
    admin_password       = local.admin_password
    cors_allowed_origins = var.cors_allowed_origins
    region               = var.region
    registry             = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
  })

  # Recrear la instancia si cambia el script de arranque.
  user_data_replace_on_change = true

  root_block_device {
    volume_size = var.root_volume_gb
    volume_type = "gp3"
  }

  tags = {
    Name    = "${var.project_name}-backend"
    Project = var.project_name
  }
}
