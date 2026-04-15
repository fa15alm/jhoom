import Ionicons from "@expo/vector-icons/Ionicons";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "../components/ui/AppHeader";
import BottomNav from "../components/ui/BottomNav";
import useMobileFrame from "../hooks/useMobileFrame";

const CARD_SPACING = 18;
const milestoneCategories = [
  { label: "Weight", icon: "scale-outline" },
  { label: "Steps", icon: "walk-outline" },
  { label: "Sleep", icon: "moon-outline" },
  { label: "Workouts", icon: "barbell-outline" },
  { label: "Calories", icon: "flame-outline" },
  { label: "Custom", icon: "star-outline" },
];

const starterMilestones = [
  {
    id: "weight-goal",
    title: "Weight goal reached",
    detail: "Reach 78kg",
    progressLabel: "82%",
    progress: 0.82,
    icon: "scale-outline",
    completed: false,
  },
  {
    id: "sleep-streak",
    title: "Sleep consistency",
    detail: "7h+ sleep for 5 nights",
    progressLabel: "5/5",
    progress: 1,
    icon: "moon-outline",
    completed: true,
  },
  {
    id: "steps-week",
    title: "Steps target",
    detail: "8k steps for 4 days",
    progressLabel: "3/4",
    progress: 0.75,
    icon: "walk-outline",
    completed: false,
  },
  {
    id: "workout-week",
    title: "Workout week",
    detail: "Complete 4 workouts",
    progressLabel: "4/4",
    progress: 1,
    icon: "barbell-outline",
    completed: true,
  },
];

function GoalSlide({ item, cardWidth }) {
  return (
    <View style={[styles.goalSlide, { width: cardWidth }]}>
      <View style={styles.goalHeader}>
        <View>
          <Text style={styles.eyebrow}>Current goal</Text>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
        <View style={styles.goalIcon}>
          <Ionicons name={item.icon} size={20} color="#4EA955" />
        </View>
      </View>

      <Text style={styles.goalDetail}>{item.detail}</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${item.progress * 100}%` }]} />
      </View>

      <View style={styles.goalFooter}>
        <Text style={styles.progressLabel}>{item.progressLabel}</Text>
        <View style={[styles.statusPill, item.completed && styles.statusPillComplete]}>
          <Text
            style={[
              styles.statusPillText,
              item.completed && styles.statusPillTextComplete,
            ]}
          >
            {item.completed ? "Met" : "In progress"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function MilestonesScreen() {
  const {
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
    sliderWidth,
    cardWidth,
  } = useMobileFrame();
  const [activeGoalIndex, setActiveGoalIndex] = useState(0);
  const [milestones, setMilestones] = useState(starterMilestones);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneTarget, setNewMilestoneTarget] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");
  const [newMilestoneCategory, setNewMilestoneCategory] = useState("Custom");
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0]?.index != null) {
      setActiveGoalIndex(viewableItems[0].index);
    }
  }).current;

  function resetMilestoneForm() {
    setNewMilestoneTitle("");
    setNewMilestoneTarget("");
    setNewMilestoneDate("");
    setNewMilestoneCategory("Custom");
    setEditingMilestoneId(null);
  }

  function handleSaveMilestone() {
    const title = newMilestoneTitle.trim();
    const target = newMilestoneTarget.trim();
    const targetDate = newMilestoneDate.trim();
    const category = milestoneCategories.find(
      (item) => item.label === newMilestoneCategory,
    ) ?? milestoneCategories[milestoneCategories.length - 1];

    if (!title && !target) {
      return;
    }

    // Milestones are local for now. Later, real log data and the AI health plan
    // should update progress and completion automatically.
    setMilestones((current) => {
      const nextMilestone = {
        id: editingMilestoneId ?? `milestone-${Date.now()}`,
        title: title || "New milestone",
        detail: target || "Custom target",
        targetDate,
        category: category.label,
        progressLabel: "0%",
        progress: 0,
        icon: category.icon,
        completed: false,
      };

      if (editingMilestoneId) {
        return current.map((milestone) =>
          milestone.id === editingMilestoneId
            ? {
                ...milestone,
                ...nextMilestone,
                completed: milestone.completed,
                progress: milestone.progress,
                progressLabel: milestone.progressLabel,
              }
            : milestone,
        );
      }

      return [nextMilestone, ...current];
    });
    resetMilestoneForm();
    setActiveGoalIndex(0);
  }

  function handleEditMilestone(milestone) {
    setNewMilestoneTitle(milestone.title);
    setNewMilestoneTarget(milestone.detail);
    setNewMilestoneDate(milestone.targetDate ?? "");
    setNewMilestoneCategory(milestone.category ?? "Custom");
    setEditingMilestoneId(milestone.id);
  }

  function handleDeleteMilestone(id) {
    setMilestones((current) => current.filter((milestone) => milestone.id !== id));

    if (editingMilestoneId === id) {
      resetMilestoneForm();
    }
  }

  function handleToggleMilestone(id) {
    setMilestones((current) =>
      current.map((milestone) =>
        milestone.id === id
          ? {
              ...milestone,
              completed: !milestone.completed,
              progress: milestone.completed ? 0.5 : 1,
              progressLabel: milestone.completed ? "50%" : "Met",
            }
          : milestone,
      ),
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.outerShell,
            {
              paddingHorizontal: shellPaddingHorizontal,
              paddingVertical: shellPaddingVertical,
            },
          ]}
        >
          <View
            style={[
              styles.inner,
              {
                minHeight: Math.max(shellMinHeight, 900),
                paddingHorizontal: innerPaddingHorizontal,
                paddingTop: innerPaddingTop,
                paddingBottom: innerPaddingBottom,
              },
            ]}
          >
            <AppHeader title="MILESTONES." />

            <View style={styles.contentSection}>
              <View style={[styles.goalCarouselSection, { width: sliderWidth }]}>
                <FlatList
                  data={milestones}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  style={styles.goalCarousel}
                  contentContainerStyle={styles.goalCarouselContent}
                  renderItem={({ item }) => (
                    <GoalSlide item={item} cardWidth={cardWidth} />
                  )}
                  viewabilityConfig={viewabilityConfig}
                  onViewableItemsChanged={onViewableItemsChanged}
                />

                <View style={styles.dotsRow}>
                  {milestones.map((item, index) => (
                    <View
                      key={`${item.id}-dot`}
                      style={[
                        styles.dot,
                        activeGoalIndex === index && styles.activeDot,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={[styles.setMilestoneCard, { width: cardWidth }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.eyebrow}>Set milestone</Text>
                    <Text style={styles.sectionTitle}>
                      {editingMilestoneId ? "Edit goal" : "Add a new goal"}
                    </Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color="#4EA955" />
                </View>

                <View style={styles.categoryGrid}>
                  {milestoneCategories.map((category) => {
                    const isSelected = newMilestoneCategory === category.label;

                    return (
                      <Pressable
                        key={category.label}
                        onPress={() => setNewMilestoneCategory(category.label)}
                        style={({ pressed }) => [
                          styles.categoryChip,
                          isSelected && styles.categoryChipSelected,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Ionicons
                          name={category.icon}
                          size={14}
                          color={isSelected ? "#FFFFFF" : "#4EA955"}
                        />
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && styles.categoryChipTextSelected,
                          ]}
                        >
                          {category.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  value={newMilestoneTitle}
                  onChangeText={setNewMilestoneTitle}
                  placeholder="Milestone name..."
                  placeholderTextColor="#7A8699"
                  style={styles.input}
                />

                <TextInput
                  value={newMilestoneTarget}
                  onChangeText={setNewMilestoneTarget}
                  placeholder="Target eg lose 2kg, 4 workouts..."
                  placeholderTextColor="#7A8699"
                  style={styles.input}
                />

                <TextInput
                  value={newMilestoneDate}
                  onChangeText={setNewMilestoneDate}
                  placeholder="Target date eg 30/05/2026..."
                  placeholderTextColor="#7A8699"
                  style={styles.input}
                />

                <View style={styles.cardFooter}>
                  <Text style={styles.helperText}>Progress can connect to logs later.</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      editingMilestoneId ? "Update milestone" : "Add milestone"
                    }
                    disabled={!newMilestoneTitle.trim() && !newMilestoneTarget.trim()}
                    onPress={handleSaveMilestone}
                    style={({ pressed }) => [
                      styles.addButton,
                      !newMilestoneTitle.trim() &&
                        !newMilestoneTarget.trim() &&
                        styles.addButtonDisabled,
                      pressed &&
                        (newMilestoneTitle.trim() || newMilestoneTarget.trim()) &&
                        styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.addButtonText}>
                      {editingMilestoneId ? "Update" : "Add"}
                    </Text>
                  </Pressable>
                </View>

                {editingMilestoneId ? (
                  <Pressable
                    onPress={resetMilestoneForm}
                    style={({ pressed }) => [
                      styles.cancelEditButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.cancelEditText}>Cancel edit</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={[styles.milestoneGrid, { width: cardWidth }]}>
                {milestones.map((milestone) => (
                  <View key={milestone.id} style={styles.milestoneTile}>
                    <View style={styles.tileIcon}>
                      <Ionicons
                        name={milestone.completed ? "star" : milestone.icon}
                        size={20}
                        color="#4EA955"
                      />
                    </View>
                    <Text style={styles.tileTitle}>{milestone.title}</Text>
                    <Text style={styles.tileDetail}>{milestone.detail}</Text>
                    {milestone.targetDate ? (
                      <Text style={styles.tileDate}>By {milestone.targetDate}</Text>
                    ) : null}
                    <Text style={styles.tileStatus}>
                      {milestone.completed ? "Met" : milestone.progressLabel}
                    </Text>

                    <View style={styles.tileActions}>
                      <Pressable
                        onPress={() => handleToggleMilestone(milestone.id)}
                        style={({ pressed }) => [
                          styles.tileActionButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.tileActionText}>
                          {milestone.completed ? "Undo" : "Met"}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleEditMilestone(milestone)}
                        style={({ pressed }) => [
                          styles.tileActionButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.tileActionText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteMilestone(milestone.id)}
                        style={({ pressed }) => [
                          styles.tileActionButton,
                          styles.tileDeleteButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={[styles.tileActionText, styles.tileDeleteText]}>
                          Del
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <BottomNav activeTab="milestones" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FB",
  },
  scrollContent: {
    flexGrow: 1,
  },
  outerShell: {
    flexGrow: 1,
  },
  inner: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  contentSection: {
    flex: 1,
    alignItems: "center",
    gap: 16,
    paddingBottom: 24,
  },
  goalCarouselSection: {
    alignItems: "center",
  },
  goalCarousel: {
    flexGrow: 0,
    width: "100%",
  },
  goalCarouselContent: {
    alignItems: "center",
  },
  goalSlide: {
    height: 250,
    marginHorizontal: CARD_SPACING,
    borderRadius: 30,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    padding: 18,
    justifyContent: "space-between",
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: "#83B66E",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  sectionTitle: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.2,
  },
  goalDetail: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "700",
    color: "#3F4858",
  },
  progressTrack: {
    height: 14,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#4EA955",
  },
  goalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusPillComplete: {
    backgroundColor: "#4EA955",
    borderColor: "#4EA955",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statusPillTextComplete: {
    color: "#FFFFFF",
  },
  setMilestoneCard: {
    borderWidth: 1,
    borderColor: "#CFEFD9",
    borderRadius: 28,
    backgroundColor: "#ECFDF3",
    padding: 18,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  categoryChipSelected: {
    backgroundColor: "#4EA955",
    borderColor: "#4EA955",
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#111827",
    textTransform: "uppercase",
  },
  categoryChipTextSelected: {
    color: "#FFFFFF",
  },
  input: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  helperText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#7A8699",
  },
  addButton: {
    minWidth: 76,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  addButtonDisabled: {
    backgroundColor: "#A8C995",
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  cancelEditButton: {
    minHeight: 36,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  cancelEditText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#4EA955",
    textTransform: "uppercase",
  },
  milestoneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  milestoneTile: {
    width: "48%",
    minHeight: 196,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tileIcon: {
    marginBottom: 10,
  },
  tileTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  tileDetail: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  tileStatus: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: "700",
    color: "#7A8699",
    textTransform: "uppercase",
  },
  tileDate: {
    marginTop: 5,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "900",
    color: "#83B66E",
    textAlign: "center",
    textTransform: "uppercase",
  },
  tileActions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  tileActionButton: {
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: "#F4FFF7",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  tileActionText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#4EA955",
    textTransform: "uppercase",
  },
  tileDeleteButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  tileDeleteText: {
    color: "#991B1B",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#D7DEE8",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#111827",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
