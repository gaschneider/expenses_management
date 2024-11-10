import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../models/User";
import UserPermission from "../models/UserPermission";
import Department from "../models/Department";

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
              model: UserPermission,
              as: "userPermission",
              attributes: ["permissions"]
            },
            {
              model: Department,
              as: "departments",
              through: {
                as: "userDepartmentPermission",
                attributes: ["permissions"]
              },
              attributes: ["id", "name", "description"]
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

        return done(null, getUserDTO(user) ?? undefined);
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
          model: UserPermission,
          as: "userPermission",
          attributes: ["permissions"]
        },
        {
          model: Department,
          as: "departments",
          through: {
            as: "userDepartmentPermission",
            attributes: ["permissions"]
          },
          attributes: ["id", "name", "description"]
        }
      ]
    });
    done(null, getUserDTO(user));
  } catch (error) {
    done(error);
  }
});

export const getUserDTO = (user: User | null) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    permissions: user.userPermission?.permissions,
    departmentPermissions: user.departments?.reduce((prev, curr) => {
      if (curr.id && curr.userDepartmentPermission?.permissions) {
        prev[curr.id] = curr.userDepartmentPermission?.permissions;
      }
      return prev;
    }, {} as Record<number, string>)
  };
};
