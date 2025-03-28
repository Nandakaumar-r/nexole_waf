# Nexole WAF - Domain Management Troubleshooting Guide

This guide helps you troubleshoot common issues with domain configuration and management in Nexole WAF.

## DNS Configuration Issues

### Traffic Not Flowing Through WAF

If web traffic is not being filtered by the WAF after adding a domain:

1. **Verify DNS Records**:
   - Check that your DNS records have been properly updated to point to the WAF
   - Verify CNAME records for subdomains point to your WAF proxy domain
   - Verify A records for root domains point to the WAF IP address
   
2. **Check DNS Propagation**:
   - DNS changes can take 24-48 hours to fully propagate
   - Use online DNS lookup tools to verify your records are correctly set
   - Check from multiple geographic locations if possible

3. **Confirm WAF Status**:
   - Verify the domain is set to "Active" in the WAF dashboard
   - Check that "Active Protection" is toggled on
   
### SSL/TLS Certificate Issues

If you're experiencing SSL errors after configuring your domain:

1. **Verify SSL Verification Setting**:
   - Check if SSL Verification is enabled in the Security Settings tab
   
2. **Check Certificate Validity**:
   - Ensure your SSL certificate is valid and not expired
   - Verify you have the correct certificate for your domain (including wildcard status if needed)
   
3. **Certificate Chain Issues**:
   - Ensure your certificate chain is complete and properly configured

## Security Rule Issues

### Legitimate Traffic Being Blocked

If legitimate users are being blocked:

1. **Check Geo-Blocking Settings**:
   - Verify you haven't blocked countries where legitimate users are located
   - Temporarily disable Geo-Blocking to see if this resolves the issue
   
2. **Review WAF Rules**:
   - Some rules may be too aggressive for your application
   - Modify or disable specific rules that might be causing false positives
   
3. **Check Rate Limiting**:
   - If rate limiting is enabled, verify the threshold isn't set too low
   - Adjust "Requests Per Minute" to an appropriate value for your application

### Attacks Not Being Blocked

If malicious traffic is getting through:

1. **Verify Protection Status**:
   - Ensure WAF Rules are enabled for the domain
   - Check which security rules are selected
   
2. **Review Rule Selection**:
   - Ensure you've selected appropriate rules for your application type
   - Enable additional rule categories if needed
   
3. **Adjust ML Sensitivity**:
   - If using ML Protection, try increasing the sensitivity level
   - Enable "Auto-Apply ML Rules" for better protection

## Domain Management Issues

### Unable to Add a Domain

If you encounter issues when adding a new domain:

1. **Check Required Fields**:
   - Ensure all required fields are filled in correctly
   - Verify the URL format is correct (e.g., includes https://)
   
2. **Duplicate Domains**:
   - Check if the domain already exists in your WAF configuration
   - You cannot add the same domain twice
   
3. **Server Connectivity**:
   - Verify the WAF can reach your origin server if specified
   - Check that the Target IP (if provided) is correct and accessible

### Unable to Delete a Domain

If you cannot delete a domain:

1. **Permissions Issue**:
   - Verify you have admin permissions in the WAF system
   - Contact your administrator if you don't have sufficient permissions
   
2. **UI Issues**:
   - Try refreshing the page and attempting the deletion again
   - Clear browser cache and cookies if the issue persists

## Performance Issues

### Slow Response Times

If your website becomes slow after implementing the WAF:

1. **Check Origin Server Health**:
   - Verify your origin server is responding quickly
   - Rule out backend issues that may be unrelated to the WAF
   
2. **Reduce Rule Complexity**:
   - Having too many complex rules enabled can impact performance
   - Disable rules that aren't necessary for your security needs
   
3. **Optimize WAF Settings**:
   - Disable ML Protection temporarily to check if it's impacting performance
   - Consider adjusting or disabling heavy features like Bot Protection if not needed

## General Troubleshooting Steps

1. **Check the Request Logs**:
   - Review the request logs for the specific domain
   - Look for blocked requests or errors that might indicate configuration issues
   
2. **Temporarily Disable Protection**:
   - Toggle off "Active Protection" to determine if the WAF is causing the issue
   - Re-enable protection after testing
   
3. **Try Basic Configuration First**:
   - Start with minimal WAF settings and add features incrementally
   - This helps isolate which feature might be causing issues

4. **Contact Support**:
   - If you continue to experience issues, contact Nexole support
   - Provide detailed information about the problem and what you've tried so far

## Common Error Messages

| Error Message | Possible Causes | Solutions |
|---------------|-----------------|-----------|
| "DNS validation failed" | Incorrect DNS records | Verify your DNS configuration against the provided guidance |
| "Origin server not reachable" | Target IP incorrect or server down | Check server status and IP configuration |
| "SSL certificate error" | Certificate issues | Verify certificate is valid and properly installed |
| "Rate limit exceeded" | Too many requests | Adjust rate limiting settings or optimize client requests |
| "Blocked by security rule" | Request matched a security rule | Review the specific rule and consider adjusting if needed |