const parseReceipt = async (fileUrl) => {
  // Simulate OCR API network delay
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const categories = ['Travel', 'Food', 'Accommodation', 'Fuel', 'Office Supplies', 'Training'];
  const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
  
  const merchants = {
    Food: ['Starbucks', 'McDonalds', 'Sweetgreen', 'Uber Eats', 'Chipotle'],
    Travel: ['Uber', 'Delta Airlines', 'Lyft', 'Amtrak', 'United Airlines'],
    Accommodation: ['Hilton', 'Airbnb', 'Marriott', 'Sheraton', 'Hyatt'],
    Fuel: ['Shell', 'Chevron', 'ExxonMobil', 'BP', 'Speedway'],
    'Office Supplies': ['Staples', 'Office Depot', 'Amazon Business', 'Target'],
    Training: ['Coursera', 'Udemy', 'Pluralsight', 'Frontend Masters']
  };

  const merchantList = merchants[selectedCategory] || ['Generic Merchant'];
  const merchantName = merchantList[Math.floor(Math.random() * merchantList.length)];
  
  // Random amount between $15.00 and $250.00
  const amount = parseFloat((Math.random() * 235 + 15).toFixed(2));

  return {
    amount,
    currency: 'USD',
    merchantName,
    date: new Date(),
    category: selectedCategory,
    rawText: `
      --- INVOICE / RECEIPT ---
      ${merchantName.toUpperCase()}
      Date: ${new Date().toLocaleDateString()}
      Transaction ID: TXN-${Math.floor(Math.random() * 10000000)}
      -------------------------
      Subtotal:   $${(amount * 0.9).toFixed(2)}
      Tax (10%):  $${(amount * 0.1).toFixed(2)}
      -------------------------
      TOTAL PAID: $${amount.toFixed(2)} USD
      Card: VISA ************4421
      -------------------------
      Approved. Thank you!
    `.trim()
  };
};

module.exports = {
  parseReceipt
};
