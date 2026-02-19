import { checkPasswordRules, passwordStrength } from "@/src/lib/password-strength";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";

function ruleClass(passed: boolean) {
  return passed ? "text-emerald-700" : "text-slate-500";
}

export default function PasswordRulesPanel({
  password,
  email,
}: {
  password: string;
  email: string;
}) {
  const rules = checkPasswordRules(password, email);
  const strength = passwordStrength(password);
  const progressWidth = `${(strength.score / 4) * 100}%`;
  const strengthTone =
    strength.score >= 4 ? "success" : strength.score >= 3 ? "info" : "warning";

  return (
    <Card className="rounded-2xl shadow-none">
      <CardContent className="px-4 py-3 text-xs">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-700">Password rules</p>
        <Badge tone={strengthTone}>
          Strength: {strength.label}
        </Badge>
      </div>
      <div
        aria-label="Password strength progress"
        className="mt-2 h-1.5 w-full rounded-full bg-slate-200"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            strength.score >= 4
              ? "bg-emerald-500"
              : strength.score >= 3
                ? "bg-sky-500"
                : "bg-amber-500"
          )}
          style={{ width: progressWidth }}
        />
      </div>
      <ul className="mt-2 space-y-1">
        <li className={ruleClass(rules.lengthOk)} data-status={rules.lengthOk ? "pass" : "fail"}>
          {rules.lengthOk ? "OK" : "Need"} 10+ characters
        </li>
        <li className={ruleClass(rules.hasUpper)} data-status={rules.hasUpper ? "pass" : "fail"}>
          {rules.hasUpper ? "OK" : "Need"} at least one uppercase letter
        </li>
        <li className={ruleClass(rules.hasLower)} data-status={rules.hasLower ? "pass" : "fail"}>
          {rules.hasLower ? "OK" : "Need"} at least one lowercase letter
        </li>
        <li className={ruleClass(rules.hasNumber)} data-status={rules.hasNumber ? "pass" : "fail"}>
          {rules.hasNumber ? "OK" : "Need"} at least one number
        </li>
        <li className={ruleClass(rules.hasSymbol)} data-status={rules.hasSymbol ? "pass" : "fail"}>
          {rules.hasSymbol ? "OK" : "Need"} at least one symbol
        </li>
        <li className={ruleClass(rules.notCommon)} data-status={rules.notCommon ? "pass" : "fail"}>
          {rules.notCommon ? "OK" : "Avoid"} common passwords
        </li>
        <li className={ruleClass(rules.notEmailPart)} data-status={rules.notEmailPart ? "pass" : "fail"}>
          {rules.notEmailPart ? "OK" : "Avoid"} using your email name
        </li>
      </ul>
      </CardContent>
    </Card>
  );
}
