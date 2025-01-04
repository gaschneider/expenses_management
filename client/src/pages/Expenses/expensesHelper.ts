import { ExpenseStatusEnum } from "../../types/api";

export const expenseStatusEnumToText = (status: ExpenseStatusEnum) => {
  switch (status) {
    case ExpenseStatusEnum.DRAFT:
      return "Draft";
    case ExpenseStatusEnum.PENDING_ADDITIONAL_INFO:
      return "Pending additional info";
    case ExpenseStatusEnum.PENDING_APPROVAL:
      return "Pending approval";
    case ExpenseStatusEnum.WAITING_WORKFLOW:
      return "Waiting workflow";
    case ExpenseStatusEnum.APPROVED:
      return "Approved";
    case ExpenseStatusEnum.CANCELLED:
      return "Cancelled";
    case ExpenseStatusEnum.REJECTED:
      return "Rejected";
    default:
      return "Unknown";
  }
};
