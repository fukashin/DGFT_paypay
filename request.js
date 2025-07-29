const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // ブラウザ起動に使用

// リクエスト読み込み
const requestBody = JSON.parse(fs.readFileSync('./request.json', 'utf-8'));

// PayPayテストエンドポイント
const endpoint = 'https://api3.veritrans.co.jp/test-paynow/v2/Authorize/paypay';

axios.post(endpoint, requestBody, {
    headers: {
        'Content-Type': 'application/json'
    }
}).then(res => {
    console.log('✅ APIリクエスト成功');

    // HTMLファイルとして保存
    const filePath = path.resolve(__dirname, 'paypay_redirect.html');
    fs.writeFileSync(filePath, res.data, 'utf8');
    console.log(`💾 HTMLファイル保存: ${filePath}`);

    // OS別にブラウザで開く（Windows/Mac/Linux 対応）
    const openCommand =
        process.platform === 'darwin' ? `open "${filePath}"` :       // macOS
            process.platform === 'win32' ? `start "" "${filePath}"` :    // Windows
                `xdg-open "${filePath}"`;                                     // Linux

    exec(openCommand, (err) => {
        if (err) {
            console.error('❌ ブラウザ起動エラー:', err.message);
        } else {
            console.log('🌐 ブラウザでページを開きました');
        }
    });

}).catch(err => {
    if (err.response) {
        fs.writeFileSync('error_response.html', err.response.data, 'utf8');
        console.error('❌ APIエラー:', err.response.status);
    } else {
        console.error('❌ 通信エラー:', err.message);
    }
});
