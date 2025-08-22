# Booking Dashboard

A user-friendly dashboard to manage and track reservations. View availability, monitor bookings, generate reports, and streamline the reservation process for hotels, events, or appointments.

## Features
- Manage bookings and availability
- Generate reports
- User-friendly interface

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/babuas25/dashboard.git
cd dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory with your Firebase configuration:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key-here"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# API Configuration
NEXT_PUBLIC_API_URL="your-api-url-here"
```

**Important:** Replace the placeholder values with your actual Firebase project configuration. You can find these values in your Firebase Console under Project Settings > General > Your apps.

### 4. Run the application in development
```bash
npm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000)

### 5. Build for production
```bash
npm run build
npm start
```

## License
Specify your license here. 