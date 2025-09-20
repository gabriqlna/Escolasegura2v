# School Safety Management System - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from utility-focused applications like Notion, Asana, and Linear for the administrative interfaces, while incorporating visual elements from safety-focused platforms. This balances functionality with the serious nature of school safety management.

## Core Design Principles
- **Trust and Reliability**: Clean, professional interface that instills confidence
- **Role-Based Visual Hierarchy**: Clear differentiation between student, staff, and admin interfaces
- **Accessibility First**: High contrast, clear typography, and intuitive navigation
- **Emergency-Ready**: Critical actions (emergency button) prominently displayed

## Color Palette

### Primary Colors
- **Primary Blue**: 217 91% 60% (trustworthy, professional)
- **Safety Red**: 0 84% 60% (emergency actions, alerts)
- **Success Green**: 142 76% 36% (completed actions, safe status)

### Supporting Colors
- **Warning Orange**: 38 92% 50% (caution, pending items)
- **Background Gray**: 220 14% 96% (light mode background)
- **Text Dark**: 220 9% 20% (primary text)
- **Text Medium**: 220 9% 46% (secondary text)

### Dark Mode
- **Background Dark**: 220 13% 18%
- **Surface Dark**: 220 13% 24%
- **Primary Blue Dark**: 217 91% 65%

## Typography
**Primary Font**: Inter (Google Fonts) - excellent readability for safety-critical information
**Secondary Font**: Roboto (Google Fonts) - for data tables and forms
- **Headings**: Inter, 600 weight
- **Body**: Inter, 400 weight
- **Critical Actions**: Inter, 500 weight

## Layout System
**Tailwind Spacing Units**: Consistent use of 2, 4, 8, 12, 16 units
- **Component Spacing**: p-4, m-8
- **Section Spacing**: py-12, px-4
- **Grid Gaps**: gap-4 for cards, gap-8 for sections

## Component Library

### Navigation
- **Role-Based Sidebar**: Different menu items based on user permissions
- **Emergency Button**: Always visible, fixed position (top-right)
- **Notification Badge**: Real-time updates for urgent alerts

### Cards and Containers
- **Report Cards**: Subtle shadow, rounded corners (8px), color-coded by urgency
- **Dashboard Widgets**: Clean white/dark containers with clear headers
- **Alert Banners**: Prominent positioning for urgent notices

### Forms
- **Incident Reporting**: Progressive disclosure, anonymous option toggle
- **User Management**: Table-based with action buttons
- **Visitor Log**: Time-stamped entries with status indicators

### Data Display
- **Surveillance Grid**: 2x2 camera feed simulation with status indicators
- **Safety Checklist**: Progress bars and checkbox interactions
- **Calendar View**: Clean month/week views for drills and events

## Role-Based Interface Variations

### Student Interface
- **Simplified Navigation**: Essential features only
- **Large Action Buttons**: Easy access to report incidents and emergency
- **Educational Content**: Prominent campaigns and safety information

### Staff Interface
- **Extended Functionality**: Additional visitor and occurrence management
- **Quick Actions**: Streamlined workflows for daily tasks
- **Status Indicators**: Clear visual feedback for completed actions

### Admin Interface
- **Comprehensive Dashboard**: Overview of all system activity
- **Management Tools**: User administration and system configuration
- **Analytics Views**: Reports and trend visualization

## Critical Interactions

### Emergency Button
- **Position**: Fixed top-right, always visible
- **Design**: Large, red, with icon and text
- **Animation**: Subtle pulse when inactive, immediate feedback when pressed

### Anonymous Reporting
- **Visual Cue**: Lock icon and "Anonymous" badge
- **Form Design**: Simplified, non-intimidating interface
- **Confirmation**: Clear feedback without revealing identity

### Push Notifications
- **In-App**: Toast notifications with role-appropriate styling
- **Visual Priority**: Color-coded by urgency level

## Accessibility Features
- **High Contrast**: Meets WCAG AA standards
- **Keyboard Navigation**: All functions accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Font Scaling**: Responsive typography that scales appropriately

## Images
No large hero images required. Focus on:
- **Icon Library**: Heroicons for consistent iconography
- **Camera Placeholders**: Subtle surveillance feed mockups
- **Safety Illustrations**: Simple, clear diagrams for evacuation plans

This design system prioritizes functionality and trust while maintaining visual appeal appropriate for a safety-critical application.