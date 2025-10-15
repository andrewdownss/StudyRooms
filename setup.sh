#!/bin/bash

# StudyRooms Setup Script
# This script will install all dependencies and set up the project

echo "🚀 Starting StudyRooms setup..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install npm dependencies"
    exit 1
fi

echo "✅ npm dependencies installed successfully"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating one from template..."
    cat > .env << EOF
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Admin Emails (comma-separated)
ADMIN_EMAILS="your-email@g.cofc.edu"
EOF
    echo "✅ Created .env file. Please update it with your credentials."
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Set up Prisma database
echo "🗄️  Setting up database..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated successfully"
echo ""

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "⚠️  Migration failed. This might be expected for a fresh setup."
    echo "   Trying to create the database..."
    npx prisma db push
fi

echo "✅ Database migrations completed"
echo ""

# Seed the database
echo "🌱 Seeding database with initial data..."
npm run db:seed

if [ $? -ne 0 ]; then
    echo "⚠️  Database seeding failed. You may need to seed manually."
else
    echo "✅ Database seeded successfully"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with your Google OAuth credentials"
echo "2. Update ADMIN_EMAILS in .env with your email address"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "Optional commands:"
echo "- 'npm run db:studio' - Open Prisma Studio to view/edit database"
echo "- 'npm run db:migrate' - Create a new migration"
echo ""

