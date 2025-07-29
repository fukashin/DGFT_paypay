const { execSync } = require('child_process');
const path = require('path');

try {
    // スクリプトのパス（ファイルが同じフォルダにある場合）
    const generateHashPath = path.resolve(__dirname, 'generate_hash.js');
    const requestPath = path.resolve(__dirname, 'request.js');

    // ① generate_hash.js を実行
    console.log('🔧 generate_hash.js を実行中...');
    execSync(`node "${generateHashPath}"`, { stdio: 'inherit' });

    // ② request.js を実行
    console.log('\n🚀 request.js を実行中...');
    execSync(`node "${requestPath}"`, { stdio: 'inherit' });

} catch (error) {
    console.error('❌ スクリプト実行中にエラーが発生しました:', error.message);
}
