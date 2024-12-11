import { Request, Response, NextFunction } from "express";
import Department from "../models/Department";
import { Op } from "sequelize";
import { Rule, RuleStep } from "../models/Rule";
import User from "../models/User";
import sequelize from "../config/database";
import { DepartmentPermission } from "../types/auth";
import { RuleAttributes } from "../types/rule";
import { Category } from "../models/Category";

interface DepartmentDTO {
  id: number;
  name: string;
  description: string;
}

interface CategoryDTO {
  id: number;
  departmentId?: number | null;
  name: string;
  department?: DepartmentDTO;
}

const departmentToDTO = (department?: Department) => {
  return department
    ? {
        id: department.id!,
        name: department.name,
        description: department.description
      }
    : undefined;
};

const categoryToDTO = (category: Category): CategoryDTO => {
  return {
    id: category.id,
    departmentId: category.departmentId,
    name: category.name,
    department: departmentToDTO(category.department)
  };
};

export type CategoryToCreateDTO = {
  departmentId?: number;
  name: string;
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      res.status(401).json({ error: "User not found" });
      await transaction.rollback();
      return;
    }

    const { departmentId, name } = req.body as CategoryToCreateDTO;

    if (departmentId) {
      // Validate department exists
      const department = await Department.findByPk(departmentId, { transaction });
      if (!department) {
        res.status(400).json({ error: "Invalid department" });
        await transaction.rollback();
        return;
      }

      const departmentCategoryExist = await Category.findOne({
        where: {
          departmentId,
          name
        }
      });
      if (departmentCategoryExist) {
        res.status(404).json({ error: `Department category already exists with name ${name}` });
        await transaction.rollback();
        return;
      }

      const generalCategoryExist = await Category.findOne({
        where: {
          departmentId: null,
          name
        }
      });
      if (generalCategoryExist) {
        res.status(404).json({ error: `General category already exists with name ${name}` });
        await transaction.rollback();
        return;
      }
    }

    // Create Category
    const category = await Category.create(
      {
        departmentId,
        name
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    res.status(201).json({
      message: "Category created successfully",
      categoryId: category.id
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response) => {
  const categories = await Category.findAll({ include: { model: Department, as: "department" } });

  res.status(200).json(categories.map(categoryToDTO));
};

export const getCategoryById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid category id" });
    return;
  }

  const category = await Category.findOne({
    where: { id },
    include: { model: Department, as: "department" }
  });

  if (!category) {
    res.status(404).json({
      error: "Category not found"
    });
    return;
  }

  res.status(200).json(categoryToDTO(category));
};

export const editCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid category id" });
    return;
  }

  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      res.status(401).json({ error: "User not found" });
      await transaction.rollback();
      return;
    }

    const categoryId = parseInt(req.params.id, 10);
    const updateData: Omit<CategoryDTO, "departmentId" | "department"> = req.body;

    // Find existing category
    const existingCategory = await Category.findByPk(categoryId, {
      include: { model: Department, as: "department" },
      transaction
    });

    if (!existingCategory) {
      res.status(404).json({ error: "Category not found" });
      await transaction.rollback();
      return;
    }

    const { name: nameToUpdate } = updateData;

    // Merge existing data with update data
    if (existingCategory.departmentId) {
      const department = await Department.findByPk(existingCategory.departmentId, { transaction });
      if (!department) {
        res.status(400).json({ error: "Invalid department" });
        await transaction.rollback();
        return;
      }

      const departmentCategoryExist = await Category.findOne({
        where: {
          departmentId: existingCategory.departmentId,
          name: nameToUpdate
        }
      });
      if (departmentCategoryExist) {
        res.status(404).json({ error: `Department category already exists with name ${name}` });
        await transaction.rollback();
        return;
      }

      const generalCategoryExist = await Category.findOne({
        where: { departmentId: null, name: nameToUpdate }
      });
      if (generalCategoryExist) {
        res
          .status(404)
          .json({ error: `General category already exists with name ${nameToUpdate}` });
        await transaction.rollback();
        return;
      }
    }

    await existingCategory.update({ name: nameToUpdate }, { transaction });

    // Commit transaction
    await transaction.commit();

    res.status(200).json({
      message: "Category updated successfully"
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid category id" });
    return;
  }

  const category = await Category.findOne({ where: { id } });

  if (!category) {
    res.status(404).json({
      error: "Category not found"
    });
    return;
  }

  try {
    await Category.destroy({ where: { id }, cascade: true });

    res.status(200).json({
      message: "Category deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
