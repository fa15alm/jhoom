import BottomNav from "../components/ui/BottomNav";
import PlaceholderScreen from "../components/ui/PlaceholderScreen";

export default function LogScreen() {
  return (
    <PlaceholderScreen
      title="Log"
      text="Log screen placeholder while we rebuild the main dashboard flow."
      footer={<BottomNav activeTab="log" />}
    />
  );
}
