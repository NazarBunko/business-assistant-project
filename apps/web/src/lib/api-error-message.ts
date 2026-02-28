export const API_ERROR_KEYS: Record<string, string> = {
  "User already exists": "Common.errors.userExists",
  "Invalid company code": "Common.errors.invalidCompanyCode",
  Forbidden: "Common.errors.forbidden",
  "Only owner or admin can remove employees":
    "Common.errors.onlyOwnerOrAdminCanRemove",
  "Employee not found": "Common.errors.employeeNotFound",
  "Cannot remove company owner": "Common.errors.cannotRemoveOwner",
  "Invalid credentials": "Auth.Login.errors.invalidCredentials",
  "Employee has no salary set": "Employees.noSalarySet",
  "Only owner or admin can update employees":
    "Common.errors.onlyOwnerOrAdminCanRemove",
  "Cannot pay tax for current month": "tax.cannotPayCurrentMonth",
  "Cannot delete salary or bonus payment. Use employees section to manage.":
    "table.cannotDeleteSalary",
};

export function getApiErrorMessage(
  message: string,
  t: (key: string) => string
): string {
  const key = API_ERROR_KEYS[message];
  return key ? t(key) : message;
}
