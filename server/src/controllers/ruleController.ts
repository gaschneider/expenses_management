import { Request, Response, NextFunction } from "express";
import Department from "../models/Department";
import { Op } from "sequelize";
import { Rule, RuleStep } from "../models/Rule";
import User from "../models/User";
import sequelize from "../config/database";
import { DepartmentPermission } from "../types/auth";
import { RuleAttributes } from "../types/rule";

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

export type RuleToCreateDTO = {
  departmentId: number;
  minValue: number;
  maxValue: number;
  canBeSingleApproved: boolean;
  ruleSteps: {
    approvingDepartmentId: number | null;
    approvingUserId: number | null;
  }[];
};

export const createRule = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const {
      departmentId,
      minValue,
      maxValue,
      canBeSingleApproved,
      ruleSteps: steps
    } = req.body as RuleToCreateDTO;

    if (minValue >= maxValue) {
      res.status(400).json({ error: "Minimum value must be less than maximum value" });
      return;
    }

    // Validate department exists
    const department = await Department.findByPk(departmentId, { transaction });
    if (!department) {
      res.status(400).json({ error: "Invalid department" });
      return;
    }

    // Check for range conflicts
    const existingRangeConflict = await Rule.findOne({
      where: {
        departmentId,
        [Op.or]: [
          {
            minValue: { [Op.gte]: minValue },
            maxValue: { [Op.lte]: maxValue }
          },
          {
            minValue: { [Op.lte]: minValue },
            maxValue: { [Op.gte]: maxValue }
          },
          {
            minValue: { [Op.and]: [{ [Op.lt]: maxValue }, { [Op.gte]: minValue }] },
            maxValue: { [Op.gt]: minValue }
          },
          {
            minValue: { [Op.lt]: maxValue },
            maxValue: { [Op.and]: [{ [Op.gt]: minValue }, { [Op.lte]: maxValue }] }
          }
        ]
      },
      transaction
    });

    if (existingRangeConflict) {
      res.status(400).json({
        error: "Rule range conflicts with an existing rule"
      });
      return;
    }

    // Validate unique approvers and department permissions
    const approverDepartments = new Set<number>();
    const approverUsers = new Set<number>();

    const allowedApproversForDepartment = await department.getUsersWithPermission(
      DepartmentPermission.APPROVE_EXPENSES
    );

    for (const step of steps) {
      // Check for duplicate approvers
      if (step.approvingDepartmentId) {
        if (approverDepartments.has(step.approvingDepartmentId)) {
          res.status(400).json({
            error: "Duplicate approving department in rule steps"
          });
          return;
        }
        approverDepartments.add(step.approvingDepartmentId);
      }

      if (step.approvingUserId) {
        if (approverUsers.has(step.approvingUserId)) {
          res.status(400).json({
            error: "Duplicate approving user in rule steps"
          });
          return;
        }
        approverUsers.add(step.approvingUserId);

        // Validate user's department permissions
        const user = await User.findByPk(step.approvingUserId, {
          transaction
        });

        if (!user) {
          res.status(400).json({ error: "Invalid user" });
          return;
        }

        const canApprove = allowedApproversForDepartment.some((u) => u.id === step.approvingUserId);

        if (!canApprove) {
          res.status(403).json({
            error: `User ${user.id} does not have permission to approve expenses for this department`
          });
          return;
        }
      }
    }

    // Create Rule
    const rule = await Rule.create(
      {
        departmentId,
        minValue,
        maxValue,
        canBeSingleApproved
      },
      { transaction }
    );

    // Create Rule Steps
    await Promise.all(
      steps.map((step, index) =>
        RuleStep.create(
          {
            ruleId: rule.id,
            step: index + 1,
            approvingDepartmentId: step.approvingDepartmentId,
            approvingUserId: step.approvingUserId
          },
          { transaction }
        )
      )
    );

    // Commit transaction
    await transaction.commit();

    res.status(201).json({
      message: "Rule created successfully",
      ruleId: rule.id
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const getRules = async (req: Request, res: Response) => {
  const rules = await Rule.findAll({ include: { model: RuleStep, as: "ruleSteps" } });

  res.status(200).json(rules.map(ruleToDTO));
};

export const getRuleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid rule id" });
    return;
  }

  const rule = await Rule.findOne({ where: { id }, include: { model: RuleStep, as: "ruleSteps" } });

  if (!rule) {
    res.status(404).json({
      error: "Rule not found"
    });
    return;
  }

  res.status(200).json(ruleToDTO(rule));
};

export const editRule = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid rule id" });
    return;
  }

  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const ruleId = parseInt(req.params.id, 10);
    const updateData: Partial<RuleDTO> = req.body;

    // Find existing rule
    const existingRule = await Rule.findByPk(ruleId, {
      include: { model: RuleStep, as: "ruleSteps" },
      transaction
    });

    if (!existingRule) {
      res.status(404).json({ error: "Rule not found" });
      return;
    }

    // Merge existing data with update data
    const finalMinValue = updateData.minValue ?? existingRule.minValue;
    const finalMaxValue = updateData.maxValue ?? existingRule.maxValue;
    const finalDepartmentId = updateData.departmentId ?? existingRule.departmentId;

    const department = await Department.findByPk(finalDepartmentId, { transaction });

    if (!department) {
      res.status(400).json({ error: "Invalid department" });
      return;
    }

    // Check for range conflicts
    const rangeConflict = await Rule.findOne({
      where: {
        id: { [Op.ne]: ruleId }, // Exclude current rule
        departmentId: existingRule.departmentId,
        [Op.or]: [
          {
            minValue: { [Op.lte]: finalMinValue },
            maxValue: { [Op.gte]: finalMaxValue }
          },
          {
            minValue: { [Op.gte]: finalMinValue },
            maxValue: { [Op.lte]: finalMaxValue }
          },
          {
            minValue: { [Op.and]: [{ [Op.lt]: finalMaxValue }, { [Op.gte]: finalMinValue }] },
            maxValue: { [Op.gt]: finalMinValue }
          },
          {
            minValue: { [Op.lt]: finalMaxValue },
            maxValue: { [Op.and]: [{ [Op.gt]: finalMinValue }, { [Op.lte]: finalMaxValue }] }
          }
        ]
      },
      transaction
    });

    if (rangeConflict) {
      res.status(400).json({ error: "Rule range conflicts with an existing rule" });
      return;
    }

    // Update Rule main attributes
    const updateFields: Partial<RuleAttributes> = {
      ...(updateData.departmentId && { departmentId: finalDepartmentId }),
      ...(updateData.minValue !== undefined && { minValue: finalMinValue }),
      ...(updateData.maxValue !== undefined && { maxValue: finalMaxValue }),
      ...(updateData.canBeSingleApproved !== undefined && {
        canBeSingleApproved: updateData.canBeSingleApproved
      })
    };

    await existingRule.update(updateFields, { transaction });

    // Handle Rule Steps update
    if (updateData.ruleSteps) {
      // Validate unique approvers
      const approverDepartments = new Set<number>();
      const approverUsers = new Set<number>();

      const allowedApproversForDepartment = await department.getUsersWithPermission(
        DepartmentPermission.APPROVE_EXPENSES
      );

      const updatedStepIds = updateData.ruleSteps.map((step) => step.id);
      await RuleStep.destroy({
        where: {
          ruleId: existingRule.id,
          id: { [Op.notIn]: updatedStepIds }
        },
        transaction
      });

      const existingRuleSteps = await RuleStep.findAll({
        where: {
          ruleId: existingRule.id,
          id: { [Op.in]: updatedStepIds }
        },
        transaction
      });

      // Process steps
      const ruleStepsToUpdate: Promise<RuleStep>[] = [];
      const ruleStepsToCreate: Promise<RuleStep>[] = [];

      const validateRuleStepApprovers = async (stepData: RuleStepDTO) => {
        // Check for duplicate approvers
        if (stepData.approvingDepartmentId) {
          if (approverDepartments.has(stepData.approvingDepartmentId)) {
            throw new Error("Duplicate approving department in rule steps");
          }
          approverDepartments.add(stepData.approvingDepartmentId);
        }

        if (stepData.approvingUserId) {
          if (approverUsers.has(stepData.approvingUserId)) {
            throw new Error("Duplicate approving user in rule steps");
          }
          approverUsers.add(stepData.approvingUserId);

          // Validate user's department permissions
          const user = await User.findByPk(stepData.approvingUserId, {
            transaction
          });

          if (!user) {
            throw new Error("Invalid user");
          }

          const canApprove = allowedApproversForDepartment.some(
            (u) => u.id === stepData.approvingUserId
          );

          if (!canApprove) {
            throw new Error(
              `User ${user.id} does not have permission to approve expenses for this department`
            );
          }
        }
      };

      for (let index = updateData.ruleSteps.length - 1; index >= 0; index--) {
        const stepData = updateData.ruleSteps[index];

        // If step has an ID, update existing step
        if (stepData.id) {
          const existingStep = existingRuleSteps.find((s) => s.id === stepData.id);
          if (existingStep) {
            ruleStepsToUpdate.push(
              validateRuleStepApprovers(stepData).then(() =>
                existingStep.update(
                  {
                    step: index + 1,
                    approvingDepartmentId: stepData.approvingDepartmentId,
                    approvingUserId: stepData.approvingUserId
                  },
                  { transaction }
                )
              )
            );
            continue;
          }
        }

        // If no ID, create new step
        ruleStepsToCreate.push(
          validateRuleStepApprovers(stepData).then(() =>
            RuleStep.create(
              {
                ruleId: existingRule.id,
                step: index + 1,
                approvingDepartmentId: stepData.approvingDepartmentId,
                approvingUserId: stepData.approvingUserId
              },
              { transaction }
            )
          )
        );
      }

      await Promise.all(ruleStepsToUpdate);
      await Promise.all(ruleStepsToCreate);
    }

    // Commit transaction
    await transaction.commit();

    res.status(200).json({
      message: "Rule updated successfully"
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
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
