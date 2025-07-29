const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

(async () => {

    // 📦 リクエストボディ読み込み
    const requestBody = JSON.parse(fs.readFileSync('./request.json', 'utf-8'));

    const endpoint = 'https://api3.veritrans.co.jp/test-paynow/v2/Authorize/paypay';
    const res = await axios.post(endpoint, requestBody, {
        headers: { 'Content-Type': 'application/json' }
    });

    // 📄 HTMLとして保存するパス
    const filePath = path.resolve(__dirname, 'paypay_redirect.html');

    // 📎 HTML or JSON 判定
    const htmlContent = typeof res.data === 'string'
        ? res.data
        : JSON.stringify(res.data, null, 2);

    // 💾 保存処理
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    console.log(`💾 ファイル保存成功: ${filePath}`);

    // 🌐 ブラウザで表示（OSに応じたコマンドで開く）
    const openCommand =
        process.platform === 'darwin' ? `open "${filePath}"` :       // macOS
            process.platform === 'win32' ? `start "" "${filePath}"` :    // Windows
                `xdg-open "${filePath}"`;                                     // Linux

    exec(openCommand, (err) => {
        if (err) {
            console.error('❌ ブラウザ起動失敗:', err.message);
        } else {
            console.log('🌐 ブラウザでページを開きました');
        }
    });

} catch (err) {
    // 🛠️ エラーハンドリング（API失敗 or 書き込み失敗）
    const errorLogPath = path.resolve(__dirname, 'error_response.json');

    if (err.response && err.response.data) {
        // APIエラーの詳細保存
        fs.writeFileSync(errorLogPath, JSON.stringify(err.response.data, null, 2), 'utf8');
        console.error(`❌ APIレスポンスエラー（詳細を保存）: ${errorLogPath}`);
    } else {
        // その他のエラー（JSONでない、ファイル書き込みエラーなど）
        console.error('❌ 実行時エラー:', err.message);
    }
}
}) ();
