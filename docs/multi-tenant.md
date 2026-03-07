# Multi-Tenant Overview

Tenancy is enforced in the API layer. Each record contains a tenantId.

Tenant Resolution Priority
1. Custom domain mapping
2. Subdomain of BASE_DOMAIN
3. x-tenant-id header (testing)
4. DEFAULT_TENANT_ID fallback

Tenant Guard
- Resolved tenantId is attached to each request
- Write operations verify tenantId matches the resolved tenant
- Optional Clerk org check blocks mismatched orgs
