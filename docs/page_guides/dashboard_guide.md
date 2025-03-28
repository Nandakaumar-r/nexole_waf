# Dashboard Guide

## Overview

The Dashboard is the central command center of the Nexole WAF, providing an at-a-glance view of your security posture and key metrics. This page is designed to give security administrators immediate visibility into the system's status, recent attacks, and potential issues requiring attention.

![Dashboard](../../attached_assets/image_1743061465752.png)

## Key Components

### 1. Traffic Summary Card

This card displays the total number of requests processed by the WAF, categorized as:
- **Total Requests**: Overall traffic volume
- **Allowed Requests**: Legitimate traffic that passed security checks
- **Blocked Requests**: Malicious traffic stopped by the WAF

### 2. Traffic Trend Chart

The main chart visualizes traffic patterns over time, showing:
- Allowed traffic (green)
- Blocked traffic (red)
- Total traffic volume

You can toggle different views using the timeframe selector to see traffic patterns over the last hour, day, week, or month.

### 3. Request Methods Breakdown

This doughnut chart shows the distribution of HTTP methods (GET, POST, PUT, DELETE, etc.) across all traffic, helping identify unusual method usage patterns.

### 4. Recent Attacks

This section lists the most recent security incidents detected by the WAF, including:
- Attack timestamp
- Source IP address
- Attack type
- Targeted endpoint
- Action taken

Click on any attack entry to view detailed information about the attack and the rule that blocked it.

### 5. Top Attackers

Shows the most active malicious IP addresses, including:
- Attacker IP
- Number of malicious requests
- Geographic location
- Last seen timestamp
- Quick block button for immediate mitigation

### 6. Protected Domains

Displays a list of all domains protected by the WAF with key metrics for each:
- Traffic volume
- Block rate
- Health status

### 7. System Health

Shows the current status of key system components:
- WAF Engine
- Database Connection
- Rule Processing
- Threat Intelligence Feeds

### 8. Latest Rules

Lists recently created or modified security rules with their activation status and description.

## Usage Tips

### Timeframe Selection

Use the date range selector in the top-right corner to adjust the timeframe for all dashboard metrics. Options include:
- Last hour
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

### Export and Reporting

The "Export" button allows you to:
- Download dashboard data in CSV or JSON format
- Generate a PDF report of current metrics
- Schedule regular reports to be delivered via email

### Interactive Elements

- Hover over charts for detailed tooltips
- Click on chart segments to filter data
- Use the search function to find specific metrics or events
- Click the refresh button to get the latest data

### Customization

Administrators can customize the dashboard by:
- Rearranging widget positions
- Showing/hiding specific metrics
- Adjusting chart visualization types
- Setting default timeframes

## Best Practices

1. **Regular Monitoring**: Check the dashboard at least once daily to stay aware of your security posture.

2. **Investigate Spikes**: Any sudden increases in blocked traffic should be investigated promptly.

3. **Track Trends**: Use the historical data to identify patterns that might indicate targeted attacks.

4. **Quick Response**: Use the one-click actions to respond rapidly to emerging threats.

5. **Share Insights**: Use the export functionality to share security insights with stakeholders.

## Related Pages

- [Requests](./requests_guide.md) - For detailed traffic analysis
- [Rules](./rules_guide.md) - To manage security rules
- [Threat Intelligence](./threat_intelligence_guide.md) - For deeper threat analysis