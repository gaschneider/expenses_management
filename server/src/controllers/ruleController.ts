import { Request, Response, NextFunction } from "express";
import Department from "../models/Department";
import { Op } from "sequelize";
import { Rule, RuleStep } from "../models/Rule";
import User from "../models/User";

interface DepartmentDTO {
  id: number;
  name: string;
  description: string;
}

interface UserDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface RuleStepDTO {
  id: number;
  ruleId: number;
  step: number;
  approvingDepartmentId: number | null;
  approvingUserId: number | null;
  approvingDepartment?: DepartmentDTO;
  approvingUser?: UserDTO;
}

interface RuleDTO {
  id: number;
  departmentId: number;
  minValue: number;
  maxValue: number;
  canBeSingleApproved: boolean;
  department?: DepartmentDTO;
  ruleSteps: RuleStepDTO[];
}

const stepToDTO = (step: RuleStep) => {
  return {
    id: step.id,
    ruleId: step.ruleId,
    step: step.step,
    approvingDepartmentId: step.approvingDepartmentId,
    approvingUserId: step.approvingUserId,
    approvingDepartment: departmentToDTO(step.approvingDepartment),
    approvingUser: userToDTO(step.approvingUser)
  };
};

const departmentToDTO = (department?: Department) => {
  return department
    ? {
        id: department.id!,
        name: department.name,
        description: department.description
      }
    : undefined;
};

const userToDTO = (user?: User) => {
  return user
    ? {
        id: user.id!,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    : undefined;
};

const ruleToDTO = (rule: Rule): RuleDTO => {
  return {
    id: rule.id,
    departmentId: rule.departmentId,
    minValue: rule.minValue,
    maxValue: rule.maxValue,
    canBeSingleApproved: rule.canBeSingleApproved,
    department: departmentToDTO(rule.department),
    ruleSteps: rule.ruleSteps?.map(stepToDTO) || []
  };
};

type RuleToCreateDTO = {
  departmentId: number;
  minValue: number;
  maxValue: number;
  canBeSingleApproved: boolean;
  steps: {
    approvingDepartmentId: number | null;
    approvingUserId: number | null;
  }[];
};

export const createRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const { departmentId, minValue, maxValue, canBeSingleApproved, steps } =
      req.body as RuleToCreateDTO;

    // // Validate input
    // if (!departmentId) {
    //   res.status(400).json({
    //     error: "Name is required"
    //   });
    //   return;
    // }

    // // Check if department already exists
    // const existingDepartment = await Department.findOne({ where: { name } });
    // if (existingDepartment) {
    //   res.status(400).json({
    //     error: "Department already exists"
    //   });
    //   return;
    // }

    // // Create new department
    // const newDepartment = await Department.create({
    //   name,
    //   description
    // });

    // const newDepartmentInfo = newDepartment.get();

    res.status(201).json({
      message: "Rule created successfully",
      rule: {
        // id: newDepartmentInfo.id,
        // name: newDepartmentInfo.name,
        // description: newDepartmentInfo.description
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRules = async (req: Request, res: Response) => {
  const rules = await Rule.findAll();

  res.status(200).json(rules.map(ruleToDTO));
};

export const getRuleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid rule id" });
    return;
  }

  const rule = await Rule.findOne({ where: { id } });

  if (!rule) {
    res.status(404).json({
      error: "Rule not found"
    });
    return;
  }

  res.status(200).json(ruleToDTO(rule));
};

export const editRule = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid rule id" });
    return;
  }

  const rule = await Rule.findOne({ where: { id } });

  if (!rule) {
    res.status(404).json({
      error: "rule not found"
    });
    return;
  }

  // const { name, description } = req.body;

  // if (!name) {
  //   res.status(400).json({
  //     error: "Name is required"
  //   });
  //   return;
  // }

  // const countDepartments = await Department.count({
  //   where: {
  //     name,
  //     id: {
  //       [Op.ne]: department.id
  //     }
  //   }
  // });
  // if (countDepartments > 0) {
  //   res.status(400).json({
  //     error: "Department already exists"
  //   });
  //   return;
  // }

  // await department.update({
  //   name,
  //   description
  // });
  res.status(200).json({
    message: "Rule updated successfully"
  });
};

export const deleteRule = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid rule id" });
    return;
  }

  const rule = await Rule.findOne({ where: { id } });

  if (!rule) {
    res.status(404).json({
      error: "Rule not found"
    });
    return;
  }

  try {
    await Rule.destroy({ where: { id }, cascade: true });

    res.status(200).json({
      message: "Rule deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
