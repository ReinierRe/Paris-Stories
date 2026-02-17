import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  LayoutAnimation,
  UIManager,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { themes, type Theme, type Topic } from "@/constants/themes";
import { useAuth } from "@/contexts/AuthContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function TopicRow({ topic, theme }: { topic: Topic; theme: Theme }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.topicRow, pressed && styles.topicRowPressed]}
      onPress={() =>
        router.push({
          pathname: "/customize",
          params: {
            topicId: topic.id,
            topicName: topic.name,
            topicNameNl: topic.nameNl,
            themeId: theme.id,
            themeName: theme.name,
            themeNameNl: theme.nameNl,
          },
        })
      }
    >
      <View style={styles.topicContent}>
        <Text style={styles.topicName}>{topic.name}</Text>
        <Text style={styles.topicDescription} numberOfLines={2}>
          {topic.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.light.textTertiary} />
    </Pressable>
  );
}

function ThemeCard({ theme }: { theme: Theme }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const renderIcon = () => {
    if (theme.iconImage) {
      return <Image source={theme.iconImage} style={{ width: 44, height: 44, borderRadius: 12 }} />;
    }
    const iconProps = { size: 22, color: "#FFFFFF" };
    if (theme.iconFamily === "MaterialIcons") {
      return <MaterialIcons name={theme.icon as any} {...iconProps} />;
    }
    if (theme.iconFamily === "Feather") {
      return <Feather name={theme.icon as any} {...iconProps} />;
    }
    return <Ionicons name={theme.icon as any} {...iconProps} />;
  };

  return (
    <View style={styles.themeCard}>
      <Pressable
        style={({ pressed }) => [styles.themeHeader, pressed && styles.themeHeaderPressed]}
        onPress={toggleExpand}
      >
        {theme.iconImage ? (
          renderIcon()
        ) : (
          <View style={[styles.themeIconContainer, { backgroundColor: theme.color }]}>
            {renderIcon()}
          </View>
        )}
        <View style={styles.themeTextContainer}>
          <Text style={styles.themeName}>{theme.name}</Text>
          <Text style={styles.themeTopicCount}>
            {theme.topics.length} {theme.topics.length === 1 ? "topic" : "topics"}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={Colors.light.textTertiary}
        />
      </Pressable>

      {expanded && (
        <View style={styles.topicList}>
          {theme.topics.map((topic, index) => (
            <React.Fragment key={topic.id}>
              {index > 0 && <View style={styles.topicDivider} />}
              <TopicRow topic={topic} theme={theme} />
            </React.Fragment>
          ))}
          <View style={styles.topicDivider} />
          <Pressable
            style={({ pressed }) => [styles.addOwnRow, pressed && styles.topicRowPressed]}
            onPress={() => router.push("/custom-create")}
          >
            <View style={styles.addOwnIcon}>
              <Ionicons name="add" size={18} color={Colors.light.accent} />
            </View>
            <Text style={styles.addOwnText}>Add your own subject</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textTertiary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout();
      return;
    }
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16 + webTopInset },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Paris Stories</Text>
              <Text style={styles.headerSubtitle}>
                {user?.firstName ? `Welcome, ${user.firstName}` : "Discover the stories of Paris"}
              </Text>
            </View>
            <Pressable onPress={handleLogout} hitSlop={12} testID="logout-button">
              <Ionicons name="log-out-outline" size={24} color={Colors.light.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.themesContainer}>
          {themes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerSection: {
    marginBottom: 28,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 6,
    lineHeight: 21,
  },
  themesContainer: {
    gap: 14,
  },
  themeCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    overflow: "hidden",
  },
  themeHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  themeHeaderPressed: {
    opacity: 0.7,
  },
  themeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  themeTextContainer: {
    flex: 1,
  },
  themeName: {
    fontSize: 17,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
  },
  themeTopicCount: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  topicList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topicDivider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginLeft: 0,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  topicRowPressed: {
    opacity: 0.6,
  },
  topicContent: {
    flex: 1,
  },
  topicName: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.text,
  },
  topicDescription: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  addOwnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  addOwnIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(196, 162, 101, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  addOwnText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.accent,
  },
});
