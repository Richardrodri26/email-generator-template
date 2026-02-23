export interface Theme {
  id: string;
  name: string;
  authorId: string;
  isDefault: boolean;
  // Raw CSS text that a user pastes (e.g. from Shadcn)
  cssVariables: string;
  createdAt: string;
  updatedAt: string;
}
