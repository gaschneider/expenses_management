import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../models/user";
import Group from "../models/group";
import Permission from "../models/permission";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password"
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({
          where: { email },
          include: [
            {
              model: Group,
              attributes: ["id", "name", "description"],
              include: [
                {
                  model: Permission,
                  attributes: ["id", "name", "description"]
                }
              ]
            }
          ]
        });
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        const isValid = await user.validatePassword(password);
        if (!isValid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await User.findByPk(id, {
      include: [
        {
          model: Group,
          attributes: ["id", "name", "description"],
          include: [
            {
              model: Permission,
              attributes: ["id", "name", "description"]
            }
          ]
        }
      ]
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});
