import type { ComponentProps } from "react";
import type { CreateTestRole } from "../types/createTest.types";
import { StepRoleConfigDeveloper } from "../role-config/StepRoleConfigDeveloper";
import { StepRoleConfigFrontend } from "../role-config/StepRoleConfigFrontend";
import { StepRoleConfigQa } from "../role-config/StepRoleConfigQa";
import { StepRoleConfigDesigner } from "../role-config/StepRoleConfigDesigner";
import { StepRoleConfigGeneric } from "../role-config/StepRoleConfigGeneric";

type Props = {
  roleCategory: CreateTestRole;
} & Record<string, unknown>;

export function CreateTestStep3RoleConfigRouter({ roleCategory, ...props }: Props) {
  if (roleCategory === "developer") {
    return <StepRoleConfigDeveloper {...(props as ComponentProps<typeof StepRoleConfigDeveloper>)} roleCategory={roleCategory} />;
  }
  if (roleCategory === "frontend") {
    return <StepRoleConfigFrontend {...(props as ComponentProps<typeof StepRoleConfigFrontend>)} roleCategory={roleCategory} />;
  }
  if (roleCategory === "qa_manual") {
    return <StepRoleConfigQa {...(props as ComponentProps<typeof StepRoleConfigQa>)} roleCategory={roleCategory} />;
  }
  if (roleCategory === "designer") {
    return <StepRoleConfigDesigner {...(props as ComponentProps<typeof StepRoleConfigDesigner>)} roleCategory={roleCategory} />;
  }
  return <StepRoleConfigGeneric {...(props as ComponentProps<typeof StepRoleConfigGeneric>)} roleCategory={roleCategory} />;
}
