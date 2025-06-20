@echo off
REM Run Backend and Frontend for CNR Project

REM Start backend in a new terminal window
start cmd /k "cd backend && go run main.go"

REM Wait a bit to ensure backend starts
ping 127.0.0.1 -n 5 > nul

REM Start frontend in a new terminal window
start cmd /k "cd frontend\cnr && npm run dev"

REM Optional: Keep this window open
pause 