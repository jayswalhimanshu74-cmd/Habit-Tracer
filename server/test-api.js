const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('http://localhost:8000/api/habits', {
      headers: {
        'Authorization': 'Bearer ' + process.env.TEST_TOKEN // I don't have a token easily, but I can check if it at least responds (even with 401)
      }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
