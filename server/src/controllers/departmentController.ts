import { Request, Response, NextFunction } from "express";
import Department from "../models/Department";
import { Op } from "sequelize";
import { DepartmentPermission, SystemPermission } from "../types/auth";
import { Category } from "../models/Category";
import { categoryToDTO } from "./categoryController";
import User from "../models/User";
import { checkPermission, userHasPermission } from "../middlewares/checkPermission";

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
    const newDepartment = await Department.create({
      name,
      description
    });

    const newDepartmentInfo = newDepartment.get();

    res.status(201).json({
      message: "Department created successfully",
      department: {
        id: newDepartmentInfo.id,
        name: newDepartmentInfo.name,
        description: newDepartmentInfo.description
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  const departments = await Department.findAll();

  res.status(200).json(departments.map(departmentToDTO));
};

export const getDepartmentById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid department id" });
    return;
  }

  const department = await Department.findOne({ where: { id } });

  if (!department) {
    res.status(404).json({
      error: "Department not found"
    });
    return;
  }

  res.status(200).json(departmentToDTO(department));
};

export const editDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid department id" });
    return;
  }

  const department = await Department.findOne({ where: { id } });

  if (!department) {
    res.status(404).json({
      error: "Department not found"
    });
    return;
  }

  const { name, description } = req.body;

  if (!name) {
    res.status(400).json({
      error: "Name is required"
    });
    return;
  }

  const countDepartments = await Department.count({
    where: {
      name,
      id: {
        [Op.ne]: department.id
      }
    }
  });
  if (countDepartments > 0) {
    res.status(400).json({
      error: "Department already exists"
    });
    return;
  }

  await department.update({
    name,
    description
  });
  res.status(200).json({
    message: "Department updated successfully"
  });
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid department id" });
    return;
  }

  const department = await Department.findOne({ where: { id } });

  if (!department) {
    res.status(404).json({
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

export const getApproversByDepartmentId = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid department id" });
    return;
  }

  const department = await Department.findByPk(id);
  if (!department) {
    res.status(200).json([]);
    return;
  }

  const users = await department.getUsersWithPermission(DepartmentPermission.APPROVE_EXPENSES);

  const usersDTO = users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email
  }));

  res.status(200).json(usersDTO);
};

export const getCategoriesByDepartmentId = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
    res.status(400).json({ error: "Invalid department id" });
    return;
  }

  const categories = await Category.findAll({
    where: {
      departmentId: {
        [Op.or]: [{ [Op.is]: null }, { [Op.eq]: id }]
      }
    },
    include: {
      model: Department,
      as: "department"
    }
  });

  res.status(200).json(categories.map(categoryToDTO));
};

export const getCreateExpenseDepartmentsByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authenticated user not found" });
      return;
    }

    const user = await User.findByPk(req.user.id, {
      include: { model: Department, as: "departments" }
    });

    if (!user) {
      res.status(401).json({ error: "Authenticated user not found" });
      return;
    }

    if (await user.hasPermissionString(SystemPermission.ADMIN)) {
      const departments = await Department.findAll();
      res.status(200).json(departments.map(departmentToDTO));
      return;
    }

    if (!user.departments) {
      res.status(400).json({ error: "User has no departments" });
      return;
    }

    // Get accessible department IDs with proper null checks
    const accessibleDepartmentIdsPromises = new Map<string, Promise<boolean>>();

    for (let index = 0; index < user.departments?.length; index++) {
      const dept = user.departments[index];
      accessibleDepartmentIdsPromises.set(
        dept.id?.toString() ?? "",
        Promise.resolve(
          await userHasPermission(user, DepartmentPermission.CREATE_EXPENSES, dept.id)
        )
      );
    }

    const accessibleDepartmentIds: string[] = [];

    await Promise.all(
      Array.from(accessibleDepartmentIdsPromises).map(async ([deptId, promise]) => {
        if (await promise) accessibleDepartmentIds.push(deptId);
      })
    );

    const departmentsAllowedToCreate = await Department.findAll({
      where: { id: { [Op.in]: accessibleDepartmentIds } }
    });

    res.status(200).json(departmentsAllowedToCreate.map(departmentToDTO));
  } catch (error) {
    next(error);
  }
};

export const getExpenseDepartmentsByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authenticated user not found" });
      return;
    }

    const user = await User.findByPk(req.user.id, {
      include: { model: Department, as: "departments" }
    });

    if (!user) {
      res.status(401).json({ error: "Authenticated user not found" });
      return;
    }

    if (await user.hasPermissionString(SystemPermission.ADMIN)) {
      const departments = await Department.findAll();
      res.status(200).json(departments.map(departmentToDTO));
      return;
    }

    if (!user.departments) {
      res.status(400).json({ error: "User has no departments" });
      return;
    }
    const accessibleDepartmentIds: string[] = [];

    // Get accessible department IDs with proper null checks
    const accessibleDepartmentIdsPromises = new Map<string, Promise<boolean>>();
    for (let index = 0; index < user.departments?.length; index++) {
      const dept = user.departments[index];
      accessibleDepartmentIdsPromises.set(
        dept.id?.toString() ?? "",
        Promise.resolve(
          (await userHasPermission(user, DepartmentPermission.APPROVE_EXPENSES, dept.id)) ||
            (await userHasPermission(user, DepartmentPermission.CREATE_EXPENSES, dept.id)) ||
            (await userHasPermission(user, DepartmentPermission.VIEW_EXPENSES, dept.id))
        )
      );
    }

    await Promise.all(
      Array.from(accessibleDepartmentIdsPromises).map(async ([deptId, promise]) => {
        if (await promise) accessibleDepartmentIds.push(deptId);
      })
    );

    const departmentsAllowed = await Department.findAll({
      where: { id: { [Op.in]: accessibleDepartmentIds } }
    });

    res.status(200).json(departmentsAllowed.map(departmentToDTO));
  } catch (error) {
    next(error);
  }
};

export const getDataAnalysisDepartmentsByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authenticated user not found" });
      return;
    }

    const user = await User.findByPk(req.user.id, {
      include: { model: Department, as: "departments" }
    });

    if (!user) {
      res.status(401).json([]);
      return;
    }

    const departments = await Department.findAll();

    // Mapeia cada departamento para uma Promise de verificação de permissão
    const results = await Promise.all(
      departments.map(async (dept) => {
        const hasPermission = await userHasPermission(
          user,
          DepartmentPermission.VIEW_DEPARTMENT_DATA_ANALYSIS,
          dept.id
        );
        return { dept, hasPermission };
      })
    );
    
    // Filtra apenas os departamentos onde o usuário tem permissão
    const departmentsAllowedToCreate = results
      .filter(({ hasPermission }) => hasPermission)
      .map(({ dept }) => dept);
    
    // Mapeia para DTO, conforme necessário
    res.status(200).json(departmentsAllowedToCreate.map(departmentToDTO));    
  } catch (error) {
    next(error);
  }
};
