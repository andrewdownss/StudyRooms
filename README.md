# StudyRooms - College of Charleston Study Room Booking System

A modern study room booking system built with Next.js 15, featuring dual authentication (Google OAuth + Email/Password), object-oriented architecture, and real-time availability management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd StudyRooms

# Install dependencies
npm install

# Set up the database
npm run db:migrate
npm run db:seed

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl-rand-base64-32"

# Google OAuth (Optional - for Google Sign-In)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Admin Configuration
ADMIN_EMAILS="admin@g.cofc.edu"
```

## 🔐 Authentication

### Supported Methods
1. **Email/Password**: Register with your `@g.cofc.edu` email
   - Minimum 8-character password required
   - Name field required
   - No email verification (simplified for MVP)

2. **Google OAuth**: Sign in with College of Charleston Google account
   - Requires `@g.cofc.edu` domain
   - Automatic account creation

### Google OAuth Setup (Optional)

If you want to enable Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret to `.env`

## 📚 Features

### For Students
- **Book Study Rooms**: Choose room size, time, and duration
- **View Bookings**: See all your upcoming reservations
- **Cancel Bookings**: Cancel future bookings (not past ones)
- **Room Availability**: Real-time availability checking
- **Dashboard**: Quick overview of upcoming bookings

### For Admins
- **Manage All Bookings**: View and manage all user bookings
- **User Management**: View registered users
- **Room Management**: Add/edit/remove study rooms
- **Booking Override**: Create bookings for any user

## 🏗️ Architecture

This project demonstrates **Object-Oriented Design (OOP)** principles:

### Design Patterns
- **Repository Pattern**: Data access abstraction
- **Service Layer Pattern**: Business logic separation
- **Dependency Injection**: Loose coupling via Container
- **Strategy Pattern**: Multiple authentication providers
- **Domain-Driven Design**: Rich domain models with business logic

### SOLID Principles
- **Single Responsibility**: Each class has one clear purpose
- **Open/Closed**: Extensible without modification
- **Liskov Substitution**: Interfaces used throughout
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Depend on abstractions

### Project Structure

```
src/
├── app/                      # Next.js 15 App Router
│   ├── api/                  # API routes
│   ├── auth/                 # Authentication pages
│   ├── book-room/            # Room booking page
│   ├── dashboard/            # User dashboard
│   └── settings/             # User settings
├── components/               # React components
├── lib/
│   ├── domain/              # Domain models (Booking, Room, User)
│   ├── repositories/        # Data access layer
│   ├── services/            # Business logic layer
│   ├── interfaces/          # TypeScript interfaces
│   ├── validation/          # Zod schemas
│   ├── errors/              # Custom error classes
│   ├── container.ts         # Dependency injection
│   └── auth.ts              # NextAuth configuration
└── prisma/
    ├── schema.prisma        # Database schema
    └── seed.ts              # Database seeder
```

## 🗄️ Database Schema

**Users**: Email, name, role (student/admin), password (optional), authProvider  
**Rooms**: Name, category (small/large), capacity, description  
**Bookings**: User, room, date, time, duration, status  

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample rooms
npm run db:studio    # Open Prisma Studio (database GUI)
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers

### Bookings
- `GET /api/bookings` - List all bookings (admin)
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get booking details
- `PATCH /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Cancel booking
- `GET /api/user/bookings` - Get current user's bookings

### Rooms
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/categories` - List room categories

## 🧪 Testing

### Manual Testing Checklist
- [ ] Register with email/password
- [ ] Sign in with email/password
- [ ] Sign in with Google OAuth
- [ ] Book a study room
- [ ] View upcoming bookings
- [ ] Cancel a booking
- [ ] Admin: View all bookings
- [ ] Validation: Try booking in the past
- [ ] Validation: Try invalid email domain

## 🚨 Troubleshooting

### Database Issues
```bash
# Reset database (deletes all data)
rm prisma/dev.db
npm run db:migrate
npm run db:seed
```

### NextAuth Errors
- Verify `NEXTAUTH_SECRET` is set in `.env`
- Check `NEXTAUTH_URL` matches your domain
- For Google OAuth, verify redirect URIs in Google Console

### Port Already in Use
```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or let Next.js use a different port automatically
```

## 📄 License

This project is for educational purposes at the College of Charleston.

## 👥 Contact

For questions or support, contact your system administrator.
