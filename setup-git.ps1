# Создаёт main и dev, три коммита в dev. Не загружает ничего в интернет.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git не установлен. Установите Git for Windows и повторите.'
}
if (Test-Path '.git') {
    throw 'В папке уже есть репозиторий .git. Скрипт для новой распакованной папки.'
}
$name = git config user.name
$email = git config user.email
if (-not $name -or -not $email) {
    throw 'Сначала настройте Git: git config --global user.name "Ваше имя" и git config --global user.email "ваш_email"'
}

function RunGit {
    & git @args
    if ($LASTEXITCODE -ne 0) { throw "Git завершился с ошибкой: $($args -join ' ')" }
}

RunGit init -b main
RunGit add .gitignore .nojekyll README.md INSTRUCTIONS.md setup-git.ps1
RunGit commit -m 'Initialize project and instructions'
RunGit switch -c dev
RunGit add index.html style.css assets/books.svg
RunGit commit -m 'Add HTML5 page and book illustration'
RunGit add config.js script.js
RunGit commit -m 'Add JavaScript button and CSV loading'
RunGit add books.csv AI_PROMPT_AND_ANSWER.md ai-report.md
RunGit commit -m 'Add book data and AI analysis report'

Write-Host ''
Write-Host 'Готово: ветки main и dev созданы, в dev сделано 3 коммита.' -ForegroundColor Green
RunGit log --oneline --all --graph --decorate
Write-Host 'Следующий шаг: создать пустой ПУБЛИЧНЫЙ репозиторий на GitHub, затем push main и dev.'
