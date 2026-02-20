lknjkln$body = @{
    action = "synchronize"
    pull_request = @{
        number = 99
        html_url = "https://github.com/demo/repo/pull/99"
        head = @{ ref = "demo-branch" }
    }
    repository = @{
        full_name = "demo-user/ghostwriter-demo"
        name = "ghostwriter-demo"
        owner = @{ login = "demo-user" }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/github-webhook" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "x-github-event" = "pull_request" } `
    -Body $body
$body = @{
    action = "synchronize"
    pull_request = @{
        number = 99
        html_url = "https://github.com/demo/repo/pull/99"
        head = @{ ref = "demo-branch" }
    }
    repository = @{
        full_name = "demo-user/ghostwriter-demo"
        name = "ghostwriter-demo"
        owner = @{ login = "demo-user" }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/github-webhook" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "x-github-event" = "pull_request" } `
    -Body $body

