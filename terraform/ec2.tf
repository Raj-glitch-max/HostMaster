# Launch Template (blueprint for EC2 instances)
resource "aws_launch_template" "main" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  # Network configuration
  network_interfaces {
    associate_public_ip_address = false  # Private instances (in private subnet)
    security_groups             = [aws_security_group.ec2.id]
    delete_on_termination       = true
  }

  # User data script (runs on instance launch)
  user_data = base64encode(<<-EOF
              #!/bin/bash
              # Update system
              yum update -y
              
              # Install nginx as placeholder web server
              yum install -y nginx
              
              # Create simple health check page
              echo "HostMaster Backend - Instance $(hostname)" > /usr/share/nginx/html/index.html
              
              # Start nginx
              systemctl start nginx
              systemctl enable nginx
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-instance"
    }
  }

  tags = {
    Name = "${var.project_name}-launch-template"
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${var.project_name}-asg"
  vpc_zone_identifier = aws_subnet.private[*].id  # Launch in private subnets
  target_group_arns   = [aws_lb_target_group.main.arn]  # Register with ALB target group
  health_check_type   = "ELB"  # Use ALB health checks (not just EC2 status)
  health_check_grace_period = 300  # Wait 5 minutes before starting health checks

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"  # Always use latest version
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-instance"
    propagate_at_launch = true  # Apply tag to instances
  }

  # Lifecycle: Create new instances before destroying old ones
  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policy - Scale UP when CPU > 70%
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.project_name}-scale-up"
  scaling_adjustment     = 1  # Add 1 instance
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300  # Wait 5 minutes before scaling again
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarm - Trigger scale up
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"  # 2 consecutive periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"  # 5 minutes
  statistic           = "Average"
  threshold           = "70"  # 70% CPU

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  alarm_description = "Scale up if CPU > 70% for 10 minutes"
  alarm_actions     = [aws_autoscaling_policy.scale_up.arn]
}

# Auto Scaling Policy - Scale DOWN when CPU < 30%
resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.project_name}-scale-down"
  scaling_adjustment     = -1  # Remove 1 instance
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarm - Trigger scale down
resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.project_name}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "30"  # 30% CPU

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  alarm_description = "Scale down if CPU < 30% for 10 minutes"
  alarm_actions     = [aws_autoscaling_policy.scale_down.arn]
}
