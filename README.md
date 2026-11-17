# End-to-End DevSecOps & GitOps on AWS EKS — Starter

**Owner:** Anees Ahmad (customize this in your public repo)

**Project status:** Phase 1 starter. **AWS EKS, Terraform, Jenkins, SonarQube, Trivy, Helm, ArgoCD, Prometheus and Grafana are NOT implemented yet.** They are planned learning milestones, not completed features.

## Maqsad (Roman Urdu)

Hum zero se aik simple Node.js status API banayenge, uska automated test likhenge, Docker image banayenge, aur KIND Kubernetes par run karenge. Baad mein Jenkins + DevSecOps scans + Terraform/EKS + Helm/ArgoCD + monitoring add karenge. Pehle local practice hogi taa-ke AWS par unnecessary charges na hon.

## File structure

```text
.
├── app/
│   ├── src/index.js              # Node.js HTTP API, zero npm dependencies
│   ├── test/index.test.js         # Built-in Node test runner
│   ├── Dockerfile                 # Non-root production-style container
│   └── package.json
├── compose.yaml                  # Local Docker Compose
├── k8s/                          # Kubernetes Phase 2 example manifests
├── .github/workflows/ci.yml      # Starter PR check (not Jenkins)
└── docs/                         # Roadmap and Roman Urdu interviews
```

## Prerequisites

- Windows 11 with PowerShell or WSL2/Ubuntu; VS Code; Git.
- Node.js **22 or 24 LTS** and Docker Desktop with Linux containers.
- For Phase 2 only: `kind` and `kubectl`.
- AWS CLI, Terraform, Helm, Jenkins, ArgoCD etc. **not needed** for Phase 1.

## Day 1 — Node.js local app

Open a terminal in the project root (the folder containing `compose.yaml`):

```bash
cd app
node --version
npm test
npm start
```

Open a *second terminal* (keep server running in the first):

```bash
curl http://localhost:3000/
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
curl http://localhost:3000/api/version
```

Windows PowerShell can use `curl.exe` instead of `curl`.

Stop the server using Ctrl+C.

## Day 2 — Docker and Docker Compose

From the **project root**, not `app/`:

```bash
docker build -t devsecops-status-api:0.1.0 ./app
docker run --rm -p 127.0.0.1:3000:3000 devsecops-status-api:0.1.0
```

In another terminal, run `curl http://localhost:3000/health/ready`. Stop with Ctrl+C.

Or run Compose instead:

```bash
docker compose up --build -d
docker compose ps
docker compose logs status-api
docker compose down
```

Do not start the standalone `docker run` container and Compose simultaneously; both need port 3000.

## Day 3 — KIND / Kubernetes, optional preview

Install KIND and kubectl first. From the project root:

```bash
kind create cluster --name devsecops-lab
docker build -t devsecops-status-api:0.1.0 ./app
kind load docker-image devsecops-status-api:0.1.0 --name devsecops-lab
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl -n devsecops-demo get deployments,pods,services
kubectl -n devsecops-demo rollout status deployment/status-api
kubectl -n devsecops-demo port-forward service/status-api 8080:80
```

In another terminal: `curl http://localhost:8080/health/ready`. Stop port-forward with Ctrl+C.

Cleanup local cluster:

```bash
kind delete cluster --name devsecops-lab
```

## GitHub initial push

1. GitHub par aik **empty** public repository banao: `devsecops-gitops-eks` (README auto-create mat karo).
2. Project root mein:

```bash
git init
git add .
git commit -m "feat: add tested Node API, Docker and local Kubernetes starter"
git branch -M main
git remote add origin https://github.com/aneesahmad081/devsecops-gitops-eks.git
git push -u origin main
```

Agar repository exist nahin karti to push fail hoga. Git credentials/GitHub access pehle configure karo. **Never commit access keys, secrets, .env or Terraform state.**

## Milestone checklist

- [ ] Phase 1: `npm test`, API response, Docker working
- [ ] Phase 2: KIND, deployment/service/probes, local scaling
- [ ] Phase 3: Jenkins CI for test/build, secure credentials
- [ ] Phase 4: SonarQube + Trivy scans, quality gates
- [ ] Phase 5: Terraform VPC/EKS/ECR, IAM access, AWS budget
- [ ] Phase 6: Helm chart and ArgoCD GitOps; Jenkins updates config in Git
- [ ] Phase 7: Prometheus metrics, Grafana dashboards, alerting/HPA
- [ ] Phase 8: Failures/recovery tests, README/screenshots, cleanup and interview notes

## Scope note

This is a *learning project with production-inspired patterns*, not a security-audited or certified production system. Phase 1 health endpoints only report local process readiness; in later phases readiness should check critical dependencies when relevant.

## Cost warning

AWS EKS cluster, EC2 worker nodes, NAT gateways, Load Balancers and public IPv4 may generate costs. Always configure AWS budget alerts, verify resources before and after apply, and destroy the lab after screenshots. **Do not execute Terraform apply in a paid account until you have reviewed the resources and pricing.**

## Next reading

- `docs/ROADMAP-ROMAN-URDU.md`
- `docs/INTERVIEW-ROMAN-URDU.md`

## Jenkins Continuous Integration

This project uses Jenkins Declarative Pipeline for:

- GitHub repository checkout
- Node.js environment verification
- Source code syntax validation
- Automated unit testing
- CI build status verification

All 5 automated tests passed successfully.
### CI/CD Automation

Jenkins automatically checks GitHub for new commits
using SCM Polling and runs the CI pipeline.