// Fees module

function setTotalFee(roll, total) {
    const rec = getOrCreateFeeRecord(roll);
    rec.total = total;
    saveDB();
}

function addFeePayment(roll, amount) {
    const rec = getOrCreateFeeRecord(roll);
    rec.payments.push({ amount, date: new Date().toISOString().slice(0, 10) });
    saveDB();
}

function getFeeInfo(roll) {
    const rec = getOrCreateFeeRecord(roll);
    const paid = rec.payments.reduce((s, p) => s + p.amount, 0);
    const due = Math.max(0, (rec.total || 0) - paid);
    return {
        roll: rec.roll,
        total: rec.total || 0,
        paid,
        due,
        payments: rec.payments
    };
}
