import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Hey, welcome back</Text>
        <Text style={styles.title}>Today’s summary</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Daily calorie target</Text>
          <Text style={styles.heroValue}>2,150 kcal</Text>
          <Text style={styles.heroSubtext}>450 kcal remaining today</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.smallCard}>
            <Text style={styles.cardLabel}>Workout</Text>
            <Text style={styles.cardValue}>Push Day</Text>
            <Text style={styles.cardSubtext}>45 mins planned</Text>
          </View>

          <View style={styles.smallCard}>
            <Text style={styles.cardLabel}>Sleep</Text>
            <Text style={styles.cardValue}>8 hrs</Text>
            <Text style={styles.cardSubtext}>Recommended tonight</Text>
          </View>

          <View style={styles.smallCard}>
            <Text style={styles.cardLabel}>Streak</Text>
            <Text style={styles.cardValue}>6 days</Text>
            <Text style={styles.cardSubtext}>Keep it going</Text>
          </View>

          <View style={styles.smallCard}>
            <Text style={styles.cardLabel}>Weight</Text>
            <Text style={styles.cardValue}>72.4 kg</Text>
            <Text style={styles.cardSubtext}>-0.6 kg this week</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Progress highlights</Text>
          <Text style={styles.sectionText}>
            You completed 4 workouts this week and stayed within your calorie
            goal on 5 days.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recommended next step</Text>
          <Text style={styles.sectionText}>
            Log your evening meal and complete your planned Push Day workout.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: "#16A34A",
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  heroLabel: {
    color: "#DCFCE7",
    fontSize: 14,
    marginBottom: 8,
  },
  heroValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 6,
  },
  heroSubtext: {
    color: "#F0FDF4",
    fontSize: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  smallCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 13,
    color: "#94A3B8",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
  },
});
