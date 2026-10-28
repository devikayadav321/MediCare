import { DOC_STATUS, VALUE_STATUS } from "../../constants/wording";
import { Badge } from "../ui";

export const CaseStatus = ({ status }) => {
  const s = DOC_STATUS[status] || DOC_STATUS.pending;
  return <Badge tone={s.tone}>{s.label}</Badge>;
};

export const ValueStatus = ({ status }) => {
  const s = VALUE_STATUS[status] || VALUE_STATUS.pending;
  return <Badge tone={s.tone}>{s.label}</Badge>;
};
