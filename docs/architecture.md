# Architecture

The authoritative architecture document, with the system, request-flow, data-model and Docker deployment diagrams, is:

- [`assessment/task-01-application-setup/architecture/architecture.md`](../assessment/task-01-application-setup/architecture/architecture.md)

The local Docker Compose deployment serves the app over HTTP on port 8080. HTTPS is not enabled in the local stack; for a public domain, TLS must be added at Nginx or an upstream terminator (see `assessment/task-04-deployment/deployment-guide.md`, section 6).
