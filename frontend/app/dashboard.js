/*
 * Dashboard screen.
 *
 * This is the main home screen after login. It presents current health metrics,
 * weekly/monthly progress graphs, plan summary text, and the shared bottom nav.
 * The screen currently uses a local dashboard source; backend wiring should
 * replace that source with logs, health integrations, milestones, and the AI plan.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppHeader from "../src/shared/ui/AppHeader";
import BottomNav from "../src/shared/ui/BottomNav";
import useMobileFrame from "../src/shared/hooks/useMobileFrame";
import { getPlanSummary } from "../src/features/health-plan/healthPlan";

const BUTTON_GREEN = "#4EA955";
const CARD_SPACING = 18;
const GRAPH_HEIGHT = 220;
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Mock dashboard source. Backend log and health integration summaries should replace this.
// Keep the shape stable when wiring the backend so the UI components below do
// not need to change when real data arrives.
const defaultDashboardSource = {
  streakCount: "1",
  caloriesBurned: "540 kcal",
  sleepTime: "7h 48m",
  steps: "8,214",
  workoutsThisWeek: "4 done",
  tomorrowsWorkout: "Push day",
  tomorrowsFocus: "Chest + shoulders",
  weeklyCaloriesTargetPerDay: 500,
  weeklyStepsTargetPerDay: 8000,
  weeklyCaloriesBurned: [
    { day: "Mon", value: 420 },
    { day: "Tue", value: 510 },
    { day: "Wed", value: 390 },
    { day: "Thu", value: 610 },
    { day: "Fri", value: 540 },
    { day: "Sat", value: 470 },
    { day: "Sun", value: 320 },
  ],
  weeklyStepsCompleted: [
    { day: "Mon", value: 6200 },
    { day: "Tue", value: 8100 },
    { day: "Wed", value: 7400 },
    { day: "Thu", value: 9300 },
    { day: "Fri", value: 8214 },
    { day: "Sat", value: 10100 },
    { day: "Sun", value: 5600 },
  ],
  weeklySleepTime: [
    { day: "Mon", value: 7.4 },
    { day: "Tue", value: 8.1 },
    { day: "Wed", value: 6.9 },
    { day: "Thu", value: 7.8 },
    { day: "Fri", value: 7.2 },
    { day: "Sat", value: 8.4 },
    { day: "Sun", value: 7.6 },
  ],
  monthlyWorkoutsCompleted: [
    { day: "1", value: 1 },
    { day: "2", value: 0 },
    { day: "3", value: 1 },
    { day: "4", value: 0 },
    { day: "5", value: 1 },
    { day: "6", value: 0 },
    { day: "7", value: 1 },
    { day: "8", value: 0 },
    { day: "9", value: 1 },
    { day: "10", value: 0 },
    { day: "11", value: 1 },
    { day: "12", value: 0 },
    { day: "13", value: 1 },
    { day: "14", value: 0 },
    { day: "15", value: 1 },
    { day: "16", value: 0 },
    { day: "17", value: 1 },
    { day: "18", value: 0 },
    { day: "19", value: 1 },
    { day: "20", value: 0 },
    { day: "21", value: 1 },
    { day: "22", value: 0 },
    { day: "23", value: 1 },
    { day: "24", value: 0 },
    { day: "25", value: 1 },
    { day: "26", value: 0 },
    { day: "27", value: 1 },
    { day: "28", value: 0 },
    { day: "29", value: 1 },
    { day: "30", value: 0 },
    { day: "31", value: 1 },
  ],
};

function formatHoursValue(value) {
  const hours = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${hours}h`;
}

function buildDashboardViewModel(dataSources = {}) {
  void dataSources;
  // Keep dashboard mapping in one place so future API data does not leak into UI components.
  // Backend data should be normalised here into simple slide objects before it
  // reaches the chart/card components.
  // Example future inputs:
  // - userLogs
  // - workoutPlan
  // - completedWorkoutHistory
  // - healthIntegrationSummary
  // - weeklyHealthSeries
  const source = { ...defaultDashboardSource };

  return {
    streakCount: source.streakCount,
    slides: [
      {
        id: "overview",
        kind: "metrics",
        metrics: [
          {
            id: "caloriesBurned",
            label: "Calories burned",
            icon: "flame-outline",
            value: source.caloriesBurned,
          },
          {
            id: "sleepTime",
            label: "Sleep time",
            icon: "moon-outline",
            value: source.sleepTime,
          },
          {
            id: "steps",
            label: "Steps",
            icon: "walk-outline",
            value: source.steps,
          },
          {
            id: "workoutsThisWeek",
            label: "Workouts this week",
            icon: "barbell-outline",
            value: source.workoutsThisWeek,
          },
          {
            id: "tomorrowsWorkout",
            label: "Tomorrow's workout",
            icon: "calendar-outline",
            value: source.tomorrowsWorkout,
          },
          {
            id: "tomorrowsFocus",
            label: "Tomorrow's focus",
            icon: "search-outline",
            value: source.tomorrowsFocus,
          },
        ],
      },
      {
        id: "weekly-calories",
        kind: "chart",
        title: "Burned this week",
        targetLabel: "AI target",
        targetUnit: "/day",
        series: source.weeklyCaloriesBurned,
        targetValue: source.weeklyCaloriesTargetPerDay,
      },
      {
        id: "weekly-steps",
        kind: "chart",
        title: "Steps this week",
        targetLabel: "AI target",
        targetUnit: "/day",
        series: source.weeklyStepsCompleted,
        targetValue: source.weeklyStepsTargetPerDay,
      },
      {
        id: "weekly-sleep",
        kind: "bar-chart",
        title: "Sleep this week",
        series: source.weeklySleepTime,
        formatValue: formatHoursValue,
        titleOffset: 6,
      },
      {
        id: "monthly-workouts",
        kind: "calendar",
        title: "Workouts this month",
        series: source.monthlyWorkoutsCompleted,
      },
    ],
  };
}

function getCurrentWeekdayIndex() {
  const today = new Date().getDay();
  return (today + 6) % 7;
}

function buildProgressSeries(data, labels, key, currentIndex) {
  // Future days stay empty so weekly charts visually fill as the week progresses.
  // When connected to real logs, this same helper can keep incomplete future
  // days from looking like missed targets.
  return labels.map((label, index) => {
    const matchingEntry = data.find((entry) => entry[key] === label);

    return {
      label,
      value: index <= currentIndex ? (matchingEntry?.value ?? 0) : 0,
      isFuture: index > currentIndex,
    };
  });
}

function getWeekToDateSeries(data) {
  return buildProgressSeries(data, WEEK_DAYS, "day", getCurrentWeekdayIndex());
}

function getCurrentMonthCalendarData(data) {
  // Builds the monthly workout dot grid from a simple day/value series.
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthLabel = today.toLocaleString("en-GB", { month: "long" });
  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ id: `empty-${index}`, isPlaceholder: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const matchingEntry = data.find((entry) => entry.day === `${day}`);

    cells.push({
      id: `day-${day}`,
      day,
      isFuture: day > today.getDate(),
      hasWorkout: (matchingEntry?.value ?? 0) > 0,
    });
  }

  return { monthLabel, cells };
}

function MetricsCard({ item, cardWidth, compact, onMetricPress }) {
  // Metric tiles are pressable so they can deep-link to relevant log history later.
  // For example, tapping Sleep can route to the log screen filtered to sleep logs.
  return (
    <View style={[styles.metricsCard, { width: cardWidth }]}>
      <View style={styles.metricsGrid}>
        {item.metrics.map((metric) => (
          <Pressable
            key={metric.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${metric.label}`}
            onPress={() => onMetricPress(metric)}
            style={({ pressed }) => [
              styles.metricTile,
              pressed && styles.metricTilePressed,
            ]}
          >
            <View style={styles.metricIconWrap}>
              <Ionicons name={metric.icon} size={18} color="#4EA955" />
            </View>
            <Text style={[styles.metricLabel, compact && styles.compactMetricLabel]}>
              {metric.label}
            </Text>
            {metric.value ? (
              <Text style={[styles.metricValue, compact && styles.compactMetricValue]}>
                {metric.value}
              </Text>
            ) : null}
            <Text style={styles.metricUpdated}>From logs</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TodayPlanCard({ cardWidth, planSummary, onOpenAi }) {
  // Displays the compact health-plan summary above the dashboard carousel.
  return (
    <View style={[styles.todayPlanCard, { width: cardWidth }]}>
      <View style={styles.todayPlanHeader}>
        <View>
          <Text style={styles.todayPlanEyebrow}>Today&apos;s plan</Text>
          <Text style={styles.todayPlanTitle}>{planSummary.title}</Text>
        </View>
        <Ionicons name="sparkles-outline" size={22} color="#4EA955" />
      </View>
      <Text style={styles.todayPlanText}>{planSummary.detail}</Text>
      <Text style={styles.todayPlanMeta}>
        Last updated from onboarding and daily logs.
      </Text>
      <Pressable
        onPress={onOpenAi}
        style={({ pressed }) => [
          styles.todayPlanButton,
          pressed && styles.metricTilePressed,
        ]}
      >
        <Text style={styles.todayPlanButtonText}>Ask AI coach</Text>
      </Pressable>
    </View>
  );
}

function QuickActions({ cardWidth, onOpenLog, onOpenAi }) {
  const actions = [
    { label: "Log workout", icon: "barbell-outline", onPress: onOpenLog },
    { label: "Log sleep", icon: "moon-outline", onPress: onOpenLog },
    { label: "Ask AI", icon: "sparkles-outline", onPress: onOpenAi },
  ];

  return (
    <View style={[styles.quickActionsCard, { width: cardWidth }]}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.quickActionButton,
            pressed && styles.metricTilePressed,
          ]}
        >
          <Ionicons name={action.icon} size={16} color="#4EA955" />
          <Text style={styles.quickActionText}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function WeeklyProgressChart({ item, cardWidth, graphWidth, compact }) {
  // Rendered with positioned views to avoid pulling in a charting dependency.
  const formatValue = item.formatValue ?? ((value) => value.toString());
  const weekToDateData = getWeekToDateSeries(item.series);
  const maxValue = Math.max(
    ...weekToDateData.map((entry) => entry.value),
    item.targetValue,
    1,
  );
  const pointSpacing =
    weekToDateData.length > 1 ? graphWidth / (weekToDateData.length - 1) : 0;
  const points = weekToDateData.map((entry, index) => ({
    ...entry,
    x: index * pointSpacing,
    y: GRAPH_HEIGHT - (entry.value / maxValue) * GRAPH_HEIGHT,
  }));
  const completedPoints = points.filter((point) => !point.isFuture);
  const targetY = GRAPH_HEIGHT - (item.targetValue / maxValue) * GRAPH_HEIGHT;

  return (
    <View style={[styles.chartCard, { width: cardWidth }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, compact && styles.compactChartTitle]}>
          {item.title}
        </Text>
        <View style={styles.targetBadge}>
          <Text style={styles.targetBadgeLabel}>{item.targetLabel}</Text>
          <Text style={styles.targetBadgeValue}>
            {formatValue(item.targetValue)}
            {item.targetUnit}
          </Text>
        </View>
      </View>

      <View style={styles.graphWrapper}>
        <View style={[styles.graphSurface, { width: graphWidth }]}>
          <View style={styles.graphBaseline} />
          <View
            style={[
              styles.targetLine,
              { top: Math.max(0, Math.min(targetY, GRAPH_HEIGHT - 2)) },
            ]}
          />

          {completedPoints.slice(0, -1).map((point, index) => {
            const nextPoint = completedPoints[index + 1];
            const dx = nextPoint.x - point.x;
            const dy = nextPoint.y - point.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`;

            return (
              <View
                key={`${point.label}-${nextPoint.label}`}
                style={[
                  styles.graphSegment,
                  {
                    width: length,
                    left: (point.x + nextPoint.x) / 2 - length / 2,
                    top: (point.y + nextPoint.y) / 2,
                    transform: [{ rotate: angle }],
                  },
                ]}
              />
            );
          })}

          {points.map((point) => (
            <View
              key={point.label}
              style={[
                styles.graphPointWrap,
                { left: point.x - 14, top: point.y - 36 },
              ]}
            >
              {!point.isFuture ? (
                <Text style={styles.barValue}>{formatValue(point.value)}</Text>
              ) : (
                <View style={styles.futureValueSpacer} />
              )}
              <View
                style={[
                  styles.graphPoint,
                  point.isFuture && styles.graphPointFuture,
                ]}
              />
            </View>
          ))}
        </View>

        <View style={[styles.graphLabelsRow, { width: graphWidth }]}>
          {points.map((entry) => (
            <Text
              key={entry.label}
              style={[styles.barLabel, entry.isFuture && styles.barLabelFuture]}
            >
              {entry.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function ProgressBarChart({ item, cardWidth, compact }) {
  const formatValue = item.formatValue ?? ((value) => value.toString());
  const progressData = getWeekToDateSeries(item.series);
  const maxValue = Math.max(...progressData.map((entry) => entry.value), 1);

  return (
    <View style={[styles.chartCard, { width: cardWidth }]}>
      <View style={styles.chartHeader}>
        <Text
          style={[
            styles.chartTitle,
            compact && styles.compactChartTitle,
            item.titleOffset ? { marginTop: item.titleOffset } : null,
          ]}
        >
          {item.title}
        </Text>
        <View style={styles.chartHeaderSpacer} />
      </View>

      <View style={styles.graphWrapper}>
        <View style={styles.barSurface}>
          <View style={styles.graphBaseline} />
          {progressData.map((entry) => {
            const barHeight = (entry.value / maxValue) * (GRAPH_HEIGHT - 12);
            const renderedBarHeight = Math.max(10, barHeight);

            return (
              <View key={entry.label} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  {!entry.isFuture ? (
                    <Text
                      style={[styles.sleepBarValue, { bottom: renderedBarHeight + 8 }]}
                    >
                      {formatValue(entry.value)}
                    </Text>
                  ) : null}

                  {entry.isFuture ? (
                    <View style={styles.sleepBarFutureStub} />
                  ) : (
                    <View style={[styles.sleepBarFill, { height: renderedBarHeight }]} />
                  )}
                </View>

                <Text
                  style={[
                    styles.barLabel,
                    styles.sleepBarLabel,
                    entry.isFuture && styles.barLabelFuture,
                  ]}
                >
                  {entry.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function MonthlyWorkoutCalendarCard({ item, cardWidth, compact }) {
  const { monthLabel, cells } = getCurrentMonthCalendarData(item.series);

  return (
    <View style={[styles.chartCard, { width: cardWidth }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, compact && styles.compactChartTitle]}>
          {item.title}
        </Text>
        <Text style={styles.calendarMonthLabel}>{monthLabel}</Text>
      </View>

      <View style={styles.calendarWrapper}>
        <View style={styles.calendarWeekdaysRow}>
          {WEEK_DAYS.map((day) => (
            <Text key={day} style={styles.calendarWeekday}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {cells.map((cell) => {
            if (cell.isPlaceholder) {
              return <View key={cell.id} style={styles.calendarCellPlaceholder} />;
            }

            return (
              <View
                key={cell.id}
                style={[
                  styles.calendarCell,
                  cell.isFuture && styles.calendarCellFuture,
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    cell.isFuture && styles.calendarDayTextFuture,
                  ]}
                >
                  {cell.day}
                </Text>
                <View
                  style={[
                    styles.calendarWorkoutDot,
                    cell.hasWorkout && styles.calendarWorkoutDotFilled,
                    cell.isFuture && styles.calendarWorkoutDotFuture,
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const {
    isCompactWidth,
    isShortHeight,
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    sliderWidth,
    cardWidth,
  } = useMobileFrame();
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const metricsListRef = useRef(null);
  const dashboardView = buildDashboardViewModel();
  const planSummary = getPlanSummary();
  const graphWidth = Math.max(cardWidth - 36, 220);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0]?.index != null) {
      setActiveMetricIndex(viewableItems[0].index);
    }
  }).current;

  function handleMetricPress() {
    router.push("/log");
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
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
                minHeight: Math.max(760, isShortHeight ? 720 : 820),
                paddingHorizontal: innerPaddingHorizontal,
                paddingTop: innerPaddingTop,
                paddingBottom: innerPaddingBottom,
              },
            ]}
          >
            <AppHeader
              title="DASHBOARD."
              leftAccessory={(
                <View style={styles.streakBadge}>
                  <Ionicons name="flame-outline" size={16} color="#4EA955" />
                  <Text style={styles.streakValue}>{dashboardView.streakCount}</Text>
                </View>
              )}
            />

            <View style={styles.carouselSection}>
              <TodayPlanCard
                cardWidth={cardWidth}
                planSummary={planSummary}
                onOpenAi={() => router.push("/ai")}
              />

              <QuickActions
                cardWidth={cardWidth}
                onOpenLog={() => router.push("/log")}
                onOpenAi={() => router.push("/ai")}
              />

              <FlatList
                ref={metricsListRef}
                data={dashboardView.slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                style={[styles.sliderList, { width: sliderWidth }]}
                contentContainerStyle={styles.sliderContent}
                renderItem={({ item }) => {
                  if (item.kind === "chart") {
                    return (
                      <WeeklyProgressChart
                        item={item}
                        cardWidth={cardWidth}
                        graphWidth={graphWidth}
                        compact={isCompactWidth}
                      />
                    );
                  }

                  if (item.kind === "bar-chart") {
                    return (
                      <ProgressBarChart
                        item={item}
                        cardWidth={cardWidth}
                        compact={isCompactWidth}
                      />
                    );
                  }

                  if (item.kind === "calendar") {
                    return (
                      <MonthlyWorkoutCalendarCard
                        item={item}
                        cardWidth={cardWidth}
                        compact={isCompactWidth}
                      />
                    );
                  }

                  return (
                    <MetricsCard
                      item={item}
                      cardWidth={cardWidth}
                      compact={isCompactWidth}
                      onMetricPress={handleMetricPress}
                    />
                  );
                }}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
              />

              <View style={styles.dotsRow}>
                {dashboardView.slides.map((slide, index) => (
                  <View
                    key={slide.id}
                    style={[
                      styles.dot,
                      activeMetricIndex === index && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </View>

            <BottomNav activeTab="home" />
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
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: "#F4FFF7",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 10,
  },
  streakValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  carouselSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 6,
    paddingBottom: 28,
    gap: 14,
  },
  todayPlanCard: {
    borderRadius: 28,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    padding: 18,
  },
  todayPlanHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  todayPlanEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  todayPlanTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },
  todayPlanText: {
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "700",
    color: "#5E6B7F",
    marginBottom: 8,
  },
  todayPlanMeta: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "800",
    color: "#83B66E",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  todayPlanButton: {
    alignSelf: "flex-start",
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  todayPlanButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  quickActionsCard: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  quickActionText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#111827",
    textTransform: "uppercase",
  },
  sliderList: {
    flexGrow: 0,
  },
  sliderContent: {
    alignItems: "center",
  },
  metricsCard: {
    marginHorizontal: CARD_SPACING,
    height: 510,
    borderRadius: 30,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  chartCard: {
    marginHorizontal: CARD_SPACING,
    height: 510,
    borderRadius: 30,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
    letterSpacing: 0.2,
  },
  compactChartTitle: {
    fontSize: 15,
  },
  chartHeaderSpacer: {
    width: 78,
    height: 1,
  },
  targetBadge: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  targetBadgeLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  targetBadgeValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  calendarMonthLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#83B66E",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  graphWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  graphSurface: {
    height: GRAPH_HEIGHT + 22,
    position: "relative",
    marginBottom: 10,
  },
  barValue: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textAlign: "center",
  },
  graphBaseline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    borderRadius: 999,
    backgroundColor: "#CFEFD9",
  },
  targetLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(78, 169, 85, 0.45)",
  },
  graphSegment: {
    position: "absolute",
    height: 3,
    borderRadius: 999,
    backgroundColor: BUTTON_GREEN,
  },
  graphPointWrap: {
    position: "absolute",
    width: 28,
    alignItems: "center",
  },
  graphPoint: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: BUTTON_GREEN,
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  graphPointFuture: {
    backgroundColor: "#CFEFD9",
  },
  futureValueSpacer: {
    height: 12,
  },
  graphLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barSurface: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    paddingBottom: 8,
    position: "relative",
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  barTrack: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    marginBottom: 12,
    position: "relative",
  },
  sleepBarFill: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: BUTTON_GREEN,
  },
  sleepBarFutureStub: {
    width: "100%",
    height: 10,
    borderRadius: 18,
    backgroundColor: "#CFEFD9",
    opacity: 0.55,
  },
  sleepBarValue: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -14 }],
    width: 28,
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textAlign: "center",
  },
  sleepBarLabel: {
    textAlign: "center",
  },
  barLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7A8699",
    textTransform: "uppercase",
  },
  barLabelFuture: {
    color: "#AAB4C3",
  },
  calendarWrapper: {
    flex: 1,
    justifyContent: "flex-start",
  },
  calendarWeekdaysRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  calendarWeekday: {
    flex: 1,
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    letterSpacing: 0.6,
    textAlign: "center",
    textTransform: "uppercase",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  calendarCellPlaceholder: {
    width: "14.2857%",
    aspectRatio: 1,
  },
  calendarCell: {
    width: "14.2857%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  calendarCellFuture: {
    opacity: 0.55,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  calendarDayTextFuture: {
    color: "#9CA3AF",
  },
  calendarWorkoutDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#CFEFD9",
    backgroundColor: "transparent",
  },
  calendarWorkoutDotFilled: {
    backgroundColor: BUTTON_GREEN,
    borderColor: BUTTON_GREEN,
  },
  calendarWorkoutDotFuture: {
    borderColor: "#D7DEE8",
  },
  metricsGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
  },
  metricTile: {
    width: "48%",
    height: "31%",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  metricIconWrap: {
    marginBottom: 10,
  },
  metricTilePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    lineHeight: 13,
  },
  compactMetricLabel: {
    fontSize: 9,
    lineHeight: 12,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginTop: 6,
  },
  compactMetricValue: {
    fontSize: 12,
  },
  metricUpdated: {
    marginTop: 5,
    fontSize: 8,
    fontWeight: "900",
    color: "#A8C995",
    textTransform: "uppercase",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
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
});
