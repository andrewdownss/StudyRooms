@echo off
REM StudyRooms Setup Script for Windows
REM This script will install all dependencies and set up the project

echo.
echo Starting StudyRooms setup...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.

REM Install npm dependencies
echo Installing npm dependencies...
call npm install

if %errorlevel% neq 0 (
    echo Failed to install npm dependencies
    exit /b 1
)

echo npm dependencies installed successfully
echo.

REM Check if .env file exists
if not exist .env (
    echo No .env file found. Creating one from template...
    (
        echo # Database
        echo DATABASE_URL="file:./prisma/dev.db"
        echo.
        echo # NextAuth
        echo NEXTAUTH_URL="http://localhost:3000"
        echo NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"
        echo.
        echo # Google OAuth
        echo GOOGLE_CLIENT_ID="your-google-client-id"
        echo GOOGLE_CLIENT_SECRET="your-google-client-secret"
        echo.
        echo # Admin Emails (comma-separated^)
        echo ADMIN_EMAILS="your-email@g.cofc.edu"
    ) > .env
    echo Created .env file. Please update it with your credentials.
    echo.
) else (
    echo .env file already exists
    echo.
)

REM Set up Prisma database
echo Setting up database...
call npx prisma generate

if %errorlevel% neq 0 (
    echo Failed to generate Prisma client
    exit /b 1
)

echo Prisma client generated successfully
echo.

REM Run database migrations
echo Running database migrations...
call npx prisma migrate deploy

if %errorlevel% neq 0 (
    echo Migration failed. Trying to create the database...
    call npx prisma db push
)

echo Database migrations completed
echo.

REM Seed the database
echo Seeding database with initial data...
call npm run db:seed

if %errorlevel% neq 0 (
    echo Database seeding failed. You may need to seed manually.
) else (
    echo Database seeded successfully
)

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Update your .env file with your Google OAuth credentials
echo 2. Update ADMIN_EMAILS in .env with your email address
echo 3. Run 'npm run dev' to start the development server
echo.
echo Optional commands:
echo - 'npm run db:studio' - Open Prisma Studio to view/edit database
echo - 'npm run db:migrate' - Create a new migration
echo.
pause

