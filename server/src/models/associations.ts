import Department from "./Department";
import User from "./User";
import UserDepartmentPermission from "./UserDepartmentPermission";
import UserPermission from "./UserPermission";

export const defineAssociations = () => {
  // User - UserPermission Association
  User.hasOne(UserPermission, {
    foreignKey: "userId",
    as: "userPermission",
    onDelete: "CASCADE"
  });
  UserPermission.belongsTo(User, {
    foreignKey: "userId",
    as: "user"
  });

  // User - Department Association (through UserDepartmentPermission)
  User.belongsToMany(Department, {
    through: UserDepartmentPermission,
    foreignKey: "userId",
    as: "departments",
    onDelete: "CASCADE"
  });
  Department.belongsToMany(User, {
    through: UserDepartmentPermission,
    foreignKey: "departmentId",
    as: "users",
    onDelete: "CASCADE"
  });

  User.hasMany(UserDepartmentPermission, {
    foreignKey: "userId",
    as: "userDepartmentPermissions"
  });
  Department.hasMany(UserDepartmentPermission, {
    foreignKey: "departmentId",
    as: "userDepartmentPermissions"
  });

  // UserDepartmentPermission associations
  UserDepartmentPermission.belongsTo(User, {
    foreignKey: "userId",
    as: "user"
  });
  UserDepartmentPermission.belongsTo(Department, {
    foreignKey: "departmentId",
    as: "department"
  });
};
