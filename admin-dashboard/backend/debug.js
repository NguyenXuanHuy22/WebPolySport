const axios = require('axios');

async function checkDebug() {
  try {
    const response = await axios.get('http://localhost:5000/api/stats/debug');
    const data = response.data;
    
    console.log('=== DEBUG DATA ===');
    console.log('Payment Methods:', data.paymentMethods);
    console.log('Payment Counts:', data.paymentCounts);
    console.log('Status Counts:', data.statusCounts);
    console.log('Total Orders:', data.totalOrders);
    
    console.log('\n=== COD ORDERS ===');
    console.log('COD Orders (first 10):', data.codOrders);
    
    console.log('\n=== COD IN DATE RANGE (2025-08-01 to 2025-08-31) ===');
    console.log('COD in date range:', data.codInDateRange);
    console.log('Count:', data.codInDateRange.length);
    
    console.log('\n=== COD WITH VALID STATUS ===');
    console.log('COD with valid status:', data.codWithValidStatus);
    console.log('Count:', data.codWithValidStatus.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDebug();
