import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

interface ExpenseAttributes {
  id: number;
  description: string;
  amount: number;
  date: Date;
}
class Expense extends Model<ExpenseAttributes> {
  declare id: number;
  declare description: string;
  declare amount: number;
  declare date: Date;
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: "Expense"
  }
);

export default Expense;
