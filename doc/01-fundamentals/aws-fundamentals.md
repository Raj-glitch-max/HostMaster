# AWS Fundamentals: Cloud Computing from Zero to Production

**Reading time:** 75 minutes  
**Mastery level:** Complete AWS foundation for building production applications

---

## Table of Contents
1. [What is Cloud Computing](#what-is-cloud-computing)
2. [Why AWS](#why-aws)
3. [AWS Global Infrastructure](#aws-global-infrastructure)
4. [Core AWS Services Overview](#core-aws-services-overview)
5. [AWS Pricing Model](#aws-pricing-model)
6. [Identity and Access Management (IAM)](#identity-and-access-management-iam)
7. [Service Categories Deep Dive](#service-categories-deep-dive)
8. [Best Practices](#best-practices)
9. [Interview Questions](#interview-questions)

---

## What is Cloud Computing?

### Before Cloud (2000s)

**Traditional IT:**
```
Company needs a website:
1. Buy physical server ($5,000)
2. Buy networking equipment ($2,000)
3. Rent datacenter space ($500/month)
4. Hire IT staff to maintain (2 people × $80k/year)
5. Wait 3 months for setup
6. Pray it doesn't break
7. Scale by buying more servers (3 months lead time)

Total first year: $200,000+
```

**Problems:**
- **Massive upfront cost** - Need capital before earning revenue
- **Overprovisioning** - Buy for peak capacity, waste during low usage
- **Slow to scale** - Takes months to add capacity
- **Maintenance burden** - Security updates, hardware failures, backups
- **Single point of failure** - If datacenter floods, you're done

### After Cloud (2010s+)

**Cloud Computing:**
```
Company needs a website:
1. Visit aws.amazon.com
2. Click "Launch EC2 instance"
3. Website running in 5 minutes
4. Pay $20/month for what you use
5. Scale up/down automatically
6. AWS handles all maintenance

Total first year: $240
```

**Definition:** Cloud Computing = Renting computing resources (servers, storage, databases) over the internet instead of owning them

**Key characteristics:**
1. **On-demand** - Get resources instantly when needed
2. **Pay-as-you-go** - Only pay for what you use
3. **Scalable** - Increase/decrease capacity instantly
4. **Managed** - Provider handles maintenance, security, updates
5. **Global** - Deploy worldwide in minutes

---

## Why AWS?

### Cloud Provider Market Share (2026)

| Provider | Market Share | Strengths |
|----------|-------------|-----------|
| AWS | 32% | Most services, mature, largest community |
| Microsoft Azure | 23% | Windows integration, enterprise focus |
| Google Cloud | 11% | Data analytics, ML/AI, Kubernetes |
| Others | 34% | Alibaba, IBM, Oracle, etc. |

### Why I Choose AWS for HostMaster

**1. Dominant Market Leader**
- Most job postings require AWS (65% vs Azure 25%, GCP 10%)
- Largest community = more tutorials, StackOverflow answers
- Most third-party tools integrate with AWS first

**2. Service Breadth**
- 200+ services (vs Azure ~170, GCP ~100)
- Whatever you need, AWS probably has it
- HostMaster needs: EC2, RDS, S3, CloudWatch - all mature AWS services

**3. Free Tier**
- Learn without spending money
- 750 hours/month EC2 (t2.micro) free
- 20 GB RDS database free
- 5 GB S3 storage free

**4. Enterprise Trust**
- Netflix, Airbnb, NASA all run on AWS
- Compliance certifications (HIPAA, SOC2, PCI-DSS)
- 99.99% uptime SLA

**Interview answer:** "I use AWS because it's the market leader with the most services, largest community, and best free tier for learning. 65% of job postings require AWS experience making it the safest career bet."

---

## AWS Global Infrastructure

### Three Levels of Infrastructure

**1. Regions** (Geographic areas)
```
us-east-1 (N. Virginia)
us-west-2 (Oregon)
eu-west-1 (Ireland)
ap-southeast-1 (Singapore)

Currently: 33 regions globally
```

**What is a Region?**
- Physically separate geographic location
- Completely independent (Paris cloud doesn't talk to Tokyo cloud)
- You choose which region to deploy in

**How to choose a region?**
1. **Latency** - Deploy close to your users (US users → us-east-1)
2. **Cost** - us-east-1 is cheapest, ap-southeast-2 (Sydney) is expensive
3. **Services** - New AWS features launch in us-east-1 first
4. **Compliance** - EU data must stay in EU (use eu-west-1)

**HostMaster choice:** us-east-1 (N. Virginia)
- Cheapest pricing
- Most services available
- Lowest latency for US users

**2. Availability Zones (AZs)** (Datacenters within Region)
```
us-east-1 region:
├─ us-east-1a (datacenter in Virginia location A)
├─ us-east-1b (datacenter in Virginia location B)
├─ us-east-1c (datacenter in Virginia location C)
├─ us-east-1d
├─ us-east-1e
└─ us-east-1f

Each region has 2-6 AZs, typically 3
```

**What is an AZ?**
- One or more physical datacenters
- Separate buildings (fire in AZ-A doesn't affect AZ-B)  
- Separate power, cooling, networking
- Connected with low-latency fiber

**Why multiple AZs?**
- **High availability** - If one datacenter fails, others keep running
- **Disaster recovery** - Hurricane destroys one building, your app keeps running

**HostMaster architecture:**
```
us-east-1a: EC2 instance, RDS primary
us-east-1b: EC2 instance, RDS standby

If us-east-1a fails → us-east-1b handles 100% traffic
```

**3. Edge Locations** (CDN caching)
```
400+ edge locations globally
Purpose: Cache content close to users (CloudFront CDN)
```

**Hierarchy:**
```
33 Regions
  └─ 105 Availability Zones
      └─ 400+ Edge Locations
```

---

## Core AWS Services Overview

AWS has 200+ services. Here are the essential ones:

### Compute (Run Code)

**1. EC2 (Elastic Compute Cloud)**
- Virtual servers you can customize
- Like renting a computer in AWS datacenter
- **Use for:** Web servers, application servers, batch processing
- **HostMaster uses:** Backend API servers

**2. Lambda**
- Serverless - run code without managing servers
- Pay per execution (not per hour)
- **Use for:** Event-driven tasks, scheduled jobs, APIs (light workloads)

**3. ECS/EKS (Container Services)**
- Run Docker containers
- ECS = AWS-managed, EKS = Kubernetes
- **Use for:** Microservices, containerized apps

### Storage

**1. S3 (Simple Storage Service)**
- Object storage (files, images, videos)
- 99.999999999% (11 nines) durability - will not lose your data
- **Use for:** Backups, static website hosting, data lakes
- **HostMaster uses:** Store cost report PDFs

**2. EBS (Elastic Block Store)**
- Hard drives for EC2 instances
- Like attaching USB drive to computer
- **Use for:** Database files, application data

**3. EFS (Elastic File System)**
- Shared file system (multiple EC2 instances access same files)
- **Use for:** Content management systems, shared application state

### Database

**1. RDS (Relational Database Service)**
- Managed PostgreSQL, MySQL, MariaDB, Oracle, SQL Server
- AWS handles backups, updates, high availability
- **Use for:** Structured data, transactional workloads
- **HostMaster uses:** Store user accounts, AWS resource data

**2. DynamoDB**
- NoSQL database (key-value store)
- Serverless, auto-scales
- **Use for:** Session storage, real-time data, high-scale applications

**3. ElastiCache**
- Managed Redis or Memcached
- **Use for:** Caching frequent database queries
- **HostMaster uses:** Cache AWS cost calculations

### Networking

**1. VPC (Virtual Private Cloud)**
- Your own private network in AWS
- Subnets, route tables, firewalls
- **Required for:** Isolating resources, security

**2. Route 53**
- DNS service (maps hostmaster.com → 52.44.123.45)
- **Use for:** Domain management, health checks

**3. CloudFront**
- CDN (Content Delivery Network)
- Caches content at edge locations worldwide
- **Use for:** Fast delivery of static assets (images, CSS, JS)

### Security & Identity

**1. IAM (Identity and Access Management)**
- Who can access what in AWS
- Users, roles, policies
- **Critical for:** Security, least privilege access

**2. Secrets Manager**
- Store passwords, API keys, database credentials
- **Use for:** Never hardcode secrets in code

**3. KMS (Key Management Service)**
- Encryption keys
- **Use for:** Encrypt data at rest (RDS, S3)

### Monitoring & Management

**1. CloudWatch**
- Metrics (CPU usage, disk space)
- Logs (application logs)
- Alarms (alert when CPU > 80%)
- **HostMaster uses:** Monitor EC2, RDS, set cost alerts

**2. CloudTrail**
- Audit logs (who did what, when)
- **Use for:** Compliance, security investigations

**3. X-Ray**
- Distributed tracing (track requests across services)
- **Use for:** Performance debugging

---

## AWS Pricing Model

### Pay-As-You-Go (Most Services)

**EC2 Pricing:**
```
t3.small instance:
- On-Demand: $0.0208/hour = $15.18/month (if running 24/7)
- Reserved (1 year): 30% discount = $10.63/month
- Spot Instance: Up to 90% discount = $1.52/month (can be terminated)
```

**When instance is STOPPED:** Pay $0 for compute, but still pay for EBS storage

**RDS Pricing:**
```
db.t3.micro Multi-AZ:
- Instance cost: $0.034/hour = $24.82/month
- Storage: $0.115/GB-month (20 GB = $2.30)
Total: ~$27/month
```

### Free Tier (First 12 Months)

**Always Free:**
- Lambda: 1 million requests/month
- DynamoDB: 25 GB storage
- CloudWatch: 10 custom metrics

**12 Months Free:**
- EC2: 750 hours/month t2.micro (enough for 1 instance 24/7)
- RDS: 750 hours/month db.t2.micro
- S3: 5 GB storage

**HostMaster cost during free tier:** $0-10/month (only NAT Gateway not free)

### Cost Optimization Strategies

**1. Right-sizing**
```
❌ Bad: Use t3.xlarge ($0.1664/hr) for low-traffic app
✅ Good: Use t3.small ($0.0208/hr) - 8x cheaper
```

**2. Reserved Instances**
```
If you'll run for 1+ year:
On-Demand: $15.18/month
Reserved (1 year): $10.63/month (save 30%)
Reserved (3 year): $6.79/month (save 55%)
```

**3. Spot Instances**
```
Use spare AWS capacity at 90% discount
Risk: AWS can terminate with 2-minute warning
Use for: Batch jobs, non-critical workloads
```

**4. Auto Scaling**
```
❌ Bad: Run 10 servers 24/7 (even at 2 AM)
✅ Good: Auto-scale: 2 servers at night, 10 during peak
Save: 60% on compute costs
```

**5. S3 Lifecycle Policies**
```
Day 0-30: S3 Standard ($0.023/GB)
Day 31-90: S3 Infrequent Access ($0.0125/GB)
Day 90+: Glacier ($0.004/GB)
Save: 80% on storage
```

---

## Identity and Access Management (IAM)

### The Foundation of AWS Security

**Problem without IAM:**
```
Everyone uses root account (full admin access)
Anyone can delete everything
No audit trail of who did what
```

**Solution with IAM:**
```
Root account: Only for billing, creating first admin user
Admin users: Can create other users, manage permissions
Developer users: Can deploy apps, read CloudWatch
Auditor users: Read-only access

= Least privilege + audit trail
```

### Core Concepts

**1. IAM Users**
- Individual person or application
- Has credentials (password or access keys)
- Example: Developer John, Application HostMaster-Backend

**2. IAM Groups**
- Collection of users
- Attach policies to group → all users inherit
- Example: "Developers" group with EC2 read/write access

**3. IAM Roles**
- Temporary credentials for AWS services
- EC2 instance needs to access S3 → Attach IAM role (no hardcoded keys)
- **Best practice:** Always use roles for applications, not access keys

**4. IAM Policies**
- JSON document defining permissions
```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::my-bucket/*"
}
```
Means: "Allow reading files from my-bucket"

### Least Privilege Principle

**❌ Bad:**
```
Give everyone Admin access
```

**✅ Good:**
```
Backend API needs:
- Read EC2 (to list instances)
- Read RDS (to get costs)
- Read CloudWatch (to get metrics)

Only give those permissions, nothing more
```

---

## Service Categories Deep Dive

### When to Use What?

**Compute:**
- **EC2:** Full control, long-running servers, custom.OS
- **Lambda:** Event-driven, short tasks (< 15 min), serverless
- **ECS:** Containerized apps, microservices
- **Elastic Beanstalk:** Quick deploy (PaaS), less control

**Storage:**
- **S3:** Objects (files), static website, backups
- **EBS:** EC2 instance disk (like C: drive on Windows)
- **EFS:** Shared files across multiple EC2 instances

**Database:**
- **RDS:** Structured data (users, orders, SQL queries)
- **DynamoDB:** High-scale, key-value (sessions, real-time data)
- **ElastiCache:** Cache frequently accessed data (speed up DB queries)
- **Aurora:** Better RDS (5x faster MySQL, but more expensive)

**Interview answer:** "I'd use RDS for HostMaster because user data is structured and relational. DynamoDB would be overkill for our scale and RDS provides familiar SQL queries with automated backups."

---

## Best Practices

### 1. Use Multiple AZs
```
❌ Single AZ: Datacenter fails → App down
✅ Multi-AZ: One datacenter fails → Other AZ takes over
```

### 2. Never Use Root Account
```
Root account = Master key to everything
Create admin user, never use root except for billing
```

### 3. Enable MFA (Multi-Factor Authentication)
```
Password alone = hackable
Password + phone OTP = secure
```

### 4. Tag Everything
```
Name: hostmaster-web-server
Environment: production
Project: HostMaster
CostCenter: Engineering

= Easy to track costs, find resources
```

### 5. Set Billing Alarms
```
CloudWatch alarm:
If estimated monthly bill > $50 → Send email alert

Prevents surprise $10,000 bills
```

### 6. Use CloudFormation or Terraform
```
❌ Manual: Click AWS console, can't reproduce
✅ IaC: terraform apply → Entire infrastructure reproducible
```

### 7. Encrypt Everything
```
EBS volumes: Encrypted with KMS
RDS database: Encrypted at rest
S3 buckets: Encrypted by default
Data in transit: HTTPS/TLS
```

---

## Interview Questions

### Q1: What is cloud computing and why use it?
**A:** Cloud computing is renting computing resources (servers, storage, databases) over the internet instead of owning them. Benefits: lower upfront costs (pay-as-you-go), faster scalability (add capacity in minutes vs months), no maintenance burden (AWS handles hardware), and global reach (deploy worldwide instantly).

### Q2: What's the difference between a Region and an Availability Zone?
**A:** A Region is a geographic area (e.g., us-east-1 in Virginia) with 2-6 Availability Zones. An AZ is one or more physical datacenters within a Region, isolated for disaster recovery. If one AZ fails (power outage, fire), other AZs in the Region continue operating.

### Q3: When would you use EC2 vs Lambda?
**A:** EC2 for long-running processes, full OS control, and custom configurations (web servers, databases). Lambda for event-driven, short-duration tasks (< 15 minutes), serverless workloads where you don't want to manage servers (API endpoints, scheduled jobs, image processing).

###Q4: Explain the difference between S3, EBS, and EFS
**A:** S3 is object storage for files (backups, static websites), accessible over HTTP. EBS is block storage attached to a single EC2 instance (like a hard drive). EFS is shared file storage accessible by multiple EC2 instances simultaneously (NFS). Use S3 for objects, EBS for EC2 disks, EFS for shared files.

### Q5: What is IAM and why is it important?
**A:** IAM (Identity and Access Management) controls who can access what in AWS. It provides users, groups, roles, and policies for least-privilege access. Without IAM, everyone would use the root account (full admin access), creating security risks. IAM provides audit trails and granular permissions.

### Q6: How does AWS pricing work?
**A:** AWS uses pay-as-you-go pricing. You pay for what you use (EC2 by hour, RDS by hour, S3 by GB-month). Reserved Instances offer 30-55% discounts for 1-3 year commitments. Spot Instances offer up to 90% discounts for interruptible workloads. Auto Scaling and right-sizing reduce costs.

### Q7: What's the AWS Free Tier?
**A:** AWS offers 12 months of free services for new accounts: 750 hours/month of t2.micro EC2, 750 hours/month of db.t2.micro RDS, 5 GB S3 storage, and more. Some services like Lambda have always-free tiers (1 million requests/month). Great for learning without spending money.

### Q8: Explain Multi-AZ deployment
**A:** Multi-AZ deploys resources across multiple Availability Zones for high availability. If one AZ fails, traffic automatically fails over to the other AZ. For RDS,Multi-AZ creates a synchronous standby replica in another AZ with automatic failover in 60-120 seconds.

### Q9: What's the difference between RDS and DynamoDB?
**A:** RDS is a managed relational database (PostgreSQL, MySQL) for structured data with SQL queries, ACID transactions, and complex joins. DynamoDB is a NoSQL key-value database for high-scale, simple queries, with automatic scaling. Use RDS for structured data, DynamoDB for high-scale, simple access patterns.

### Q10: How do you choose an AWS region?
**A:** Consider: 1) Latency (deploy close to users), 2) Cost (us-east-1 cheapest), 3) Services (new features launch in us-east-1 first), 4) Compliance (EU data must stay in EU). For HostMaster with US users, I chose us-east-1 for low latency and cost.

---

## Summary

**AWS Fundamentals Mastery Checklist:**
- ✅ Understand what cloud computing is and why it exists
- ✅ Know AWS global infrastructure (Regions, AZs, Edge Locations)
- ✅ Understand core services (EC2, S3, RDS, VPC, IAM)
- ✅ Know when to use which service
- ✅ Understand AWS pricing model
- ✅ Can explain IAM and least privilege
- ✅ Know Multi-AZ for high availability
- ✅ Follow best practices (MFA, tagging, billing alarms)
- ✅ Can answer interview questions confidently

**Key takeaways:**
1. Cloud = Rent instead of buy compute resources
2. AWS = Market leader, most services, best for career
3. Multi-AZ = High availability (2 datacenters)
4. IAM = Security foundation (who can access what)
5. Pay-as-you-go = Only pay for what you use

**Next:** Deep dive into specific AWS services (EC2, RDS, S3, VPC) in the 05-aws-services documentation.
