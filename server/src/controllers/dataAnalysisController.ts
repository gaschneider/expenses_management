import { Request, Response, NextFunction } from "express";
import Expense from "../models/Expense";
import { Category } from "../models/Category";
import Department from "../models/Department";
import User from "../models/User";
import { ExpenseStatusEnum } from "../types/expense";
import sequelize from "../config/database";
import { Op, where } from "sequelize";
import { buildDataAnalysisQuery } from "../helpers/dataAnalysisQueryHelper"

// Returns the count of expenses grouped by status (merging pending statuses into one).
export const getExpensesStatusCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const authenticatedUser = await User.findByPk(req.user.id, {
      include: { model: Department, as: "departments" }
    });
    if (!authenticatedUser) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const {
      departmentId,
      startDate,
      endDate,
    } = req.query as {
      departmentId?: string;
      startDate?: string;
      endDate?: string;
    };

    const expensesGrouped = await Expense.findAll({
      where: await buildDataAnalysisQuery(authenticatedUser, {
        startDate,
        endDate,
        departmentId
      }),
      attributes: [
        "currentStatus",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["currentStatus"],
    });

    const groupedData = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    expensesGrouped.forEach((expense) => {
      const status = expense.getDataValue("currentStatus") as string;
      const count = Number(expense.getDataValue("count"));

      switch (status) {
        case ExpenseStatusEnum.PENDING_APPROVAL:
        case ExpenseStatusEnum.PENDING_ADDITIONAL_INFO:
          groupedData.PENDING += count;
          break;
        case ExpenseStatusEnum.APPROVED:
          groupedData.APPROVED += count;
          break;
        case ExpenseStatusEnum.REJECTED:
          groupedData.REJECTED += count;
          break;
        case ExpenseStatusEnum.CANCELLED:
        default:
          break;
      }
    });

    const responseData = [
      { status: "PENDING", count: groupedData.PENDING },
      { status: "APPROVED", count: groupedData.APPROVED },
      { status: "REJECTED", count: groupedData.REJECTED },
    ];

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// Returns the total amount of expenses grouped by status (merging pending statuses into one).
export const getExpensesAmountByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const authenticatedUser = await User.findByPk(req.user.id, {
      include: { model: Department, as: "departments" }
    });
    if (!authenticatedUser) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const {
      departmentId,
      startDate,
      endDate,
    } = req.query as {
      departmentId?: string;
      startDate?: string;
      endDate?: string;
    };

    const expensesGrouped = await Expense.findAll({
      where: await buildDataAnalysisQuery(authenticatedUser, {
        startDate,
        endDate,
        departmentId
      }),
      attributes: [
        "currentStatus",
        [sequelize.fn("SUM", sequelize.col("amount")), "amount"],
      ],
      group: ["currentStatus"],
    });

    const groupedData = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    expensesGrouped.forEach((expense) => {
      const status = expense.getDataValue("currentStatus") as ExpenseStatusEnum;
      const amount = Number(expense.getDataValue("amount"));

      switch (status) {
        case ExpenseStatusEnum.PENDING_APPROVAL:
        case ExpenseStatusEnum.PENDING_ADDITIONAL_INFO:
          groupedData.PENDING += amount;
          break;
        case ExpenseStatusEnum.APPROVED:
          groupedData.APPROVED += amount;
          break;
        case ExpenseStatusEnum.REJECTED:
          groupedData.REJECTED += amount;
          break;
      }
    });

    const responseData = Object.entries(groupedData).map(([status, amount]) => ({
      status,
      amount,
    }));

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// Returns the monthly sum of expenses (only with APPROVED status).
export const getExpensesByMonth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const authenticatedUser = await User.findByPk(req.user.id, {
      include: { model: Department, as: "departments" }
    });
    if (!authenticatedUser) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const {
      departmentId,
      startDate,
      endDate,
    } = req.query as {
      departmentId?: string;
      startDate?: string;
      endDate?: string;
    };

    const expensesByMonth = await Expense.findAll({
      attributes: [
        [sequelize.fn("MONTHNAME", sequelize.col("date")), "month"],
        [sequelize.fn("SUM", sequelize.col("amount")), "amount"],
      ],
      where: {
        [Op.and]: [
          { currentStatus: ExpenseStatusEnum.APPROVED },
          await buildDataAnalysisQuery(authenticatedUser, {
        startDate,
        endDate,
        departmentId
      }),
        ]
      },
      group: [
        sequelize.fn("MONTH", sequelize.col("date")),
        sequelize.fn("MONTHNAME", sequelize.col("date")),
      ],
      order: [[sequelize.fn("MONTH", sequelize.col("date")), "ASC"]],
    });

    const responseData = expensesByMonth.map((expense) => ({
      month: expense.getDataValue("month"),
      amount: Number(expense.getDataValue("amount")),
    }));

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// Returns global metrics (total amount, total expenses, distinct departments, and total pending expenses).
export const getGlobalMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const authenticatedUser = await User.findByPk(req.user.id, {
      include: { model: Department, as: "departments" }
    });
    if (!authenticatedUser) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const {
      departmentId,
      startDate,
      endDate,
    } = req.query as {
      departmentId?: string;
      startDate?: string;
      endDate?: string;
    };

    const [totalAmount, totalExpenses, totalDepartments, pendingExpenses] =
      await Promise.all([
        Expense.sum("amount", {
          where: {
            [Op.and]: [
              { currentStatus: ExpenseStatusEnum.APPROVED },
              await buildDataAnalysisQuery(authenticatedUser, {
        startDate,
        endDate,
        departmentId
      })
            ]
          }
        }),
        Expense.count({ where: await buildDataAnalysisQuery(authenticatedUser, {
        startDate,
        endDate,
        departmentId
      }) }),
        Expense.aggregate("departmentId", "COUNT", { distinct: true, where: await buildDataAnalysisQuery(authenticatedUser, {
        startDate,
        endDate,
        departmentId
      }) }),
        Expense.count({
          where: {
            [Op.and]: [
              {
                [Op.or]: [
                  { currentStatus: ExpenseStatusEnum.PENDING_APPROVAL },
                  { currentStatus: ExpenseStatusEnum.PENDING_ADDITIONAL_INFO },
                ]
              },
              await buildDataAnalysisQuery(authenticatedUser, {
        startDate,
        endDate,
        departmentId
      })
            ]
          },
        }),
      ]);

    const responseData = {
      totalAmount: Number(totalAmount),
      expenses: totalExpenses,
      departments: totalDepartments,
      pending: pendingExpenses,
    };

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

export const getCountExpensesByCategoryAndStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const authenticatedUser = await User.findByPk(req.user.id, {
      include: { model: Department, as: "departments" }
    });
    if (!authenticatedUser) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const {
      departmentId,
      startDate,
      endDate,
    } = req.query as {
      departmentId?: string;
      startDate?: string;
      endDate?: string;
    };

    const expensesGrouped = await Expense.findAll({
      attributes: [
        [sequelize.col('category.name'), 'category_name'],
        'currentStatus',
        [sequelize.fn('COUNT', sequelize.col('Expense.id')), 'count'],
      ],
      include: [{ model: Category, as: "category" }],
      where: {
        [Op.and]: [{
          [Op.or]: [
            { currentStatus: ExpenseStatusEnum.PENDING_APPROVAL },
            { currentStatus: ExpenseStatusEnum.PENDING_ADDITIONAL_INFO },
            { currentStatus: ExpenseStatusEnum.APPROVED },
            { currentStatus: ExpenseStatusEnum.REJECTED },
          ]
        },
        await buildDataAnalysisQuery(authenticatedUser, {
        startDate,
        endDate,
        departmentId
      }),
        ],
      },
      group: [
        'category.id',
        'category.name',
        'Expense.currentStatus',
      ],
    });
    const groupedData: Record<string, Record<string, number>> = {};
    expensesGrouped.forEach((expense) => {
      const category = expense.get("category_name") || "Uncategorized"; // Nome da categoria
      const status = expense.get("currentStatus") as string;
      const count = Number(expense.get("count"));

      if (!groupedData[category]) {
        groupedData[category] = {
          APPROVED: 0,
          PENDING: 0,
          REJECTED: 0,
        };
      }

      switch (status) {
        case "APPROVED":
          groupedData[category].APPROVED += count;
          break;
        case "PENDING_APPROVAL":
        case "PENDING_ADDITIONAL_INFO":
          groupedData[category].PENDING += count;
          break;
        case "REJECTED":
          groupedData[category].REJECTED += count;
          break;
        default:
          break;
      }
    });

    const responseData = Object.entries(groupedData).map(
      ([category, statuses]) => ({
        category,
        APPROVED: statuses.APPROVED,
        PENDING: statuses.PENDING,
        REJECTED: statuses.REJECTED,
      })
    );

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching expenses by category and status:", error);
    next(error);
  }
};

export const getAmountExpensesByCategoryAndStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const authenticatedUser = await User.findByPk(req.user.id, {
      include: { model: Department, as: "departments" }
    });
    if (!authenticatedUser) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const {
      departmentId,
      startDate,
      endDate,
    } = req.query as {
      departmentId?: string;
      startDate?: string;
      endDate?: string;
    };

    const expensesGrouped = await Expense.findAll({
      attributes: [
        [sequelize.col('category.name'), 'category_name'],
        'currentStatus',
        [sequelize.fn('SUM', sequelize.col('Expense.amount')), 'sum'],
      ],
      include: [{ model: Category, as: "category" }],
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { currentStatus: ExpenseStatusEnum.PENDING_APPROVAL },
              { currentStatus: ExpenseStatusEnum.PENDING_ADDITIONAL_INFO },
              { currentStatus: ExpenseStatusEnum.APPROVED },
              { currentStatus: ExpenseStatusEnum.REJECTED },
            ]
          },
          await buildDataAnalysisQuery(authenticatedUser, {
        startDate,
        endDate,
        departmentId
      }),
        ]
      },
      group: [
        'category.id',
        'category.name',
        'Expense.currentStatus',
      ],
    });
    const groupedData: Record<string, Record<string, number>> = {};
    expensesGrouped.forEach((expense) => {
      const category = expense.get("category_name") || "Uncategorized"; // Nome da categoria
      const status = expense.get("currentStatus") as string;
      const sum = Number(expense.get("sum"));

      if (!groupedData[category]) {
        groupedData[category] = {
          APPROVED: 0,
          PENDING: 0,
          REJECTED: 0,
        };
      }

      switch (status) {
        case "APPROVED":
          groupedData[category].APPROVED += sum;
          break;
        case "PENDING_APPROVAL":
        case "PENDING_ADDITIONAL_INFO":
          groupedData[category].PENDING += sum;
          break;
        case "REJECTED":
          groupedData[category].REJECTED += sum;
          break;
        default:
          break;
      }
    });

    const responseData = Object.entries(groupedData).map(
      ([category, statuses]) => ({
        category,
        APPROVED: statuses.APPROVED,
        PENDING: statuses.PENDING,
        REJECTED: statuses.REJECTED,
      })
    );

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching expenses by category and status:", error);
    next(error);
  }
};

export const getTotalExpensesByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const authenticatedUser = await User.findByPk(req.user.id, {
      include: { model: Department, as: "departments" }
    });
    if (!authenticatedUser) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const {
      departmentId,
      startDate,
      endDate,
    } = req.query as {
      departmentId?: string;
      startDate?: string;
      endDate?: string;
    };

    // Se quiser a contagem de registros
    const expensesGrouped = await Expense.findAll({
      attributes: [
        [sequelize.col("category.name"), "category_name"],
        [sequelize.fn("COUNT", sequelize.col("Expense.id")), "count"],
      ],
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { currentStatus: ExpenseStatusEnum.PENDING_APPROVAL },
              { currentStatus: ExpenseStatusEnum.PENDING_ADDITIONAL_INFO },
              { currentStatus: ExpenseStatusEnum.APPROVED },
              { currentStatus: ExpenseStatusEnum.REJECTED },
            ]
          },
          await buildDataAnalysisQuery(authenticatedUser, {
        startDate,
        endDate,
        departmentId
      }),
        ]
      },
      include: [
        {
          model: Category,
          as: "category",
          attributes: [], // Não retorna atributos extras, só precisa do JOIN
        },
      ],
      group: ["category.id", "category.name"], // Removemos a parte do currentStatus
    });

    // Mapeia o resultado do Sequelize (que é um array de Expenses)
    const responseData = expensesGrouped.map((expense) => ({
      category: expense.get("category_name"),
      count: Number(expense.get("count")),
    }));

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching total expenses by category:", error);
    next(error);
  }
};