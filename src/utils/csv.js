export const exportTransactionsToCSV = (transactions, viewMonthName, addToast) => {
  if (transactions.length === 0) return addToast('Tidak ada transaksi untuk diekspor.', 'warning');

  const headers = ['ID', 'Date', 'Transaction Name', 'Amount (IDR)', 'Account', 'Category', 'Type', 'Status', 'Budget Month'];
  const csvRows = [headers.join(',')];

  transactions.forEach(tx => {
    let type = 'Expense';
    if (tx.category === 'Income') type = 'Income';
    if (tx.category === 'Transfer In' || tx.category === 'Transfer Out') type = 'Internal Transfer';
    const row = [
      tx.id,
      tx.date,
      `"${tx.name.replace(/"/g, '""')}"`,
      tx.amount,
      `"${tx.account}"`,
      `"${tx.category}"`,
      type,
      tx.isPaid ? 'Completed' : 'Pending',
      tx.budget_month || ''
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `AlkaFlow_Transactions_${viewMonthName.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
