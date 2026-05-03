import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatMessage } from "@/constants/mockData";
import { useBackend } from "@/context/BackendContext";
import { useSimulations } from "@/context/SimulationContext";
import { useColors } from "@/hooks/useColors";

const SUGGESTIONS = [
  "When will NACA 0012 converge?",
  "How is the residual trending?",
  "Analyze my mesh quality",
  "Review Ahmed Body results",
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const colors = useColors();
  const isUser = msg.role === "user";

  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <View style={[styles.aiAvatar, { borderColor: colors.primary + "40" }]}>
          <Text style={[styles.aiAvatarText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Q</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser && styles.bubbleUser, {
        backgroundColor: isUser ? colors.primary + "20" : colors.card,
        borderColor: isUser ? colors.primary + "40" : colors.border,
      }]}>
        <Text style={[styles.bubbleText, {
          color: isUser ? colors.primary : colors.foreground,
          fontFamily: "Inter_400Regular",
        }]}>
          {msg.text}
        </Text>
        <Text style={[styles.bubbleTime, { color: colors.mutedForeground }]}>
          {formatTime(msg.timestamp)}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  const colors = useColors();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );

    const a1 = makeAnim(dot1, 0);
    const a2 = makeAnim(dot2, 200);
    const a3 = makeAnim(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={styles.msgRow}>
      <View style={[styles.aiAvatar, { borderColor: colors.primary + "40" }]}>
        <Text style={[styles.aiAvatarText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Q</Text>
      </View>
      <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 14 }]}>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.typingDot, { backgroundColor: colors.primary }, dotStyle(dot1)]} />
          <Animated.View style={[styles.typingDot, { backgroundColor: colors.primary }, dotStyle(dot2)]} />
          <Animated.View style={[styles.typingDot, { backgroundColor: colors.primary }, dotStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}

export default function CopilotScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { connectionState } = useBackend();
  const { messages, isAiTyping, sendMessage } = useSimulations();
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const TAB_BAR_H = Platform.OS === "web" ? 84 : Platform.OS === "ios" ? 49 : 56;
  const chatBarPad = insets.bottom + TAB_BAR_H + 8;

  // Hide suggestions once the user has sent at least one message
  const hasUserMessages = messages.some((m) => m.role === "user");

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const allItems: (ChatMessage | { id: string; type: "typing" })[] = [
    ...messages,
    ...(isAiTyping ? [{ id: "typing", type: "typing" as const }] : []),
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={[styles.onlineIndicator, {
          backgroundColor: connectionState === "connected" ? "#00C97A" : connectionState === "checking" ? colors.primary : "#FF4D4D",
        }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            QENGINE AI
          </Text>
          <Text style={[styles.headerSub, {
            color: connectionState === "connected" ? "#00C97A" : connectionState === "checking" ? colors.mutedForeground : "#FF4D4D",
            fontFamily: "Inter_400Regular",
          }]}>
            {connectionState === "connected"
              ? "Online · Backend connected"
              : connectionState === "checking"
              ? "Connecting to backend..."
              : "Offline · Using local AI"}
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={allItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.msgList, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          if ("type" in item && item.type === "typing") return <TypingIndicator />;
          return <MessageBubble msg={item as ChatMessage} />;
        }}
      />

      <View style={{ paddingBottom: chatBarPad }}>
        {!hasUserMessages && (
          <View style={[styles.suggestions]}>
            <FlatList
              horizontal
              data={SUGGESTIONS}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionList}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.suggestion, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => handleSuggestion(item)}
                >
                  <Text style={[styles.suggestionText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}

        <View style={[styles.inputBar, { borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            }]}
            placeholder="Ask QENGINE AI..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, {
              backgroundColor: input.trim() ? colors.primary : colors.secondary,
              opacity: input.trim() ? 1 : 0.5,
            }]}
            onPress={handleSend}
            disabled={!input.trim() || isAiTyping}
          >
            <Feather name="send" size={16} color={input.trim() ? colors.primaryForeground : colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 15,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  msgList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  msgRowUser: {
    justifyContent: "flex-end",
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  aiAvatarText: {
    fontSize: 12,
  },
  bubble: {
    maxWidth: "78%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  bubbleUser: {
    borderTopRightRadius: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTime: {
    fontSize: 9,
    letterSpacing: 0.3,
    alignSelf: "flex-end",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  suggestions: {
    marginBottom: 8,
  },
  suggestionList: {
    paddingHorizontal: 16,
    gap: 6,
  },
  suggestion: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  suggestionText: {
    fontSize: 12,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
