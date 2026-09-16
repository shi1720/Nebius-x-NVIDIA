import { requireChatGPTUser } from "@/app/chatgpt-auth";
import RecallRoom from "@/components/recall-room";
export const dynamic = "force-dynamic";
export default async function Workspace() {
  const user = await requireChatGPTUser("/workspace");
  return (
    <RecallRoom
      user={{ name: user.displayName, email: user.email }}
      persistent
    />
  );
}
