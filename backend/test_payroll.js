const { db } = require('./src/config/db');
try {
  const month = 5;
  const year = 2026;
  const workers = db.prepare('SELECT id, user_id FROM workers WHERE status = "active"').all();
  console.log("workers:", workers);
  const insertStmt = db.prepare(`
    INSERT INTO payroll (worker_id, month, year, base_salary, net_pay, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  let generatedCount = 0;
  const transaction = db.transaction((workersList) => {
    for (const worker of workersList) {
      const baseSalary = 25000; 
      insertStmt.run(worker.user_id, month, year, baseSalary, baseSalary, 'pending');
      generatedCount++;
    }
  });
  transaction(workers);
  console.log("Success, count:", generatedCount);
} catch(e) {
  console.error("Error:", e.message);
}
