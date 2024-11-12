import { Request, Response, NextFunction } from "express";
import { UserInstance } from "../types/auth";
import passport from "passport";
import { validateEmail } from "../helpers/emailHelper";
import User from "../models/User";
import { getUserDTO } from "../config/passport";
import Department from "../models/Department";

const departmentToDTO = (department: Department) => {
  return {
    id: department.id,
    name: department.name,
    description: department.description
  };
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const { name, description } = req.body;

    // Validate input
    if (!name) {
      res.status(400).json({
        error: "Name is required"
      });
      return;
    }

    // Check if department already exists
    const existingDepartment = await Department.findOne({ where: { name } });
    if (existingDepartment) {
      res.status(400).json({
        error: "Department already exists"
      });
      return;
    }

    // Create new department
    await Department.create({
      name,
      description
    });

    res.status(201).json({
      message: "Department created successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  const departments = await Department.findAll();

  res.json(departments.map(departmentToDTO));
};

export const getDepartmentById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id == null || typeof id != "string") {
    res.status(401).json({ error: "Invalid department id" });
    return;
  }

  const department = await Department.findOne({ where: { id } });

  if (!department) {
    res.status(400).json({
      error: "Department not found"
    });
    return;
  }

  res.json(departmentToDTO(department));
};

export const editDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (id == null || typeof id != "string") {
    res.status(401).json({ error: "Invalid department id" });
    return;
  }

  const department = await Department.findOne({ where: { id } });

  if (!department) {
    res.status(400).json({
      error: "Department not found"
    });
    return;
  }

  const { name, description } = req.body;
  department.update({
    name,
    description
  });
  res.status(200).json({
    message: "Department updated successfully"
  });
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (id == null || typeof id != "string") {
    res.status(401).json({ error: "Invalid department id" });
    return;
  }

  const department = await Department.findOne({ where: { id } });

  if (!department) {
    res.status(400).json({
      error: "Department not found"
    });
    return;
  }

  try {
    await Department.destroy({ where: { id }, cascade: true });

    res.status(200).json({
      message: "Department deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
