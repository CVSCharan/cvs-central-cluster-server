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
      callbackURL:
        process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/v1/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info(`Google OAuth login attempt`, {
          email: profile._json.email,
        });

        // Check if user exists
        let user = await User.findOne({ email: profile._json.email });

        if (user) {
          // If user exists but used different provider
          if (user.provider !== "google") {
            logger.info("User exists with different provider", {
              email: profile._json.email,
              existingProvider: user.provider,
            });

            // Update provider if it was local and not verified
            if (user.provider === "local" && !user.isVerified) {
              user.provider = "google";
              user.providerId = profile.id;
              user.isVerified = true;
              user.verificationToken = undefined;
              await user.save();
            } else {
              logger.warn(
                "OAuth login failed: Account exists with different provider",
                {
                  email: profile._json.email,
                  provider: user.provider,
                }
              );
              return done(
                new Error(
                  `You already have an account with ${user.provider}. Please sign in with that provider.`
                ),
                undefined
              );
            }
          }
        } else {
          // Create new user if doesn't exist
          user = new User({
            email: profile._json.email,
            name: profile.displayName,
            picture: profile._json.picture,
            provider: "google",
            providerId: profile.id,
            isVerified: true,
          });

          await user.save();
          logger.info("New user created via Google OAuth", {
            userId: user._id,
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error("Error during Google OAuth", {
          error: (error as Error).message,
        });
        return done(error as Error, undefined);
      }
    }
  )
);
