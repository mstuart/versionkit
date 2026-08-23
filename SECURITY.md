# Security Policy

## Supported Versions

Security fixes are provided for the latest released version and the current default branch.

## Scope

Reports are in scope when attacker-controlled request data can select an unintended registered handler, bypass version-routing boundaries, inject malformed security-sensitive response metadata, cause realistic denial of service, or compromise the published package.

Caller-provided handlers, host-framework authentication, and application configuration are outside scope unless Versionkit causes the boundary violation.

## Reporting a Vulnerability

Report suspected vulnerabilities through [GitHub private vulnerability reporting](https://github.com/mstuart/versionkit/security/advisories/new). Do not open a public issue.

Include the affected version, host framework, reproduction steps, and impact. Do not include secrets or personal data. Remediation and disclosure will be coordinated through the private advisory.
