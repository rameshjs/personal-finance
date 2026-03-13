export function formatINR(val: number) {
  return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatQty(val: number) {
  return val % 1 === 0 ? val.toString() : val.toFixed(3);
}
