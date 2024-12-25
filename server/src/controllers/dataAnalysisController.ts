import { Request, Response, NextFunction } from "express";
import Expense from "../models/Expense";
import {  ExpenseStatusEnum } from "../types/expense";
import sequelize from "../config/database";
import { Op } from "sequelize";

export const getExpensesStatusCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Faz a consulta agrupada por currentStatus
    const expensesGrouped = await Expense.findAll({
      attributes: [
        "currentStatus",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["currentStatus"],
    });

    // Mapeia o resultado para o formato desejado
    const responseData = expensesGrouped.map((expense) => ({
      status: expense.getDataValue("currentStatus"),
      count: Number(expense.getDataValue("count")), // Converter para número
    }));

    // Retorna o resultado (não há necessidade de "return" aqui)
    res.status(200).json(responseData);
  } catch (error) {
    // Envia o erro para o próximo middleware de tratamento de erro
    next(error);
  }
};

export const getExpensesAmountByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Consulta agrupada por currentStatus, somando o campo "amount"
    const expensesGrouped = await Expense.findAll({
      attributes: [
        "currentStatus",
        [sequelize.fn("SUM", sequelize.col("amount")), "amount"],
      ],
      group: ["currentStatus"],
    });

    // Formata o resultado no formato desejado
    const responseData = expensesGrouped.map((expense) => ({
      status: expense.getDataValue("currentStatus"),
      amount: Number(expense.getDataValue("amount")),
    }));

    // Exemplo de retorno:
    // [
    //   { status: 'Approved', amount: 4200 },
    //   { status: 'Pending', amount: 1902 },
    //   { status: 'Declined', amount: 3200 },
    // ]
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

export const getExpensesByMonth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Busca somando o campo "amount", agrupado por nome do mês
    const expensesByMonth = await Expense.findAll({
      attributes: [
        [sequelize.fn("MONTHNAME", sequelize.col("date")), "month"],
        [sequelize.fn("SUM", sequelize.col("amount")), "amount"],
      ],
      group: [
        sequelize.fn("MONTH", sequelize.col("date")),
        sequelize.fn("MONTHNAME", sequelize.col("date")),
      ],
      // Ordenar pelo número do mês (1..12)
      order: [[sequelize.fn("MONTH", sequelize.col("date")), "ASC"]],
      // opcionalmente, você pode ordenar por mês (1 a 12), mas requer outra função ou manipulação no front
      // order: [sequelize.fn("MONTH", sequelize.col("date"))],
    });

    // Mapeamos cada resultado para o formato desejado
    const responseData = expensesByMonth.map((expense) => ({
      month: expense.getDataValue("month"), // "Jan", "Feb", ...
      amount: Number(expense.getDataValue("amount")),
    }));

    // Exemplo de retorno:
    // [
    //   { month: 'Jan', amount: 100 },
    //   { month: 'Feb', amount: 1500 },
    //   { month: 'Mar', amount: 3000 },
    //   { month: 'Jun', amount: 5000 },
    //   ...
    // ]
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

export const getGlobalMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Executa consultas em paralelo (Promise.all)
    const [totalAmount, totalExpenses, totalDepartments, pendingExpenses] = await Promise.all([
      // 1) Soma de todos os amounts:
      Expense.sum("amount"),
      // 2) Total de despesas (quantidade):
      Expense.count(),
      // 3) Total de departamentos (quantidade):
      Expense.aggregate("departmentId", "COUNT", { distinct: true }),
      // 4) Total de despesas pendentes (filtro por currentStatus: "PENDING")
      Expense.count({
        where: {
          [Op.or]: [
            { currentStatus: ExpenseStatusEnum.PENDING_APPROVAL },
            { currentStatus: ExpenseStatusEnum.PENDING_ADDITIONAL_INFO }
          ],
        },
      }),
    ]);

    // Monta o objeto de retorno conforme solicitado
    const responseData = {
      totalAmount: Number(totalAmount), // sum() pode retornar string dependendo do dialeto
      expenses: totalExpenses,
      departments: totalDepartments,
      pending: pendingExpenses,
    };

    // Exemplo de retorno:
    // {
    //   totalAmount: 9302,
    //   expenses: 10,
    //   departments: 10,
    //   pending: 10
    // }
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};