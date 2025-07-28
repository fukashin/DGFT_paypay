# generate_hash.ps1

# マーチャント情報（仮）
$merchantCcid = "A100000000000000000000cc"
$merchantKey  = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"

# params 定義
$params = @{
    orderId = "dummy001"
    serviceOptionType = "online"
    accountingType = "0"
    amount = "1000"
    itemName = "テスト商品"
    itemId = "item001"
    successUrl = "https://example.com/success"
    cancelUrl = "https://example.com/cancel"
    errorUrl = "https://example.com/error"
    pushUrl = "https://example.com/push"
    transitionType = "1"
    extendParameterType = "0"
    txnVersion = "2.0.0"
    dummyRequest = "1"
    merchantCcid = $merchantCcid
}

# JSON文字列をminify
$minifiedParams = ($params | ConvertTo-Json -Depth 10 -Compress)
$encodedParams = [uri]::EscapeDataString($minifiedParams)

# 署名用文字列
$rawString = $merchantCcid + $encodedParams + $merchantKey

# SHA256ハッシュを生成
$bytes = [System.Text.Encoding]::UTF8.GetBytes($rawString)
$hashBytes = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
$authHash = ([BitConverter]::ToString($hashBytes)).Replace("-", "").ToLower()

# JSON出力用オブジェクト
$result = @{
    params = $params
    authHash = $authHash
}

# ファイル出力
$result | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 .\request.json
Write-Output "authHash: $authHash"
