import passport from "passport";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import User from "@models/User";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET is not defined in .env file");
}

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

passport.use(
  new JWTStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findByPk(payload.id);
      return user ? done(null, user) : done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }),
);

export default passport;
