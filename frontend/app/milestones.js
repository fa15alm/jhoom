import BottomNav from "../components/ui/BottomNav";
import PlaceholderScreen from "../components/ui/PlaceholderScreen";

export default function MilestonesScreen() {
  return (
    <PlaceholderScreen
      title="Milestones"
      text="Milestones screen placeholder while we rebuild the main dashboard flow."
      footer={<BottomNav activeTab="milestones" />}
    />
  );
}
