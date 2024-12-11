import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import Department from "./Department";
import { CategoryAttributes } from "../types/category";

interface CategoryInstance extends Model<CategoryAttributes, CategoryAttributes> {
  id: number;
  departmentId?: number | null;
  name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Associations
  department?: Department;
}

// Category Model
class Category extends Model<CategoryAttributes, CategoryAttributes> implements CategoryInstance {
  declare id: number;
  declare departmentId?: number | null;
  declare name: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Declare relationship properties
  declare department?: Department;

  // Declare association methods
  declare getDepartment: () => Promise<Department>;
  declare setDepartment: (department: Department) => Promise<void>;
}

// Initialize Rule Model
Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Departments",
        key: "id"
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: "Categories",
    modelName: "Category",
    indexes: [
      {
        unique: true,
        fields: ["departmentId", "name"]
      }
    ]
  }
);

export { Category };
