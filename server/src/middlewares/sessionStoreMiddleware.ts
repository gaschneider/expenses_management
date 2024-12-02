import SequelizeStore from "connect-session-sequelize";
import session from "express-session";
import sequelize from "../config/database";

// Create the Session model
const initializeSessionStore = () => {
  // Extend the default session store
  const SessionStore = SequelizeStore(session.Store);

  const sessionStore = new SessionStore({
    db: sequelize, // Sequelize connection
    tableName: "sessions", // Custom table name

    // Optional: Additional configuration
    checkExpirationInterval: 15 * 60 * 1000, // How often to clear expired sessions (15 minutes)
    expiration: 24 * 60 * 60 * 1000 // Default session expiration (24 hours)
  });

  // Sync the session model (create table if not exists)
  sessionStore.sync();

  return sessionStore;
};

// Middleware setup function
export const setupSessionMiddleware = () => {
  // Initialize the session store
  const sessionStore = initializeSessionStore();

  // Create session middleware
  const sessionMiddleware = session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "fallback_secret_key",
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true, // Prevent client-side JS from reading the cookie
      sameSite: "lax" // CSRF protection
    }
  });

  return {
    sessionMiddleware,
    sessionStore
  };
};
