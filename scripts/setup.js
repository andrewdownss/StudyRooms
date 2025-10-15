#!/usr/bin/env node

/**
 * Cross-platform setup script for StudyRooms
 * This script installs dependencies and sets up the project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, errorMessage) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (errorMessage) {
      log(`❌ ${errorMessage}`, colors.red);
    }
    return false;
  }
}

async function setup() {
  console.log('');
  log('🚀 Starting StudyRooms setup...', colors.blue);
  console.log('');

  // Check Node.js version
  const nodeVersion = process.version;
  log(`✅ Node.js version: ${nodeVersion}`, colors.green);
  console.log('');

  // Install dependencies
  log('📦 Installing npm dependencies...', colors.blue);
  if (!exec('npm install', 'Failed to install npm dependencies')) {
    process.exit(1);
  }
  log('✅ npm dependencies installed successfully', colors.green);
  console.log('');

  // Remove unused dependencies
  log('🧹 Removing unused dependencies...', colors.blue);
  exec('npm uninstall drizzle-orm', null);
  log('✅ Cleanup completed', colors.green);
  console.log('');

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    log('⚠️  No .env file found. Creating one from template...', colors.yellow);
    const envTemplate = `# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Admin Emails (comma-separated)
ADMIN_EMAILS="your-email@g.cofc.edu"
`;
    fs.writeFileSync(envPath, envTemplate);
    log('✅ Created .env file. Please update it with your credentials.', colors.green);
    console.log('');
  } else {
    log('✅ .env file already exists', colors.green);
    console.log('');
  }

  // Generate Prisma client
  log('🗄️  Generating Prisma client...', colors.blue);
  if (!exec('npx prisma generate', 'Failed to generate Prisma client')) {
    process.exit(1);
  }
  log('✅ Prisma client generated successfully', colors.green);
  console.log('');

  // Run database migrations
  log('🔄 Setting up database...', colors.blue);
  if (!exec('npx prisma migrate deploy', null)) {
    log('⚠️  Migration failed. Trying to push schema...', colors.yellow);
    exec('npx prisma db push', null);
  }
  log('✅ Database setup completed', colors.green);
  console.log('');

  // Seed database
  log('🌱 Seeding database with initial data...', colors.blue);
  if (!exec('npm run db:seed', null)) {
    log('⚠️  Database seeding failed. You may need to seed manually.', colors.yellow);
  } else {
    log('✅ Database seeded successfully', colors.green);
  }

  console.log('');
  log('🎉 Setup complete!', colors.green);
  console.log('');
  log('Next steps:', colors.blue);
  console.log('1. Update your .env file with your Google OAuth credentials');
  console.log('2. Update ADMIN_EMAILS in .env with your email address');
  console.log('3. Run \'npm run dev\' to start the development server');
  console.log('');
  log('Optional commands:', colors.blue);
  console.log('- \'npm run db:studio\' - Open Prisma Studio to view/edit database');
  console.log('- \'npm run db:migrate\' - Create a new migration');
  console.log('- \'npm run db:reset\' - Reset database and re-seed');
  console.log('');
}

setup().catch((error) => {
  log(`❌ Setup failed: ${error.message}`, colors.red);
  process.exit(1);
});

