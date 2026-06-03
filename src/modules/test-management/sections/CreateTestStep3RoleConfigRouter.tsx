import type { CreateTestRole } from "../types/createTest.types";
import { StepRoleConfigDeveloper } from "../role-config/StepRoleConfigDeveloper";
import { StepRoleConfigFrontend } from "../role-config/StepRoleConfigFrontend";
import { StepRoleConfigQa } from "../role-config/StepRoleConfigQa";
import { StepRoleConfigDesigner } from "../role-config/StepRoleConfigDesigner";
import { StepRoleConfigGeneric, type StepRoleConfigGenericProps } from "../role-config/StepRoleConfigGeneric";

type Props = {
  roleCategory: CreateTestRole;
} & Omit<StepRoleConfigGenericProps, "roleCategory"> &
  Record<string, unknown>;

export function CreateTestStep3RoleConfigRouter({ roleCategory, ...props }: Props) {
  if (roleCategory === "developer") return <StepRoleConfigDeveloper {...props} roleCategory={roleCategory} />;
  if (roleCategory === "frontend") return <StepRoleConfigFrontend {...props} roleCategory={roleCategory} />;
  if (roleCategory === "qa_manual") return <StepRoleConfigQa {...props} roleCategory={roleCategory} />;
  if (roleCategory === "designer") return <StepRoleConfigDesigner {...props} roleCategory={roleCategory} />;
  return <StepRoleConfigGeneric {...props} roleCategory={roleCategory} />;
}
