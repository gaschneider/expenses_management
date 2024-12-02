// Interfaces for Rule
export interface RuleAttributes {
  id?: number;
  departmentId: number;
  minValue: number;
  maxValue: number;
  canBeSingleApproved: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// Interfaces for RuleStep
export interface RuleStepAttributes {
  id?: number;
  ruleId: number;
  step: number;
  approvingDepartmentId?: number | null;
  approvingUserId?: number | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
