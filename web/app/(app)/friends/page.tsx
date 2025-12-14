"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../providers/Auth";
import { friendsService, friendRequestsService, accountService } from "../../../lib/firebase";
import type { Friend } from "@liftledger/shared/firestore/friends";
import type { FriendRequest } from "@liftledger/shared/firestore/friendRequests";
import { Users, Mail, Trash2, Plus, Trophy, ChevronRight, Check, X, Clock } from "lucide-react";
import { toast } from "../../../lib/toast";
import { logger } from "../../../lib/logger";

export default function Friends() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.replace("/login");
      return;
    }
    loadFriends();
  }, [user, router, authLoading]);

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
    } catch (error) {
      logger.error("Error loading friends", error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!emailInput.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setSendingRequest(true);
    try {
      await friendRequestsService.sendFriendRequest(emailInput.trim());
      setEmailInput("");
      await loadFriends();
      toast.success("Friend request sent!");
    } catch (error: any) {
      logger.error("Error sending friend request", error);
      toast.error(error?.message || "Failed to send friend request");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendRequestsService.acceptFriendRequest(requestId);
      await loadFriends();
      toast.success("Friend request accepted!");
    } catch (error: any) {
      logger.error("Error accepting friend request", error);
      toast.error(error?.message || "Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendRequestsService.rejectFriendRequest(requestId);
      await loadFriends();
      toast.success("Friend request rejected");
    } catch (error: any) {
      logger.error("Error rejecting friend request", error);
      toast.error(error?.message || "Failed to reject friend request");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await friendRequestsService.cancelFriendRequest(requestId);
      await loadFriends();
      toast.success("Friend request cancelled");
    } catch (error: any) {
      logger.error("Error cancelling friend request", error);
      toast.error(error?.message || "Failed to cancel friend request");
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    if (!confirm("Are you sure you want to remove this friend?")) {
      return;
    }

    // Get the other user's ID (not current user)
    const friendUserId = friend.userId === user?.uid 
      ? friend.friendUserId 
      : friend.userId;

    friendsService
      .removeFriend(friendUserId)
      .then(() => {
        loadFriends();
        toast.success("Friend removed successfully");
      })
      .catch((error: any) => {
        logger.error("Error removing friend", error);
        toast.error(error?.message || "Failed to remove friend");
      });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
          <p className="mt-4 text-gray-500">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* Fixed Header */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Friends</h1>
            <p className="text-sm text-gray-500">Connect with friends and compete</p>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 md:px-8 md:max-w-4xl">
          <div className="space-y-6">
            {/* Leaderboards Button */}
            <section>
              <button
                onClick={() => router.push("/friends/leaderboards")}
                className="w-full rounded-2xl border border-gray-100 bg-black p-5 text-left shadow-sm transition-opacity hover:opacity-90"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white p-2">
                      <Trophy className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Leaderboards</h2>
                      <p className="text-sm text-gray-300">Compete with your friends</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white" />
                </div>
              </button>
            </section>

            {/* Pending Requests - Incoming */}
            {incomingRequests.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                  Friend Requests ({incomingRequests.length})
                </h2>
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-2">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {usernames[request.fromUserId] || request.fromUserId.substring(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500">Sent you a friend request</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="rounded-full bg-green-50 p-2 text-green-600 transition-colors hover:bg-green-100"
                          title="Accept"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="rounded-full bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                          title="Reject"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pending Requests - Outgoing */}
            {outgoingRequests.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                  Sent Requests ({outgoingRequests.length})
                </h2>
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {outgoingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <div className="rounded-full bg-yellow-100 p-2">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {usernames[request.toUserId] || request.toUserId.substring(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500">Waiting for response</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
                        title="Cancel request"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Send Friend Request Section */}
            <section>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Send Friend Request</h2>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 outline-none focus:border-black focus:bg-white"
                      disabled={sendingRequest}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !sendingRequest && emailInput.trim()) {
                          handleSendFriendRequest();
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={sendingRequest || !emailInput.trim()}
                    className={`flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-opacity ${
                      sendingRequest || !emailInput.trim()
                        ? "cursor-not-allowed bg-gray-300"
                        : "bg-black hover:opacity-90"
                    }`}
                  >
                    {sendingRequest ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Friends List */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                My Friends ({friends.length})
              </h2>
              {friends.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                  <Users className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-gray-500">
                    No friends yet. Add friends by email to get started!
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <div className="rounded-full bg-gray-100 p-2">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {(() => {
                              // Get the other user's ID (not current user)
                              const friendUserId = friend.userId === user?.uid 
                                ? friend.friendUserId 
                                : friend.userId;
                              return usernames[friendUserId] || friendUserId.substring(0, 8);
                            })()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Added {new Date(friend.createdAt.toMillis()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(friend)}
                        className="rounded-full bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                        title="Remove friend"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
