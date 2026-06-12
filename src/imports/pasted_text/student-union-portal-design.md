Design a premium, modern, scalable **white-label student union portal web application** called **Student Union Portal OS**, with the first implementation branded as **UNZAHSSA Connect (University of Zambia Humanities & Social Sciences Student Association)**.

This system must be designed so that **different student unions or associations can adopt the platform and customize branding entirely from the admin panel without changing code.**

The design should feel:

* premium
* modern university-grade technology
* elegant and institutional
* highly polished
* student-friendly
* luxurious white space
* production-ready

Avoid generic dashboard aesthetics or cheap student portal styling.

The design should feel similar to:

* premium fintech dashboards
* modern university systems
* elegant SaaS products
* Apple-level spacing and polish

## Brand Design System

Default theme for UNZAHSSA:

Primary Color:
Deep navy blue (#1E3A5F equivalent)

Accent Color:
Warm academic gold (#D4A33D equivalent)

Background:
Near white

Cards:
Pure white with subtle shadows

Typography:

* Display/headings: Playfair Display serif
* Body/UI text: Inter sans-serif

Visual style:

* refined spacing
* rounded cards
* elegant shadows
* soft gradients
* premium typography hierarchy
* subtle hover interactions
* minimalist iconography
* responsive layouts

The app must support **dynamic branding** from the admin panel:

Admins should be able to change:

* association name
* logo
* primary color
* accent color
* dashboard welcome text
* footer branding
* contact information

Design the interface so that branding can visually adapt to different associations.

---

## Authentication Pages

Create elegant university-grade authentication UI.

### Login Page

NO demo credentials visible.

Include:

* logo area
* customizable association name
* elegant login card
* email
* password
* forgot password
* sign up
* remember me
* refined illustration or university-themed visual

Professional and trustworthy appearance.

### Registration Page

Include:

* full name
* email
* password
* confirm password
* OTP verification flow
* elegant multi-step registration experience

---

## Student Layout

Sticky top navigation bar:

* dynamic association logo
* dynamic association name
* Dashboard
* Forum
* Affiliations
* Academic Query
* Internship
* Profile
* Logout

Responsive navigation:
desktop + mobile hamburger menu.

---

## Student Dashboard

Premium hero section:

Dynamic welcome banner.

Example:
“Welcome to UNZAHSSA”

Hero should be dynamically editable by admins.

Include:

### Latest News

Beautiful card-based news feed.

Cards include:

* category badge
* pinned indicator
* title
* excerpt
* timestamp

Elegant responsive grid.

---

### Contact the Team

IMPORTANT:

This section must be **fully editable by admins**.

Admins can:

* add contacts
* remove contacts
* edit names
* edit phone numbers
* change WhatsApp links
* rename committee roles

Contact cards include:

* role title
* representative name
* description
* call button
* WhatsApp button

Responsive card layout.

---

## Forum Page

Modern student discussion interface.

Include:

* create post modal
* discussion cards
* replies thread
* reply composer
* empty states

Modern social-discussion feel.

---

## Affiliations Page

Affiliation status should **default to NOT AFFILIATED** until payment is approved.

Status card:

If not affiliated:
orange warning state.

Display:
“Not Affiliated”

Show:
Affiliation Fee:
ZMW 50

CTA:
“Pay Affiliation Fee”

Payment Modal should include payment method selection:

### Mobile Money

* MTN Mobile Money
* Airtel Money

### Cash Payment

Student selects payment method.

Then enters:

* transaction reference
* payer number (for mobile money)
  OR
* cash reference / receipt

After submission:

Status becomes:
“Pending Approval”

Admin must approve before affiliation becomes active.

If approved:

Green success state:

“Affiliated Member”

Benefits unlocked.

Include:

* payment history table
* payment status badges

---

## Academic Query Page

Professional support/ticket UI.

Include:

* query submission form
* subject
* message
* submission history
* status badges
* admin response panel

Modern clean interface.

---

## Internship Landing Page

Premium marketing-style layout.

Elegant hero section.

Professional internship visuals.

CTA:
“Enter Internship Portal”

---

## Internship Portal (3-Step Wizard)

Create premium stepper experience.

Steps:

1. Registration
2. CV & Letter
3. Documents

### Registration Step

Modern structured form.

Include:

* student information
* programme
* year of study
* target organisations

---

### CV Builder

IMPORTANT:

Professional document builder UI.

Must look premium and print-ready.

Include:

* CV editor tabs
* live preview
* font selector
* theme selector
* professional formatting controls

Generated CV download MUST look:

* sharp
* clean
* professional
* printable
* high resolution PDF quality

No blurry exports.

---

### Application Letter Builder

Formal professional letter editor.

Live preview.

Download must produce:
clean professional PDF.

Sharp typography.

Print-ready.

---

### AI Assistant Sidebar

Modern conversational assistant panel.

Elegant UI.

Professional guidance appearance.

---

### Document Upload

Premium upload experience.

Drag-and-drop UI.

Upload:

* NRC
* Transcript
* Certificate
* Recommendation Letter
* Medical
* Other

Completion state when required documents uploaded.

---

## Admin Layout

Dark navy premium collapsible sidebar.

Gold accent highlights.

Elegant institutional admin experience.

Menu:

* Dashboard
* Student Registry
* Internship Reviews
* Analytics
* Payments Management
* System Branding
* Audit Logs

---

## Admin Dashboard

Premium KPI cards.

Charts include:

* donut charts
* radar charts
* bar charts
* placement analytics
* affiliation analytics
* programme distribution
* revenue analytics

Recent payment submissions section.

Buttons:

* Download CSV
* Download Excel
* Download PDF Report

Reports should visually include charts.

---

## Payments Management Page

Admins can:

* approve payments
* reject payments
* search payments
* filter payments
* review payment references

When payment approved:

Student automatically becomes:
“Affiliated”

System automatically sends approval email.

---

## Student Registry

Professional searchable data table.

Filters:

* programme
* year
* affiliation
* internship status

Student profile modal.

Export tools.

---

## Internship Reviews

Card-based student review interface.

Status updates:

* pending
* under review
* approved
* placed
* rejected

Documents review area.

Review notes panel.

---

## Analytics Page

Executive institutional dashboard.

Premium data visualization.

Filtering system:

* programme
* year
* semester
* affiliation status

---

## System Branding Page

Critical white-label feature.

Admins can edit:

* association name
* logo
* hero text
* footer text
* contact email
* primary theme color
* accent color

Include live preview panel showing branding changes.

---

## Audit Logs

Professional read-only activity logs.

Elegant table UI.

---

Design both:

### Desktop Version

and

### Mobile Responsive Version

Ensure the entire UI feels implementation-ready for:

React + TailwindCSS + Supabase.

The result should feel like a premium commercial SaaS product for student unions, not a basic university portal.
