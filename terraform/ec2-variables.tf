# Additional Variables for EC2 and ALB

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "min_size" {
  description = "Minimum number of EC2 instances"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of EC2 instances"
  type        = number
  default     = 5
}

variable "desired_capacity" {
  description = "Desired number of EC2 instances"
  type        = number
  default     = 2
}

variable "ami_id" {
  description = "AMI ID for EC2 instances (Amazon Linux 2023)"
  type        = string
  default     = "ami-07ff62358b87c7116"  # Amazon Linux 2023 in us-east-1
}
