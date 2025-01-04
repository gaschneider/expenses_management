import { WorkflowOrchestrator } from "../services/workflowOrchestrator";
import { RuleBasedWorkflowService } from "../services/workflowService";

export class WorkflowConfig {
  private static instance: WorkflowConfig;
  public orchestrator: WorkflowOrchestrator;
  public workflowService: RuleBasedWorkflowService;

  private constructor() {
    this.workflowService = new RuleBasedWorkflowService();
    this.orchestrator = new WorkflowOrchestrator(this.workflowService);
  }

  // Singleton pattern to ensure single workflow configuration
  public static getInstance(): WorkflowConfig {
    if (!WorkflowConfig.instance) {
      WorkflowConfig.instance = new WorkflowConfig();
    }
    return WorkflowConfig.instance;
  }
}
