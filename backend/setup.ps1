$ErrorActionPreference = 'Stop'

Write-Host '=== MySawari Backend Setup ===' -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is not installed or not available on PATH. Install Node.js 20+ and reopen PowerShell.'
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm is not available on PATH. Reinstall Node.js with npm and reopen PowerShell.'
}

$nodeVersion = (node --version).Trim()
Write-Host "Detected Node.js $nodeVersion"

if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
    Write-Host 'Created backend/.env from .env.example.' -ForegroundColor Green
} else {
    Write-Host 'Existing .env preserved.' -ForegroundColor Yellow
}

Write-Host 'Installing dependencies...'
npm install
if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }

Write-Host 'Checking JavaScript syntax...'
npm run verify
if ($LASTEXITCODE -ne 0) { throw 'Syntax check failed.' }

Write-Host 'Checking SQL migration sequence...'
npm run db:check
if ($LASTEXITCODE -ne 0) { throw 'Migration file check failed.' }

Write-Host ''
Write-Host 'Setup completed.' -ForegroundColor Green
Write-Host 'Next: add your Supabase URL, anon key and server-only service-role key to .env.'
Write-Host 'Then apply migrations 001, 002, 003, 004 in Supabase SQL Editor, followed by supabase/seed.sql.'
Write-Host 'Start the API with: npm run dev'
