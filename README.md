# Ly - Music Collaboration Platform

A web-based platform where music enthusiasts can explore, share, and collaborate on song lyrics and compositions. Unlike regular lyrics websites, this platform is instrument-focused — meaning users can search for songs based on the instrument they want to play.

## 🎵 Features

### Core Features
- **Song Library**: Search and browse songs by title, artist, language, genre, or instrument
- **User Compositions**: Add your own composition of a song (lyrics variation, chord progression, tabs, etc.)
- **Ranking System**: Like/dislike system for community-driven quality control
- **Authentication**: Email/password and Google OAuth 2.0 login
- **User Profiles**: Personal dashboards with composition history and statistics

### Advanced Features
- **Instrument-Focused Search**: Find songs specifically for your instrument
- **Community Collaboration**: Share and discover different arrangements
- **Real-time Statistics**: Track views, likes, and community engagement
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Modern UI/UX**: Smooth animations and intuitive navigation

## 🛠 Tech Stack

### Frontend
- **HTML5 + CSS3**: Modern, semantic markup with CSS Grid and Flexbox
- **Vanilla JavaScript**: No frameworks, pure ES6+ with modern APIs
- **CSS Animations**: Smooth, performant animations for better UX
- **Responsive Design**: Mobile-first approach with progressive enhancement

### Backend
- **Node.js + Express**: Fast, scalable server with RESTful APIs
- **MongoDB + Mongoose**: Flexible document database with ODM
- **JWT Authentication**: Secure token-based auth with refresh capabilities
- **Google OAuth 2.0**: Third-party authentication integration
- **Express Security**: Helmet, CORS, rate limiting, and input validation

### Database Schema
- **Users**: Authentication, profiles, and user statistics
- **Songs**: Official lyrics, metadata, and community metrics
- **Compositions**: User-submitted arrangements with voting system
- **LikesDislikes**: Community feedback and ranking system

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ly-platform
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   # Serve with your preferred static server
   # For example, using Python:
   python -m http.server 3000
   # Or using Node.js http-server:
   npx http-server -p 3000
   ```

4. **Database Setup**
   - Install MongoDB locally or create a MongoDB Atlas account
   - Update the `MONGODB_URI` in your `.env` file
   - The application will create collections automatically

### Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ly-platform
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your-session-secret
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

## 📁 Project Structure

```
ly-platform/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Song.js
│   │   ├── Composition.js
│   │   └── LikeDislike.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── songs.js
│   │   ├── compositions.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── package.json
│   ├── server.js
│   └── .env
├── frontend/
│   ├── css/
│   │   ├── style.css
│   │   └── animations.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── utils.js
│   │   └── main.js
│   ├── index.html
│   └── ...
└── README.md
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Songs
- `GET /api/songs` - Get songs with filtering
- `GET /api/songs/trending` - Get trending songs
- `GET /api/songs/:id` - Get single song
- `POST /api/songs` - Create new song (auth required)
- `PUT /api/songs/:id` - Update song (auth required)
- `DELETE /api/songs/:id` - Delete song (auth required)

### Compositions
- `GET /api/compositions` - Get compositions with filtering
- `GET /api/compositions/featured` - Get featured compositions
- `GET /api/compositions/:id` - Get single composition
- `POST /api/compositions` - Create composition (auth required)
- `PUT /api/compositions/:id` - Update composition (auth required)
- `DELETE /api/compositions/:id` - Delete composition (auth required)
- `POST /api/compositions/:id/vote` - Vote on composition (auth required)

### Users
- `GET /api/users` - Get users list
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/compositions` - Get user's compositions
- `GET /api/users/me/dashboard` - Get user dashboard (auth required)

`



**Happy Composing! 🎵**
