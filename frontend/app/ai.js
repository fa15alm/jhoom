import BottomNav from "../components/ui/BottomNav";
import PlaceholderScreen from "../components/ui/PlaceholderScreen";

export default function AiScreen() {
  return (
    <PlaceholderScreen
      title="AI"
      text="AI screen placeholder while we rebuild the main dashboard flow."
      footer={<BottomNav activeTab="ai" />}
    />
  );
}
