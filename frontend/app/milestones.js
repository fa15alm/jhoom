/*
 * Milestones screen.
 *
 * Structured goals are tied to fitness data where possible. Weight reads from
 * profile weight, and weekly goal types read from the current week's logs.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
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
import AppHeader from "../src/shared/ui/AppHeader";
import BottomNav from "../src/shared/ui/BottomNav";
import useMobileFrame from "../src/shared/hooks/useMobileFrame";
import { getPagedCarouselIndex } from "../src/shared/utils/carousel";
import {
  createMilestone,
  deleteMilestone,
  getMilestones,
  updateMilestone,
} from "../src/services/api/milestonesApi";
import { getAuthToken } from "../src/services/authSession";

const CARD_SPACING = 18;

const goalTemplates = [
  {
    key: "weight",
    label: "Weight",
    icon: "scale-outline",
    helper: "Uses your latest logged weight, or your profile weight if no weight log exists yet.",
    buildDraft: () => ({
      title: "",
      targetDate: "",
      targetWeightKg: "",
    }),
  },
  {
    key: "steps",
    label: "Steps",
    icon: "walk-outline",
    helper: "Counts how many days this week hit your step target.",
    buildDraft: () => ({
      title: "",
      targetDate: "",
      dailyTarget: "",
      targetDays: "",
    }),
  },
  {
    key: "sleep",
    label: "Sleep",
    icon: "moon-outline",
    helper: "Counts how many nights this week hit your sleep goal.",
    buildDraft: () => ({
      title: "",
      targetDate: "",
      nightlyTargetHours: "",
      targetDays: "",
    }),
  },
  {
    key: "workouts",
    label: "Workouts",
    icon: "barbell-outline",
    helper: "Counts workout and cardio logs saved this week.",
    buildDraft: () => ({
      title: "",
      targetDate: "",
      targetSessions: "",
    }),
  },
  {
    key: "calories",
    label: "Calories",
    icon: "flame-outline",
    helper: "Tracks calories burned from this week's movement logs.",
    buildDraft: () => ({
      title: "",
      targetDate: "",
      targetCalories: "",
    }),
  },
  {
    key: "custom",
    label: "Custom",
    icon: "star-outline",
    helper: "Manual fallback for goals the app does not auto-track yet.",
    buildDraft: () => ({
      title: "",
      targetDate: "",
      detail: "",
      targetValue: "",
      currentValue: "",
      unit: "",
    }),
  },
];

const goalTemplateByKey = Object.fromEntries(
  goalTemplates.map((template) => [template.key, template]),
);

const starterMilestones = [
  {
    id: "starter-workouts",
    title: "Workout week",
    detail: "Complete 4 workouts this week",
    progressLabel: "3/4",
    progress: 0.75,
    goalType: "workouts",
    icon: "barbell-outline",
    completed: false,
    isAutoTracked: true,
  },
  {
    id: "starter-sleep",
    title: "Sleep consistency",
    detail: "7 h sleep for 5 nights",
    progressLabel: "4/5",
    progress: 0.8,
    goalType: "sleep",
    icon: "moon-outline",
    completed: false,
    isAutoTracked: true,
  },
];

function buildDraft(goalType) {
  return {
    goalType,
    ...goalTemplateByKey[goalType].buildDraft(),
  };
}

function GoalSlide({ item, cardWidth }) {
  const template = goalTemplateByKey[item.goalType] || goalTemplateByKey.custom;

  return (
    <View style={[styles.goalSlide, { width: cardWidth }]}>
      <View style={styles.goalHeader}>
        <View>
          <Text style={styles.eyebrow}>Current goal</Text>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
        <View style={styles.goalIcon}>
          <Ionicons name={template.icon} size={20} color="#4EA955" />
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
            {item.completed ? "Met" : item.isAutoTracked ? "Auto" : "Manual"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function GoalTypeFields({ draft, onChange }) {
  if (draft.goalType === "weight") {
    return (
      <TextInput
        value={draft.targetWeightKg}
        onChangeText={(value) => onChange("targetWeightKg", value)}
        placeholder="Target weight (kg)..."
        placeholderTextColor="#7A8699"
        keyboardType="decimal-pad"
        style={styles.input}
      />
    );
  }

  if (draft.goalType === "steps") {
    return (
      <>
        <TextInput
          value={draft.dailyTarget}
          onChangeText={(value) => onChange("dailyTarget", value)}
          placeholder="Daily target (steps)..."
          placeholderTextColor="#7A8699"
          keyboardType="number-pad"
          style={styles.input}
        />
        <TextInput
          value={draft.targetDays}
          onChangeText={(value) => onChange("targetDays", value)}
          placeholder="Target days this week..."
          placeholderTextColor="#7A8699"
          keyboardType="number-pad"
          style={styles.input}
        />
      </>
    );
  }

  if (draft.goalType === "sleep") {
    return (
      <>
        <TextInput
          value={draft.nightlyTargetHours}
          onChangeText={(value) => onChange("nightlyTargetHours", value)}
          placeholder="Nightly target (hours)..."
          placeholderTextColor="#7A8699"
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <TextInput
          value={draft.targetDays}
          onChangeText={(value) => onChange("targetDays", value)}
          placeholder="Target nights this week..."
          placeholderTextColor="#7A8699"
          keyboardType="number-pad"
          style={styles.input}
        />
      </>
    );
  }

  if (draft.goalType === "workouts") {
    return (
      <TextInput
        value={draft.targetSessions}
        onChangeText={(value) => onChange("targetSessions", value)}
        placeholder="Workout sessions this week..."
        placeholderTextColor="#7A8699"
        keyboardType="number-pad"
        style={styles.input}
      />
    );
  }

  if (draft.goalType === "calories") {
    return (
      <TextInput
        value={draft.targetCalories}
        onChangeText={(value) => onChange("targetCalories", value)}
        placeholder="Calories burned this week (kcal)..."
        placeholderTextColor="#7A8699"
        keyboardType="number-pad"
        style={styles.input}
      />
    );
  }

  return (
    <>
      <TextInput
        value={draft.detail}
        onChangeText={(value) => onChange("detail", value)}
        placeholder="Target detail..."
        placeholderTextColor="#7A8699"
        style={styles.input}
      />
      <TextInput
        value={draft.targetValue}
        onChangeText={(value) => onChange("targetValue", value)}
        placeholder="Target value..."
        placeholderTextColor="#7A8699"
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        value={draft.currentValue}
        onChangeText={(value) => onChange("currentValue", value)}
        placeholder="Current value..."
        placeholderTextColor="#7A8699"
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        value={draft.unit}
        onChangeText={(value) => onChange("unit", value)}
        placeholder="Unit..."
        placeholderTextColor="#7A8699"
        style={styles.input}
      />
    </>
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
  const [milestones, setMilestones] = useState([]);
  const [draft, setDraft] = useState(() => buildDraft("workouts"));
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [notice, setNotice] = useState("");
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0]?.index != null) {
      setActiveGoalIndex(viewableItems[0].index);
    }
  }).current;

  function handleGoalScroll(event) {
    setActiveGoalIndex(getPagedCarouselIndex(event, sliderWidth, milestones.length));
  }

  useEffect(() => {
    loadMilestones();
  }, []);

  async function loadMilestones() {
    const token = getAuthToken();

    if (!token) {
      setNotice("Log in to sync milestones.");
      setMilestones(starterMilestones);
      return;
    }

    try {
      setMilestones(await getMilestones(token));
      setNotice("");
    } catch (error) {
      setNotice(error.message || "Could not load milestones.");
      setMilestones(starterMilestones);
    }
  }

  function resetMilestoneForm(goalType = draft.goalType) {
    setDraft(buildDraft(goalType));
    setEditingMilestoneId(null);
  }

  function handleDraftChange(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
    if (notice) {
      setNotice("");
    }
  }

  function handleSelectGoalType(goalType) {
    setDraft(buildDraft(goalType));
    setEditingMilestoneId(null);
    setNotice("");
  }

  function buildMilestonePayload() {
    const title = draft.title.trim() || goalTemplateByKey[draft.goalType].label;
    const targetDate = draft.targetDate.trim();

    if (draft.goalType === "weight") {
      return {
        goalType: "weight",
        title,
        targetDate,
        targetWeightKg: Number(draft.targetWeightKg),
      };
    }

    if (draft.goalType === "steps") {
      return {
        goalType: "steps",
        title,
        targetDate,
        dailyTarget: Number(draft.dailyTarget),
        targetDays: Number(draft.targetDays),
      };
    }

    if (draft.goalType === "sleep") {
      return {
        goalType: "sleep",
        title,
        targetDate,
        nightlyTargetHours: Number(draft.nightlyTargetHours),
        targetDays: Number(draft.targetDays),
      };
    }

    if (draft.goalType === "workouts") {
      return {
        goalType: "workouts",
        title,
        targetDate,
        targetSessions: Number(draft.targetSessions),
      };
    }

    if (draft.goalType === "calories") {
      return {
        goalType: "calories",
        title,
        targetDate,
        targetCalories: Number(draft.targetCalories),
      };
    }

    return {
      goalType: "custom",
      title,
      targetDate,
      detail: draft.detail.trim() || "Custom target",
      targetValue: Number(draft.targetValue),
      currentValue: Number(draft.currentValue),
      unit: draft.unit.trim() || "target",
    };
  }

  async function handleSaveMilestone() {
    const token = getAuthToken();

    if (!token) {
      setNotice("Log in again before saving milestones.");
      return;
    }

    try {
      const payload = buildMilestonePayload();
      const savedMilestone = editingMilestoneId
        ? await updateMilestone(token, editingMilestoneId, payload)
        : await createMilestone(token, payload);

      setMilestones((current) => {
        if (editingMilestoneId) {
          return current.map((milestone) =>
            milestone.id === editingMilestoneId ? savedMilestone : milestone
          );
        }

        return [savedMilestone, ...current];
      });

      resetMilestoneForm(draft.goalType);
      setActiveGoalIndex(0);
      setNotice("");
    } catch (error) {
      setNotice(error.message || "Could not save milestone.");
    }
  }

  function handleEditMilestone(milestone) {
    const baseDraft = buildDraft(milestone.goalType || "custom");
    const config = milestone.config || {};

    setDraft({
      ...baseDraft,
      goalType: milestone.goalType || "custom",
      title: milestone.title || baseDraft.title,
      targetDate: milestone.targetDate || "",
      targetWeightKg: config.targetWeightKg ? String(config.targetWeightKg) : baseDraft.targetWeightKg,
      dailyTarget: config.dailyTarget ? String(config.dailyTarget) : baseDraft.dailyTarget,
      targetDays: config.targetDays ? String(config.targetDays) : baseDraft.targetDays,
      nightlyTargetHours: config.nightlyTargetHours
        ? String(config.nightlyTargetHours)
        : baseDraft.nightlyTargetHours,
      targetSessions: config.targetSessions
        ? String(config.targetSessions)
        : baseDraft.targetSessions,
      targetCalories: config.targetCalories
        ? String(config.targetCalories)
        : baseDraft.targetCalories,
      detail: milestone.detail || baseDraft.detail,
      targetValue: milestone.targetValue != null ? String(milestone.targetValue) : baseDraft.targetValue,
      currentValue: milestone.currentValue != null ? String(milestone.currentValue) : baseDraft.currentValue,
      unit: milestone.unit || baseDraft.unit,
    });
    setEditingMilestoneId(milestone.id);
    setNotice("");
  }

  async function handleDeleteMilestone(id) {
    const token = getAuthToken();

    if (!token) {
      setNotice("Log in again before deleting milestones.");
      return;
    }

    try {
      await deleteMilestone(token, id);
      setMilestones((current) => current.filter((milestone) => milestone.id !== id));

      if (editingMilestoneId === id) {
        resetMilestoneForm();
      }
    } catch (error) {
      setNotice(error.message || "Could not delete milestone.");
    }
  }

  async function handleToggleCustomMilestone(id) {
    const token = getAuthToken();
    const milestone = milestones.find((item) => item.id === id);

    if (!token || !milestone || milestone.isAutoTracked) {
      return;
    }

    try {
      const updated = await updateMilestone(token, id, {
        goalType: "custom",
        title: milestone.title,
        detail: milestone.detail,
        targetDate: milestone.targetDate,
        targetValue: milestone.targetValue || 1,
        currentValue: milestone.completed ? 0 : milestone.targetValue || 1,
        unit: milestone.unit || "target",
        completed: !milestone.completed,
      });

      setMilestones((current) =>
        current.map((item) => (item.id === id ? updated : item))
      );
    } catch (error) {
      setNotice(error.message || "Could not update milestone.");
    }
  }

  const activeTemplate = goalTemplateByKey[draft.goalType] || goalTemplateByKey.custom;

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
                minHeight: Math.max(shellMinHeight, 920),
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
                  onScroll={handleGoalScroll}
                  onMomentumScrollEnd={handleGoalScroll}
                  viewabilityConfig={viewabilityConfig}
                  scrollEventThrottle={16}
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
                  {goalTemplates.map((template) => {
                    const isSelected = draft.goalType === template.key;

                    return (
                      <Pressable
                        key={template.key}
                        onPress={() => handleSelectGoalType(template.key)}
                        style={({ pressed }) => [
                          styles.categoryChip,
                          isSelected && styles.categoryChipSelected,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Ionicons
                          name={template.icon}
                          size={14}
                          color={isSelected ? "#FFFFFF" : "#4EA955"}
                        />
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && styles.categoryChipTextSelected,
                          ]}
                        >
                          {template.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.helperText}>{activeTemplate.helper}</Text>

                <TextInput
                  value={draft.title}
                  onChangeText={(value) => handleDraftChange("title", value)}
                  placeholder="Goal name..."
                  placeholderTextColor="#7A8699"
                  style={styles.input}
                />

                <GoalTypeFields draft={draft} onChange={handleDraftChange} />

                <TextInput
                  value={draft.targetDate}
                  onChangeText={(value) => handleDraftChange("targetDate", value)}
                  placeholder="Target date eg 30/05/2026..."
                  placeholderTextColor="#7A8699"
                  style={styles.input}
                />

                <View style={styles.cardFooter}>
                  <Text style={styles.helperText}>
                    Weekly goals update from current-week logs. Weight goals read from your latest logged weight.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      editingMilestoneId ? "Update milestone" : "Add milestone"
                    }
                    onPress={handleSaveMilestone}
                    style={({ pressed }) => [
                      styles.addButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.addButtonText}>
                      {editingMilestoneId ? "Update" : "Add"}
                    </Text>
                  </Pressable>
                </View>

                {editingMilestoneId ? (
                  <Pressable
                    onPress={() => resetMilestoneForm()}
                    style={({ pressed }) => [
                      styles.cancelEditButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.cancelEditText}>Cancel edit</Text>
                  </Pressable>
                ) : null}

                {notice ? (
                  <Text style={styles.inlineNotice}>{notice}</Text>
                ) : null}
              </View>

              <View style={[styles.milestoneGrid, { width: cardWidth }]}>
                {milestones.map((milestone) => {
                  const template = goalTemplateByKey[milestone.goalType] || goalTemplateByKey.custom;

                  return (
                    <View key={milestone.id} style={styles.milestoneTile}>
                      <View style={styles.tileIcon}>
                        <Ionicons
                          name={milestone.completed ? "star" : template.icon}
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
                        {milestone.progressLabel}
                      </Text>

                      <View style={styles.progressTrackCompact}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${(milestone.progress || 0) * 100}%` },
                          ]}
                        />
                      </View>

                      <View style={styles.tileActions}>
                        {!milestone.isAutoTracked ? (
                          <Pressable
                            onPress={() => handleToggleCustomMilestone(milestone.id)}
                            style={({ pressed }) => [
                              styles.tileActionButton,
                              pressed && styles.buttonPressed,
                            ]}
                          >
                            <Text style={styles.tileActionText}>
                              {milestone.completed ? "Undo" : "Met"}
                            </Text>
                          </Pressable>
                        ) : null}
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
                  );
                })}
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
  progressTrackCompact: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#F4FFF7",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    overflow: "hidden",
    marginBottom: 12,
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
    marginBottom: 12,
  },
  inlineNotice: {
    marginTop: 12,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#4EA955",
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
    gap: 12,
  },
  milestoneTile: {
    width: "48%",
    borderRadius: 24,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    padding: 14,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tileTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  tileDetail: {
    fontSize: 11,
    lineHeight: 18,
    fontWeight: "700",
    color: "#3F4858",
    marginBottom: 6,
  },
  tileDate: {
    fontSize: 10,
    fontWeight: "700",
    color: "#83B66E",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  tileStatus: {
    fontSize: 11,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  tileActions: {
    flexDirection: "row",
    gap: 8,
  },
  tileActionButton: {
    flex: 1,
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    alignItems: "center",
    justifyContent: "center",
  },
  tileActionText: {
    fontSize: 9,
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
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
  },
  activeDot: {
    width: 20,
    backgroundColor: "#4EA955",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
