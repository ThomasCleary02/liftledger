"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../providers/Auth";
import { friendsService, friendRequestsService, accountService } from "../../../../lib/firebase";
import type { Friend } from "@liftledger/shared/firestore/friends";
import type { FriendRequest } from "@liftledger/shared/firestore/friendRequests";
import type { AchievementProgress } from "@liftledger/shared";
import { Users, User, Trash2, Plus, Trophy, ChevronRight, Check, X, ArrowLeft } from "lucide-react";
import { Avatar } from "../../../../components/Avatar";
import { toast } from "../../../../lib/toast";
import { logger } from "../../../../lib/logger";
import { ConfirmDialog } from "../../../../components/ConfirmDialog";
import { ProfileSheet } from "../../../../components/ProfileSheet";

export default function Friends() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, { username: string | null; photoURL: string | null }>>({});
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const [profileOpen, setProfileOpen] = useState<{
    username: string | null;
    photoURL: string | null;
    progress: AchievementProgress;
  } | null>(null);

  const friendIdOf = (friend: Friend) =>
    friend.userId === user?.uid ? friend.friendUserId : friend.userId;

  const openFriendProfile = async (friend: Friend) => {
    const id = friendIdOf(friend);
    try {
      const publicProfile = await accountService.getPublicProfile(id);
      setProfileOpen(publicProfile);
    } catch (error) {
      logger.error("Failed to load profile", error);
      toast.error("Could not open profile");
    }
  };

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
      setLoading(false);
      
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
      
      const profileMap: Record<string, { username: string | null; photoURL: string | null }> = {};
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            profileMap[userId] = await accountService.getProfileForUser(userId);
          } catch (error) {
            console.error(`Error fetching profile for ${userId}:`, error);
          }
        })
      );
      setProfiles(profileMap);
    } catch (error) {
      logger.error("Error loading friends", error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!emailInput.trim()) {
      toast.error("Enter a username");
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
    setFriendToRemove(friend);
  };

  const confirmRemoveFriend = () => {
    const friend = friendToRemove;
    setFriendToRemove(null);
    if (!friend) return;
    const friendUserId = friend.userId === user?.uid 
      ? friend.friendUserId 
      : friend.userId;

    friendsService
      .removeFriend(friendUserId)
      .then(() => {
        loadFriends();
        toast.success("Friend removed");
      })
      .catch((error: any) => {
        logger.error("Error removing friend", error);
        toast.error(error?.message || "Failed to remove friend");
      });
  };

  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      {/* Fixed Header */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/profile"
              prefetch
              className="mb-3 flex min-h-[44px] items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-semibold">Profile</span>
            </Link>
            <p className="kicker mb-1">Profile</p>
            <h1 className="mb-2 text-2xl font-semibold text-gray-900 md:text-3xl">Friends</h1>
            <p className="text-sm text-gray-500">
              Add friends by username to compare streaks, volume, and cardio time.
            </p>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 pb-8 md:px-8 md:max-w-4xl">
          <div className="space-y-6">
            {/* Leaderboards Button */}
            <section>
              <Link
                href="/profile/friends/leaderboards"
                prefetch
                className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-5 py-4 shadow-[0_1px_0_rgb(20_83_45/0.08)] hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Leaderboards</p>
                    <p className="text-sm text-gray-500">Streaks, volume, and cardio time</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </section>

            {(authLoading || loading) && (
              <div className="flex justify-center py-12">
                <div className="spinner" />
              </div>
            )}

            {!loading && !authLoading && (
            <>
            {/* Pending Requests - Incoming */}
            {incomingRequests.length > 0 && (
              <section>
                <h2 className="kicker mb-3">Incoming</h2>
                <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-[0_1px_0_rgb(20_83_45/0.08)]">
                  {incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar
                          name={profiles[request.fromUserId]?.username}
                          photoURL={profiles[request.fromUserId]?.photoURL}
                          size={40}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-gray-900">
                            {profiles[request.fromUserId]?.username || "Unknown user"}
                          </p>
                          <p className="text-sm text-gray-500">Sent you a friend request</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="rounded-full bg-green-50 p-2 text-green-600 transition-colors hover:bg-green-100"
                          aria-label="Accept friend request"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="rounded-full bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                          aria-label="Decline friend request"
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
                <h2 className="kicker mb-3">Outgoing</h2>
                <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-[0_1px_0_rgb(20_83_45/0.08)]">
                  {outgoingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar
                          name={profiles[request.toUserId]?.username}
                          photoURL={profiles[request.toUserId]?.photoURL}
                          size={40}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-gray-900">
                            {profiles[request.toUserId]?.username || "Unknown user"}
                          </p>
                          <p className="text-sm text-gray-500">Waiting for response</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
                        aria-label="Cancel friend request"
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
              <div className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
                <p className="kicker">Add by username</p>
                <h2 className="mb-1 text-lg font-semibold text-gray-900">Send friend request</h2>
                <p className="mb-4 text-sm text-gray-500">Use their username, not email.</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Username"
                      className="w-full rounded-md border border-gray-300 bg-white py-3 pl-10 pr-4 text-base text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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
                    className="btn-primary flex min-h-[48px] items-center justify-center gap-2 px-6"
                  >
                    {sendingRequest ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-fg border-t-transparent"></div>
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
              <h2 className="kicker mb-3">Friends ({friends.length})</h2>
              {friends.length === 0 ? (
                <div className="rounded-md border border-gray-200 bg-white p-12 text-center shadow-[0_1px_0_rgb(20_83_45/0.08)]">
                  <Users className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 font-medium text-gray-900">No friends yet</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Use the form above to send a request by username. Once they accept, you can compare on leaderboards.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-[0_1px_0_rgb(20_83_45/0.08)]">
                  {friends.map((friend) => {
                    const friendUserId = friendIdOf(friend);
                    return (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
                    >
                      <button
                        type="button"
                        onClick={() => void openFriendProfile(friend)}
                        className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <Avatar
                          name={profiles[friendUserId]?.username}
                          photoURL={profiles[friendUserId]?.photoURL}
                          size={40}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-gray-900">
                            {profiles[friendUserId]?.username || "Unknown user"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Added {new Date(friend.createdAt.toMillis()).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend)}
                        className="rounded-full bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                        aria-label="Remove friend"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    );
                  })}
                </div>
              )}
            </section>
            </>
            )}
          </div>
        </div>
      </main>
      <ProfileSheet
        open={Boolean(profileOpen)}
        username={profileOpen?.username ?? null}
        photoURL={profileOpen?.photoURL ?? null}
        progress={profileOpen?.progress ?? null}
        onClose={() => setProfileOpen(null)}
      />
      <ConfirmDialog
        open={Boolean(friendToRemove)}
        title="Remove friend?"
        message="You can send a new request later if you change your mind."
        confirmText="Remove"
        danger
        onCancel={() => setFriendToRemove(null)}
        onConfirm={confirmRemoveFriend}
      />
    </div>
  );
}
