# School Safety Management System

## Overview

This is a comprehensive school safety management system designed to handle incident reporting, emergency management, visitor tracking, and role-based administrative functions. The system prioritizes safety-critical information with an emergency-ready interface that builds trust and reliability among users. It serves students, staff, and administrators with role-specific features and clear visual hierarchy.

The application focuses on incident reporting (including anonymous bullying reports), visitor management, emergency notifications, and administrative oversight through a clean, professional interface inspired by utility-focused applications like Notion and Asana.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI primitives with shadcn/ui components for consistent, accessible interface elements
- **Styling**: Tailwind CSS with custom design system implementing safety-focused color palette (trust blue, safety red, success green)
- **State Management**: React Context for authentication state, TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured but using Neon serverless)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Development**: Hot module replacement with Vite integration

### Authentication & Authorization
- **Provider**: Firebase Authentication for user management
- **Strategy**: Role-based access control with three tiers (student, staff, admin)
- **Session Handling**: Firebase auth state management with context provider
- **Permission System**: Hierarchical role permissions with utility functions

### Data Architecture
- **Schema Design**: Comprehensive schema covering users, reports, notices, visitors, and occurrences
- **Database Strategy**: PostgreSQL with Drizzle ORM migrations
- **Type Safety**: Shared schema types between frontend and backend using Zod validation
- **Role-based Data Access**: Different data visibility based on user roles

### Design System
- **Component Library**: Custom design system based on shadcn/ui with safety-focused modifications
- **Typography**: Inter font family for excellent readability in safety-critical contexts
- **Color System**: Professional palette with semantic colors (primary blue for trust, safety red for emergencies, success green for completed actions)
- **Responsive Design**: Mobile-first approach with consistent spacing using Tailwind units
- **Accessibility**: High contrast ratios and clear visual hierarchy for emergency situations

### Security Considerations
- **Input Validation**: Zod schemas for runtime type checking and validation
- **Authentication**: Firebase security rules and session-based authorization
- **Anonymous Reporting**: Support for anonymous incident reporting while maintaining data integrity
- **Role Enforcement**: Server-side permission checks for sensitive operations

## External Dependencies

### Authentication & Database
- **Firebase**: Authentication provider with user management and real-time capabilities
- **Neon Database**: Serverless PostgreSQL hosting for production deployment
- **PostgreSQL**: Primary database with session storage via connect-pg-simple

### UI & Styling
- **Radix UI**: Accessible component primitives for dialogs, dropdowns, navigation
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Google Fonts**: Inter and additional fonts for optimal readability
- **Lucide React**: Icon library for consistent iconography

### Development & Build Tools
- **Vite**: Fast build tool with HMR and TypeScript support
- **ESBuild**: Fast bundling for production builds
- **TypeScript**: Type safety across the entire application stack
- **Replit Integration**: Development environment with runtime error handling

### Data & State Management
- **TanStack Query**: Server state management with caching and synchronization
- **Drizzle Kit**: Database migration and schema management tools
- **Date-fns**: Date manipulation and formatting utilities
- **React Hook Form**: Form state management with validation integration