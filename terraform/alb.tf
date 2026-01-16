# Application Load Balancer

resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false  # Internet-facing (not internal)
  load_balancer_type = "application"  # ALB (not NLB or GLB)
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id  # Deploy in public subnets

  enable_deletion_protection = false  # Allow deletion (set true in production)

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# Target Group (defines what ALB sends traffic to)
resource "aws_lb_target_group" "main" {
  name     = "${var.project_name}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  # Health check configuration
  health_check {
    enabled             = true
    healthy_threshold   = 2    # 2 successful checks = healthy
    unhealthy_threshold = 2    # 2 failed checks = unhealthy
    timeout             = 5    # Wait 5 seconds for response
    interval            = 30   # Check every 30 seconds
    path                = "/"  # Check root path
    protocol            = "HTTP"
    matcher             = "200"  # Expect HTTP 200 OK
  }

  tags = {
    Name = "${var.project_name}-tg"
  }
}

# Listener (tells ALB what traffic to accept)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  # Default action: forward to target group
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}
