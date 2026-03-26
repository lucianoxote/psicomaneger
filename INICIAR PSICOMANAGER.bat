@echo off
title PsicoManager - Gestão Clínica 2026
echo.
echo  =========================================
echo  Iniciando PsicoManager - Gestão Clínica
echo  =========================================
echo.
echo  Aguarde enquanto o servidor inicia...
echo  O navegador abrirá automaticamente em alguns segundos.
echo.

:: Abre o navegador
start http://localhost:3000

:: Entra na pasta (garante o caminho correto)
cd /d "%~dp0"

:: Inicia o servidor Next.js
npm run dev

pause
