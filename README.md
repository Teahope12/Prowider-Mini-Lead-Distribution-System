# Provider Lead Distribution System

## 📌 Live Demo
[Insert your Vercel deployment URL here]

## 📋 Project Overview
A full-stack lead distribution system that automatically assigns customer service enquiries to multiple providers based on predefined business rules. The system ensures fair lead allocation, respects provider monthly quotas, and provides real-time dashboard updates.

### Key Features
- **Customer Service Request Form** with duplicate prevention
- **Automatic Lead Distribution** to exactly 3 providers per lead
- **Mandatory Provider Rules** for specific service types
- **Round-Robin Fair Allocation** for remaining provider slots
- **Real-Time Dashboard Updates** via Server-Sent Events (SSE)
- **Provider Quota Management** (10 leads per month)
- **Idempotent Webhook** for quota reset simulation
- **Concurrency Testing** with 10-lead bulk generation

## 🛠️ Tech Stack
| Technology | Purpose |
|------------|---------|
| Next.js 14 | Frontend & API routes |
| Prisma ORM | Database ORM |
| PostgreSQL (Supabase) | Database |
| Server-Sent Events (SSE) | Real-time updates |
| Tailwind CSS | Styling |

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase/Neon/Railway)

### Installation Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd provider-lead-system

2.Install dependencies

npm install

3. Create .env.local file:
DATABASE_URL="postgresql://your-connection-string"


4. Setup database
# Push schema to database
npx prisma db push

# Seed providers (8 providers with quotas)
node prisma/seed.js

5. Run development server
npm run dev

6. Access the application

Customer Form: http://localhost:3000/request-service
Provider Dashboard: http://localhost:3000/dashboard
Test Tools: http://localhost:3000/test-tools

7. Allocation Algorithm Explanation
Overview
The system uses a Round-Robin algorithm with database persistence to ensure fair distribution of leads among eligible providers.

How It Works
1. Provider Classification
Each service has two provider categories:

Mandatory Providers - Always receive every lead (if quota available)

Pool Providers - Eligible for remaining slots via round-robin

Service	Mandatory Providers	Pool Providers
Service 1	Provider 1	Providers 2, 3, 4
Service 2	Provider 5	Providers 6, 7, 8
Service 3	Providers 1, 4	Providers 2, 3, 5, 6, 7, 8
2. Round-Robin Implementation
javascript
// AllocationCounter table stores last index per service
{
  serviceType: "Service 1",
  lastIndex: 0  // Next provider to assign
}

// Selection logic
const poolProviders = getEligibleProviders(serviceType)
const nextProvider = poolProviders[currentIndex % poolProviders.length]
counter.lastIndex++ // Increment for next lead
3. Allocation Process
For each new lead:

Select mandatory providers (always included if quota available)

Calculate remaining slots (Total 3 providers - mandatory count)

Apply round-robin to select remaining providers from pool

Check quotas before finalizing assignment

Update counter in database for persistence

4. Persistence Mechanism
AllocationCounter table stores the last index for each service

After server restart, counter resumes from last saved position

Ensures fair distribution continues across application restarts

Example Distribution for Service 1:

text
Lead 1: Mandatory (P1) + Pool providers: P2, P3
Lead 2: Mandatory (P1) + Pool providers: P4, P2  
Lead 3: Mandatory (P1) + Pool providers: P3, P4
Lead 4: Mandatory (P1) + Pool providers: P2, P3 (cycles back)
🔒 Concurrency Handling
Challenge
Multiple leads submitted simultaneously could cause:

Quota violations (provider exceeding 10 leads)

Duplicate assignments

Race conditions in allocation

Solutions Implemented
1. Database Transactions
Every lead creation runs in a prisma.$transaction():

javascript
await prisma.$transaction(async (tx) => {
  // All operations within transaction
  const lead = await tx.lead.create({ data })
  await tx.leadAssignment.createMany({ data })
  await tx.provider.updateMany({ data })
  
  // If any fails, ALL changes rollback
})
2. Atomic Operations
Lead creation, assignments, and quota updates happen together

No partial state - either all succeed or none commit

Prevents quota double-counting under load

3. Database-Level Constraints
prisma
model Lead {
  @@unique([phoneNumber, serviceType])  // No duplicate leads
}

model LeadAssignment {
  @@unique([leadId, providerId])  // No duplicate assignments
}
4. Quota Checking Before Assignment
javascript
const eligibleProviders = await tx.provider.findMany({
  where: {
    leadsAssigned: { lt: 10 }  // Only providers with quota
  }
})
5. Concurrency Testing
The system includes a test endpoint that generates 10 leads simultaneously:

Each lead processed in its own transaction

Quota checks prevent over-assignment

Dashboard updates in real-time for each lead

Results
✅ 10 concurrent leads = 0 quota violations

✅ Each lead assigned to exactly 3 providers

✅ No duplicate assignments

✅ All transactions complete successfully

🔁 Webhook Idempotency
What is Idempotency?
An idempotent operation produces the same result whether called once or multiple times with the same parameters.

Implementation Strategy
1. Unique Event ID
Each webhook call includes a unique eventId:

json
{
  "eventId": "reset_1705123456789_abc123"
}
2. Receipt Storage
prisma
model WebhookReceipt {
  id        String   @id @default(cuid())
  eventId   String   @unique  // Prevents duplicates
  processed DateTime @default(now())
}
3. Idempotency Check Flow
javascript
export async function POST(request) {
  const { eventId } = await request.json()
  
  // Check if already processed
  const existing = await prisma.webhookReceipt.findUnique({
    where: { eventId }
  })
  
  if (existing) {
    return { message: "Already processed", alreadyProcessed: true }
  }
  
  // Process webhook within transaction
  await prisma.$transaction(async (tx) => {
    await tx.provider.updateMany({ data: { leadsAssigned: 0 } })
    await tx.webhookReceipt.create({ data: { eventId } })
  })
}
4. Testing Idempotency
The test tools page includes a "Test Idempotency" button that:

Calls the webhook 3 times with the same eventId

First call resets quotas and stores receipt

Subsequent calls return cached response without resetting

Expected Output:

text
Call #1: First time - quotas reset
Call #2: Already processed (idempotency working)
Call #3: Already processed (idempotency working)
Benefits
Prevents duplicate quota resets

Safe for retry mechanisms

Audit trail of processed events

Idempotent by default - no side effects on retries

🧪 Testing the System
Test Scenarios
Test Case	How to Test	Expected Result
Duplicate Lead	Submit same phone + service twice	Error: "Duplicate lead"
Fair Allocation	Generate 10 leads	Each pool provider gets equal leads
Quota Enforcement	Submit 11 leads to same provider	11th lead fails (quota exceeded)
Real-time Updates	Open dashboard + submit lead	Dashboard updates within 2 seconds
Webhook Idempotency	Click "Test Idempotency"	Only first call processes
Concurrency	Click "Generate 10 Leads"	All 10 succeed, no quota violations
Quick Test Guide
Open Dashboard in one browser tab

Open Test Tools in another tab

Click "Reset Provider Quotas"

Click "Generate 10 Leads Instantly"

Watch dashboard - leads appear in real-time


*******Project Folder Structure ********


provider-lead-system/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── leads/
│   │   │   │   └── route.js                # POST - Create new lead
│   │   │   ├── dashboard/
│   │   │   │   └── route.js                # GET - Fetch provider data
│   │   │   ├── webhook/
│   │   │   │   └── route.js                # POST - Reset quotas (idempotent)
│   │   │   ├── test/
│   │   │   │   └── route.js                # POST - Generate 10 leads
│   │   │   └── sse/
│   │   │       └── route.js                # GET - Server-Sent Events stream
│   │   ├── request-service/
│   │   │   └── page.jsx                    # Public customer form
│   │   ├── dashboard/
│   │   │   └── page.jsx                    # Provider dashboard
│   │   ├── test-tools/
│   │   │   └── page.jsx                    # Webhook testing panel
│   │   ├── layout.jsx                      # Root layout with SSE provider
│   │   └── page.jsx                        # Landing/redirect page
│   ├── lib/
│   │   ├── prisma.js                       # Prisma client singleton (updated for Supabase)
│   │   ├── allocation/
│   │   │   ├── fairAllocation.js           # Round-robin logic
│   │   │   ├── mandatoryRules.js           # Service → mandatory providers
│   │   │   └── quotaChecker.js             # Validate provider quotas
│   │   ├── validation/
│   │   │   └── duplicateCheck.js           # Phone+service duplicate validation
│   │   └── realtime/
│   │       └── eventEmitter.js             # SSE event manager
│   └── components/
│       ├── LeadForm.jsx                    # Reusable form component
│       ├── DashboardTable.jsx              # Provider leads table
│       ├── QuotaDisplay.jsx                # Quota progress bars
│       └── RealTimeProvider.jsx            # SSE connection wrapper
├── prisma/
│   ├── schema.prisma                       # Database schema (same)
│   ├── seed.js                             # Seed 8 providers + 3 services (same)
│   └── migrations/                         # Auto-generated migrations
├── public/
│   └── (empty)
├── .env.local                              # SUPABASE connection string
├── .gitignore
├── package.json
├── next.config.js
└── README.md