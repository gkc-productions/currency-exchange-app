import { checkPasswordRules, passwordStrength } from "@/src/lib/password-strength";

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

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-700">Password rules</p>
        <p className="font-semibold text-slate-700">Strength: {strength.label}</p>
      </div>
      <ul className="mt-2 space-y-1">
        <li className={ruleClass(rules.lengthOk)} data-status={rules.lengthOk ? "pass" : "fail"}>
          {rules.lengthOk ? "OK" : "Need"} 10+ characters
        </li>
        <li className={ruleClass(rules.hasLetter)} data-status={rules.hasLetter ? "pass" : "fail"}>
          {rules.hasLetter ? "OK" : "Need"} at least one letter
        </li>
        <li className={ruleClass(rules.hasNumber)} data-status={rules.hasNumber ? "pass" : "fail"}>
          {rules.hasNumber ? "OK" : "Need"} at least one number
        </li>
        <li className={ruleClass(rules.notCommon)} data-status={rules.notCommon ? "pass" : "fail"}>
          {rules.notCommon ? "OK" : "Avoid"} common passwords
        </li>
        <li className={ruleClass(rules.notEmailPart)} data-status={rules.notEmailPart ? "pass" : "fail"}>
          {rules.notEmailPart ? "OK" : "Avoid"} using your email name
        </li>
      </ul>
    </div>
  );
}
