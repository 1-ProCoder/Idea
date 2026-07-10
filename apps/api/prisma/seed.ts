/* eslint-disable no-console */
/**
 * Idempotent demo-data seeder.
 *
 * Strategy:
 *   1. Pick the first BusinessProfile in the database. If none exists,
 *      bail with a clear message — the user must sign in via Clerk at
 *      least once so `getOrCreateDefaultBusiness` provisions a row.
 *   2. Use phone numbers + email addresses as the dedupe key inside a
 *      business, so re-running this seed is a no-op (update path) instead
 *      of accumulating duplicate workers/calls.
 *
 * Run with: `npm -w @flowfix/api run prisma:seed`
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const business = await prisma.businessProfile.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  if (!business) {
    console.error(
      '\n[seed] No BusinessProfile found in the database.\n' +
        '       Sign in to the app once via Clerk so the API provisions a\n' +
        '       default BusinessProfile, then re-run this script.\n',
    );
    process.exit(1);
  }

  console.log(`[seed] Using business "${business.name}" (${business.id})`);

  // ─── 1. Workers (technicians) ──────────────────────────────────────
  const WORKERS = [
    {
      phone: '(555) 220-1010',
      email: 'james@flowfix.demo',
      name: 'James Mobile',
      role: 'TECHNICIAN' as const,
    },
    {
      phone: '(555) 220-1011',
      email: 'aisha@flowfix.demo',
      name: 'Aisha Khan',
      role: 'TECHNICIAN' as const,
    },
    {
      phone: '(555) 220-1012',
      email: 'diego@flowfix.demo',
      name: 'Diego Perez',
      role: 'TECHNICIAN' as const,
    },
    {
      phone: '(555) 220-1013',
      email: 'marcus@flowfix.demo',
      name: 'Marcus Wells',
      role: 'ADMIN' as const,
    },
    {
      phone: '(555) 220-1014',
      email: 'lina@flowfix.demo',
      name: 'Lina Tran',
      role: 'TECHNICIAN' as const,
    },
    {
      phone: '(555) 220-1015',
      email: 'sara@flowfix.demo',
      name: 'Sara Boyd',
      role: 'TECHNICIAN' as const,
    },
  ];

  const workerRecords = [];
  for (const w of WORKERS) {
    const upserted = await prisma.worker.upsert({
      where: { businessId_phone: { businessId: business.id, phone: w.phone } },
      update: { name: w.name, role: w.role, email: w.email, active: true },
      create: {
        businessId: business.id,
        name: w.name,
        role: w.role,
        phone: w.phone,
        email: w.email,
        active: true,
      },
    });
    workerRecords.push(upserted);
  }

  // ─── 2. Customers ──────────────────────────────────────────────────
  const CUSTOMERS = [
    {
      phone: '(555) 234-8910',
      name: 'Sarah Mitchell',
      email: 'sarah@email.demo',
      address: '128 Birch Ln, Brighton',
    },
    {
      phone: '(555) 882-0011',
      name: 'Carlos Reyes',
      email: 'carlos@email.demo',
      address: '44 Elm Rd, Brighton',
    },
    {
      phone: '(555) 119-2275',
      name: 'Priya Shah',
      email: 'priya@email.demo',
      address: '12 Pine St, Brighton',
    },
  ];

  const customerRecords = [];
  for (const c of CUSTOMERS) {
    const upserted = await prisma.customer.upsert({
      where: { businessId_phone: { businessId: business.id, phone: c.phone } },
      update: { name: c.name, email: c.email, address: c.address },
      create: {
        businessId: business.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
      },
    });
    customerRecords.push(upserted);
  }

  const james = workerRecords.find((w) => w.name === 'James Mobile');
  const aisha = workerRecords.find((w) => w.name === 'Aisha Khan');
  const marcus = workerRecords.find((w) => w.name === 'Marcus Wells');
  const diego = workerRecords.find((w) => w.name === 'Diego Perez');
  const lina = workerRecords.find((w) => w.name === 'Lina Tran');
  if (!james || !aisha || !marcus || !diego || !lina) {
    throw new Error('[seed] Worker roster incomplete — aborting.');
  }

  // ─── 3. Jobs + linked Appointments ────────────────────────────────
  // Each job in this seed is paired with an Appointment at a fixed
  // future time. Re-running this script updates the appointment fields
  // (start/end) but does not recreate the Job, because the dedupe key
  // here is the (customerId + issue) pair — we manually check first.
  const NOW = Date.now();
  const HOUR = 60 * 60 * 1000;
  const today = new Date(NOW);
  today.setHours(10, 30, 0, 0); // 10:30 today

  const JOBS: Array<{
    customerIndex: number;
    issue: string;
    priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
    status: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
    workerId: string;
    offsetHours: number;
    durationHours: number;
  }> = [
    {
      customerIndex: 0,
      issue: 'Burst pipe, kitchen flooding',
      priority: 'EMERGENCY',
      status: 'SCHEDULED',
      workerId: james.id,
      offsetHours: 4,
      durationHours: 1.5,
    },
    {
      customerIndex: 1,
      issue: 'AC tune-up',
      priority: 'NORMAL',
      status: 'SCHEDULED',
      workerId: marcus.id,
      offsetHours: 6,
      durationHours: 1,
    },
    {
      customerIndex: 2,
      issue: 'Quote visit for water heater replacement',
      priority: 'NORMAL',
      status: 'PENDING',
      workerId: aisha.id,
      offsetHours: 9,
      durationHours: 1,
    },
    {
      customerIndex: 0,
      issue: 'Bathroom faucet install',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      workerId: lina.id,
      offsetHours: -2,
      durationHours: 2,
    },
    {
      customerIndex: 1,
      issue: 'Furnace inspection',
      priority: 'NORMAL',
      status: 'COMPLETED',
      workerId: diego.id,
      offsetHours: -24,
      durationHours: 1.5,
    },
  ];

  for (const j of JOBS) {
    const customer = customerRecords[j.customerIndex];
    if (!customer) continue;

    // Idempotent: find existing by (customerId + issue), then update or create.
    const existing = await prisma.job.findFirst({
      where: { customerId: customer.id, issue: j.issue },
    });

    const start = new Date(today.getTime() + j.offsetHours * HOUR);
    const end = new Date(start.getTime() + j.durationHours * HOUR);

    let job = existing;
    if (!job) {
      job = await prisma.job.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          workerId: j.workerId,
          issue: j.issue,
          status: j.status,
          priority: j.priority,
          notes: 'Seed: created by demo seed.',
        },
      });
      await prisma.appointment.create({
        data: {
          businessId: business.id,
          jobId: job.id,
          workerId: j.workerId,
          start,
          end,
          status: j.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
        },
      });
    } else {
      job = await prisma.job.update({
        where: { id: job.id },
        data: {
          workerId: j.workerId,
          status: j.status,
          priority: j.priority,
        },
      });
      await prisma.appointment.upsert({
        where: { jobId: job.id },
        update: { start, end, status: j.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED' },
        create: {
          businessId: business.id,
          jobId: job.id,
          workerId: j.workerId,
          start,
          end,
          status: j.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
        },
      });
    }
  }

  // ─── 4. Calls (last 7 days, sprinkled) ─────────────────────────────
  const CALLS = [
    { fromPhone: '(555) 234-8910', summary: 'Burst pipe, kitchen flooding', isEmergency: true, dayOffset: 0 },
    { fromPhone: '(555) 882-0011', summary: 'AC tune-up request', isEmergency: false, dayOffset: 0 },
    { fromPhone: '(555) 119-2275', summary: 'Quote for water heater', isEmergency: false, dayOffset: 0 },
    { fromPhone: '(555) 667-3104', summary: 'Out-of-hours inquiry', isEmergency: false, dayOffset: 1 },
    { fromPhone: '(555) 442-7788', summary: 'No hot water', isEmergency: false, dayOffset: 1 },
    { fromPhone: '(555) 220-0181', summary: 'Leaking radiator', isEmergency: false, dayOffset: 2 },
    { fromPhone: '(555) 909-3344', summary: 'No answer callback', isEmergency: false, dayOffset: 2 },
    { fromPhone: '(555) 998-0011', summary: 'Quote for bathroom remodel', isEmergency: false, dayOffset: 3 },
    { fromPhone: '(555) 776-1144', summary: 'Humming circuit breaker', isEmergency: false, dayOffset: 4 },
    { fromPhone: '(555) 552-7782', summary: 'A/C not cooling', isEmergency: false, dayOffset: 5 },
    { fromPhone: '(555) 313-2288', summary: 'New customer callback', isEmergency: false, dayOffset: 5 },
    { fromPhone: '(555) 808-9911', summary: 'Pipe leak under sink', isEmergency: false, dayOffset: 6 },
  ];

  let createdCalls = 0;
  for (const c of CALLS) {
    const existing = await prisma.call.findFirst({
      where: { businessId: business.id, fromPhone: c.fromPhone, summary: c.summary },
    });
    if (existing) continue;

    const createdAt = new Date(today.getTime() - c.dayOffset * 24 * HOUR + Math.random() * 12 * HOUR);

    await prisma.call.create({
      data: {
        businessId: business.id,
        fromPhone: c.fromPhone,
        summary: c.summary,
        isEmergency: c.isEmergency,
        duration: c.isEmergency ? 120 + Math.floor(Math.random() * 90) : 30 + Math.floor(Math.random() * 90),
        createdAt,
      },
    });
    createdCalls += 1;
  }

  // ─── 5. Business settings (defaults for new dashes) ────────────────
  await prisma.businessProfile.update({
    where: { id: business.id },
    data: {
      notificationPrefsJson: {
        'missed-call': { sms: true, email: true, push: true },
        emergency: { sms: true, email: true, push: true },
        'invoice-paid': { sms: false, email: true, push: false },
        'tech-on-route': { sms: false, email: false, push: true },
        'new-customer': { sms: false, email: true, push: false },
      },
      aiConfigJson: {
        voice: 'aria',
        greeting:
          'Hi, this is the AI receptionist at FlowFix. How can I help you today?',
        emergencyKeywords: ['burst', 'leak', 'gas', 'no heat', 'electrical fire'],
        bookingWindowHours: 24,
      },
      brandingJson: {
        primaryColor: '#3B82F6',
        accentColor: '#8B5CF6',
      },
    },
  });

  console.log(
    `[seed] Done. Upserted ${workerRecords.length} workers, ${customerRecords.length} customers, ${JOBS.length} jobs (with appointments), and added ${createdCalls} calls.`,
  );
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
