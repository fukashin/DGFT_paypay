// request.js
const axios = require('axios');
const fs = require('fs');

// request.jsonから読み込み
const requestBody = JSON.parse(fs.readFileSync('./request.json', 'utf-8'));

const endpoint = 'https://api3.veritrans.co.jp/test-paynow/v2/Authorize/paypay';

axios.post(endpoint, requestBody, {
    headers: {
        'Content-Type': 'application/json'
    }
}).then(res => {
    console.log('✅ 成功:', res.data);
}).catch(err => {
    if (err.response) {
        console.error('❌ エラー:', err.response.status, err.response.data);
        console.error('詳細:', err.code, err.config);
        console.error('レスポンスヘッダー:', err.response.headers);
        fs.writeFileSync('error_response.html', err.response.data);
    } else {
        console.error('❌ 通信エラー:', err.message);
        console.error('詳細:', err.code, err.config);
    }
});
