import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/primary/User";
import logger from "../utils/logger";

// Serialize user to store in session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (error) {
    logger.error("Error deserializing user", {
      error: (error as Error).message,
    });
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.GOOGLE_REDIRECT_URI, // No fallback
      scope: ["profile", "email"],
      passReqToCallback: true, // To access `req` in the verify callback
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        if (!profile._json?.email) {
          throw new Error("Email permission required");
        }

        logger.info("Google OAuth attempt", {
          email: profile._json.email,
          providerId: profile.id,
        });

        let user = await User.findOne({ email: profile._json.email });

        if (user) {
          // Existing user with different provider
          if (user.provider !== "google") {
            if (user.provider === "local" && !user.isVerified) {
              // Migrate unverified local user to Google
              user.provider = "google";
              user.providerId = profile.id;
              user.isVerified = true;
              await user.save();
            } else {
              logger.warn("Account exists with different provider", {
                existingProvider: user.provider,
              });
              return done(
                new Error(`Sign in with ${user.provider} instead.`),
                undefined
              );
            }
          }
        } else {
          // New user
          user = new User({
            email: profile._json.email,
            name: profile.displayName,
            provider: "google",
            providerId: profile.id,
            isVerified: true,
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        logger.error("Google OAuth failed", {
          error: (error as Error).message,
        });
        return done(error as Error, undefined);
      }
    }
  )
);
