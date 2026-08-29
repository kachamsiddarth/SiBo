import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates synthetic payment and settlement CSV data for testing
 * Includes various exception scenarios:
 * - Matched records
 * - Amount mismatches
 * - Missing settlements
 * - Duplicate transactions
 * - Component mismatches (fee/tax differences)
 * - Unexplained differences
 */

// Seed for reproducible generation
const SEED = 42;
let seedValue = SEED;

function seededRandom() {
  seedValue = (seedValue * 1664525 + 1013904223) % 4294967296;
  return seedValue / 4294967296;
}

function seededChoice(array) {
  return array[Math.floor(seededRandom() * array.length)];
}

function seededInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function generateTransactionId(index) {
  return `TXN${String(index).padStart(6, '0')}`;
}

function generateSettlementId(index) {
  return `STL${String(index).padStart(6, '0')}`;
}

function generateDate(daysOffset = 0) {
  const baseDate = new Date('2025-01-01');
  baseDate.setDate(baseDate.getDate() + daysOffset);
  return baseDate.toISOString().split('T')[0];
}

function formatAmount(amount) {
  return amount.toFixed(2);
}

const PAYMENT_METHODS = ['UPI', 'CARD', 'NETBANKING', 'WALLET', 'EMI'];
const PAYMENT_STATUSES = ['captured', 'authorized', 'captured', 'captured', 'captured']; // weighted

function generatePaymentRecord(index, options = {}) {
  const transactionId = generateTransactionId(index);
  const amount = seededInt(100, 50000);
  const method = seededChoice(PAYMENT_METHODS);
  const status = seededChoice(PAYMENT_STATUSES);
  const date = generateDate(seededInt(0, 180));

  return {
    transaction_id: transactionId,
    payment_amount: formatAmount(amount),
    payment_date: date,
    payment_method: method,
    status: status,
    metadata: JSON.stringify({ source: 'synthetic', batch: options.batch || 'default' })
  };
}

function generateSettlementRecord(paymentRecord, options = {}) {
  const { scenario = 'matched', settlementIndex } = options;

  const settlementId = generateSettlementId(settlementIndex);
  const paymentAmount = parseFloat(paymentRecord.payment_amount);
  const paymentDate = new Date(paymentRecord.payment_date);
  const settlementDate = new Date(paymentDate);
  settlementDate.setDate(settlementDate.getDate() + seededInt(1, 3)); // T+1 to T+3

  let fee = 0, tax = 0, adjustment = 0, refund = 0;
  let settlementAmount = paymentAmount;

  switch (scenario) {
    case 'matched':
      // Normal case: fee ~2%, tax ~18% of fee, no adjustment/refund
      fee = Math.round(paymentAmount * 0.02);
      tax = Math.round(fee * 0.18);
      settlementAmount = paymentAmount - fee - tax;
      break;

    case 'amount_mismatch':
      // Settlement amount differs from expected
      fee = Math.round(paymentAmount * 0.02);
      tax = Math.round(fee * 0.18);
      const expectedAmount = paymentAmount - fee - tax;
      // Introduce a random difference of 1-5%
      const diffPercent = seededRandom() * 0.04 + 0.01; // 1-5%
      const diff = Math.round(expectedAmount * diffPercent) * (seededRandom() > 0.5 ? 1 : -1);
      settlementAmount = expectedAmount + diff;
      break;

    case 'component_mismatch':
      // Fee/tax components don't match standard calculation
      fee = Math.round(paymentAmount * (0.015 + seededRandom() * 0.02)); // 1.5-3.5%
      tax = Math.round(fee * (0.15 + seededRandom() * 0.1)); // 15-25% of fee
      adjustment = seededInt(-500, 500);
      settlementAmount = paymentAmount - fee - tax + adjustment;
      break;

    case 'unexplained_difference':
      // Settlement amount has no clear explanation
      fee = Math.round(paymentAmount * 0.02);
      tax = Math.round(fee * 0.18);
      const baseAmount = paymentAmount - fee - tax;
      const unexplainedDiff = seededInt(-2000, 2000);
      settlementAmount = baseAmount + unexplainedDiff;
      break;

    default:
      fee = Math.round(paymentAmount * 0.02);
      tax = Math.round(fee * 0.18);
      settlementAmount = paymentAmount - fee - tax;
  }

  return {
    settlement_id: settlementId,
    transaction_id: paymentRecord.transaction_id,
    payment_amount: formatAmount(paymentAmount),
    fee: formatAmount(fee),
    tax: formatAmount(tax),
    adjustment: formatAmount(adjustment),
    refund: formatAmount(refund),
    settlement_amount: formatAmount(settlementAmount),
    settlement_date: settlementDate.toISOString().split('T')[0],
    metadata: JSON.stringify({ source: 'synthetic', scenario, batch: options.batch || 'default' })
  };
}

function generateDataset(totalRecords = 100) {
  const payments = [];
  const settlements = [];
  const scenarios = [];

  // Define scenario distribution
  const scenarioDistribution = [
    { scenario: 'matched', weight: 0.55 },
    { scenario: 'amount_mismatch', weight: 0.15 },
    { scenario: 'missing_settlement', weight: 0.10 },
    { scenario: 'duplicate_transaction', weight: 0.05 },
    { scenario: 'component_mismatch', weight: 0.10 },
    { scenario: 'unexplained_difference', weight: 0.05 }
  ];

  let settlementIndex = 1;

  for (let i = 1; i <= totalRecords; i++) {
    const payment = generatePaymentRecord(i);
    payments.push(payment);

    // Determine scenario for this record
    const rand = seededRandom();
    let cumulativeWeight = 0;
    let selectedScenario = 'matched';

    for (const { scenario, weight } of scenarioDistribution) {
      cumulativeWeight += weight;
      if (rand < cumulativeWeight) {
        selectedScenario = scenario;
        break;
      }
    }

    scenarios.push({ transactionId: payment.transaction_id, scenario: selectedScenario });

    if (selectedScenario === 'missing_settlement') {
      // No settlement record for this payment
      continue;
    }

    if (selectedScenario === 'duplicate_transaction') {
      // Create two settlement records for the same transaction
      const settlement1 = generateSettlementRecord(payment, { scenario: 'matched', settlementIndex: settlementIndex++ });
      const settlement2 = generateSettlementRecord(payment, { scenario: 'matched', settlementIndex: settlementIndex++ });
      settlements.push(settlement1);
      settlements.push(settlement2);
    } else {
      const settlement = generateSettlementRecord(payment, { scenario: selectedScenario, settlementIndex: settlementIndex++ });
      settlements.push(settlement);
    }
  }

  return { payments, settlements, scenarios };
}

function arrayToCSV(array, columns) {
  const header = columns.join(',');
  const rows = array.map(obj => columns.map(col => {
    const value = obj[col];
    // Escape values containing commas or quotes
    if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }).join(','));
  return [header, ...rows].join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 100;
  const outputDir = args[1] || path.join(__dirname, '../../data/synthetic');

  console.log(`🔧 Generating ${count} synthetic payment/settlement records...`);

  const { payments, settlements, scenarios } = generateDataset(count);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write payment CSV
  const paymentColumns = [
    'transaction_id', 'payment_amount', 'payment_date',
    'payment_method', 'status', 'metadata'
  ];
  const paymentCsv = arrayToCSV(payments, paymentColumns);
  fs.writeFileSync(path.join(outputDir, 'payments.csv'), paymentCsv);
  console.log(`📄 Generated payments.csv with ${payments.length} records`);

  // Write settlement CSV
  const settlementColumns = [
    'settlement_id', 'transaction_id', 'payment_amount',
    'fee', 'tax', 'adjustment', 'refund',
    'settlement_amount', 'settlement_date', 'metadata'
  ];
  const settlementCsv = arrayToCSV(settlements, settlementColumns);
  fs.writeFileSync(path.join(outputDir, 'settlements.csv'), settlementCsv);
  console.log(`📄 Generated settlements.csv with ${settlements.length} records`);

  // Write scenario mapping for verification
  const scenarioData = {
    generatedAt: new Date().toISOString(),
    totalPayments: payments.length,
    totalSettlements: settlements.length,
    scenarios: scenarios
  };
  fs.writeFileSync(path.join(outputDir, 'scenarios.json'), JSON.stringify(scenarioData, null, 2));
  console.log(`📋 Generated scenarios.json with scenario mapping`);

  // Print scenario summary
  const summary = scenarios.reduce((acc, s) => {
    acc[s.scenario] = (acc[s.scenario] || 0) + 1;
    return acc;
  }, {});
  console.log('\n📊 Scenario Distribution:');
  Object.entries(summary).forEach(([scenario, count]) => {
    console.log(`   ${scenario}: ${count}`);
  });

  console.log('\n✅ Synthetic data generation complete!');
  console.log(`   Output directory: ${outputDir}`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateDataset, generatePaymentRecord, generateSettlementRecord };