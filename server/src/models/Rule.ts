import { Model, DataTypes, Transaction } from "sequelize";
import sequelize from "../config/database";
import Department from "./Department";
import User from "./User";
import { RuleAttributes, RuleStepAttributes } from "../types/rule";

interface RuleInstance extends Model<RuleAttributes, RuleAttributes> {
  id: number;
  departmentId: number;
  minValue: number;
  maxValue: number;
  canBeSingleApproved: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Associations
  department?: Department;
  ruleSteps?: RuleStep[];
}

interface RuleStepInstance extends Model<RuleStepAttributes, RuleStepAttributes> {
  id: number;
  ruleId: number;
  step: number;
  approvingDepartmentId: number | null;
  approvingUserId: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Associations
  rule?: Rule;
  approvingDepartment?: Department;
  approvingUser?: User;
}

// Rule Model
class Rule extends Model<RuleAttributes, RuleAttributes> implements RuleInstance {
  declare id: number;
  declare departmentId: number;
  declare minValue: number;
  declare maxValue: number;
  declare canBeSingleApproved: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Declare relationship properties
  declare department?: Department;
  declare ruleSteps?: RuleStep[];

  // Declare association methods
  declare getDepartment: () => Promise<Department>;
  declare setDepartment: (department: Department) => Promise<void>;
  declare getRuleSteps: () => Promise<RuleStep[]>;
  declare setRuleSteps: (ruleSteps: RuleStep[]) => Promise<void>;
  declare addRuleStep: (ruleStep: RuleStep) => Promise<void>;
  declare removeRuleStep: (ruleStep: RuleStep) => Promise<void>;
}

// RuleStep Model
class RuleStep extends Model<RuleStepAttributes, RuleStepAttributes> implements RuleStepInstance {
  declare id: number;
  declare ruleId: number;
  declare step: number;
  declare approvingDepartmentId: number | null;
  declare approvingUserId: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Declare relationship properties
  declare rule?: Rule;
  declare approvingDepartment?: Department;
  declare approvingUser?: User;

  // Declare association methods
  declare getRule: () => Promise<Rule>;
  declare setRule: (rule: Rule) => Promise<void>;
  declare getApprovingDepartment: () => Promise<Department | null>;
  declare setApprovingDepartment: (department: Department | null) => Promise<void>;
  declare getApprovingUser: () => Promise<User | null>;
  declare setApprovingUser: (user: User | null) => Promise<void>;
}

// Initialize Rule Model
Rule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Departments",
        key: "id"
      }
    },
    minValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    maxValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    canBeSingleApproved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: "Rules",
    modelName: "Rule",
    validate: {
      minLessThanMax(this: Rule) {
        if (this.minValue >= this.maxValue) {
          throw new Error("Minimum value must be less than maximum value");
        }
      }
    }
  }
);

// Initialize RuleStep Model
RuleStep.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    ruleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Rules",
        key: "id"
      }
    },
    step: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    approvingDepartmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Departments",
        key: "id"
      }
    },
    approvingUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id"
      }
    }
  },
  {
    sequelize,
    tableName: "RuleSteps",
    modelName: "RuleStep",
    validate: {
      exclusiveApprover(this: RuleStep) {
        if (this.approvingDepartmentId === null && this.approvingUserId === null) {
          throw new Error("Either approving department or approving user must be specified");
        }
        if (this.approvingDepartmentId !== null && this.approvingUserId !== null) {
          throw new Error("Cannot specify both approving department and approving user");
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ["ruleId", "step"]
      }
    ]
  }
);

export { Rule, RuleStep };
