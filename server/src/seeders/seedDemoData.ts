import { Category } from "../models/Category";
import Department from "../models/Department";
import Expense from "../models/Expense";
import { Rule, RuleStep } from "../models/Rule";
import User from "../models/User";
import UserPermission from "../models/UserPermission";
import { DepartmentPermission, SystemPermission } from "../types/auth";

const usersToCreate: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  permissions: SystemPermission[];
  departmentPermissions: Record<string, DepartmentPermission[]>;
}[] = [
  {
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "Example",
    password: "admin123",
    permissions: [SystemPermission.ADMIN],
    departmentPermissions: {}
  },
  {
    email: "manager@example.com",
    firstName: "Manager",
    lastName: "Example",
    password: "manager123",
    permissions: [
      SystemPermission.CREATE_DEPARTMENT,
      SystemPermission.DELETE_DEPARTMENT,
      SystemPermission.EDIT_DEPARTMENT,
      SystemPermission.MANAGE_CATEGORIES,
      SystemPermission.MANAGE_RULES,
      SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS
    ],
    departmentPermissions: {}
  },
  {
    email: "it_leader@example.com",
    firstName: "IT",
    lastName: "Leader",
    password: "ITLeader123",
    permissions: [SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS],
    departmentPermissions: {
      ["IT"]: [
        DepartmentPermission.APPROVE_EXPENSES,
        DepartmentPermission.CREATE_EXPENSES,
        DepartmentPermission.VIEW_EXPENSES,
        DepartmentPermission.VIEW_DEPARTMENT_DATA_ANALYSIS
      ]
    }
  },
  {
    email: "it_user@example.com",
    firstName: "IT",
    lastName: "User",
    password: "ITUser123",
    permissions: [],
    departmentPermissions: { ["IT"]: [DepartmentPermission.CREATE_EXPENSES] }
  },
  {
    email: "hr_leader@example.com",
    firstName: "HR",
    lastName: "Leader",
    password: "HRLeader123",
    permissions: [SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS],
    departmentPermissions: {
      ["HR"]: [
        DepartmentPermission.APPROVE_EXPENSES,
        DepartmentPermission.CREATE_EXPENSES,
        DepartmentPermission.VIEW_EXPENSES,
        DepartmentPermission.VIEW_DEPARTMENT_DATA_ANALYSIS
      ]
    }
  },
  {
    email: "finance_leader@example.com",
    firstName: "Finance",
    lastName: "Leader",
    password: "financeLeader123",
    permissions: [SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS],
    departmentPermissions: {
      ["Finance"]: [
        DepartmentPermission.APPROVE_EXPENSES,
        DepartmentPermission.CREATE_EXPENSES,
        DepartmentPermission.VIEW_EXPENSES,
        DepartmentPermission.VIEW_DEPARTMENT_DATA_ANALYSIS
      ]
    }
  }
];

const departmentsToCreate = [
  {
    name: "IT",
    description: "Technology"
  },
  {
    name: "HR",
    description: "Human Resources"
  },
  {
    name: "Finance",
    description: "Finance"
  }
];

const categoriesToCreate = [
  {
    department: "IT",
    name: "Travel"
  },
  {
    department: "IT",
    name: "Office Supplies"
  },
  {
    department: "IT",
    name: "Meals"
  }
];

const rulesToCreate = [
  {
    department: "IT",
    minValue: 0,
    maxValue: 100,
    ruleSteps: [
      {
        step: 1,
        approverType: "USER",
        approver: "it_user@example.com"
      }
    ]
  },
  {
    department: "IT",
    minValue: 100,
    maxValue: 1000,
    canBeSingleApproved: false,
    ruleSteps: [
      {
        step: 1,
        approverType: "USER",
        approver: "it_user@example.com"
      },
      {
        step: 2,
        approverType: "DEPARTMENT",
        approver: "Finance"
      }
    ]
  }
];

export const seedDemoData = async () => {
  console.log("Seeding demo data...");

  await Expense.destroy({ where: {} });
  await RuleStep.destroy({ where: {} });
  await Rule.destroy({ where: {} });
  await Category.destroy({ where: {} });
  await Department.destroy({ where: {} });
  await User.destroy({ where: {} });

  for (const department of departmentsToCreate) {
    let departmentRecord = await Department.findOne({ where: { name: department.name } });
    if (!departmentRecord) {
      departmentRecord = await Department.create({
        name: department.name,
        description: department.description
      });
    }
  }

  for (const user of usersToCreate) {
    let userRecord = await User.findOne({ where: { email: user.email } });
    if (!userRecord) {
      userRecord = await User.create({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password
      });
    }

    for (const permission of user.permissions) {
      await userRecord.addUserPermissionString(permission);
    }

    for (const departmentName of Object.keys(user.departmentPermissions)) {
      const department = await Department.findOne({ where: { name: departmentName } });
      if (department) {
        for (const permission of user.departmentPermissions[departmentName]) {
          userRecord.addDepartmentPermissionString(department.id!, permission);
        }
      }
    }
  }

  for (const category of categoriesToCreate) {
    const department = await Department.findOne({ where: { name: category.department } });
    await Category.create({
      name: category.name,
      departmentId: department?.id
    });
  }

  for (const rule of rulesToCreate) {
    const department = await Department.findOne({ where: { name: rule.department } });
    if (department) {
      const ruleRecord = await Rule.create({
        departmentId: department.id!,
        minValue: rule.minValue,
        maxValue: rule.maxValue,
        canBeSingleApproved: false
      });

      for (const step of rule.ruleSteps) {
        let approvingUserId: number | null = null;
        let approvingDepartmentId: number | null = null;
        if (step.approverType === "USER") {
          const userRecord = await User.findOne({ where: { email: step.approver } });
          approvingUserId = userRecord?.id ?? null;
        } else if (step.approverType === "DEPARTMENT") {
          const departmentRecord = await Department.findOne({ where: { name: step.approver } });
          approvingDepartmentId = departmentRecord?.id ?? null;
        }
        await RuleStep.create({
          ruleId: ruleRecord.id!,
          step: step.step,
          approvingUserId,
          approvingDepartmentId
        });
      }
    }
  }

  console.log("Demo data seeded.");
};

seedDemoData();
