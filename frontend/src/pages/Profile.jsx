import React, { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import "../styles/profile.css";
import "../components/PostCard.css";
import { getCurrentProfile, getProfile } from "../lib/apiClient";
import FollowButton from "../components/FollowButton";
import { formatCompactNumber } from "../lib/formatters";
import { GuestPopup, useGuestGuard } from "../components/GuestGuard";

const tabs = ["Stories", "About"];

/* ── Renders a circular author avatar: photo if available, letter otherwise ── */
function AuthorAvatar({ src, name, size = 36 }) {
  const [imgError, setImgError] = useState(false);
  const letter = (name || "?").charAt(0).toUpperCase();

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className="post-author-avatar post-author-avatar--img"
        width={size}
        height={size}
        onError={() => setImgError(true)}
        style={{ borderRadius: "50%", objectFit: "cover", width: size, height: size }}
      />
    );
  }

  return (
    <div className="post-author-avatar" style={{ width: size, height: size }}>
      {letter}
    </div>
  );
}

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Stories");
  const profilePosts = useMemo(() => profile?.posts || [], [profile]);

  // Guest guard for follow button
  const guard = useGuestGuard();

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const request = id ? getProfile(id) : getCurrentProfile();
    request
      .then((data) => { if (!cancelled) { setProfile(data); setError(""); } })
      .catch((err) => { if (!cancelled) setError(err.message || "Unable to load profile."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="page profile-stack">
          <h1 className="profile-page-title-inline">Loading profile...</h1>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="page profile-stack">
          <h1 className="profile-page-title-inline">Profile not found</h1>
          <p className="profile-muted-text">
            {error || "The profile you're looking for doesn't exist."}
          </p>
          <div>
            <Link to="/feed" className="back-btn">&#8592; Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${profile.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.handle || profile.name} on Ziele`,
          text: profile.bio || `Check out ${profile.handle || profile.name}'s profile on Ziele`,
          url: profileUrl,
        });
        return;
      } catch { /* fallback */ }
    }
    try {
      await navigator.clipboard.writeText(profileUrl);
      window.alert("Profile link copied to clipboard!");
    } catch {
      window.alert(`Share this profile: ${profileUrl}`);
    }
  };

  const renderTabContent = () => {
    if (activeTab === "Stories") {
      if (profilePosts.length === 0) {
        return (
          <div className="page profile-page-block">
            <p className="profile-muted-text">No stories published yet.</p>
          </div>
        );
      }

      return (
        <div className="profile-feed">
          {profilePosts.map((post) => (
            <article key={post.id} className="post-card">
              <div className="post-header-top">
                <AuthorAvatar
                  src={post.authorPhotoUrl || post.avatarUrl || profile?.photoUrl}
                  name={post.authorHandle || post.authorName || profile?.handle || profile?.name}
                />
                <div className="post-author-info">
                  <span className="post-author-name">
                    {post.authorHandle || post.authorName}
                  </span>
                </div>
                <FollowButton
                  profileId={post.profileId}
                  profileName={post.authorHandle || post.authorName}
                  initialIsFollowing={post.isFollowingAuthor}
                  isOwnProfile={post.isOwnAuthor}
                  className="follow-btn post-follow-btn"
                />
                <span className="post-time">{post.time}</span>
              </div>

              <div className="post-body-mid">
                <h2 className="post-title">{post.title}</h2>
                <p className="post-content">{post.summary || post.contentText}</p>
                <div className="post-tags-container">
                  {post.tags?.map((tag) => (
                    <span key={tag} className="post-tag-pill">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="post-actions-bottom">
                <button className="action-icon-btn like-btn" title="Like">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span>{formatCompactNumber(post.likes || 0)}</span>
                </button>

                <button className="action-icon-btn share-btn" title="Share" onClick={handleShare}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </button>

                <button className="action-icon-btn bookmark-btn" title="Bookmark">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                  </svg>
                  <span>{formatCompactNumber(post.bookmarks || 0)}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (activeTab === "About") {
      return (
        <div className="page profile-page-block profile-stack-sm">
          <h2 className="profile-page-title-inline">About {profile.handle || profile.name}</h2>
          {profile.bio ? (
            <p className="profile-soft-text" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
              {profile.bio}
            </p>
          ) : (
            <p className="profile-muted-text">No bio yet.</p>
          )}
          <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.5rem" }}>
            {profile.joined && (
              <p className="profile-muted-text" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Joined {profile.joined}
              </p>
            )}
            {profile.streak > 0 && (
              <p className="profile-muted-text" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2L8.5 8.5 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-6.5-.77z"/>
                </svg>
                {profile.streak}-day streak
              </p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="profile-container">
      {/* Guest popup for follow action */}
      <GuestPopup
        visible={guard.popupVisible}
        isAnimating={guard.isAnimating}
        onClose={guard.hidePopup}
      />

      <div className="profile-glass-card">
        <div className="profile-header-main">
          {/* Profile avatar: photo if exists, else letter */}
          <div className="profile-avatar-elite">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.name || profile.handle}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              (profile.avatar || (profile.handle || profile.name || "?").charAt(0).toUpperCase())
            )}
            <div className="profile-status-dot"></div>
          </div>

          <div className="profile-identity">
            <div className="profile-handle-row">
              <h1 className="profile-name-elite">
                {profile.handle || `@${profile.username}` || profile.name}
                {profile.isPremium && (
                  <span className="premium-check" title="Verified Author">&#10003;</span>
                )}
              </h1>
              {/* Edit Profile → redirect to Settings */}
              {profile.isOwnProfile && (
                <button
                  className="profile-edit-username-btn"
                  type="button"
                  onClick={() => navigate("/settings")}
                  title="Edit profile in Settings"
                  aria-label="Edit profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
              )}
            </div>
            {profile.name && (
              <p className="profile-handle-elite">{profile.name}</p>
            )}
          </div>

          <div className="profile-cta-group">
            {isSignedIn ? (
              <FollowButton
                profileId={profile.id}
                profileName={profile.handle || profile.name}
                initialIsFollowing={profile.isFollowing}
                isOwnProfile={profile.isOwnProfile}
                className="nav-btn-primary"
                onChange={(response) => {
                  if (response?.profile) setProfile(response.profile);
                }}
              />
            ) : (
              <button
                type="button"
                className="nav-btn-primary"
                onClick={guard.showPopup}
              >
                Follow
              </button>
            )}

            <button
              className="action-icon-btn profile-share-btn"
              type="button"
              onClick={handleShare}
              title="Share profile"
              aria-label="Share profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>
          </div>
        </div>

        <p className="profile-bio-elite">{profile.bio}</p>

        <div className="profile-stats-elite">
          <div className="elite-stat">
            <span className="stat-value">{formatCompactNumber(profile.postsTotal || profile.postsCount || 0)}</span>
            <span className="stat-label">Stories</span>
          </div>
          <Link
            to={`/connections?profile=${encodeURIComponent(profile.id)}&tab=followers`}
            className="elite-stat elite-stat-link"
          >
            <span className="stat-value">{formatCompactNumber(profile.followers)}</span>
            <span className="stat-label">Followers</span>
          </Link>
          <Link
            to={`/connections?profile=${encodeURIComponent(profile.id)}&tab=following`}
            className="elite-stat elite-stat-link"
          >
            <span className="stat-value">{formatCompactNumber(profile.following)}</span>
            <span className="stat-label">Following</span>
          </Link>
          <div className="elite-stat">
            <span className="stat-value">{formatCompactNumber(profile.likes)}</span>
            <span className="stat-label">Likes</span>
          </div>
        </div>
      </div>

      <div className="profile-nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`profile-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
            type="button"
            aria-pressed={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
}

export default Profile;
