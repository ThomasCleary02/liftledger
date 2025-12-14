import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { friendsService, friendRequestsService, accountService } from "../../lib/firebase";
import type { Friend } from "@liftledger/shared/firestore/friends";
import type { FriendRequest } from "@liftledger/shared/firestore/friendRequests";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../../providers/Auth";

export default function Friends() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const [friendList, incoming, outgoing] = await Promise.all([
        friendsService.listFriends(),
        friendRequestsService.getPendingRequestsToMe(),
        friendRequestsService.getPendingRequestsFromMe(),
      ]);
      setFriends(friendList);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      
      // Fetch usernames for all friends and requests
      const userIds = new Set<string>();
      
      // Collect friend user IDs (bidirectional)
      friendList.forEach((f) => {
        if (f.userId === user?.uid) {
          userIds.add(f.friendUserId);
        } else if (f.friendUserId === user?.uid) {
          userIds.add(f.userId);
        }
      });
      
      // Collect user IDs from requests
      incoming.forEach((r) => userIds.add(r.fromUserId));
      outgoing.forEach((r) => userIds.add(r.toUserId));
      
      // Fetch usernames
      const usernameMap: Record<string, string> = {};
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            const username = await accountService.getUsernameForUser(userId);
            if (username) {
              usernameMap[userId] = username;
            }
          } catch (error) {
            console.error(`Error fetching username for ${userId}:`, error);
          }
        })
      );
      setUsernames(usernameMap);
    } catch (error: any) {
      console.error("Error loading friends:", error);
      Alert.alert("Error", error?.message || "Failed to load friends");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriends();
  };

  const handleSendFriendRequest = async () => {
    if (!emailInput.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    setSendingRequest(true);
    try {
      await friendRequestsService.sendFriendRequest(emailInput.trim());
      setEmailInput("");
      await loadFriends();
      Alert.alert("Success", "Friend request sent!");
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      Alert.alert("Error", error?.message || "Failed to send friend request");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendRequestsService.acceptFriendRequest(requestId);
      await loadFriends();
      Alert.alert("Success", "Friend request accepted!");
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      Alert.alert("Error", error?.message || "Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendRequestsService.rejectFriendRequest(requestId);
      await loadFriends();
      Alert.alert("Success", "Friend request rejected");
    } catch (error: any) {
      console.error("Error rejecting friend request:", error);
      Alert.alert("Error", error?.message || "Failed to reject friend request");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await friendRequestsService.cancelFriendRequest(requestId);
      await loadFriends();
      Alert.alert("Success", "Friend request cancelled");
    } catch (error: any) {
      console.error("Error cancelling friend request:", error);
      Alert.alert("Error", error?.message || "Failed to cancel friend request");
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      "Remove Friend",
      "Are you sure you want to remove this friend?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Get the other user's ID (not current user)
              const friendUserId = friend.userId === user?.uid 
                ? friend.friendUserId 
                : friend.userId;
              await friendsService.removeFriend(friendUserId);
              await loadFriends();
              Alert.alert("Success", "Friend removed successfully");
            } catch (error: any) {
              console.error("Error removing friend:", error);
              Alert.alert("Error", error?.message || "Failed to remove friend");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4">Loading friends...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Custom Header - Sticky */}
      <View className="bg-white border-b border-gray-200" style={{ paddingTop: insets.top }}>
        <View className="px-6 pb-4">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Friends</Text>
          <Text className="text-gray-500 text-sm">Connect with friends and compete</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
        contentContainerStyle={{ paddingBottom: 32 }}
        stickyHeaderIndices={[0]}
      >
        <View className="p-6">
          {/* Leaderboards Button */}
          <Pressable
            onPress={() => router.push("/friends/leaderboards")}
            className="mb-6 bg-black rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="bg-white rounded-full p-2">
                  <Ionicons name="trophy" size={24} color="#000" />
                </View>
                <View>
                  <Text className="text-white font-semibold text-lg">Leaderboards</Text>
                  <Text className="text-gray-300 text-sm">Compete with your friends</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </Pressable>

          {/* Pending Requests - Incoming */}
          {incomingRequests.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Friend Requests ({incomingRequests.length})
              </Text>
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {incomingRequests.map((request) => (
                  <View
                    key={request.id}
                    className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0"
                  >
                    <View className="flex-1 flex-row items-center gap-3">
                      <View className="bg-blue-100 rounded-full p-2">
                        <Ionicons name="person" size={20} color="#2563eb" />
                      </View>
                      <View>
                        <Text className="font-semibold text-gray-900">
                          {usernames[request.fromUserId] || request.fromUserId.substring(0, 8)}
                        </Text>
                        <Text className="text-gray-500 text-xs">Sent you a friend request</Text>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleAcceptRequest(request.id)}
                        className="bg-green-50 rounded-full p-2"
                      >
                        <Ionicons name="checkmark" size={18} color="#16a34a" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleRejectRequest(request.id)}
                        className="bg-red-50 rounded-full p-2"
                      >
                        <Ionicons name="close" size={18} color="#dc2626" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Pending Requests - Outgoing */}
          {outgoingRequests.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Sent Requests ({outgoingRequests.length})
              </Text>
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {outgoingRequests.map((request) => (
                  <View
                    key={request.id}
                    className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0"
                  >
                    <View className="flex-1 flex-row items-center gap-3">
                      <View className="bg-yellow-100 rounded-full p-2">
                        <Ionicons name="time-outline" size={20} color="#ca8a04" />
                      </View>
                      <View>
                        <Text className="font-semibold text-gray-900">
                          {usernames[request.toUserId] || request.toUserId.substring(0, 8)}
                        </Text>
                        <Text className="text-gray-500 text-xs">Waiting for response</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleCancelRequest(request.id)}
                      className="bg-gray-100 rounded-full p-2"
                    >
                      <Ionicons name="close" size={18} color="#374151" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Send Friend Request Section */}
          <View className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Send Friend Request</Text>
            <View className="flex-row gap-2">
              <TextInput
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-3 bg-gray-50"
                editable={!sendingRequest}
              />
              <Pressable
                onPress={handleSendFriendRequest}
                disabled={sendingRequest || !emailInput.trim()}
                className={`px-6 py-3 rounded-lg ${sendingRequest || !emailInput.trim() ? "bg-gray-300" : "bg-black"}`}
              >
                {sendingRequest ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Send</Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Friends List */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              My Friends ({friends.length})
            </Text>
            {friends.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
                <Text className="text-gray-500 mt-4 text-center">
                  No friends yet. Add friends by email to get started!
                </Text>
              </View>
            ) : (
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {friends.map((friend) => (
                  <View
                    key={friend.id}
                    className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0"
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <View className="bg-gray-100 rounded-full p-2">
                          <Ionicons name="person" size={20} color="#374151" />
                        </View>
                        <Text className="font-semibold text-gray-900">
                          {(() => {
                            // Get the other user's ID (not current user)
                            const friendUserId = friend.userId === user?.uid 
                              ? friend.friendUserId 
                              : friend.userId;
                            return usernames[friendUserId] || friendUserId.substring(0, 8);
                          })()}
                        </Text>
                      </View>
                      <Text className="text-gray-500 text-xs mt-1">
                        Added {new Date(friend.createdAt.toMillis()).toLocaleDateString()}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleRemoveFriend(friend)}
                      className="bg-red-50 rounded-full p-2"
                    >
                      <Ionicons name="trash" size={18} color="#dc2626" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
