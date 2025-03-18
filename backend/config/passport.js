const passport = require("passport");
const { Strategy: JWTStrategy, ExtractJwt } = require("passport-jwt");
const { User } = require("../models/User");

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

passport.use(
    new JWTStrategy(options, async (payload, done) => {
        try {
            const user = await User.findByPk(payload.id);
            if (user) return done(null, user);
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

module.exports = passport; 