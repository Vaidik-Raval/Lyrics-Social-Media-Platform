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

## 🎯 Usage Examples

### Adding a Song
```javascript
const songData = {
  title: "Wonderwall",
  artist: "Oasis",
  genre: "rock",
  language: "english",
  instruments: ["guitar", "vocals"],
  officialLyrics: "Today is gonna be the day..."
};

const response = await api.createSong(songData);
```

### Creating a Composition
```javascript
const compositionData = {
  song: "64f8a1b2c3d4e5f6g7h8i9j0", // Song ID
  title: "Acoustic Guitar Arrangement",
  type: "chords",
  content: "G D Em C\nToday is gonna be...",
  instrument: "guitar",
  difficulty: "beginner"
};

const response = await api.createComposition(compositionData);
```

### Searching
```javascript
// Search songs by instrument
const guitarSongs = await api.getSongs({ instrument: "guitar" });

// Search compositions by difficulty
const beginnerCompositions = await api.getCompositions({ difficulty: "beginner" });
```

## 🔧 Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (when implemented)

### Code Style
- Use ES6+ features
- Follow RESTful API conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Implement proper error handling

### Database Indexes
The application automatically creates these indexes for better performance:
- Text indexes on song titles, artists, and tags
- Compound indexes on frequently queried fields
- Unique indexes on user emails and usernames

## 🚀 Deployment

### Backend (Railway/Render/AWS)
1. Set environment variables on your platform
2. Deploy from Git repository
3. Ensure MongoDB connection string is correct

### Frontend (Netlify/Vercel/GitHub Pages)
1. Build and deploy static files
2. Update API base URL for production
3. Configure redirects for SPA routing

### Environment Considerations
- Use HTTPS in production
- Set NODE_ENV=production
- Use strong, random secrets
- Configure CORS properly
- Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
- MongoDB for the database
- All the musicians who will use this platform!

## 📞 Support

For support, email support@ly-platform.com or create an issue in the repository.

---

**Happy Composing! 🎵**
