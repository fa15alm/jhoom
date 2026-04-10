import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomNav from "../components/ui/BottomNav";
import useMobileFrame from "../hooks/useMobileFrame";

const BUTTON_GREEN = "#4EA955";
const CARD_SPACING = 18;
const GRAPH_HEIGHT = 220;
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  // Hook real log/history sources in here later so all user-changing
  // dashboard content is mapped in one place.
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

function HeaderIconButton({ icon, onPress, accessibilityLabel }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerButton,
        pressed && styles.headerButtonPressed,
      ]}
    >
      <Ionicons name={icon} size={18} color="#FFFFFF" />
    </Pressable>
  );
}

function MetricsCard({ item, cardWidth, compact }) {
  return (
    <View style={[styles.metricsCard, { width: cardWidth }]}>
      <View style={styles.metricsGrid}>
        {item.metrics.map((metric) => (
          <Pressable
            key={metric.id}
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
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function WeeklyProgressChart({ item, cardWidth, graphWidth, compact }) {
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
  const router = useRouter();
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const metricsListRef = useRef(null);
  const dashboardView = buildDashboardViewModel();
  const graphWidth = Math.max(cardWidth - 36, 220);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0]?.index != null) {
      setActiveMetricIndex(viewableItems[0].index);
    }
  }).current;

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
            <View style={[styles.topRow, isShortHeight && styles.compactTopRow]}>
              <View style={styles.leftGroup}>
                <HeaderIconButton
                  icon="person-outline"
                  accessibilityLabel="Open settings"
                  onPress={() => router.push("/settings")}
                />

                <View style={styles.streakBadge}>
                  <Ionicons name="flame-outline" size={16} color="#4EA955" />
                  <Text style={styles.streakValue}>{dashboardView.streakCount}</Text>
                </View>
              </View>

              <View pointerEvents="none" style={styles.titleWrap}>
                <Text style={styles.title}>DASHBOARD.</Text>
              </View>

              <HeaderIconButton
                icon="people-outline"
                accessibilityLabel="Open social"
                onPress={() => router.push("/social")}
              />
            </View>

            <View style={styles.carouselSection}>
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
    borderRadius: 38,
    backgroundColor: "#F7F8FB",
  },
  topRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40,
    paddingTop: 8,
    marginBottom: 28,
  },
  compactTopRow: {
    marginBottom: 22,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleWrap: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: BUTTON_GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(78, 169, 85, 0.28)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  headerButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    letterSpacing: 0.1,
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "serif",
    }),
    textShadowColor: "rgba(78, 169, 85, 0.65)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  carouselSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 6,
    paddingBottom: 2,
  },
  sliderList: {
    flexGrow: 0,
  },
  sliderContent: {
    alignItems: "center",
  },
  metricsCard: {
    marginHorizontal: CARD_SPACING,
    minHeight: 510,
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
    marginBottom: 20,
    gap: 12,
  },
  chartTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  compactChartTitle: {
    fontSize: 21,
  },
  chartHeaderSpacer: {
    width: 78,
    height: 1,
  },
  targetBadge: {
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  targetBadgeLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#5E6B7F",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  targetBadgeValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },
  calendarMonthLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5E6B7F",
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
    fontWeight: "600",
    color: "#166534",
    textAlign: "center",
  },
  graphBaseline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    borderRadius: 999,
    backgroundColor: "#D7DEE8",
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
    backgroundColor: "#D7DEE8",
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
    backgroundColor: "#D7DEE8",
    opacity: 0.55,
  },
  sleepBarValue: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -14 }],
    width: 28,
    fontSize: 10,
    fontWeight: "600",
    color: "#166534",
    textAlign: "center",
  },
  sleepBarLabel: {
    textAlign: "center",
  },
  barLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5E6B7F",
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
    fontWeight: "700",
    color: "#5E6B7F",
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
    backgroundColor: "#F7F8FB",
    borderWidth: 1,
    borderColor: "#DDEBE0",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  calendarCellFuture: {
    opacity: 0.55,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: "700",
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
    borderColor: "#BFD9C6",
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
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  metricIconWrap: {
    marginBottom: 10,
  },
  metricTilePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#5E6B7F",
    textAlign: "center",
    textTransform: "uppercase",
    lineHeight: 13,
  },
  compactMetricLabel: {
    fontSize: 9,
    lineHeight: 12,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginTop: 6,
  },
  compactMetricValue: {
    fontSize: 14,
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
});
