# Backend Resiliency Plan

Ordered by effort. Each tier builds on the previous.

---

## Tier 1 — Minutes, immediate protection

### 1. Automated DB backups
- Set `backup_retention_period = 7` on RDS — enables daily snapshots and point-in-time recovery (PITR) to 5-minute granularity
- Set `skip_final_snapshot = false` — retains a snapshot when the instance is destroyed
- **Status:** done

### 2. DB deletion protection
- Set `deletion_protection = true` on RDS — prevents accidental `terraform destroy` or console wipe of the prod database
- **Status:** done

---

## Tier 2 — Hours, big operational wins

### 3. Structured JSON logging in FastAPI
- Replace uvicorn's default unstructured text logs with JSON (fields: `level`, `timestamp`, `request_id`, `route`, `status_code`)
- Makes CloudWatch Insights queries and alerting actually useful
- **Status:** todo

### 4. ECS deployment circuit breaker
- Add `deployment_circuit_breaker { enable = true, rollback = true }` to the ECS service
- Bad deploys auto-rollback to the previous task definition instead of hanging
- **Status:** todo

### 5. CloudWatch alarm: ECS task count = 0
- Alarm fires if running task count drops to 0 (site is down signal)
- Pair with SNS topic → email/SMS notification
- Add alarms for RDS storage and ALB 5xx rate while here
- **Status:** todo

---

## Tier 3 — Half-day, meaningful HA

### 6. ECS desired_count = 2
- Run 2 tasks behind the existing ALB so rolling deploys and task restarts are zero-downtime
- **Status:** todo

### 7. Multi-AZ RDS
- Set `multi_az = true` — adds a synchronous standby in a second AZ, automatic failover in ~60s
- **Status:** todo

---

## Tier 4 — Bigger investment

### 8. Terraform remote state
- Move state to S3 + DynamoDB locking — prevents state divergence when multiple people run Terraform
- Required before the infra is touched by more than one person
- **Status:** todo

### 9. CloudWatch dashboard + runbook
- Combine alarms and log insights queries into a dashboard
- Write a short runbook: what to do when each alarm fires
- **Status:** todo
