import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { config } from "../../config/env.js";
import { UserModel } from "../../models/user.js";

export function configurePassport() {
  // Serialize user to store in session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await UserModel.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (config.googleClientId && config.googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.googleClientId,
          clientSecret: config.googleClientSecret,
          callbackURL: config.googleCallbackUrl,
          scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await UserModel.findByProvider("google", profile.id);

            if (!user) {
              // Check if email already exists with local provider
              const email = profile.emails?.[0]?.value;
              if (email) {
                user = await UserModel.findByEmail(email);
              }

              if (user) {
                // Link Google account to existing user
                // Note: In a real app, you might want to ask for confirmation
                console.log("Linking Google account to existing user");
              } else {
                // Create new user
                user = await UserModel.createUser({
                  email: profile.emails?.[0]?.value || `google_${profile.id}@oauth.local`,
                  name: profile.displayName,
                  provider: "google",
                  provider_id: profile.id,
                  is_verified: true, // OAuth users are pre-verified
                });
              }
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );
  } else {
    console.warn("⚠️  Google OAuth not configured");
  }

  // GitHub OAuth Strategy
  if (config.githubClientId && config.githubClientSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: config.githubClientId,
          clientSecret: config.githubClientSecret,
          callbackURL: config.githubCallbackUrl,
          scope: ["user:email"],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            // Check if user already exists
            let user = await UserModel.findByProvider("github", profile.id);

            if (!user) {
              // Get primary email
              const email = profile.emails?.[0]?.value;
              if (email) {
                user = await UserModel.findByEmail(email);
              }

              if (user) {
                // Link GitHub account to existing user
                console.log("Linking GitHub account to existing user");
              } else {
                // Create new user
                user = await UserModel.createUser({
                  email: email || `github_${profile.id}@oauth.local`,
                  name: profile.displayName || profile.username,
                  provider: "github",
                  provider_id: profile.id,
                  is_verified: true, // OAuth users are pre-verified
                });
              }
            }

            return done(null, user);
          } catch (error) {
            return done(error, undefined);
          }
        }
      )
    );
  } else {
    console.warn("⚠️  GitHub OAuth not configured");
  }
}

