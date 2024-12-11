// Interfaces for Category
export interface CategoryAttributes {
  id?: number;
  departmentId?: number | null;
  name: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
