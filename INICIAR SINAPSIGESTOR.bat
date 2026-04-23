@echo off
title Sinapsi Gestor - Gestao Clinica 2026
echo.
echo ===========================================
echo   Iniciando Sinapsi Gestor - Gestao Clinica
echo ===========================================
echo.
echo Aguarde enquanto o servidor inicia...
echo O navegador abrira automaticamente em alguns segundos.
echo.

:: Abre o navegador
start http://localhost:3000

:: Entra na pasta (garante o caminho correto)
cd /d "%~dp0"

:: Inicia o servidor Next.js
npm run dev

pause
