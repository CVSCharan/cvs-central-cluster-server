import { Router } from "express";
import userController from "../controllers/userController";
import { auth } from "../middleware/authMiddleware";
import passport from "passport";

const router = Router();

// Regular routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/verify/:token", userController.verifyEmail);

// OAuth routes with Passport
router.get(
  "/login/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/register/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "register",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: true,
  }),
  userController.googleCallback
);

router.post("/set-password", auth, userController.setPasswordForOAuthUser);

// User info and logout
router.get("/me", userController.getCurrentUser);
router.get("/logout", userController.logout);

export default router;
