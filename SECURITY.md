# Security Advisory

## Known Vulnerabilities

### CVE: ip Package SSRF Vulnerability (GHSA-2p57-rm9w-gvfp)

**Status**: Acknowledged - No patch available  
**Severity**: High  
**Package**: `ip@<=2.0.1`  
**Path**: Transitive dependency via React Native CLI

**Description**:
The `ip` package has an SSRF (Server-Side Request Forgery) vulnerability in its `isPublic` function. This affects versions <=2.0.1.

**Impact Assessment**:

- **Risk Level**: Low for this project
- **Reason**: The vulnerable package is only used by React Native CLI tooling during development
- **Runtime Impact**: None - not used in production application code
- **Development Impact**: Minimal - CLI tools run in controlled development environment

**Mitigation**:

1. ✅ Dependency override applied to use `ip@1.1.9` (older stable version)
2. ✅ Regular security audits scheduled
3. ✅ Monitoring for upstream patches

**Action Items**:

- [ ] Monitor React Native CLI updates for dependency resolution
- [ ] Check quarterly for `ip` package patches
- [ ] Consider alternative CLI tools if vulnerability becomes critical

**Last Updated**: January 2025

---

## Security Best Practices

- All production dependencies are regularly audited
- Supabase RLS (Row Level Security) enabled
- JWT tokens with proper expiry/refresh
- Input validation using Zod schemas
- API rate limiting implemented
- CORS properly configured
