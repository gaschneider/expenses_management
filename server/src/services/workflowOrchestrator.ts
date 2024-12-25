import { EventEmitter } from "events";
import { RuleBasedWorkflowService } from "./workflowService";
import User from "../models/User";

export class WorkflowOrchestrator {
  private eventBus: EventEmitter;
  private workflowService: RuleBasedWorkflowService;
  // private logger: Logger;

  constructor(workflowService: RuleBasedWorkflowService) {
    this.eventBus = new EventEmitter();
    this.workflowService = workflowService;
    // this.logger = new Logger("WorkflowOrchestrator");
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Expense creation workflow trigger
    this.eventBus.on("expense:created", async (expenseId: number) => {
      try {
        // Use a system user ID or implement a way to get initial system user
        const systemUserId = await this.getSystemInitiatorUserId();
        await this.workflowService.processExpenseWorkflow(expenseId, systemUserId);
        console.info(`Workflow initiated for expense ${expenseId}`);
      } catch (error) {
        console.error(`Workflow initiation failed for expense ${expenseId}`, error);
      }
    });

    // Expense approval event
    this.eventBus.on(
      "expense:approve",
      async (data: { expenseId: number; userId: number; comment?: string }) => {
        try {
          await this.workflowService.advanceToNextApprovalStep(
            data.expenseId,
            data.userId,
            data.comment
          );
          console.info(`Expense ${data.expenseId} approved by user ${data.userId}`);
        } catch (error) {
          console.error(`Expense approval failed for expense ${data.expenseId}`, error);
        }
      }
    );
  }

  // Method to trigger workflow
  async triggerWorkflow(expenseId: number) {
    this.eventBus.emit("expense:created", expenseId);
  }

  // Method to approve expense
  async approveExpense(expenseId: number, userId: number, comment?: string) {
    this.eventBus.emit("expense:approve", { expenseId, userId, comment });
  }

  // Helper method to get system initiator user ID
  private async getSystemInitiatorUserId(): Promise<number> {
    // Implement logic to get a system user with workflow initiation rights
    // This could be a predefined system user in your database
    const systemUser = await User.findOne({
      where: {
        email: "admin@example.com"
      }
    });

    if (!systemUser) {
      throw new Error("No system initiator user found");
    }

    return systemUser.id!;
  }
}
