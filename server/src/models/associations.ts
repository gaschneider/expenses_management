import Group from "./group";
import GroupPermission from "./groupPermission";
import Permission from "./permission";
import User from "./user";
import UserGroup from "./userGroup";

export const defineAssociations = () => {
  User.belongsToMany(Group, {
    through: UserGroup,
    onDelete: "CASCADE"
  });

  Group.belongsToMany(User, {
    through: UserGroup,
    onDelete: "CASCADE"
  });

  Group.belongsToMany(Permission, {
    through: GroupPermission,
    onDelete: "CASCADE"
  });

  Permission.belongsToMany(Group, {
    through: GroupPermission,
    onDelete: "CASCADE"
  });
};
