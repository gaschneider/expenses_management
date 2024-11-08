import Group from "./group";
import GroupPermission from "./groupPermission";
import Permission from "./permission";
import User from "./user";
import UserGroup from "./userGroup";

export const defineAssociations = () => {
  User.belongsToMany(Group, {
    through: UserGroup,
    foreignKey: "userId",
    otherKey: "groupId",
    as: "groups",
    onDelete: "CASCADE"
  });

  Group.belongsToMany(User, {
    through: UserGroup,
    foreignKey: "groupId",
    otherKey: "userId",
    as: "users",
    onDelete: "CASCADE"
  });

  Group.belongsToMany(Permission, {
    through: GroupPermission,
    foreignKey: "groupId",
    otherKey: "permissionId",
    as: "permissions",
    onDelete: "CASCADE"
  });

  Permission.belongsToMany(Group, {
    through: GroupPermission,
    foreignKey: "permissionId",
    otherKey: "groupId",
    as: "groups",
    onDelete: "CASCADE"
  });
};
