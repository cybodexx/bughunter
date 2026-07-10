# SecureScan Pro - Web Security Vulnerability Scanner

## Overview

SecureScan Pro is a professional web vulnerability scanner designed for authorized security testing. It provides comprehensive security assessments through multiple testing modules including SQL injection detection, XSS vulnerability scanning, directory traversal testing, authentication bypass checks, parameter fuzzing, and SSL/TLS analysis. The application features a modern React frontend with a professional dark theme and an Express.js backend that orchestrates security scanning operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible interface elements
- **Styling**: Tailwind CSS with custom design tokens and a professional dark theme optimized for security tools
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates and real-time polling
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **Module System**: ESM (ES Modules) for modern JavaScript module handling
- **Scanner Engine**: Modular security testing system with weighted progress tracking across multiple vulnerability categories
- **Request Handling**: Axios and Cheerio for web scraping and HTML parsing during security tests
- **Development Tools**: TSX for TypeScript execution in development with hot reloading

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL for scalable cloud database hosting
- **Schema**: Structured tables for scans, vulnerabilities, and related metadata with proper foreign key relationships
- **Development Storage**: In-memory storage adapter for development and testing scenarios

### Authentication and Authorization
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple for persistent user sessions
- **Security**: Currently uses development-level authentication with plans for production-grade security implementation

### External Dependencies
- **Database**: Neon serverless PostgreSQL for production data persistence
- **UI Framework**: Radix UI primitives for accessible, unstyled component foundations
- **HTTP Client**: Axios for robust HTTP request handling with interceptors and error handling
- **Web Parsing**: Cheerio for server-side HTML parsing and DOM manipulation during security scans
- **Validation**: Zod for runtime type checking and schema validation across the application
- **Development Environment**: Replit integration with custom plugins for enhanced development experience

### Security Scanner Implementation
The core scanning engine implements a modular architecture where each security test (SQL injection, XSS, directory traversal, etc.) operates as an independent module with configurable intensity levels. The system tracks scan progress through weighted modules and maintains real-time status updates via polling. All scan results are categorized by severity levels (critical, high, medium, low) with detailed remediation recommendations and CWE mappings for industry-standard vulnerability classification.