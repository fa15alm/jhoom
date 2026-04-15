import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/ui/AppHeader";
import BottomNav from "../../components/ui/BottomNav";
import useMobileFrame from "../../hooks/useMobileFrame";
import { getCurrentPlanSections } from "../../lib/healthPlan";

export default function RecommendationsScreen() {
  const {
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
    cardWidth,
  } = useMobileFrame();
  const recommendations = getCurrentPlanSections();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                minHeight: Math.max(shellMinHeight, 760),
                paddingHorizontal: innerPaddingHorizontal,
                paddingTop: innerPaddingTop,
                paddingBottom: innerPaddingBottom,
              },
            ]}
          >
            <AppHeader title="RECOMMENDATIONS." />

            <View style={[styles.card, { width: cardWidth }]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.eyebrow}>AI suggestions</Text>
                  <Text style={styles.sectionTitle}>Based on plan and logs</Text>
                </View>
                <Ionicons name="sparkles-outline" size={22} color="#4EA955" />
              </View>

              {recommendations.map((section) => (
                <View key={section.title} style={styles.recommendationItem}>
                  <Text style={styles.recommendationTitle}>{section.title}</Text>
                  <Text style={styles.recommendationText}>{section.body}</Text>
                </View>
              ))}

              <Text style={styles.helperText}>
                Real recommendations should be recalculated from daily logs, health integrations, and the generated AI plan.
              </Text>
            </View>

            <BottomNav />
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
  card: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    borderRadius: 28,
    backgroundColor: "#ECFDF3",
    padding: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  },
  recommendationItem: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "700",
    color: "#3F4858",
  },
  helperText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#7A8699",
    textAlign: "center",
  },
});
