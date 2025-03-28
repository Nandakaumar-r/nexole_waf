# Domains Guide

## Overview

The Domains page allows you to manage the websites, APIs, and web applications that are protected by the Nexole WAF. This central hub for domain management enables you to configure protection settings, monitor traffic patterns, and implement domain-specific security policies.

![Domains Page](../../attached_assets/image_1743078564132.png)

## Key Components

### 1. Domain List

The main table displays all configured domains with key information:

- **Domain Name**: The fully qualified domain name
- **Description**: Brief description of the domain purpose
- **Target IP**: The origin server's IP address
- **Status**: Current protection status (Protected, Monitoring, Disabled)
- **Traffic**: Visual indicator of current traffic volume
- **Threats**: Counter for recent security threats
- **Protection Level**: Current security level (Basic, Standard, Advanced, Custom)
- **Actions**: Edit, View Details, Delete, Enable/Disable

### 2. Domain Management Panel

This section provides controls for domain management:

- **Add Domain**: Register a new domain for protection
- **Bulk Actions**: Enable, disable, or modify multiple domains
- **Import Domains**: Import domain configurations from file
- **Export Domains**: Export domain settings and statistics

### 3. Domain Detail View

When you select a domain, this panel displays comprehensive information:

- **Overview Tab**:
  - Domain health status
  - Protection summary
  - Traffic statistics
  - Current alerts

- **Configuration Tab**:
  - Origin server settings
  - SSL/TLS configuration
  - Cache settings
  - Custom error pages

- **Security Tab**:
  - Protection level settings
  - Rule sets assigned to this domain
  - Rate limiting configuration
  - Custom security policies

- **Analytics Tab**:
  - Traffic trends
  - Request distribution
  - Performance metrics
  - Error rates

### 4. Domain Editor

When adding or editing a domain, this interface allows you to configure:

- **Basic Properties**:
  - Domain name (with wildcard support)
  - Description and tags
  - Target origin server(s)
  - Backup origin settings

- **SSL/TLS Settings**:
  - Certificate management
  - Cipher configuration
  - TLS version requirements
  - HSTS settings

- **Advanced Settings**:
  - Health checks
  - Timeout configurations
  - Header manipulation
  - Traffic routing rules

### 5. Domain Traffic Dashboard

This section provides a visual overview of domain traffic:

- **Traffic Volume**: Requests per minute/hour/day
- **Geographic Distribution**: Map of visitor locations
- **Response Codes**: Distribution of HTTP status codes
- **Performance Metrics**: Response times and bandwidth usage

## Usage Tips

### Adding a New Domain

When adding a new domain for protection:

1. **Complete DNS Setup**: Ensure DNS records are properly configured before adding
2. **Start Conservative**: Begin with less restrictive security settings
3. **Test Thoroughly**: Verify all functionality works through the WAF
4. **Implement Gradually**: Roll out protection to a subset of users first
5. **Monitor Closely**: Watch for any blocked legitimate traffic

### Domain Organization

Best practices for organizing multiple domains:

1. **Use Tags**: Apply tags for business units, environments, or criticality
2. **Group Related Domains**: Use domain groups for related websites
3. **Standardize Naming**: Use consistent naming conventions for easier management
4. **Document Purposes**: Add clear descriptions for each domain
5. **Define Ownership**: Assign responsible teams or individuals

### Protection Strategies

Optimize protection based on domain type:

1. **Public Websites**: Focus on bot protection and DDoS mitigation
2. **E-commerce**: Prioritize payment form protection and business logic attacks
3. **APIs**: Configure specific content type and structure validation
4. **Admin Portals**: Implement stricter access controls and rate limiting

## Best Practices

1. **Multi-Layer Protection**: Combine different security features for comprehensive protection.

2. **Regular Health Checks**: Set up automated health checks to verify domain accessibility.

3. **Traffic Analysis**: Review traffic patterns regularly to spot anomalies.

4. **Custom Error Pages**: Configure branded error pages for better user experience.

5. **Domain-Specific Rules**: Create customized rule sets for each domain's unique needs.

## Related Pages

- [Dashboard](./dashboard_guide.md) - For high-level security overview
- [Geo Blocking](./geo_blocking_guide.md) - To restrict access by geographic location
- [Rules](./rules_guide.md) - To manage security rules for domains